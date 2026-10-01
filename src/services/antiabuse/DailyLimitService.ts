import { xpRepository } from '../../repositories/XPRepository.js';
import type { XPSourceType } from '../../config/constants.js';

export class DailyLimitService {
  /**
   * Check if adding `amount` XP would exceed the daily limit
   * Returns how much XP can actually be awarded (capped if limit reached)
   */
  public async getAvailableDailyXP(
    guildId: string,
    userId: string,
    source: XPSourceType,
    amount: number,
    dailyLimit: number
  ): Promise<{ allowedAmount: number; limitReached: boolean; currentDailyXP: number }> {
    if (dailyLimit <= 0) {
      return { allowedAmount: amount, limitReached: false, currentDailyXP: 0 };
    }

    const currentDailyXP = await xpRepository.getDailyXP(guildId, userId, source);

    if (currentDailyXP >= dailyLimit) {
      return { allowedAmount: 0, limitReached: true, currentDailyXP };
    }

    const remainingLimit = dailyLimit - currentDailyXP;
    const allowedAmount = Math.min(amount, remainingLimit);

    return {
      allowedAmount,
      limitReached: allowedAmount < amount,
      currentDailyXP,
    };
  }
}

export const dailyLimitService = new DailyLimitService();
