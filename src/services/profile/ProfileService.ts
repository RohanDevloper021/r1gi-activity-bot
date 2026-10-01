import { EmbedBuilder, type User as DiscordUser, type GuildMember } from 'discord.js';
import { userRepository } from '../../repositories/UserRepository.js';
import { rankingService } from '../leaderboard/RankingService.js';
import { levelService } from '../xp/LevelService.js';
import { COLORS } from '../../config/constants.js';

export class ProfileService {
  /**
   * Generates a Discord embed representing the member's profile
   */
  public async createProfileEmbed(
    guildId: string,
    discordUser: DiscordUser,
    member?: GuildMember | null
  ): Promise<EmbedBuilder> {
    const userRecord = await userRepository.getOrCreate(guildId, discordUser.id);
    const rankInfo = await rankingService.getUserRankInfo(guildId, discordUser.id);
    const progress = levelService.getProgress(userRecord.totalXP);

    const voiceHours = Math.floor(userRecord.voiceSeconds / 3600);
    const voiceMinutes = Math.floor((userRecord.voiceSeconds % 3600) / 60);
    const voiceDurationStr = `${voiceHours}h ${voiceMinutes}m`;

    // Progress bar visualization
    const barLength = 16;
    const filledCount = Math.round((progress.percentage / 100) * barLength);
    const progressBar = '█'.repeat(filledCount) + '░'.repeat(Math.max(0, barLength - filledCount));

    const rankDisplay = rankInfo?.rank ? `#${rankInfo.rank}` : 'Unranked';

    const embed = new EmbedBuilder()
      .setColor(COLORS.PRIMARY)
      .setTitle(`Activity Profile — ${discordUser.username}`)
      .setThumbnail(discordUser.displayAvatarURL({ size: 256 }))
      .addFields(
        { name: '🎖️ Level', value: `**${userRecord.level}**`, inline: true },
        { name: '🏆 Server Rank', value: `**${rankDisplay}**`, inline: true },
        { name: '⭐ Total XP', value: `**${userRecord.totalXP.toLocaleString()}**`, inline: true },
        { name: '💬 Chat XP', value: `${userRecord.chatXP.toLocaleString()}`, inline: true },
        { name: '🎙️ Voice XP', value: `${userRecord.voiceXP.toLocaleString()}`, inline: true },
        { name: '⏱️ Voice Time', value: `${voiceDurationStr}`, inline: true },
        {
          name: `📈 Level Progress (${progress.percentage}%)`,
          value: `\`${progressBar}\`\n**${(userRecord.totalXP - progress.currentLevelBaseXP).toLocaleString()}** / **${(progress.nextLevelXP - progress.currentLevelBaseXP).toLocaleString()} XP** (${progress.needed.toLocaleString()} XP to Level ${progress.level + 1})`,
          inline: false,
        }
      )
      .setFooter({ text: 'Activity Engine • Real-time stats' })
      .setTimestamp();

    if (member?.joinedAt) {
      embed.setDescription(`Member of this server since ${member.joinedAt.toLocaleDateString()}`);
    }

    return embed;
  }
}

export const profileService = new ProfileService();
