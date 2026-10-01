import { ANTI_ABUSE } from '../../config/constants.js';

export interface SpamCheckResult {
  valid: boolean;
  reason?: string;
}

export class AntiSpamService {
  // Key: guildId:discordUserId -> timestamps of recent messages
  private burstHistory = new Map<string, number[]>();

  private getKey(guildId: string, discordUserId: string): string {
    return `${guildId}:${discordUserId}`;
  }

  public validateMessage(
    guildId: string,
    discordUserId: string,
    content: string,
    isBot = false,
    isWebhook = false
  ): SpamCheckResult {
    if (isBot) {
      return { valid: false, reason: 'Bots do not earn XP.' };
    }

    if (isWebhook) {
      return { valid: false, reason: 'Webhooks do not earn XP.' };
    }

    const trimmed = content.trim();

    if (!trimmed || trimmed.length === 0) {
      return { valid: false, reason: 'Empty messages do not earn XP.' };
    }

    if (trimmed.length < ANTI_ABUSE.MIN_MESSAGE_LENGTH) {
      return { valid: false, reason: 'Message too short.' };
    }

    // Ignore bot commands (slash commands or typical bot prefixes)
    const commandPrefixes = ['/', '!', '?', '.', '$', '-', '>', ';'];
    if (commandPrefixes.some((prefix) => trimmed.startsWith(prefix))) {
      return { valid: false, reason: 'Command messages do not earn XP.' };
    }

    // Check repetitive single character spam (e.g. "aaaaaaaaaa")
    if (/^(.)\1{7,}$/.test(trimmed)) {
      return { valid: false, reason: 'Repetitive character spam.' };
    }

    // Check burst rate
    const now = Date.now();
    const key = this.getKey(guildId, discordUserId);
    const timestamps = (this.burstHistory.get(key) || []).filter(
      (ts) => (now - ts) / 1000 <= ANTI_ABUSE.BURST_WINDOW_SECONDS
    );

    if (timestamps.length >= ANTI_ABUSE.BURST_MAX_MESSAGES) {
      return { valid: false, reason: 'Message burst rate exceeded.' };
    }

    timestamps.push(now);
    this.burstHistory.set(key, timestamps);

    return { valid: true };
  }

  public clearAll(): void {
    this.burstHistory.clear();
  }
}

export const antiSpamService = new AntiSpamService();
