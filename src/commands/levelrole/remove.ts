import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder,
  type ChatInputCommandInteraction,
} from 'discord.js';
import { levelRoleRepository } from '../../repositories/LevelRoleRepository.js';
import { COLORS } from '../../config/constants.js';

export const data = new SlashCommandBuilder()
  .setName('levelrole-remove')
  .setDescription('Remove a level-role reward milestone')
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
  .addIntegerOption((option) =>
    option.setName('level').setDescription('The level milestone to remove').setRequired(true).setMinValue(1)
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  if (!interaction.guildId) return;

  const level = interaction.options.getInteger('level', true);
  const existing = await levelRoleRepository.findByGuildAndLevel(interaction.guildId, level);

  if (!existing) {
    await interaction.reply({
      content: `❌ No level role milestone is configured for Level ${level}.`,
      ephemeral: true,
    });
    return;
  }

  await levelRoleRepository.delete(interaction.guildId, level);

  const embed = new EmbedBuilder()
    .setColor(COLORS.WARNING)
    .setTitle('🗑️ Level Role Milestone Removed')
    .setDescription(
      `Removed milestone for **Level ${level}** (<@&${existing.roleId}>). Existing role holders are unaffected.`
    )
    .setTimestamp();

  await interaction.reply({ embeds: [embed] });
}
