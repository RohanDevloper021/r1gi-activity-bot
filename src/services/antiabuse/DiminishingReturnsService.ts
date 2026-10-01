export class DiminishingReturnsService {
  /**
   * Apply diminishing returns to base XP according to current daily XP earned
   */
  public calculateAdjustedXP(
    baseXP: number,
    currentDailyXP: number,
    enabled: boolean,
    threshold: number
  ): { finalXP: number; multiplier: number } {
    if (!enabled || threshold <= 0 || currentDailyXP < threshold) {
      return { finalXP: baseXP, multiplier: 1.0 };
    }

    let multiplier = 1.0;
    if (currentDailyXP >= threshold * 3) {
      multiplier = 0.2; // 20%
    } else if (currentDailyXP >= threshold * 2) {
      multiplier = 0.4; // 40%
    } else if (currentDailyXP >= threshold) {
      multiplier = 0.7; // 70%
    }

    const finalXP = Math.max(1, Math.round(baseXP * multiplier));
    return { finalXP, multiplier };
  }
}

export const diminishingReturnsService = new DiminishingReturnsService();
