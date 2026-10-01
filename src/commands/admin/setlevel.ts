import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder,
  type ChatInputCommandInteraction,
} from 'discord.js';
import { xpService } from '../../services/xp/XPService.js';
import { COLORS } from '../../config/constants.js';

export const data = new SlashCommandBuilder()
  .setName('setlevel')
  .setDescription('Set a user’s level directly (triggers rank card and rewards)')
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
  .addUserOption((option) =>
    option.setName('target').setDescription('The target member to update').setRequired(true)
  )
  .addIntegerOption((option) =>
    option.setName('level').setDescription('The new level to assign (1 to 300)').setRequired(true).setMinValue(0).setMaxValue(300)
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  if (!interaction.guildId || !interaction.guild) return;

  const targetUser = interaction.options.getUser('target', true);
  const targetLevel = interaction.options.getInteger('level', true);
  const member = await interaction.guild.members.fetch(targetUser.id).catch(() => null);

  const updatedUser = await xpService.setLevel(
    interaction.guildId,
    targetUser.id,
    targetLevel,
    `Admin manual setlevel by ${interaction.user.tag}`,
    member,
    interaction.channel
  );

  const embed = new EmbedBuilder()
    .setColor(COLORS.SUCCESS)
    .setTitle('✅ Level Updated')
    .setDescription(
      `Updated **${targetUser.username}** to Level **${targetLevel}** (Total XP: **${updatedUser.totalXP.toLocaleString()}**).`
    )
    .setTimestamp();

  await interaction.reply({ embeds: [embed] });
}
