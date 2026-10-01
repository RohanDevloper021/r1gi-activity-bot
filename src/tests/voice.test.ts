import { describe, it, expect, beforeEach } from 'vitest';
import { voiceEligibilityService } from '../services/voice/VoiceEligibilityService.js';
import { voiceXPService } from '../services/xp/VoiceXPService.js';
import { recoveryService } from '../services/recovery/RecoveryService.js';
import { voiceSessionRepository } from '../repositories/VoiceSessionRepository.js';
import { memoryStore } from '../repositories/memoryStore.js';
import { DEFAULT_CONFIG } from '../config/constants.js';

describe('Voice XP & Eligibility System', () => {
  const guildId = 'test-guild-vc';
  const config = {
    id: 'cfg-test',
    guildId,
    ...DEFAULT_CONFIG,
    vcRoleId: 'role-vc',
    levelUpChannelId: null,
    ignoredTextChannels: '[]',
    ignoredVoiceChannels: '["vc-ignored-1"]',
  };

  beforeEach(() => {
    memoryStore.clearAll();
  });

  describe('Voice Eligibility Rules', () => {
    it('disqualifies bots in voice channel', () => {
      const mockVoiceState: any = {
        member: { user: { bot: true } },
        channel: { id: 'vc-1', members: new Map() },
        guild: { id: guildId, afkChannelId: 'afk-channel' },
        selfDeaf: false,
        selfMute: false,
        serverDeaf: false,
      };

      const res = voiceEligibilityService.checkEligibility(mockVoiceState, config);
      expect(res.eligible).toBe(false);
      expect(res.reason).toContain('Bots');
    });

    it('qualifies user when alone in VC with solo allowed (minimumVoiceParticipants = 1)', () => {
      // 1 human, 1 bot
      const membersMap = new Map([
        ['user-1', { user: { bot: false } }],
        ['bot-1', { user: { bot: true } }],
      ]);

      const mockVoiceState: any = {
        member: { id: 'user-1', user: { bot: false } },
        channel: { id: 'vc-1', members: membersMap },
        guild: { id: guildId, afkChannelId: 'afk-channel' },
        selfDeaf: false,
        selfMute: false,
        serverDeaf: false,
      };

      const res = voiceEligibilityService.checkEligibility(mockVoiceState, config);
      expect(res.eligible).toBe(true);
      expect(res.humanCount).toBe(1);
    });

    it('disqualifies user when alone only if config requires at least 2 humans', () => {
      const strictConfig = { ...config, minimumVoiceParticipants: 2 };
      const membersMap = new Map([
        ['user-1', { user: { bot: false } }],
        ['bot-1', { user: { bot: true } }],
      ]);

      const mockVoiceState: any = {
        member: { id: 'user-1', user: { bot: false } },
        channel: { id: 'vc-1', members: membersMap },
        guild: { id: guildId, afkChannelId: 'afk-channel' },
        selfDeaf: false,
        selfMute: false,
        serverDeaf: false,
      };

      const res = voiceEligibilityService.checkEligibility(mockVoiceState, strictConfig);
      expect(res.eligible).toBe(false);
      expect(res.humanCount).toBe(1);
      expect(res.reason).toContain('minimum required is 2');
    });

    it('qualifies user when another real human is present', () => {
      // 2 humans
      const membersMap = new Map([
        ['user-1', { user: { bot: false } }],
        ['user-2', { user: { bot: false } }],
      ]);

      const mockVoiceState: any = {
        member: { id: 'user-1', user: { bot: false } },
        channel: { id: 'vc-1', members: membersMap },
        guild: { id: guildId, afkChannelId: 'afk-channel' },
        selfDeaf: false,
        selfMute: false,
        serverDeaf: false,
      };

      const res = voiceEligibilityService.checkEligibility(mockVoiceState, config);
      expect(res.eligible).toBe(true);
      expect(res.humanCount).toBe(2);
    });

    it('allows self-muted user by default (muting does not prove AFK)', () => {
      const membersMap = new Map([
        ['user-1', { user: { bot: false } }],
        ['user-2', { user: { bot: false } }],
      ]);

      const mockVoiceState: any = {
        member: { id: 'user-1', user: { bot: false } },
        channel: { id: 'vc-1', members: membersMap },
        guild: { id: guildId, afkChannelId: 'afk-channel' },
        selfDeaf: false,
        selfMute: true, // Muted!
        serverDeaf: false,
      };

      const res = voiceEligibilityService.checkEligibility(mockVoiceState, config);
      expect(res.eligible).toBe(true);
    });

    it('disqualifies self-deafened user when configured', () => {
      const membersMap = new Map([
        ['user-1', { user: { bot: false } }],
        ['user-2', { user: { bot: false } }],
      ]);

      const mockVoiceState: any = {
        member: { id: 'user-1', user: { bot: false } },
        channel: { id: 'vc-1', members: membersMap },
        guild: { id: guildId, afkChannelId: 'afk-channel' },
        selfDeaf: true, // Deafened!
        selfMute: false,
        serverDeaf: false,
      };

      const res = voiceEligibilityService.checkEligibility(mockVoiceState, config);
      expect(res.eligible).toBe(false);
      expect(res.reason).toContain('Self deafened');
    });

    it('disqualifies server-deafened user', () => {
      const membersMap = new Map([
        ['user-1', { user: { bot: false } }],
        ['user-2', { user: { bot: false } }],
      ]);

      const mockVoiceState: any = {
        member: { id: 'user-1', user: { bot: false } },
        channel: { id: 'vc-1', members: membersMap },
        guild: { id: guildId, afkChannelId: 'afk-channel' },
        selfDeaf: false,
        selfMute: false,
        serverDeaf: true,
      };

      const res = voiceEligibilityService.checkEligibility(mockVoiceState, config);
      expect(res.eligible).toBe(false);
      expect(res.reason).toContain('Server deafened');
    });

    it('disqualifies user in AFK channel', () => {
      const membersMap = new Map([
        ['user-1', { user: { bot: false } }],
        ['user-2', { user: { bot: false } }],
      ]);

      const mockVoiceState: any = {
        member: { id: 'user-1', user: { bot: false } },
        channel: { id: 'afk-channel-99', members: membersMap },
        guild: { id: guildId, afkChannelId: 'afk-channel-99' },
        selfDeaf: false,
        selfMute: false,
        serverDeaf: false,
      };

      const res = voiceEligibilityService.checkEligibility(mockVoiceState, config);
      expect(res.eligible).toBe(false);
      expect(res.reason).toContain('AFK');
    });

    it('disqualifies user in ignored voice channel', () => {
      const membersMap = new Map([
        ['user-1', { user: { bot: false } }],
        ['user-2', { user: { bot: false } }],
      ]);

      const mockVoiceState: any = {
        member: { id: 'user-1', user: { bot: false } },
        channel: { id: 'vc-ignored-1', members: membersMap },
        guild: { id: guildId, afkChannelId: 'afk-channel' },
        selfDeaf: false,
        selfMute: false,
        serverDeaf: false,
      };

      const res = voiceEligibilityService.checkEligibility(mockVoiceState, config);
      expect(res.eligible).toBe(false);
      expect(res.reason).toContain('ignored list');
    });
  });

  describe('Voice Session & Short Session Protection', () => {
    it('awards 0 XP for 0 or negative eligible seconds', async () => {
      const result = await voiceXPService.awardVoiceXP(guildId, 'user-short-1', 0, config);
      expect(result.awardedXP).toBe(0);
    });

    it('calculates proportional XP for verified interval duration', async () => {
      // 120 seconds of verified voice time at 10 XP per 60s
      const result = await voiceXPService.awardVoiceXP(guildId, 'user-vc-2', 120, config);
      expect(result.awardedXP).toBe(20);
    });
  });

  describe('Restart Recovery & Failure-Safe Reconciliation', () => {
    it('closes zombie sessions without guessing missing XP if bot restarts and user disconnected', async () => {
      const session = await voiceSessionRepository.createSession(guildId, 'user-dc-1', 'vc-channel');
      expect(session.active).toBe(true);

      // Mock Discord client where user is NOT in VC
      const mockClient: any = {
        guilds: {
          cache: new Map([
            [
              guildId,
              {
                id: guildId,
                members: { cache: new Map([['user-dc-1', { id: 'user-dc-1', voice: null }]]) },
                voiceStates: { cache: new Map() },
              },
            ],
          ]),
        },
      };

      const report = await recoveryService.reconcileVoiceState(mockClient);
      expect(report.closedZombieSessions).toBeGreaterThanOrEqual(1);

      const activeAfter = await voiceSessionRepository.findActiveSession(guildId, 'user-dc-1');
      expect(activeAfter).toBeNull();
    });
  });
});
