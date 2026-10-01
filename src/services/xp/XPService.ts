import { userRepository } from '../../repositories/UserRepository.js';
import { xpRepository } from '../../repositories/XPRepository.js';
import { guildConfigRepository } from '../../repositories/GuildConfigRepository.js';
import { rankingService } from '../leaderboard/RankingService.js';
import { levelService } from './LevelService.js';
import { levelRoleService } from '../roles/LevelRoleService.js';
import { rankCardConfigRepository } from '../../repositories/RankCardConfigRepository.js';
import { XPSource, type XPSourceType, COLORS } from '../../config/constants.js';
import { formatProgressBar, formatDuration } from '../../utils/formatters.js';
import type { UserRecord } from '../../types/index.js';
import { EmbedBuilder, AttachmentBuilder, type GuildMember, type TextChannel } from 'discord.js';
import { rankCardService } from '../image/RankCardService.js';

export interface AwardXPResult {
  success: boolean;
  awardedAmount: number;
  oldXP: number;
  newXP: number;
  oldLevel: number;
  newLevel: number;
  leveledUp: boolean;
  user: UserRecord;
}

export class XPService {
  // Simple mutex per guild+user to ensure serial atomic updates
  private lockQueue = new Map<string, Promise<any>>();

  private async acquireLock<T>(key: string, task: () => Promise<T>): Promise<T> {
    const prev = this.lockQueue.get(key) || Promise.resolve();
    let release: () => void = () => {};
    const current = new Promise<void>((resolve) => {
      release = resolve;
    });

    this.lockQueue.set(
      key,
      prev.then(() => current)
    );

    try {
      await prev;
      return await task();
    } finally {
      release();
      if (this.lockQueue.get(key) === current) {
        this.lockQueue.delete(key);
      }
    }
  }

  /**
   * Central atomic method for awarding XP
   */
  public async awardXP(params: {
    guildId: string;
    discordUserId: string;
    amount: number;
    source: XPSourceType;
    reason: string;
    voiceSeconds?: number;
    member?: GuildMember | null;
    fallbackChannel?: any;
  }): Promise<AwardXPResult> {
    const { guildId, discordUserId, amount, source, reason, voiceSeconds, member, fallbackChannel } = params;

    if (amount <= 0 && (!voiceSeconds || voiceSeconds <= 0)) {
      const u = await userRepository.getOrCreate(guildId, discordUserId);
      return {
        success: false,
        awardedAmount: 0,
        oldXP: u.totalXP,
        newXP: u.totalXP,
        oldLevel: u.level,
        newLevel: u.level,
        leveledUp: false,
        user: u,
      };
    }

    const lockKey = `${guildId}:${discordUserId}`;

    return this.acquireLock(lockKey, async () => {
      const user = await userRepository.getOrCreate(guildId, discordUserId);
      const oldXP = user.totalXP;
      const oldLevel = user.level;
      const newXP = Math.max(0, oldXP + amount);
      const newLevel = levelService.getLevelFromXP(newXP);
      const leveledUp = newLevel > oldLevel;

      // Update user atomically
      const updatedUser = await userRepository.atomicUpdateXP(guildId, discordUserId, {
        totalXPIncrement: amount,
        chatXPIncrement: source === XPSource.CHAT ? amount : 0,
        voiceXPIncrement: source === XPSource.VOICE ? amount : 0,
        voiceSecondsIncrement: voiceSeconds || 0,
        level: newLevel,
        lastMessageAt: source === XPSource.CHAT ? new Date() : undefined,
      });

      // Record transaction
      if (amount !== 0) {
        await xpRepository.recordTransaction(guildId, user.id, source, amount, reason);
      }

      // Handle Level Up and Roles if leveled up
      if (leveledUp) {
        await this.handleLevelUp(guildId, discordUserId, oldLevel, newLevel, newXP, member, fallbackChannel);
      }

      return {
        success: true,
        awardedAmount: amount,
        oldXP,
        newXP,
        oldLevel,
        newLevel,
        leveledUp,
        user: updatedUser,
      };
    });
  }

