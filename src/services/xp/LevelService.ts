import { XPFormula } from './XPFormula.js';
import type { GuildConfigRecord } from '../../types/index.js';

export interface LevelUpResult {
  leveledUp: boolean;
  oldLevel: number;
  newLevel: number;
}

export class LevelService {
  public checkLevelUp(oldXP: number, newXP: number): LevelUpResult {
    const oldLevel = XPFormula.getLevelFromXP(oldXP);
    const newLevel = XPFormula.getLevelFromXP(newXP);

    return {
      leveledUp: newLevel > oldLevel,
      oldLevel,
      newLevel,
    };
  }

  public formatLevelUpMessage(
    template: string,
    params: {
      userId: string;
      level: number;
      totalXP: number;
    }
  ): string {
    return template
      .replace('{user}', `<@${params.userId}>`)
      .replace('{level}', params.level.toString())
      .replace('{totalXP}', params.totalXP.toLocaleString());
  }

  public getLevelFromXP(xp: number): number {
    return XPFormula.getLevelFromXP(xp);
  }

  public getRequiredXP(level: number): number {
    return XPFormula.getRequiredXP(level);
  }

  public getProgress(currentXP: number) {
    const level = XPFormula.getLevelFromXP(currentXP);
    const currentLevelBaseXP = XPFormula.getRequiredXP(level);
    const nextLevelXP = XPFormula.getRequiredXP(level + 1);
    const needed = Math.max(0, nextLevelXP - currentXP);
    const percentage = XPFormula.getProgressPercentage(currentXP);

    return {
      level,
      currentXP,
      currentLevelBaseXP,
      nextLevelXP,
      needed,
      percentage,
    };
  }
}

export const levelService = new LevelService();
