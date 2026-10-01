import type { GuildMember, PartialGuildMember } from 'discord.js';
import { voiceSessionRepository } from '../repositories/VoiceSessionRepository.js';

export async function onGuildMemberRemove(member: GuildMember | PartialGuildMember) {
  try {
    const active = await voiceSessionRepository.findActiveSession(member.guild.id, member.id);
    if (active) {
      await voiceSessionRepository.endSession(active.id, active.eligibleSeconds, active.xpAwarded);
    }
  } catch (error) {
    console.error('[Event: guildMemberRemove] Error ending session:', error);
  }
}
