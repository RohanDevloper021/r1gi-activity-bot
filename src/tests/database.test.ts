import { describe, it, expect, beforeEach } from 'vitest';
import { xpService } from '../services/xp/XPService.js';
import { userRepository } from '../repositories/UserRepository.js';
import { xpRepository } from '../repositories/XPRepository.js';
import { memoryStore } from '../repositories/memoryStore.js';
import { XPSource } from '../config/constants.js';

describe('Database, Atomic XP & Guild Isolation', () => {
  beforeEach(() => {
    memoryStore.clearAll();
  });

  it('atomically modifies XP and avoids race conditions during concurrent awards', async () => {
    const guildId = 'atomic-guild';
    const userId = 'atomic-user-1';

    // Fire 10 concurrent awards of 25 XP
    const promises = Array.from({ length: 10 }, (_, i) =>
      xpService.awardXP({
        guildId,
        discordUserId: userId,
        amount: 25,
        source: XPSource.CHAT,
        reason: `Concurrent award #${i}`,
      })
    );

    const results = await Promise.all(promises);
    expect(results.length).toBe(10);

    const user = await userRepository.findByGuildAndUser(guildId, userId);
    expect(user).not.toBeNull();
    expect(user?.totalXP).toBe(250); // Exactly 10 * 25, zero lost updates!
    expect(user?.chatXP).toBe(250);
  });

  it('strictly isolates data between different guilds', async () => {
    const guildA = 'guild-alpha';
    const guildB = 'guild-beta';
    const sameUserId = 'user-shared-id';

    // Award 500 XP in Guild A
    await xpService.awardXP({
      guildId: guildA,
      discordUserId: sameUserId,
      amount: 500,
      source: XPSource.CHAT,
      reason: 'Guild A message',
    });

    // Award 120 XP in Guild B
    await xpService.awardXP({
      guildId: guildB,
      discordUserId: sameUserId,
      amount: 120,
      source: XPSource.VOICE,
      reason: 'Guild B voice',
    });

    const userA = await userRepository.findByGuildAndUser(guildA, sameUserId);
    const userB = await userRepository.findByGuildAndUser(guildB, sameUserId);

    expect(userA?.totalXP).toBe(500);
    expect(userA?.chatXP).toBe(500);
    expect(userA?.voiceXP).toBe(0);

    expect(userB?.totalXP).toBe(120);
    expect(userB?.chatXP).toBe(0);
    expect(userB?.voiceXP).toBe(120);

    // Leaderboards must remain completely isolated
    const lbA = await userRepository.getLeaderboard(guildA, 'totalXP');
    const lbB = await userRepository.getLeaderboard(guildB, 'totalXP');

    expect(lbA.some((u) => u.guildId === guildB)).toBe(false);
    expect(lbB.some((u) => u.guildId === guildA)).toBe(false);
  });

  it('records every XP change into immutable transaction history', async () => {
    const guildId = 'history-guild';
    const userId = 'history-user';

    await xpService.awardXP({
      guildId,
      discordUserId: userId,
      amount: 45,
      source: XPSource.CHAT,
      reason: 'Testing transaction ledger',
    });

    const recent = await xpRepository.getRecentTransactions(guildId, 10);
    expect(recent.length).toBeGreaterThanOrEqual(1);
    expect(recent[0].amount).toBe(45);
    expect(recent[0].source).toBe(XPSource.CHAT);
    expect(recent[0].reason).toBe('Testing transaction ledger');
  });
});
