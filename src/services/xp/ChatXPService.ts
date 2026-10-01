import type { Message } from 'discord.js';
import { guildConfigRepository } from '../../repositories/GuildConfigRepository.js';
import { antiSpamService } from '../antiabuse/AntiSpamService.js';
import { cooldownService } from '../antiabuse/CooldownService.js';
import { messageSimilarityService } from '../antiabuse/MessageSimilarityService.js';
import { dailyLimitService } from '../antiabuse/DailyLimitService.js';
import { diminishingReturnsService } from '../antiabuse/DiminishingReturnsService.js';
import { xpService, type AwardXPResult } from './XPService.js';
import { XPSource } from '../../config/constants.js';

export interface ChatXPProcessingResult {
  awarded: boolean;
  amount?: number;
  reason?: string;
  awardResult?: AwardXPResult;
}

export class ChatXPService {
  /**
   * Process an incoming message and award chat XP if valid
   */
  public async processMessage(message: Message): Promise<ChatXPProcessingResult> {
    const guild = message.guild;
    if (!guild) {
      return { awarded: false, reason: 'Direct messages do not earn XP.' };
    }

    const discordGuildId = guild.id;
    const discordUserId = message.author.id;
    const content = message.content || '';

    // 1. Anti-abuse validation (bot, webhook, empty, command, repetitive characters, burst rate)
    const spamCheck = antiSpamService.validateMessage(
      discordGuildId,
      discordUserId,
      content,
      message.author.bot,
      message.webhookId !== null
    );

    if (!spamCheck.valid) {
      return { awarded: false, reason: spamCheck.reason };
    }

    // 2. Fetch Guild Configuration
    const config = await guildConfigRepository.getOrCreate(discordGuildId);

    // 3. Ignored text channel check
    try {
      const ignoredChannels: string[] = JSON.parse(config.ignoredTextChannels || '[]');
      if (ignoredChannels.includes(message.channelId)) {
        return { awarded: false, reason: 'Channel is in ignored list.' };
      }
    } catch {
      // Ignore JSON parse errors
    }

    // 4. Cooldown check
    if (cooldownService.isOnChatCooldown(discordGuildId, discordUserId, config.chatCooldownSeconds)) {
      const remaining = cooldownService.getRemainingChatCooldown(
        discordGuildId,
        discordUserId,
        config.chatCooldownSeconds
      );
      return { awarded: false, reason: `On chat cooldown (${remaining}s remaining).` };
    }

    // 5. Duplicate and Similarity check
    if (messageSimilarityService.isTooSimilar(discordGuildId, discordUserId, content)) {
      return { awarded: false, reason: 'Message too similar to recent messages.' };
    }

    // Record message into similarity tracker
    messageSimilarityService.recordMessage(discordGuildId, discordUserId, content);

    // 6. Calculate base randomized XP
    const minXP = config.chatXPMin;
    const maxXP = Math.max(minXP, config.chatXPMax);
    const baseXP = Math.floor(Math.random() * (maxXP - minXP + 1)) + minXP;

    // 7. Check Daily Limit
    const { allowedAmount, limitReached, currentDailyXP } = await dailyLimitService.getAvailableDailyXP(
      discordGuildId,
      discordUserId,
      XPSource.CHAT,
      baseXP,
      config.dailyChatXPLimit
    );

    if (allowedAmount <= 0) {
      return { awarded: false, reason: 'Daily chat XP limit reached.' };
    }

    // 8. Apply Diminishing Returns if enabled
    const { finalXP } = diminishingReturnsService.calculateAdjustedXP(
      allowedAmount,
      currentDailyXP,
      config.diminishingReturnsEnabled,
      config.diminishingReturnsThreshold
    );

    // 9. Set cooldown
    cooldownService.setChatCooldown(discordGuildId, discordUserId);

    // 10. Award XP atomically
    const member = message.member || (await guild.members.fetch(discordUserId).catch(() => null));
    const awardResult = await xpService.awardXP({
      guildId: discordGuildId,
      discordUserId,
      amount: finalXP,
      source: XPSource.CHAT,
      reason: `Chat activity in #${(message.channel as any).name || message.channelId}`,
      member,
    });

    return {
      awarded: true,
      amount: finalXP,
      awardResult,
    };
  }
}

export const chatXPService = new ChatXPService();
