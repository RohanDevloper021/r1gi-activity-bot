import { memoryStore } from './memoryStore.js';

export interface RankCardConfig {
  guildId: string;
  cardWidth: number;
  cardHeight: number;
  cardRadius: number;
  avatarSize: number;
  avatarShape: 'circle' | 'square' | 'hexagon';
  avatarBorderWidth: number;
  progressBarHeight: number;
  progressBarRadius: number;
  bannerMessage: string;
  footerMessage: string;
  levelUpAnnouncementTemplate: string;
  nameFormat: 'both' | 'display' | 'username';
  showRankBadge: boolean;
  showLevelBadge: boolean;
  showTotalXP: boolean;
  showNextLevelXP: boolean;
  showPercentage: boolean;
  backgroundUrl: string;
  bgTheme: string;
  bgOverlayOpacity: number;
  primaryTextColor: string;
  secondaryTextColor: string;
  accentColor: string;
  accentColorEnd: string;
}

export const DEFAULT_RANK_CARD_CONFIG: Omit<RankCardConfig, 'guildId'> = {
  cardWidth: 934,
  cardHeight: 282,
  cardRadius: 24,
  avatarSize: 65,
  avatarShape: 'circle',
  avatarBorderWidth: 4,
  progressBarHeight: 22,
  progressBarRadius: 11,
  bannerMessage: '🎉 LEVEL UP!',
  footerMessage: '⭐ Activity Engine • 300 Levels Milestone Progression',
  levelUpAnnouncementTemplate: '🎉 Congratulations {user} on reaching **Level {level}**!',
  nameFormat: 'both',
  showRankBadge: true,
  showLevelBadge: true,
  showTotalXP: true,
  showNextLevelXP: true,
  showPercentage: true,
  backgroundUrl: '',
  bgTheme: 'midnight',
  bgOverlayOpacity: 0.75,
  primaryTextColor: '#ffffff',
  secondaryTextColor: '#94a3b8',
  accentColor: '#6366f1',
  accentColorEnd: '#a855f7',
};

export class RankCardConfigRepository {
  public async getByGuildId(guildId: string): Promise<RankCardConfig> {
    const existing = memoryStore.rankCardConfigs.get(guildId);
    if (existing) {
      return { ...DEFAULT_RANK_CARD_CONFIG, ...existing, guildId };
    }
    const def: RankCardConfig = { ...DEFAULT_RANK_CARD_CONFIG, guildId };
    memoryStore.rankCardConfigs.set(guildId, def);
    memoryStore.saveToDisk();
    return def;
  }

  public async update(guildId: string, partial: Partial<RankCardConfig>): Promise<RankCardConfig> {
    const current = await this.getByGuildId(guildId);
    const updated: RankCardConfig = {
      ...current,
      ...partial,
      guildId,
    };
    memoryStore.rankCardConfigs.set(guildId, updated);
    memoryStore.saveToDisk();
    return updated;
  }
}

export const rankCardConfigRepository = new RankCardConfigRepository();
