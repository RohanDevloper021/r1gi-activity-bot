import { SlashCommandBuilder, EmbedBuilder, type ChatInputCommandInteraction } from 'discord.js';
import { leaderboardService } from '../../services/leaderboard/LeaderboardService.js';
import { COLORS } from '../../config/constants.js';

export const data = new SlashCommandBuilder()
  .setName('topvoice')
  .setDescription('View the Top 10 members by Voice Activity XP');

export async function execute(interaction: ChatInputCommandInteraction) {
  if (!interaction.guildId) return;

  const result = await leaderboardService.getLeaderboardPage(interaction.guildId, 'voiceXP', 1, 10);
  const embed = new EmbedBuilder()
    .setColor(COLORS.VOICE)
    .setTitle('🎙️ Top 10 Voice Activity Leaders')
    .setTimestamp();

  if (result.items.length === 0) {
    embed.setDescription('No members with voice activity yet.');
  } else {
    const medalEmojis: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' };
    const lines = result.items.map((item) => {
      const medal = medalEmojis[item.rank] || `**#${item.rank}**`;
      const hours = (item.voiceSeconds / 3600).toFixed(1);
      return `${medal} <@${item.discordUserId}> — Level ${item.level} • **${item.voiceXP.toLocaleString()} Voice XP** (${hours}h in VC)`;
    });
    embed.setDescription(lines.join('\n'));
  }

  await interaction.reply({ embeds: [embed] });
}
