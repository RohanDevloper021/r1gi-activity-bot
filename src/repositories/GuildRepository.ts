import { getPrismaClient } from '../database/prisma.js';
import { memoryStore } from './memoryStore.js';
import type { GuildRecord } from '../types/index.js';

export class GuildRepository {
  public async findByDiscordId(discordGuildId: string): Promise<GuildRecord | null> {
    const prisma = getPrismaClient();
    if (prisma) {
      try {
        const found = await prisma.guild.findUnique({
          where: { discordGuildId },
        });
        return found as GuildRecord | null;
      } catch (err) {
        console.warn('Prisma error, falling back to memory store:', err);
      }
    }

    for (const guild of memoryStore.guilds.values()) {
      if (guild.discordGuildId === discordGuildId) {
        return guild;
      }
    }
    return null;
  }

  public async findById(id: string): Promise<GuildRecord | null> {
    const prisma = getPrismaClient();
    if (prisma) {
      try {
        const found = await prisma.guild.findUnique({
          where: { id },
        });
        return found as GuildRecord | null;
      } catch (err) {
        console.warn('Prisma error, falling back to memory store:', err);
      }
    }

    return memoryStore.guilds.get(id) || null;
  }

  public async getOrCreate(discordGuildId: string): Promise<GuildRecord> {
    const existing = await this.findByDiscordId(discordGuildId);
    if (existing) return existing;

    const prisma = getPrismaClient();
    if (prisma) {
      try {
        const created = await prisma.guild.create({
          data: {
            discordGuildId,
            enabled: true,
          },
        });
        return created as GuildRecord;
      } catch (err) {
        console.warn('Prisma error creating guild, falling back to memory store:', err);
      }
    }

    const id = `guild-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date();
    const newGuild: GuildRecord = {
      id,
      discordGuildId,
      enabled: true,
      createdAt: now,
      updatedAt: now,
    };
    memoryStore.guilds.set(id, newGuild);
    return newGuild;
  }

  public async listAll(): Promise<GuildRecord[]> {
    const prisma = getPrismaClient();
    if (prisma) {
      try {
        const list = await prisma.guild.findMany();
        return list as GuildRecord[];
      } catch (err) {
        console.warn('Prisma error listing guilds:', err);
      }
    }
    return Array.from(memoryStore.guilds.values());
  }
}

export const guildRepository = new GuildRepository();
