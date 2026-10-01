import { userRepository } from '../../repositories/UserRepository.js';
import type { UserRecord } from '../../types/index.js';

export interface LeaderboardPage {
  items: (UserRecord & { rank: number })[];
  totalCount: number;
  page: number;
  totalPages: number;
}

export class LeaderboardService {
  public async getLeaderboardPage(
    guildId: string,
    type: 'totalXP' | 'chatXP' | 'voiceXP' = 'totalXP',
    page = 1,
    pageSize = 10
  ): Promise<LeaderboardPage> {
    const offset = Math.max(0, (page - 1) * pageSize);
    const users = await userRepository.getLeaderboard(guildId, type, pageSize, offset);
    const totalCount = await userRepository.countGuildUsers(guildId);

    const items = users.map((u, idx) => ({
      ...u,
      rank: offset + idx + 1,
    }));

    return {
      items,
      totalCount,
      page,
      totalPages: Math.ceil(totalCount / pageSize) || 1,
    };
  }
}

export const leaderboardService = new LeaderboardService();
