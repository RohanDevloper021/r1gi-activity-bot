import type { VoiceState } from 'discord.js';
import type { GuildConfigRecord } from '../../types/index.js';

export interface EligibilityResult {
  eligible: boolean;
  reason?: string;
  humanCount: number;
}

export class VoiceEligibilityService {
  /**
   * Determine whether a member in a voice channel is currently eligible to earn voice XP
   */
  public checkEligibility(voiceState: VoiceState, config: GuildConfigRecord): EligibilityResult {
    const member = voiceState.member;
    const channel = voiceState.channel;

    if (!member || !channel) {
      return { eligible: false, reason: 'Not in a voice channel', humanCount: 0 };
    }

    if (member.user.bot) {
      return { eligible: false, reason: 'Bots do not earn voice XP', humanCount: 0 };
    }

    // Check Discord guild AFK channel
    if (voiceState.guild.afkChannelId && channel.id === voiceState.guild.afkChannelId) {
      return { eligible: false, reason: 'In Discord AFK channel', humanCount: 0 };
    }

    // Check ignored voice channels
    try {
      const ignoredChannels: string[] = JSON.parse(config.ignoredVoiceChannels || '[]');
      if (ignoredChannels.includes(channel.id)) {
        return { eligible: false, reason: 'Channel is in ignored list', humanCount: 0 };
      }
    } catch {
      // Ignore JSON parse issue
    }

    // Server deafen check
    if (voiceState.serverDeaf) {
      return { eligible: false, reason: 'Server deafened', humanCount: 0 };
    }

    // Self deafen check
    if (config.selfDeafenBlocksXP && voiceState.selfDeaf) {
      return { eligible: false, reason: 'Self deafened', humanCount: 0 };
    }

    // Self mute check
    if (config.selfMuteBlocksXP && voiceState.selfMute) {
      return { eligible: false, reason: 'Self muted (configured to block XP)', humanCount: 0 };
    }

    // Count real human participants in channel
    let humanCount = 0;
    if (channel.members) {
      if (typeof (channel.members as any).filter === 'function') {
        const filtered = (channel.members as any).filter((m: any) => !m.user?.bot);
        humanCount = filtered.size !== undefined ? filtered.size : filtered.length;
      } else if (channel.members instanceof Map) {
        for (const m of (channel.members as any).values()) {
          if (!m.user?.bot) humanCount++;
        }
      }
    }

    if (humanCount < config.minimumVoiceParticipants) {
      return {
        eligible: false,
        reason: `Channel has ${humanCount} human(s), minimum required is ${config.minimumVoiceParticipants}`,
        humanCount,
      };
    }

    return {
      eligible: true,
      humanCount,
    };
  }
}

export const voiceEligibilityService = new VoiceEligibilityService();
