import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder,
  type ChatInputCommandInteraction,
} from 'discord.js';
import { userRepository } from '../../repositories/UserRepository.js';
import { xpRepository } from '../../repositories/XPRepository.js';
import { formatDuration } from '../../utils/formatters.js';
import { COLORS } from '../../config/constants.js';

export const data = new SlashCommandBuilder()
  .setName('xpstats')
  .setDescription('View server-wide activity statistics and XP distribution')
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

export async function execute(interaction: ChatInputCommandInteraction) {
  if (!interaction.guildId) return;

  const totalUsers = await userRepository.countGuildUsers(interaction.guildId);
  const topUsers = await userRepository.getLeaderboard(interaction.guildId, 'totalXP', 10, 0);
  const recentTransactions = await xpRepository.getRecentTransactions(interaction.guildId, 5);

  let totalXPAll = 0;
  let totalChatXPAll = 0;
  let totalVoiceXPAll = 0;
  let totalVoiceSecondsAll = 0;

  for (const u of topUsers) {
    totalXPAll += u.totalXP;
    totalChatXPAll += u.chatXP;
    totalVoiceXPAll += u.voiceXP;
    totalVoiceSecondsAll += u.voiceSeconds;
  }

  const embed = new EmbedBuilder()
    .setColor(COLORS.PRIMARY)
    .setTitle('📊 Server Activity & XP Analytics')
    .addFields(
      { name: '👥 Tracked Members', value: `${totalUsers.toLocaleString()}`, inline: true },
      { name: '⭐ Top 10 Total XP', value: `${totalXPAll.toLocaleString()}`, inline: true },
      { name: '⏱️ Top 10 Voice Time', value: formatDuration(totalVoiceSecondsAll), inline: true },
      { name: '💬 Top 10 Chat XP', value: `${totalChatXPAll.toLocaleString()}`, inline: true },
      { name: '🎙️ Top 10 Voice XP', value: `${totalVoiceXPAll.toLocaleString()}`, inline: true },
      {
        name: '🕒 Recent XP Transactions',
        value:
          recentTransactions.length > 0
            ? recentTransactions
                .map(
                  (t) =>
                    `• **+${t.amount} XP** (${t.source}) — ${t.reason.substring(0, 35)} <t:${Math.floor(
                      t.createdAt.getTime() / 1000
                    )}:R>`
                )
                .join('\n')
            : 'No recent transactions',
        inline: false,
      }
    )
    .setFooter({ text: 'Activity Engine • Audit ledger active' })
    .setTimestamp();

  await interaction.reply({ embeds: [embed] });
}
