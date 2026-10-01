import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder,
  type ChatInputCommandInteraction,
} from 'discord.js';
import { xpService } from '../../services/xp/XPService.js';
import { XPSource, COLORS } from '../../config/constants.js';

export const data = new SlashCommandBuilder()
  .setName('addxp')
  .setDescription('Add bonus XP to a user (triggers level-up rank card if level increases)')
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
  .addUserOption((option) =>
    option.setName('target').setDescription('The target member to receive XP').setRequired(true)
  )
  .addIntegerOption((option) =>
    option.setName('amount').setDescription('Amount of XP to add').setRequired(true).setMinValue(1)
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  if (!interaction.guildId || !interaction.guild) return;

  const targetUser = interaction.options.getUser('target', true);
  const amount = interaction.options.getInteger('amount', true);
  const member = await interaction.guild.members.fetch(targetUser.id).catch(() => null);

  const result = await xpService.awardXP({
    guildId: interaction.guildId,
    discordUserId: targetUser.id,
    amount,
    source: XPSource.ADMIN,
    reason: `Admin bonus awarded by ${interaction.user.tag}`,
    member,
    fallbackChannel: interaction.channel,
  });

  const embed = new EmbedBuilder()
    .setColor(COLORS.SUCCESS)
    .setTitle('✅ XP Awarded')
    .setDescription(
      `Awarded **+${amount.toLocaleString()} XP** to **${targetUser.username}**.\n` +
      `New Total XP: **${result.newXP.toLocaleString()}** (Level **${result.newLevel}**)${
        result.leveledUp ? ' 🎉 **LEVELED UP!**' : ''
      }`
    )
    .setTimestamp();

  await interaction.reply({ embeds: [embed] });
}
