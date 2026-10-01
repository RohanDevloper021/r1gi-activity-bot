import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder,
  type ChatInputCommandInteraction,
} from 'discord.js';
import { xpService } from '../../services/xp/XPService.js';
import { COLORS } from '../../config/constants.js';

export const data = new SlashCommandBuilder()
  .setName('resetxp')
  .setDescription('Reset XP for a specific member or the entire server')
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
  .addUserOption((option) =>
    option
      .setName('target')
      .setDescription('Specific user to reset (leave blank to reset entire server)')
      .setRequired(false)
  )
  .addBooleanOption((option) =>
    option
      .setName('confirm_entire_server')
      .setDescription('Set to TRUE if you are resetting the entire server')
      .setRequired(false)
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  if (!interaction.guildId) return;

  const targetUser = interaction.options.getUser('target');
  const confirmEntireServer = interaction.options.getBoolean('confirm_entire_server');

  if (!targetUser && !confirmEntireServer) {
    await interaction.reply({
      content:
        '⚠️ **Warning:** To reset the entire server’s XP, you must set `confirm_entire_server: true`. Or specify a `target` user.',
      ephemeral: true,
    });
    return;
  }

  if (targetUser) {
    await xpService.resetXP(
      interaction.guildId,
      targetUser.id,
      `Reset by Admin ${interaction.user.tag}`
    );

    const embed = new EmbedBuilder()
      .setColor(COLORS.WARNING)
      .setTitle('🔄 XP Reset Complete')
      .setDescription(`Successfully reset all XP and levels for **${targetUser.username}**.`)
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  } else {
    const count = await xpService.resetXP(
      interaction.guildId,
      undefined,
      `Full server reset by Admin ${interaction.user.tag}`
    );

    const embed = new EmbedBuilder()
      .setColor(COLORS.DANGER)
      .setTitle('⚠️ Server XP Reset Complete')
      .setDescription(`Successfully reset XP and levels for **${count}** members in this server.`)
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  }
}
