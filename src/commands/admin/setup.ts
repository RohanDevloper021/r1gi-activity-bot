import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder,
  type ChatInputCommandInteraction,
} from 'discord.js';
import { guildConfigRepository } from '../../repositories/GuildConfigRepository.js';
import { levelRoleRepository } from '../../repositories/LevelRoleRepository.js';
import { COLORS } from '../../config/constants.js';

export const data = new SlashCommandBuilder()
  .setName('setup')
  .setDescription('View current server Activity Engine configuration and setup status')
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

export async function execute(interaction: ChatInputCommandInteraction) {
  if (!interaction.guildId) return;

  const config = await guildConfigRepository.getOrCreate(interaction.guildId);
  const roles = await levelRoleRepository.listByGuild(interaction.guildId);

  const embed = new EmbedBuilder()
    .setColor(COLORS.PRIMARY)
    .setTitle('⚙️ Activity Engine Server Configuration')
    .setDescription(
      'Activity Engine is actively tracking Chat and Voice activity, calculating levels, and awarding rewards.'
    )
    .addFields(
      {
        name: '💬 Chat XP Settings',
        value: [
          `• **Range:** ${config.chatXPMin} - ${config.chatXPMax} XP per message`,
          `• **Cooldown:** ${config.chatCooldownSeconds} seconds`,
          `• **Daily Limit:** ${config.dailyChatXPLimit > 0 ? `${config.dailyChatXPLimit.toLocaleString()} XP` : 'Unlimited (No Cap)'}`,
        ].join('\n'),
        inline: true,
      },
      {
        name: '🎙️ Voice XP Settings',
        value: [
          `• **Rate:** ${config.voiceXPPerInterval} XP per ${config.voiceIntervalSeconds}s`,
          `• **Min Session:** ${config.minimumVoiceSessionSeconds} seconds`,
          `• **Min Humans:** ${config.minimumVoiceParticipants} ${config.minimumVoiceParticipants <= 1 ? '(Solo allowed)' : ''}`,
          `• **Daily Limit:** ${config.dailyVoiceXPLimit > 0 ? `${config.dailyVoiceXPLimit.toLocaleString()} XP` : 'Unlimited (No Cap)'}`,
          `• **Self Deafen:** ${config.selfDeafenBlocksXP ? 'Blocks XP' : 'Allowed'}`,
          `• **Self Mute:** ${config.selfMuteBlocksXP ? 'Blocks XP' : 'Allowed'}`,
        ].join('\n'),
        inline: true,
      },
      {
        name: '🎖️ Level-Role Milestones',
        value:
          roles.length > 0
            ? roles.map((r) => `• Level **${r.level}** → <@&${r.roleId}>`).join('\n')
            : 'No level roles configured. Use `/levelrole add` to set milestones!',
        inline: false,
      },
      {
        name: '🔊 Temporary VC Role',
        value: config.vcRoleId ? `<@&${config.vcRoleId}>` : 'Not configured (`/setvcrole`)',
        inline: true,
      },
      {
        name: '📢 Level-Up Announcement Channel',
        value: [
          `• **Channel:** ${config.levelUpChannelId ? `<#${config.levelUpChannelId}>` : 'Auto-detected / Dedicated Channel'}`,
          `• **Celebration Format:** Interactive Rank Card Embed with level reached, stats & unlocked roles`,
          `• **Frequency (300 Levels):** ${
            config.levelUpFrequency === 'all'
              ? 'Every Level (1 to 300)'
              : config.levelUpFrequency === 'roles_only'
              ? 'Role Rewards Only'
              : 'Milestones (Every 5 levels + Role Rewards)'
          }`,
        ].join('\n'),
        inline: false,
      },
      {
        name: '🛡️ Anti-Farming & Diminishing Returns',
        value: config.diminishingReturnsEnabled
          ? `Enabled (Threshold: ${config.diminishingReturnsThreshold.toLocaleString()} daily XP)`
          : 'Disabled',
        inline: false,
      }
    )
    .setFooter({ text: 'Use /levelrole or admin commands to adjust settings' })
    .setTimestamp();

  await interaction.reply({ embeds: [embed] });
}
