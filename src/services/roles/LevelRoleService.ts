import type { GuildMember } from 'discord.js';
import { levelRoleRepository } from '../../repositories/LevelRoleRepository.js';
import { guildConfigRepository } from '../../repositories/GuildConfigRepository.js';
import { roleManager } from './RoleManager.js';

export interface LevelRoleSyncResult {
  addedRoles: string[];
  removedRoles: string[];
  failedRoles: string[];
}

export class LevelRoleService {
  /**
   * Evaluates and updates a member's level roles based on guild configuration
   */
  public async processLevelRoles(
    guildId: string,
    member: GuildMember,
    currentLevel: number
  ): Promise<LevelRoleSyncResult> {
    const result: LevelRoleSyncResult = {
      addedRoles: [],
      removedRoles: [],
      failedRoles: [],
    };

    const config = await guildConfigRepository.getOrCreate(guildId);
    const milestones = await levelRoleRepository.listByGuild(guildId);

    if (milestones.length === 0) {
      return result;
    }

    // Milestones sorted by level ascending
    const eligibleMilestones = milestones.filter((m) => m.level <= currentLevel);
    const higherMilestones = milestones.filter((m) => m.level > currentLevel);

    if (config.removePreviousLevelRoles) {
      // Keep only the single highest eligible milestone role
      const highestEligible = eligibleMilestones[eligibleMilestones.length - 1];
      const rolesToRemove = eligibleMilestones
        .filter((m) => highestEligible && m.id !== highestEligible.id)
        .map((m) => m.roleId);

      // Also remove any roles from higher milestones that member shouldn't have
      for (const m of higherMilestones) {
        rolesToRemove.push(m.roleId);
      }

      if (highestEligible) {
        const added = await roleManager.addRole(
          member,
          highestEligible.roleId,
          `Reached Level ${highestEligible.level}`
        );
        if (added) {
          result.addedRoles.push(highestEligible.roleId);
        } else {
          result.failedRoles.push(highestEligible.roleId);
        }
      }

      for (const roleId of rolesToRemove) {
        if (member.roles.cache.has(roleId)) {
          const removed = await roleManager.removeRole(
            member,
            roleId,
            'Previous Level Role Cleaned Up'
          );
          if (removed) {
            result.removedRoles.push(roleId);
          }
        }
      }
    } else {
      // Cumulative: Add all eligible milestone roles
      for (const milestone of eligibleMilestones) {
        if (!member.roles.cache.has(milestone.roleId)) {
          const added = await roleManager.addRole(
            member,
            milestone.roleId,
            `Reached Level ${milestone.level}`
          );
          if (added) {
            result.addedRoles.push(milestone.roleId);
          } else {
            result.failedRoles.push(milestone.roleId);
          }
        }
      }
    }

    return result;
  }
}

export const levelRoleService = new LevelRoleService();
