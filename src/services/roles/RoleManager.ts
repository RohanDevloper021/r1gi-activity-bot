import type { GuildMember, Role } from 'discord.js';

export class RoleManager {
  /**
   * Safely adds a role to a member with permission and hierarchy validation
   */
  public async addRole(member: GuildMember, roleId: string, reason?: string): Promise<boolean> {
    try {
      const guild = member.guild;
      const role = await guild.roles.fetch(roleId);
      if (!role) {
        console.warn(`[RoleManager] Role ${roleId} not found in guild ${guild.id}`);
        return false;
      }

      // Check bot permissions
      const botMember = guild.members.me;
      if (!botMember || !botMember.permissions.has('ManageRoles')) {
        console.warn(`[RoleManager] Missing 'Manage Roles' permission in guild ${guild.id}`);
        return false;
      }

      // Check hierarchy (bot's highest role must be higher than the target role)
      if (botMember.roles.highest.position <= role.position) {
        console.warn(`[RoleManager] Bot role hierarchy too low to assign role ${role.name} (${role.id})`);
        return false;
      }

      if (member.roles.cache.has(roleId)) {
        return true; // Already has role
      }

      await member.roles.add(role, reason || 'Activity Engine Role Assignment');
      return true;
    } catch (err) {
      console.error(`[RoleManager] Failed to add role ${roleId} to user ${member.id}:`, err);
      return false;
    }
  }

  /**
   * Safely removes a role from a member with validation
   */
  public async removeRole(member: GuildMember, roleId: string, reason?: string): Promise<boolean> {
    try {
      const guild = member.guild;
      const role = await guild.roles.fetch(roleId);
      if (!role) return false;

      const botMember = guild.members.me;
      if (!botMember || !botMember.permissions.has('ManageRoles')) {
        return false;
      }

      if (botMember.roles.highest.position <= role.position) {
        return false;
      }

      if (!member.roles.cache.has(roleId)) {
        return true; // Already doesn't have role
      }

      await member.roles.remove(role, reason || 'Activity Engine Role Removal');
      return true;
    } catch (err) {
      console.error(`[RoleManager] Failed to remove role ${roleId} from user ${member.id}:`, err);
      return false;
    }
  }
}

export const roleManager = new RoleManager();
