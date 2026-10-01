import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder,
  ChannelType,
  type ChatInputCommandInteraction,
} from 'discord.js';
import { guildConfigRepository } from '../../repositories/GuildConfigRepository.js';
import { COLORS } from '../../config/constants.js';

export const data = new SlashCommandBuilder()
  .setName('setchannel')
  .setDescription('Set the designated channel for Level-Up rank card celebrations')
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
  .addChannelOption((option) =>
    option
      .setName('channel')
      .setDescription('The text channel to send notifications (leave empty to disable)')
      .addChannelTypes(ChannelType.GuildText)
      .setRequired(false)
  )
  .addStringOption((option) =>
    option
      .setName('frequency')
      .setDescription('How often to send level-up rank cards across the 300 levels')
      .setRequired(false)
      .addChoices(
        { name: 'Milestones (Every 5 levels + Role Unlocks - Recommended for 300 levels)', value: 'milestones' },
        { name: 'Every Level (1 to 300)', value: 'all' },
        { name: 'Roles Only (Only when unlocking a role reward)', value: 'roles_only' }
      )
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  if (!interaction.guildId) return;

  const channel = interaction.options.getChannel('channel');
  const channelId = channel ? channel.id : null;
  const frequency = interaction.options.getString('frequency');

  const updates: Record<string, any> = {
    levelUpChannelId: channelId,
  };
  if (frequency) {
    updates.levelUpFrequency = frequency;
  }

  const updatedConfig = await guildConfigRepository.update(interaction.guildId, updates);
  const activeFreq = updatedConfig.levelUpFrequency || 'milestones';

  const freqLabel =
    activeFreq === 'all'
      ? 'Every Level (1 to 300)'
      : activeFreq === 'roles_only'
      ? 'Role Rewards Only'
      : 'Milestones (Every 5 levels + Role Rewards)';

  const embed = new EmbedBuilder()
    .setColor(COLORS.SUCCESS)
    .setTitle('✅ Level-Up Announcement Channel Updated')
    .setDescription(
      channelId
        ? `Level-up congratulations and rank cards will now be sent exclusively to <#${channelId}>!`
        : 'Level-up announcements have been disabled.'
    )
    .addFields(
      {
        name: '📢 Designated Channel',
        value: channelId ? `<#${channelId}>` : 'None (Disabled)',
        inline: true,
      },
      {
        name: '⚙️ Frequency (300 Levels)',
        value: `**${freqLabel}**`,
        inline: true,
      }
    )
    .setFooter({ text: 'Activity Engine • 300 Levels Milestone System' })
    .setTimestamp();

  await interaction.reply({ embeds: [embed] });
}