  private async handleLevelUp(
    guildId: string,
    discordUserId: string,
    oldLevel: number,
    newLevel: number,
    totalXP: number,
    member?: GuildMember | null,
    fallbackChannel?: any
  ) {
    try {
      const config = await guildConfigRepository.getOrCreate(guildId);

      // Process level roles if Discord GuildMember is available
      if (member) {
        const roleSync = await levelRoleService.processLevelRoles(guildId, member, newLevel);

        // Check announcement frequency across the 300 levels
        const frequency = config.levelUpFrequency || 'milestones';
        let shouldAnnounce = false;

        if (frequency === 'all') {
          shouldAnnounce = true;
        } else if (frequency === 'roles_only') {
          shouldAnnounce = roleSync.addedRoles.length > 0;
        } else {
          // 'milestones' (recommended for 300 levels):
          // Always announce if:
          // 1. Reaching early levels 1-5
          // 2. Reaching any multiple of 5 (5, 10, 15, 20... 300)
          // 3. Crossed any milestone level during this level-up jump (e.g. from 2 to 6)
          // 4. Any level role reward was unlocked
          const isEarlyLevel = newLevel <= 5;
          const isMultipleOf5 = newLevel % 5 === 0;
          const hasUnlockedRole = roleSync.addedRoles.length > 0;
          let crossedMilestone = isEarlyLevel || isMultipleOf5 || hasUnlockedRole;

          if (!crossedMilestone) {
            for (let lvl = oldLevel + 1; lvl <= newLevel; lvl++) {
              if (lvl <= 5 || lvl % 5 === 0) {
                crossedMilestone = true;
                break;
              }
            }
          }
          shouldAnnounce = crossedMilestone;
        }

        if (shouldAnnounce && member.guild) {
          try {
            // Find designated particular channel
            let targetChannel: any = null;
            if (config.levelUpChannelId) {
              targetChannel = await member.guild.channels.fetch(config.levelUpChannelId).catch(() => null);
            }

            // Fallback search for a dedicated bot or levelup channel
            if (!targetChannel) {
              const channels = await member.guild.channels.fetch().catch(() => null);
              if (channels) {
                targetChannel =
                  channels.find(
                    (c) =>
                      c &&
                      c.isTextBased() &&
                      ['level-ups', 'levelup', 'levels', 'bot-commands', 'announcements'].includes(
                        c.name.toLowerCase()
                      )
                  ) || member.guild.systemChannel;
              }
            }

            // If still no channel found, use fallbackChannel (channel where command was run)
            if (!targetChannel && fallbackChannel && typeof fallbackChannel.send === 'function') {
              targetChannel = fallbackChannel;
            }

            if (targetChannel && targetChannel.isTextBased()) {
              const userRecord = await userRepository.getOrCreate(guildId, discordUserId);
              const rankInfo = await rankingService.getUserRankInfo(guildId, discordUserId);
              const progress = levelService.getProgress(userRecord.totalXP);
              const bar = formatProgressBar(
                userRecord.totalXP - progress.currentLevelBaseXP,
                progress.nextLevelXP - progress.currentLevelBaseXP,
                14
              );
              const rankStr = rankInfo ? `#${rankInfo.rank}` : 'Unranked';

              const displayName = member.displayName || member.user.displayName || member.user.username;

              const celebrationEmbed = new EmbedBuilder()
                .setColor(COLORS.GOLD)
                .setAuthor({
                  name: `🎉 LEVEL UP! ${displayName} reached Level ${newLevel}!`,
                  iconURL: member.user.displayAvatarURL(),
                })
                .setTitle(`🚀 Congratulations ${displayName}!`)
                .setDescription(
                  `You have advanced to **Level ${newLevel}** out of 300!\nHere is your celebratory rank card:`
                )
                .setThumbnail(member.user.displayAvatarURL())
                .addFields(
                  { name: '🏆 Server Rank', value: `**${rankStr}**`, inline: true },
                  { name: '🎖️ Level', value: `**Level ${newLevel} / 300**`, inline: true },
                  { name: '⭐ Total XP', value: `**${userRecord.totalXP.toLocaleString()}**`, inline: true },
                  { name: '💬 Chat XP', value: `${userRecord.chatXP.toLocaleString()}`, inline: true },
                  { name: '🎙️ Voice XP', value: `${userRecord.voiceXP.toLocaleString()}`, inline: true },
                  { name: '⏱️ Voice Time', value: formatDuration(userRecord.voiceSeconds), inline: true },
                  {
                    name: `Progress to Level ${Math.min(300, newLevel + 1)} (${progress.percentage}%)`,
                    value: `\`${bar}\`\n**${(userRecord.totalXP - progress.currentLevelBaseXP).toLocaleString()}** / **${(progress.nextLevelXP - progress.currentLevelBaseXP).toLocaleString()} XP** (${progress.needed.toLocaleString()} needed)`,
                    inline: false,
                  }
                );

              if (roleSync.addedRoles.length > 0) {
                celebrationEmbed.addFields({
                  name: '🎁 Milestone Role Unlocked!',
                  value: roleSync.addedRoles.map((r) => `🎖️ <@&${r}>`).join('\n'),
                  inline: false,
                });
              }

              celebrationEmbed.setFooter({
                text: 'Activity Engine • 300 Levels Milestone System',
              });
              celebrationEmbed.setTimestamp();

              let cardAttachment: AttachmentBuilder | null = null;
              let customContent = `🎉 Congratulations <@${discordUserId}> on reaching **Level ${newLevel}**!`;
              try {
                const cardConfig = await rankCardConfigRepository.getByGuildId(guildId);
                const roleRewardName =
                  roleSync.addedRoles.length > 0 && member.guild
                    ? member.guild.roles.cache.get(roleSync.addedRoles[0])?.name || null
                    : null;

                const cardBuffer = await rankCardService.generateRankCard({
                  username: member.user.username,
                  displayName,
                  avatarUrl: member.user.displayAvatarURL({ extension: 'png', size: 256 }),
                  level: newLevel,
                  rank: rankInfo?.rank || 1,
                  currentLevelXP: userRecord.totalXP - progress.currentLevelBaseXP,
                  nextLevelXP: progress.nextLevelXP - progress.currentLevelBaseXP,
                  totalXP: userRecord.totalXP,
                  percentage: progress.percentage,
                  isLevelUp: true,
                  roleRewardName,

                  // A to Z customizable settings
                  cardWidth: cardConfig.cardWidth,
                  cardHeight: cardConfig.cardHeight,
                  cardRadius: cardConfig.cardRadius,
                  avatarSize: cardConfig.avatarSize,
                  avatarShape: cardConfig.avatarShape,
                  avatarBorderWidth: cardConfig.avatarBorderWidth,
                  progressBarHeight: cardConfig.progressBarHeight,
                  progressBarRadius: cardConfig.progressBarRadius,
                  bannerMessage: cardConfig.bannerMessage,
                  footerMessage: cardConfig.footerMessage,
                  nameFormat: cardConfig.nameFormat,
                  showRankBadge: cardConfig.showRankBadge,
                  showLevelBadge: cardConfig.showLevelBadge,
                  showTotalXP: cardConfig.showTotalXP,
                  showNextLevelXP: cardConfig.showNextLevelXP,
                  showPercentage: cardConfig.showPercentage,
                  backgroundUrl: cardConfig.backgroundUrl || null,
                  bgTheme: cardConfig.bgTheme,
                  bgOverlayOpacity: cardConfig.bgOverlayOpacity,
                  primaryTextColor: cardConfig.primaryTextColor,
                  secondaryTextColor: cardConfig.secondaryTextColor,
                  accentColor: cardConfig.accentColor,
                  accentColorEnd: cardConfig.accentColorEnd,
                });

                cardAttachment = new AttachmentBuilder(cardBuffer, { name: 'rank-card.png' });
                celebrationEmbed.setImage('attachment://rank-card.png');

                if (cardConfig.levelUpAnnouncementTemplate) {
                  customContent = cardConfig.levelUpAnnouncementTemplate
                    .replace('{user}', `<@${discordUserId}>`)
                    .replace('{username}', displayName)
                    .replace('{level}', String(newLevel))
                    .replace('{rank}', rankStr)
                    .replace('{totalXP}', userRecord.totalXP.toLocaleString());
                }
              } catch (cardErr) {
                console.warn('[XPService] Failed to render visual rank card image:', cardErr);
              }

              await (targetChannel as TextChannel).send({
                content: customContent,
                embeds: [celebrationEmbed],
                files: cardAttachment ? [cardAttachment] : [],
              });
            }
          } catch (channelErr) {
            console.warn(`[XPService] Failed to send level up rank card:`, channelErr);
          }
        }
      }
    } catch (err) {
      console.error(`[XPService] Error handling level up for user ${discordUserId}:`, err);
    }
  }

