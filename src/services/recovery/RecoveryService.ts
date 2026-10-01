import type { Client } from 'discord.js';
import { voiceSessionRepository } from '../../repositories/VoiceSessionRepository.js';
import { guildConfigRepository } from '../../repositories/GuildConfigRepository.js';
import { voiceSessionService } from '../voice/VoiceSessionService.js';
import { voiceRoleService } from '../voice/VoiceRoleService.js';

export interface RecoveryReport {
  reconciledSessions: number;
  closedZombieSessions: number;
  rolesRepaired: number;
}

export class RecoveryService {
  /**
   * Reconcile persistent database voice sessions with live Discord Gateway state
   */
  public async reconcileVoiceState(client: Client): Promise<RecoveryReport> {
    console.log('🔄 [RecoveryService] Beginning voice session & role reconciliation...');
    const report: RecoveryReport = {
      reconciledSessions: 0,
      closedZombieSessions: 0,
      rolesRepaired: 0,
    };

    try {
      const activeSessions = await voiceSessionRepository.listActiveSessions();

      for (const session of activeSessions) {
        const guild = client.guilds.cache.get(session.guildId);
        if (!guild) {
          // Guild no longer available or bot kicked, end session without guessing unverified XP
          await voiceSessionRepository.endSession(session.id, session.eligibleSeconds, session.xpAwarded);
          report.closedZombieSessions++;
          continue;
        }

        const member = guild.members.cache.get(session.userId);
        const inExpectedChannel = member && member.voice && member.voice.channelId === session.channelId;

        if (!inExpectedChannel) {
          // User is no longer in VC, close session without guessing
          await voiceSessionRepository.endSession(session.id, session.eligibleSeconds, session.xpAwarded);
          report.closedZombieSessions++;

          // Check if VC role needs to be removed
          const config = await guildConfigRepository.getOrCreate(guild.id);
          if (config.vcRoleId && member && member.roles.cache.has(config.vcRoleId)) {
            await voiceRoleService.removeVCRole(member, config.vcRoleId);
            report.rolesRepaired++;
          }
        } else {
          // User is still in VC! Resume tracking safely
          report.reconciledSessions++;
        }
      }

      // Check all guild members currently in VC to ensure active session exists and VC role is synced
      for (const guild of client.guilds.cache.values()) {
        const config = await guildConfigRepository.getOrCreate(guild.id);
        const voiceStates = guild.voiceStates.cache;

        for (const [userId, state] of voiceStates.entries()) {
          if (state.member?.user.bot) continue;

          if (state.channelId) {
            // Repair VC role if missing
            if (config.vcRoleId && state.member && !state.member.roles.cache.has(config.vcRoleId)) {
              await voiceRoleService.addVCRole(state.member, config.vcRoleId);
              report.rolesRepaired++;
            }
          }
        }
      }

      console.log(
        `✅ [RecoveryService] Reconciliation complete: ${report.reconciledSessions} active sessions resumed, ${report.closedZombieSessions} zombie sessions closed, ${report.rolesRepaired} roles repaired.`
      );
    } catch (err) {
      console.error('❌ [RecoveryService] Error during state reconciliation:', err);
    }

    return report;
  }
}

export const recoveryService = new RecoveryService();
