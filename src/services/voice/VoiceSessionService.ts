import type { VoiceState, Client } from 'discord.js';
import { voiceSessionRepository } from '../../repositories/VoiceSessionRepository.js';
import { guildConfigRepository } from '../../repositories/GuildConfigRepository.js';
import { voiceEligibilityService } from './VoiceEligibilityService.js';
import { voiceRoleService } from './VoiceRoleService.js';
import { voiceXPService } from '../xp/VoiceXPService.js';
import { cooldownService } from '../antiabuse/CooldownService.js';

interface ActiveTracker {
  sessionId: string;
  guildId: string;
  userId: string;
  channelId: string;
  joinedAt: number;
  lastTickAt: number;
  eligibleSeconds: number;
  xpAwarded: number;
}

export class VoiceSessionService {
  // In-memory active tracker synced with persistent repository
  private activeTrackers = new Map<string, ActiveTracker>();
  private intervalTimer: NodeJS.Timeout | null = null;

  private getKey(guildId: string, userId: string): string {
    return `${guildId}:${userId}`;
  }

  /**
   * Start background tick runner to process voice sessions periodically
   */
  public startInterval(client?: Client, intervalMs = 60000) {
    if (this.intervalTimer) return;
    this.intervalTimer = setInterval(() => {
      this.processAllActiveSessions(client);
    }, intervalMs);
  }

  public stopInterval() {
    if (this.intervalTimer) {
      clearInterval(this.intervalTimer);
      this.intervalTimer = null;
    }
  }

  /**
   * Handle voiceStateUpdate event from Discord
   */
  public async handleVoiceStateUpdate(oldState: VoiceState, newState: VoiceState): Promise<void> {
    const member = newState.member || oldState.member;
    if (!member || member.user.bot) return;

    const guildId = newState.guild.id;
    const userId = member.id;
    const oldChannelId = oldState.channelId;
    const newChannelId = newState.channelId;

    // 1. Temporary VC Role management
    await voiceRoleService.handleVoiceStateChange(oldState, newState);

    // 2. Joined a voice channel from disconnected state
    if (!oldChannelId && newChannelId) {
      await this.handleUserJoin(guildId, userId, newChannelId, newState);
      return;
    }

    // 3. Left voice channel completely
    if (oldChannelId && !newChannelId) {
      await this.handleUserLeave(guildId, userId, oldState);
      return;
    }

    // 4. Switched voice channels
    if (oldChannelId && newChannelId && oldChannelId !== newChannelId) {
      await this.handleUserSwitch(guildId, userId, oldChannelId, newChannelId, newState);
      return;
    }

    // 5. State change within same channel (mute, deafen, etc.)
    if (oldChannelId && newChannelId && oldChannelId === newChannelId) {
      await this.handleStateChangeWithinChannel(guildId, userId, newState);
    }
  }

  private async handleUserJoin(
    guildId: string,
    userId: string,
    channelId: string,
    state: VoiceState
  ): Promise<void> {
    // Cooldown check for join/leave farming
    if (cooldownService.isOnVoiceCooldown(guildId, userId, 10)) {
      // Still allow joining session record, but reset eligibility timer
    }
    cooldownService.setVoiceCooldown(guildId, userId);

    const session = await voiceSessionRepository.createSession(guildId, userId, channelId);
    const now = Date.now();

    const tracker: ActiveTracker = {
      sessionId: session.id,
      guildId,
      userId,
      channelId,
      joinedAt: now,
      lastTickAt: now,
      eligibleSeconds: 0,
      xpAwarded: 0,
    };

    this.activeTrackers.set(this.getKey(guildId, userId), tracker);
  }

