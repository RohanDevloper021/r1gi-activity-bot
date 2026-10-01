import { userRepository } from '../../repositories/UserRepository.js';
import { levelService } from '../xp/LevelService.js';
import type { UserRecord, UserRankInfo } from '../../types/index.js';

export class RankingService {
  public async getUserRankInfo(
    guildId: string,
    discordUserId: string,
    type: 'totalXP' | 'chatXP' | 'voiceXP' = 'totalXP'
  ): Promise<UserRankInfo | null> {
    const user = await userRepository.findByGuildAndUser(guildId, discordUserId);
    if (!user) return null;

    const rank = await userRepository.getUserRank(guildId, discordUserId, type);
    const progress = levelService.getProgress(user.totalXP);

    return {
      user,
      rank,
      nextLevelXP: progress.nextLevelXP,
      currentLevelXP: progress.currentLevelBaseXP,
      progressPercent: progress.percentage,
    };
  }
}

export const rankingService = new RankingService();
