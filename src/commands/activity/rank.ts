import {
  SlashCommandBuilder,
  EmbedBuilder,
  AttachmentBuilder,
  type ChatInputCommandInteraction,
} from 'discord.js';
import { userRepository } from '../../repositories/UserRepository.js';
import { rankingService } from '../../services/leaderboard/RankingService.js';
import { levelService } from '../../services/xp/LevelService.js';
import { rankCardService } from '../../services/image/RankCardService.js';
import { formatProgressBar, formatDuration } from '../../utils/formatters.js';
import { COLORS } from '../../config/constants.js';

export const data = new SlashCommandBuilder()
  .setName('rank')
  .setDescription('Check your server rank, level, and visual XP rank card (or check another member)')
  .addUserOption((option) =>
    option.setName('member').setDescription('The member whose rank you want to check').setRequired(false)
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  if (!interaction.guildId || !interaction.guild) return;

  const targetUser = interaction.options.getUser('member') || interaction.user;
  const member = await interaction.guild.members.fetch(targetUser.id).catch(() => null);

  const userRecord = await userRepository.getOrCreate(interaction.guildId, targetUser.id);
  const rankInfo = await rankingService.getUserRankInfo(interaction.guildId, targetUser.id);
  const progress = levelService.getProgress(userRecord.totalXP);

  const bar = formatProgressBar(
    userRecord.totalXP - progress.currentLevelBaseXP,
    progress.nextLevelXP - progress.currentLevelBaseXP,
    14
  );

  const rankStr = rankInfo ? `#${rankInfo.rank}` : 'Unranked';
  const displayName = member?.displayName || member?.user.displayName || targetUser.displayName || targetUser.username;

  const embed = new EmbedBuilder()
    .setColor(COLORS.PRIMARY)
    .setAuthor({
      name: `${displayName}'s Activity Rank Card`,
      iconURL: targetUser.displayAvatarURL(),
    })
    .setThumbnail(targetUser.displayAvatarURL())
    .addFields(
      { name: '🏆 Rank', value: `**${rankStr}**`, inline: true },
      { name: '🎖️ Level', value: `**Level ${userRecord.level} / 300**`, inline: true },
      { name: '⭐ Total XP', value: `**${userRecord.totalXP.toLocaleString()}**`, inline: true },
      { name: '💬 Chat XP', value: `${userRecord.chatXP.toLocaleString()}`, inline: true },
      { name: '🎙️ Voice XP', value: `${userRecord.voiceXP.toLocaleString()}`, inline: true },
      { name: '⏱️ Voice Time', value: formatDuration(userRecord.voiceSeconds), inline: true },
      {
        name: `Progress to Level ${userRecord.level + 1} (${progress.percentage}%)`,
        value: `\`${bar}\`\n**${(userRecord.totalXP - progress.currentLevelBaseXP).toLocaleString()}** / **${(progress.nextLevelXP - progress.currentLevelBaseXP).toLocaleString()} XP** (${progress.needed.toLocaleString()} needed)`,
        inline: false,
      }
    )
    .setFooter({ text: 'Activity Engine • Live Visual Rank Card' })
    .setTimestamp();

  let cardAttachment: AttachmentBuilder | null = null;
  try {
    const cardBuffer = await rankCardService.generateRankCard({
      username: targetUser.username,
      displayName,
      avatarUrl: targetUser.displayAvatarURL({ extension: 'png', size: 256 }),
      level: userRecord.level,
      rank: rankInfo?.rank || 1,
      currentLevelXP: userRecord.totalXP - progress.currentLevelBaseXP,
      nextLevelXP: progress.nextLevelXP - progress.currentLevelBaseXP,
      totalXP: userRecord.totalXP,
      percentage: progress.percentage,
      isLevelUp: false,
    });

    cardAttachment = new AttachmentBuilder(cardBuffer, { name: 'rank-card.png' });
    embed.setImage('attachment://rank-card.png');
  } catch (err) {
    console.warn('[RankCommand] Failed to generate visual rank card image:', err);
  }

  await interaction.reply({
    embeds: [embed],
    files: cardAttachment ? [cardAttachment] : [],
  });
}
