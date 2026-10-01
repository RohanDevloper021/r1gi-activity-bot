import { describe, it, expect, beforeEach } from 'vitest';
import { antiSpamService } from '../services/antiabuse/AntiSpamService.js';
import { cooldownService } from '../services/antiabuse/CooldownService.js';
import { messageSimilarityService } from '../services/antiabuse/MessageSimilarityService.js';
import { dailyLimitService } from '../services/antiabuse/DailyLimitService.js';
import { diminishingReturnsService } from '../services/antiabuse/DiminishingReturnsService.js';
import { chatXPService } from '../services/xp/ChatXPService.js';
import { memoryStore } from '../repositories/memoryStore.js';
import { XPSource } from '../config/constants.js';

describe('Chat XP & Anti-Abuse System', () => {
  const guildId = 'test-guild-chat';
  const userId = 'user-chat-1';

  beforeEach(() => {
    antiSpamService.clearAll();
    cooldownService.clearAll();
    messageSimilarityService.clearAll();
    memoryStore.clearAll();
  });

  describe('Anti-Spam & Validation', () => {
    it('rejects bot messages', () => {
      const res = antiSpamService.validateMessage(guildId, userId, 'Hello world', true, false);
      expect(res.valid).toBe(false);
      expect(res.reason).toContain('Bots');
    });

    it('rejects webhook messages', () => {
      const res = antiSpamService.validateMessage(guildId, userId, 'Hello world', false, true);
      expect(res.valid).toBe(false);
      expect(res.reason).toContain('Webhooks');
    });

    it('rejects empty or whitespace messages', () => {
      const res = antiSpamService.validateMessage(guildId, userId, '    ', false, false);
      expect(res.valid).toBe(false);
      expect(res.reason).toContain('Empty');
    });

    it('rejects short messages below minimum length', () => {
      const res = antiSpamService.validateMessage(guildId, userId, 'hi', false, false);
      expect(res.valid).toBe(false);
      expect(res.reason).toContain('short');
    });

    it('rejects command messages starting with slash or prefix', () => {
      const res1 = antiSpamService.validateMessage(guildId, userId, '/setup', false, false);
      expect(res1.valid).toBe(false);
      expect(res1.reason).toContain('Command');

      const res2 = antiSpamService.validateMessage(guildId, userId, '!play song', false, false);
      expect(res2.valid).toBe(false);
    });

    it('rejects repetitive single-character spam', () => {
      const res = antiSpamService.validateMessage(guildId, userId, 'aaaaaaaaaaaaa', false, false);
      expect(res.valid).toBe(false);
      expect(res.reason).toContain('Repetitive');
    });

    it('blocks rapid message bursts exceeding rate limit', () => {
      for (let i = 0; i < 4; i++) {
        const res = antiSpamService.validateMessage(guildId, userId, `Message number ${i}`, false, false);
        expect(res.valid).toBe(true);
      }
      // 5th message in 10s should be blocked
      const burstRes = antiSpamService.validateMessage(guildId, userId, 'Bursting fast!', false, false);
      expect(burstRes.valid).toBe(false);
      expect(burstRes.reason).toContain('burst');
    });
  });

  describe('Cooldown Service', () => {
    it('enforces cooldown period accurately', () => {
      expect(cooldownService.isOnChatCooldown(guildId, userId, 45)).toBe(false);

      cooldownService.setChatCooldown(guildId, userId);
      expect(cooldownService.isOnChatCooldown(guildId, userId, 45)).toBe(true);
      expect(cooldownService.getRemainingChatCooldown(guildId, userId, 45)).toBeGreaterThan(0);
    });
  });

  describe('Message Similarity & Duplicate Detection', () => {
    it('detects exact duplicate messages', () => {
      messageSimilarityService.recordMessage(guildId, userId, 'The quick brown fox jumps');
      const isSimilar = messageSimilarityService.isTooSimilar(
        guildId,
        userId,
        'The quick brown fox jumps'
      );
      expect(isSimilar).toBe(true);
    });

    it('detects highly similar messages with minor alterations', () => {
      messageSimilarityService.recordMessage(guildId, userId, 'The quick brown fox jumps over dog');
      const isSimilar = messageSimilarityService.isTooSimilar(
        guildId,
        userId,
        'The quick brown fox jumps over dog!'
      );
      expect(isSimilar).toBe(true);
    });

    it('allows genuine distinct messages', () => {
      messageSimilarityService.recordMessage(guildId, userId, 'Hello everyone in general chat');
      const isSimilar = messageSimilarityService.isTooSimilar(
        guildId,
        userId,
        'What game are you playing tonight?'
      );
      expect(isSimilar).toBe(false);
    });
  });

  describe('Daily Limits & Diminishing Returns', () => {
    it('caps XP when reaching daily limit', async () => {
      const { allowedAmount, limitReached } = await dailyLimitService.getAvailableDailyXP(
        guildId,
        userId,
        XPSource.CHAT,
        15,
        10 // limit is 10
      );
      expect(allowedAmount).toBe(10);
      expect(limitReached).toBe(true);
    });

    it('allows unlimited XP when daily limit is 0 (no cap)', async () => {
      const { allowedAmount, limitReached } = await dailyLimitService.getAvailableDailyXP(
        guildId,
        userId,
        XPSource.CHAT,
        5000,
        0 // 0 means unlimited
      );
      expect(allowedAmount).toBe(5000);
      expect(limitReached).toBe(false);
    });

    it('applies diminishing returns for heavy daily activity', () => {
      const resNormal = diminishingReturnsService.calculateAdjustedXP(10, 200, true, 1000);
      expect(resNormal.finalXP).toBe(10);
      expect(resNormal.multiplier).toBe(1.0);

      // Above threshold (e.g. 1500 XP)
      const resReduced = diminishingReturnsService.calculateAdjustedXP(10, 1500, true, 1000);
      expect(resReduced.finalXP).toBe(7); // 70%

      // Extreme activity (3x threshold)
      const resHeavy = diminishingReturnsService.calculateAdjustedXP(10, 3500, true, 1000);
      expect(resHeavy.finalXP).toBe(2); // 20%
    });
  });
});
