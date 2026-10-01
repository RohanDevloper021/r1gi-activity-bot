import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder,
  type ChatInputCommandInteraction,
} from 'discord.js';
import { levelRoleRepository } from '../../repositories/LevelRoleRepository.js';
import { COLORS } from '../../config/constants.js';

export const data = new SlashCommandBuilder()
  .setName('levelrole-add')
  .setDescription('Add a new milestone role awarded when a member reaches a specific level')
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
  .addIntegerOption((option) =>
    option.setName('level').setDescription('The level required to earn this role').setRequired(true).setMinValue(1)
  )
  .addRoleOption((option) =>
    option.setName('role').setDescription('The Discord role to award').setRequired(true)
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  if (!interaction.guildId || !interaction.guild) return;

  const level = interaction.options.getInteger('level', true);
  const role = interaction.options.getRole('role', true);

  // Bot role hierarchy check
  const botMember = interaction.guild.members.me;
  if (botMember && botMember.roles.highest.position <= role.position) {
    await interaction.reply({
      content: `⚠️ The role <@&${role.id}> is higher than or equal to my highest role. Please move my bot role higher in Server Settings > Roles so I can assign it.`,
      ephemeral: true,
    });
    return;
  }

  await levelRoleRepository.upsert(interaction.guildId, level, role.id);

  const embed = new EmbedBuilder()
    .setColor(COLORS.SUCCESS)
    .setTitle('🎖️ Level Role Milestone Configured')
    .setDescription(
      `Members reaching **Level ${level}** will now automatically receive the <@&${role.id}> role!`
    )
    .setTimestamp();

  await interaction.reply({ embeds: [embed] });
}
