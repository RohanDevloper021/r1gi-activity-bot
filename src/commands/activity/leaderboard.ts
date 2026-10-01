import {
  SlashCommandBuilder,
  EmbedBuilder,
  type ChatInputCommandInteraction,
} from 'discord.js';
import { leaderboardService } from '../../services/leaderboard/LeaderboardService.js';
import { COLORS } from '../../config/constants.js';

export const data = new SlashCommandBuilder()
  .setName('leaderboard')
  .setDescription('View the server activity leaderboard')
  .addStringOption((option) =>
    option
      .setName('category')
      .setDescription('XP ranking category')
      .setRequired(false)
      .addChoices(
        { name: '⭐ Total XP', value: 'totalXP' },
        { name: '💬 Chat XP', value: 'chatXP' },
        { name: '🎙️ Voice XP', value: 'voiceXP' }
      )
  )
  .addIntegerOption((option) =>
    option.setName('page').setDescription('Page number').setRequired(false).setMinValue(1)
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  if (!interaction.guildId) return;

  const category = (interaction.options.getString('category') || 'totalXP') as
    | 'totalXP'
    | 'chatXP'
    | 'voiceXP';
  const page = interaction.options.getInteger('page') || 1;

  const result = await leaderboardService.getLeaderboardPage(interaction.guildId, category, page, 10);

  const categoryTitles = {
    totalXP: '⭐ Total XP Leaderboard',
    chatXP: '💬 Chat Activity Leaderboard',
    voiceXP: '🎙️ Voice Activity Leaderboard',
  };

  const embed = new EmbedBuilder()
    .setColor(COLORS.PRIMARY)
    .setTitle(categoryTitles[category])
    .setFooter({
      text: `Page ${result.page} of ${result.totalPages} • Total Members: ${result.totalCount}`,
    })
    .setTimestamp();

  if (result.items.length === 0) {
    embed.setDescription('No ranked members found in this server yet.');
  } else {
    const medalEmojis: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' };
    const lines = result.items.map((item) => {
      const medal = medalEmojis[item.rank] || `**#${item.rank}**`;
      const xpVal = item[category].toLocaleString();
      return `${medal} <@${item.discordUserId}> — **Level ${item.level}** • **${xpVal} XP**`;
    });
    embed.setDescription(lines.join('\n'));
  }

  await interaction.reply({ embeds: [embed] });
}