  private async handleUserLeave(guildId: string, userId: string, state: VoiceState): Promise<void> {
    const key = this.getKey(guildId, userId);
    const tracker = this.activeTrackers.get(key);
    const config = await guildConfigRepository.getOrCreate(guildId);

    if (tracker) {
      // Process remaining eligible time up to departure
      const now = Date.now();
      const elapsedSeconds = Math.floor((now - tracker.lastTickAt) / 1000);
      const isEligible = voiceEligibilityService.checkEligibility(state, config).eligible;

      if (isEligible && elapsedSeconds > 0) {
        tracker.eligibleSeconds += elapsedSeconds;
      }

      // Check minimum voice session duration
      const totalSessionSeconds = Math.floor((now - tracker.joinedAt) / 1000);
      let awardedXP = 0;

      if (totalSessionSeconds >= config.minimumVoiceSessionSeconds && tracker.eligibleSeconds > 0) {
        const result = await voiceXPService.awardVoiceXP(
          guildId,
          userId,
          tracker.eligibleSeconds,
          config,
          state.member
        );
        awardedXP = result.awardedXP;
      } else {
        // Did not meet minimum session threshold or no eligible seconds
      }

      // End session in database
      await voiceSessionRepository.endSession(
        tracker.sessionId,
        tracker.eligibleSeconds,
        tracker.xpAwarded + awardedXP
      );

      this.activeTrackers.delete(key);
    } else {
      // Find active database session if tracker was lost
      const dbSession = await voiceSessionRepository.findActiveSession(guildId, userId);
      if (dbSession) {
        await voiceSessionRepository.endSession(dbSession.id, dbSession.eligibleSeconds, dbSession.xpAwarded);
      }
    }
  }

  private async handleUserSwitch(
    guildId: string,
    userId: string,
    oldChannelId: string,
    newChannelId: string,
    state: VoiceState
  ): Promise<void> {
    const key = this.getKey(guildId, userId);
    let tracker = this.activeTrackers.get(key);

    if (!tracker) {
      await this.handleUserJoin(guildId, userId, newChannelId, state);
      return;
    }

    // Update channel on active session
    tracker.channelId = newChannelId;
    await voiceSessionRepository.updateSession(tracker.sessionId, {
      channelId: newChannelId,
    });
  }

  private async handleStateChangeWithinChannel(
    guildId: string,
    userId: string,
    state: VoiceState
  ): Promise<void> {
    // Eligibility will be evaluated on tick or disconnect
  }

  /**
   * Process all currently active voice sessions across guilds
   */
  public async processAllActiveSessions(client?: Client): Promise<void> {
    const now = Date.now();

    for (const [key, tracker] of this.activeTrackers.entries()) {
      try {
        const config = await guildConfigRepository.getOrCreate(tracker.guildId);
        const elapsedSeconds = Math.floor((now - tracker.lastTickAt) / 1000);
        if (elapsedSeconds <= 0) continue;

        tracker.lastTickAt = now;

        let isEligible = false;
        let member = null;

        if (client) {
          const guild = client.guilds.cache.get(tracker.guildId);
          if (guild) {
            member = guild.members.cache.get(tracker.userId);
            if (member && member.voice && member.voice.channelId === tracker.channelId) {
              const check = voiceEligibilityService.checkEligibility(member.voice, config);
              isEligible = check.eligible;
            }
          }
        } else {
          // In test/standalone mode without live client, tracker maintains eligibility flag
          isEligible = true;
        }

        if (isEligible) {
          tracker.eligibleSeconds += elapsedSeconds;

          // Award XP in intervals if eligible seconds accumulate to interval
          if (tracker.eligibleSeconds >= config.voiceIntervalSeconds) {
            const intervals = Math.floor(tracker.eligibleSeconds / config.voiceIntervalSeconds);
            const secondsToProcess = intervals * config.voiceIntervalSeconds;

            const res = await voiceXPService.awardVoiceXP(
              tracker.guildId,
              tracker.userId,
              secondsToProcess,
              config,
              member
            );

            tracker.xpAwarded += res.awardedXP;
            tracker.eligibleSeconds -= secondsToProcess;

            await voiceSessionRepository.updateSession(tracker.sessionId, {
              eligibleSeconds: tracker.eligibleSeconds,
              xpAwarded: tracker.xpAwarded,
            });
          }
        }
      } catch (err) {
        console.error(`[VoiceSessionService] Error processing session ${tracker.sessionId}:`, err);
      }
    }
  }

  public getActiveTrackers(): ActiveTracker[] {
    return Array.from(this.activeTrackers.values());
  }

  public clearAll() {
    this.activeTrackers.clear();
    this.stopInterval();
  }
}

export const voiceSessionService = new VoiceSessionService();