  /**
   * Set user XP directly (admin command)
   */
  public async setXP(
    guildId: string,
    discordUserId: string,
    targetXP: number,
    reason: string,
    member?: GuildMember | null,
    fallbackChannel?: any
  ): Promise<UserRecord> {
    const lockKey = `${guildId}:${discordUserId}`;
    return this.acquireLock(lockKey, async () => {
      const user = await userRepository.getOrCreate(guildId, discordUserId);
      const oldXP = user.totalXP;
      const oldLevel = user.level;
      const diff = targetXP - oldXP;
      const newLevel = levelService.getLevelFromXP(targetXP);
      const leveledUp = newLevel > oldLevel;

      const updated = await userRepository.setXP(guildId, discordUserId, targetXP, newLevel);
      await xpRepository.recordTransaction(guildId, user.id, XPSource.ADMIN, diff, reason);

      if (leveledUp) {
        await this.handleLevelUp(guildId, discordUserId, oldLevel, newLevel, targetXP, member, fallbackChannel);
      }

      return updated;
    });
  }

  /**
   * Set user Level directly (admin command)
   */
  public async setLevel(
    guildId: string,
    discordUserId: string,
    targetLevel: number,
    reason: string,
    member?: GuildMember | null,
    fallbackChannel?: any
  ): Promise<UserRecord> {
    const targetXP = levelService.getRequiredXP(targetLevel);
    return this.setXP(guildId, discordUserId, targetXP, reason, member, fallbackChannel);
  }

  /**
   * Reset XP for user or entire guild
   */
  public async resetXP(guildId: string, discordUserId?: string, reason = 'Admin XP Reset'): Promise<number> {
    const count = await userRepository.resetXP(guildId, discordUserId);
    if (discordUserId) {
      const user = await userRepository.findByGuildAndUser(guildId, discordUserId);
      if (user) {
        await xpRepository.recordTransaction(guildId, user.id, XPSource.ADMIN, 0, reason);
      }
    }
    return count;
  }
}

export const xpService = new XPService();
