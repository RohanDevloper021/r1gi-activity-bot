import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder,
  type ChatInputCommandInteraction,
} from 'discord.js';
import { xpService } from '../../services/xp/XPService.js';
import { COLORS } from '../../config/constants.js';

export const data = new SlashCommandBuilder()
  .setName('setxp')
  .setDescription('Set a user’s total XP (triggers level-up rank card if level increases)')
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
  .addUserOption((option) =>
    option.setName('target').setDescription('The target member to update').setRequired(true)
  )
  .addIntegerOption((option) =>
    option.setName('xp').setDescription('The new total XP amount').setRequired(true).setMinValue(0)
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  if (!interaction.guildId || !interaction.guild) return;

  const targetUser = interaction.options.getUser('target', true);
  const newXP = interaction.options.getInteger('xp', true);
  const member = await interaction.guild.members.fetch(targetUser.id).catch(() => null);

  const updatedUser = await xpService.setXP(
    interaction.guildId,
    targetUser.id,
    newXP,
    `Admin manual set by ${interaction.user.tag} (${interaction.user.id})`,
    member,
    interaction.channel
  );

  const embed = new EmbedBuilder()
    .setColor(COLORS.SUCCESS)
    .setTitle('✅ XP Updated')
    .setDescription(
      `Updated **${targetUser.username}**'s total XP to **${newXP.toLocaleString()}**.\nCurrent Level: **${updatedUser.level}**.`
    )
    .setTimestamp();

  await interaction.reply({ embeds: [embed] });
}
