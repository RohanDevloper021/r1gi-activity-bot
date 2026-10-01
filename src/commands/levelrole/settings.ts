import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder,
  type ChatInputCommandInteraction,
} from 'discord.js';
import { guildConfigRepository } from '../../repositories/GuildConfigRepository.js';
import { COLORS } from '../../config/constants.js';

export const data = new SlashCommandBuilder()
  .setName('levelrole-settings')
  .setDescription('Configure level-role award behavior')
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
  .addBooleanOption((option) =>
    option
      .setName('remove_previous')
      .setDescription('Remove lower level roles upon leveling up (True = single role, False = stack)')
      .setRequired(true)
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  if (!interaction.guildId) return;

  const removePrevious = interaction.options.getBoolean('remove_previous', true);

  await guildConfigRepository.update(interaction.guildId, {
    removePreviousLevelRoles: removePrevious,
  });

  const embed = new EmbedBuilder()
    .setColor(COLORS.SUCCESS)
    .setTitle('⚙️ Level Role Settings Updated')
    .setDescription(
      removePrevious
        ? '✅ **Remove Previous Roles:** Enabled\nWhen a member reaches a higher milestone, lower milestone roles will be removed automatically.'
        : '✅ **Remove Previous Roles:** Disabled\nMembers will keep all milestone roles they qualify for simultaneously (stacking).'
    )
    .setTimestamp();

  await interaction.reply({ embeds: [embed] });
}
