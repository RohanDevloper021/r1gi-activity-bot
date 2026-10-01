/**
 * Nonlinear Level & XP progression formulas
 * Supports Level 0 to Level 300 with precomputed table and binary search
 */

export const MAX_LEVEL = 300;

// Precompute cumulative XP table for levels 0..300
const REQUIRED_XP_TABLE: number[] = new Array(MAX_LEVEL + 1);
REQUIRED_XP_TABLE[0] = 0;
let cumulative = 0;
for (let l = 1; l <= MAX_LEVEL; l++) {
  cumulative += Math.floor(100 * Math.pow(l, 1.35) + 50 * l);
  REQUIRED_XP_TABLE[l] = cumulative;
}

export class XPFormula {
  public static readonly MAX_LEVEL = MAX_LEVEL;

  /**
   * Cumulative XP required to reach a specific level
   */
  public static getRequiredXP(level: number): number {
    if (level <= 0) return 0;
    if (level <= MAX_LEVEL) {
      return REQUIRED_XP_TABLE[level];
    }
    // Extrapolate beyond level 300 if ever exceeded
    let total = REQUIRED_XP_TABLE[MAX_LEVEL];
    for (let l = MAX_LEVEL + 1; l <= level; l++) {
      total += Math.floor(100 * Math.pow(l, 1.35) + 50 * l);
    }
    return total;
  }

  /**
   * Calculate current level from total XP (0 to 300)
   * Uses binary search for high performance
   */
  public static getLevelFromXP(totalXP: number): number {
    if (totalXP <= 0) return 0;
    if (totalXP >= REQUIRED_XP_TABLE[MAX_LEVEL]) return MAX_LEVEL;

    let low = 0;
    let high = MAX_LEVEL;
    let result = 0;

    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      if (REQUIRED_XP_TABLE[mid] <= totalXP) {
        result = mid;
        low = mid + 1;
      } else {
        high = mid - 1;
      }
    }

    return result;
  }

  /**
   * Calculate XP needed from current XP to reach the next level
   */
  public static getXPForNextLevel(currentXP: number): number {
    const currentLevel = this.getLevelFromXP(currentXP);
    if (currentLevel >= MAX_LEVEL) return 0;
    const nextLevelXP = this.getRequiredXP(currentLevel + 1);
    return Math.max(0, nextLevelXP - currentXP);
  }

  /**
   * Progress percentage through the current level (0 - 100%)
   */
  public static getProgressPercentage(currentXP: number): number {
    const currentLevel = this.getLevelFromXP(currentXP);
    if (currentLevel >= MAX_LEVEL) return 100;

    const currentLevelBaseXP = this.getRequiredXP(currentLevel);
    const nextLevelXP = this.getRequiredXP(currentLevel + 1);
    const levelSpan = nextLevelXP - currentLevelBaseXP;

    if (levelSpan <= 0) return 100;
    const progressXP = currentXP - currentLevelBaseXP;
    const pct = Math.min(100, Math.max(0, (progressXP / levelSpan) * 100));
    return Math.round(pct * 10) / 10;
  }
}
