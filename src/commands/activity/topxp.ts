import { SlashCommandBuilder, EmbedBuilder, type ChatInputCommandInteraction } from 'discord.js';
import { leaderboardService } from '../../services/leaderboard/LeaderboardService.js';
import { COLORS } from '../../config/constants.js';

export const data = new SlashCommandBuilder()
  .setName('topxp')
  .setDescription('View the Top 10 members by Total Combined XP');

export async function execute(interaction: ChatInputCommandInteraction) {
  if (!interaction.guildId) return;

  const result = await leaderboardService.getLeaderboardPage(interaction.guildId, 'totalXP', 1, 10);
  const embed = new EmbedBuilder()
    .setColor(COLORS.GOLD)
    .setTitle('🏆 Top 10 Total XP Leaders')
    .setTimestamp();

  if (result.items.length === 0) {
    embed.setDescription('No members ranked yet.');
  } else {
    const medalEmojis: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' };
    const lines = result.items.map((item) => {
      const medal = medalEmojis[item.rank] || `**#${item.rank}**`;
      return `${medal} <@${item.discordUserId}> — Level ${item.level} • **${item.totalXP.toLocaleString()} Total XP**`;
    });
    embed.setDescription(lines.join('\n'));
  }

  await interaction.reply({ embeds: [embed] });
}
