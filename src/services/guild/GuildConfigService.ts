import { guildConfigRepository } from '../../repositories/GuildConfigRepository.js';
import type { GuildConfigRecord } from '../../types/index.js';

export class GuildConfigService {
  public async getConfig(guildId: string): Promise<GuildConfigRecord> {
    return guildConfigRepository.getOrCreate(guildId);
  }

  public async updateConfig(guildId: string, updates: Partial<GuildConfigRecord>): Promise<GuildConfigRecord> {
    return guildConfigRepository.update(guildId, updates);
  }

  public async setIgnoredChannel(
    guildId: string,
    channelId: string,
    type: 'text' | 'voice',
    ignore: boolean
  ): Promise<GuildConfigRecord> {
    const config = await this.getConfig(guildId);
    const field = type === 'text' ? 'ignoredTextChannels' : 'ignoredVoiceChannels';
    let list: string[] = [];
    try {
      list = JSON.parse(config[field] || '[]');
    } catch {
      list = [];
    }

    if (ignore) {
      if (!list.includes(channelId)) list.push(channelId);
    } else {
      list = list.filter((id) => id !== channelId);
    }

    return guildConfigRepository.update(guildId, {
      [field]: JSON.stringify(list),
    });
  }
}

export const guildConfigService = new GuildConfigService();
