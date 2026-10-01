import { getPrismaClient } from '../database/prisma.js';
import { memoryStore } from './memoryStore.js';
import { DEFAULT_CONFIG } from '../config/constants.js';
import type { GuildConfigRecord } from '../types/index.js';

export class GuildConfigRepository {
  public async findByGuildId(guildId: string): Promise<GuildConfigRecord | null> {
    const prisma = getPrismaClient();
    if (prisma) {
      try {
        const found = await prisma.guildConfig.findUnique({
          where: { guildId },
        });
        return found as GuildConfigRecord | null;
      } catch (err) {
        console.warn('Prisma error finding config:', err);
      }
    }

    for (const cfg of memoryStore.configs.values()) {
      if (cfg.guildId === guildId) {
        return cfg;
      }
    }
    return null;
  }

  public async getOrCreate(guildId: string): Promise<GuildConfigRecord> {
    const existing = await this.findByGuildId(guildId);
    if (existing) return existing;

    const prisma = getPrismaClient();
    if (prisma) {
      try {
        const created = await prisma.guildConfig.create({
          data: {
            guildId,
            ...DEFAULT_CONFIG,
            ignoredTextChannels: '[]',
            ignoredVoiceChannels: '[]',
          },
        });
        return created as GuildConfigRecord;
      } catch (err) {
        console.warn('Prisma error creating config:', err);
      }
    }

    const id = `cfg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const newConfig: GuildConfigRecord = {
      id,
      guildId,
      ...DEFAULT_CONFIG,
      vcRoleId: null,
      levelUpChannelId: null,
      ignoredTextChannels: '[]',
      ignoredVoiceChannels: '[]',
    };
    memoryStore.configs.set(id, newConfig);
    return newConfig;
  }

  public async update(guildId: string, partial: Partial<GuildConfigRecord>): Promise<GuildConfigRecord> {
    const current = await this.getOrCreate(guildId);

    const prisma = getPrismaClient();
    if (prisma) {
      try {
        const updated = await prisma.guildConfig.update({
          where: { guildId },
          data: partial,
        });
        return updated as GuildConfigRecord;
      } catch (err) {
        console.warn('Prisma error updating config:', err);
      }
    }

    const updated: GuildConfigRecord = {
      ...current,
      ...partial,
    };
    memoryStore.configs.set(updated.id, updated);
    return updated;
  }
}

export const guildConfigRepository = new GuildConfigRepository();
