import type { VoiceState, GuildMember } from 'discord.js';
import { guildConfigRepository } from '../../repositories/GuildConfigRepository.js';
import { roleManager } from '../roles/RoleManager.js';

export class VoiceRoleService {
  /**
   * Handle role assignment when voice state updates
   */
  public async handleVoiceStateChange(oldState: VoiceState, newState: VoiceState): Promise<void> {
    const member = newState.member || oldState.member;
    if (!member || member.user.bot) return;

    const guild = newState.guild || oldState.guild;
    const config = await guildConfigRepository.getOrCreate(guild.id);

    if (!config.vcRoleId) {
      return;
    }

    const joinedChannel = newState.channelId !== null;
    const leftAllChannels = !newState.channelId;

    if (joinedChannel) {
      // In a voice channel - ensure they have the temporary VC role
      if (!member.roles.cache.has(config.vcRoleId)) {
        await roleManager.addRole(member, config.vcRoleId, 'Joined voice channel (Temporary VC Role)');
      }
    } else if (leftAllChannels) {
      // Left voice - remove temporary VC role
      if (member.roles.cache.has(config.vcRoleId)) {
        await roleManager.removeRole(member, config.vcRoleId, 'Left voice channel (Temporary VC Role)');
      }
    }
  }

  /**
   * Remove VC role from a member directly
   */
  public async removeVCRole(member: GuildMember, vcRoleId: string): Promise<boolean> {
    return roleManager.removeRole(member, vcRoleId, 'Voice Session Cleanup');
  }

  /**
   * Add VC role to a member directly
   */
  public async addVCRole(member: GuildMember, vcRoleId: string): Promise<boolean> {
    return roleManager.addRole(member, vcRoleId, 'Voice Session Active');
  }
}

export const voiceRoleService = new VoiceRoleService();
