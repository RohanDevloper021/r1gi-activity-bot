import { xpService, type AwardXPResult } from './XPService.js';
import { dailyLimitService } from '../antiabuse/DailyLimitService.js';
import { diminishingReturnsService } from '../antiabuse/DiminishingReturnsService.js';
import { XPSource } from '../../config/constants.js';
import type { GuildConfigRecord } from '../../types/index.js';
import type { GuildMember } from 'discord.js';

export class VoiceXPService {
  /**
   * Calculate and award XP for verified eligible voice seconds
   */
  public async awardVoiceXP(
    guildId: string,
    userId: string,
    eligibleSeconds: number,
    config: GuildConfigRecord,
    member?: GuildMember | null
  ): Promise<{ awardedXP: number; awardResult?: AwardXPResult }> {
    if (eligibleSeconds <= 0) {
      return { awardedXP: 0 };
    }

    // Calculate base XP based on intervals
    // voiceXPPerInterval (e.g. 10 XP) per voiceIntervalSeconds (e.g. 60s)
    const baseXP = Math.floor(
      (eligibleSeconds / Math.max(1, config.voiceIntervalSeconds)) * config.voiceXPPerInterval
    );

    if (baseXP <= 0) {
      return { awardedXP: 0 };
    }

    // 1. Daily Limit Check
    const { allowedAmount, limitReached, currentDailyXP } = await dailyLimitService.getAvailableDailyXP(
      guildId,
      userId,
      XPSource.VOICE,
      baseXP,
      config.dailyVoiceXPLimit
    );

    if (allowedAmount <= 0) {
      return { awardedXP: 0 };
    }

    // 2. Diminishing Returns Check
    const { finalXP } = diminishingReturnsService.calculateAdjustedXP(
      allowedAmount,
      currentDailyXP,
      config.diminishingReturnsEnabled,
      config.diminishingReturnsThreshold
    );

    if (finalXP <= 0) {
      return { awardedXP: 0 };
    }

    // 3. Award XP atomically through XPService
    const awardResult = await xpService.awardXP({
      guildId,
      discordUserId: userId,
      amount: finalXP,
      source: XPSource.VOICE,
      reason: `Active voice participation (${eligibleSeconds}s)`,
      voiceSeconds: eligibleSeconds,
      member,
    });

    return {
      awardedXP: finalXP,
      awardResult,
    };
  }
}

export const voiceXPService = new VoiceXPService();
