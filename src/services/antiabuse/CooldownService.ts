export class CooldownService {
  // Key: guildId:discordUserId -> lastEarnedTimestamp (ms)
  private chatCooldowns = new Map<string, number>();
  private voiceCooldowns = new Map<string, number>();

  private getKey(guildId: string, discordUserId: string): string {
    return `${guildId}:${discordUserId}`;
  }

  public isOnChatCooldown(guildId: string, discordUserId: string, cooldownSeconds: number): boolean {
    const key = this.getKey(guildId, discordUserId);
    const last = this.chatCooldowns.get(key);
    if (!last) return false;

    const elapsedSeconds = (Date.now() - last) / 1000;
    return elapsedSeconds < cooldownSeconds;
  }

  public getRemainingChatCooldown(guildId: string, discordUserId: string, cooldownSeconds: number): number {
    const key = this.getKey(guildId, discordUserId);
    const last = this.chatCooldowns.get(key);
    if (!last) return 0;

    const remaining = cooldownSeconds - (Date.now() - last) / 1000;
    return Math.max(0, Math.ceil(remaining));
  }

  public setChatCooldown(guildId: string, discordUserId: string): void {
    const key = this.getKey(guildId, discordUserId);
    this.chatCooldowns.set(key, Date.now());
  }

  public isOnVoiceCooldown(guildId: string, discordUserId: string, cooldownSeconds = 15): boolean {
    const key = this.getKey(guildId, discordUserId);
    const last = this.voiceCooldowns.get(key);
    if (!last) return false;

    return (Date.now() - last) / 1000 < cooldownSeconds;
  }

  public setVoiceCooldown(guildId: string, discordUserId: string): void {
    const key = this.getKey(guildId, discordUserId);
    this.voiceCooldowns.set(key, Date.now());
  }

  public clearAll(): void {
    this.chatCooldowns.clear();
    this.voiceCooldowns.clear();
  }
}

export const cooldownService = new CooldownService();
