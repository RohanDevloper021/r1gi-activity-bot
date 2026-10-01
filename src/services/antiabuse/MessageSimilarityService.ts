import { ANTI_ABUSE } from '../../config/constants.js';

interface RecentMessage {
  content: string;
  timestamp: number;
}

export class MessageSimilarityService {
  // Key: guildId:discordUserId -> array of recent messages
  private history = new Map<string, RecentMessage[]>();

  private getKey(guildId: string, discordUserId: string): string {
    return `${guildId}:${discordUserId}`;
  }

  /**
   * Compute Levenshtein distance between two strings
   */
  public levenshteinDistance(a: string, b: string): number {
    const s1 = a.toLowerCase().trim();
    const s2 = b.toLowerCase().trim();
    if (s1 === s2) return 0;
    if (s1.length === 0) return s2.length;
    if (s2.length === 0) return s1.length;

    const matrix: number[][] = [];
    for (let i = 0; i <= s1.length; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= s2.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= s1.length; i++) {
      for (let j = 1; j <= s2.length; j++) {
        const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,      // deletion
          matrix[i][j - 1] + 1,      // insertion
          matrix[i - 1][j - 1] + cost // substitution
        );
      }
    }

    return matrix[s1.length][s2.length];
  }

  /**
   * Similarity score between 0.0 (completely different) and 1.0 (identical)
   */
  public getSimilarityRatio(a: string, b: string): number {
    const s1 = a.toLowerCase().trim();
    const s2 = b.toLowerCase().trim();
    if (s1 === s2) return 1.0;
    const maxLen = Math.max(s1.length, s2.length);
    if (maxLen === 0) return 1.0;

    const distance = this.levenshteinDistance(s1, s2);
    return 1 - distance / maxLen;
  }

  /**
   * Check if the message is too similar to recent messages within the window
   */
  public isTooSimilar(
    guildId: string,
    discordUserId: string,
    content: string,
    windowSeconds = 300,
    threshold = ANTI_ABUSE.SIMILARITY_THRESHOLD
  ): boolean {
    const key = this.getKey(guildId, discordUserId);
    const now = Date.now();
    const list = this.history.get(key) || [];

    // Filter to messages within the window
    const recent = list.filter((m) => (now - m.timestamp) / 1000 < windowSeconds);

    for (const prev of recent) {
      const similarity = this.getSimilarityRatio(prev.content, content);
      if (similarity >= threshold) {
        return true;
      }
    }

    return false;
  }

  /**
   * Record a new message in history
   */
  public recordMessage(guildId: string, discordUserId: string, content: string): void {
    const key = this.getKey(guildId, discordUserId);
    const now = Date.now();
    const list = this.history.get(key) || [];

    // Keep only last 10 messages within 10 minutes
    const pruned = list.filter((m) => (now - m.timestamp) / 1000 < 600);
    pruned.push({ content, timestamp: now });

    if (pruned.length > 10) {
      pruned.shift();
    }

    this.history.set(key, pruned);
  }

  public clearAll(): void {
    this.history.clear();
  }
}

export const messageSimilarityService = new MessageSimilarityService();
