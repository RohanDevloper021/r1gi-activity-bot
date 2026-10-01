import { SlashCommandBuilder, EmbedBuilder, type ChatInputCommandInteraction } from 'discord.js';
import { leaderboardService } from '../../services/leaderboard/LeaderboardService.js';
import { COLORS } from '../../config/constants.js';

export const data = new SlashCommandBuilder()
  .setName('topchat')
  .setDescription('View the Top 10 members by Chat Activity XP');

export async function execute(interaction: ChatInputCommandInteraction) {
  if (!interaction.guildId) return;

  const result = await leaderboardService.getLeaderboardPage(interaction.guildId, 'chatXP', 1, 10);
  const embed = new EmbedBuilder()
    .setColor(COLORS.PRIMARY)
    .setTitle('💬 Top 10 Chat Leaders')
    .setTimestamp();

  if (result.items.length === 0) {
    embed.setDescription('No members with chat activity yet.');
  } else {
    const medalEmojis: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' };
    const lines = result.items.map((item) => {
      const medal = medalEmojis[item.rank] || `**#${item.rank}**`;
      return `${medal} <@${item.discordUserId}> — Level ${item.level} • **${item.chatXP.toLocaleString()} Chat XP**`;
    });
    embed.setDescription(lines.join('\n'));
  }

  await interaction.reply({ embeds: [embed] });
}
