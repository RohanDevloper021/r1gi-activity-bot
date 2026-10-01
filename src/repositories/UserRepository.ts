import { getPrismaClient } from '../database/prisma.js';
import { memoryStore } from './memoryStore.js';
import type { UserRecord } from '../types/index.js';

export class UserRepository {
  public async findByGuildAndUser(guildId: string, discordUserId: string): Promise<UserRecord | null> {
    const prisma = getPrismaClient();
    if (prisma) {
      try {
        const found = await prisma.user.findUnique({
          where: {
            guildId_discordUserId: {
              guildId,
              discordUserId,
            },
          },
        });
        return found as UserRecord | null;
      } catch (err) {
        console.warn('Prisma error finding user:', err);
      }
    }

    for (const u of memoryStore.users.values()) {
      if (u.guildId === guildId && u.discordUserId === discordUserId) {
        return u;
      }
    }
    return null;
  }

  public async getOrCreate(guildId: string, discordUserId: string): Promise<UserRecord> {
    const existing = await this.findByGuildAndUser(guildId, discordUserId);
    if (existing) return existing;

    const prisma = getPrismaClient();
    if (prisma) {
      try {
        const created = await prisma.user.create({
          data: {
            guildId,
            discordUserId,
            totalXP: 0,
            chatXP: 0,
            voiceXP: 0,
            level: 0,
            voiceSeconds: 0,
          },
        });
        return created as UserRecord;
      } catch (err) {
        console.warn('Prisma error creating user:', err);
      }
    }

    const id = `user-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date();
    const newUser: UserRecord = {
      id,
      guildId,
      discordUserId,
      totalXP: 0,
      chatXP: 0,
      voiceXP: 0,
      level: 0,
      voiceSeconds: 0,
      lastMessageAt: null,
      createdAt: now,
      updatedAt: now,
    };
    memoryStore.users.set(id, newUser);
    return newUser;
  }

  public async atomicUpdateXP(
    guildId: string,
    discordUserId: string,
    updates: {
      chatXPIncrement?: number;
      voiceXPIncrement?: number;
      totalXPIncrement?: number;
      voiceSecondsIncrement?: number;
      level?: number;
      lastMessageAt?: Date;
    }
  ): Promise<UserRecord> {
    const user = await this.getOrCreate(guildId, discordUserId);

    const prisma = getPrismaClient();
    if (prisma) {
      try {
        const updated = await prisma.user.update({
          where: { id: user.id },
          data: {
            ...(updates.chatXPIncrement ? { chatXP: { increment: updates.chatXPIncrement } } : {}),
            ...(updates.voiceXPIncrement ? { voiceXP: { increment: updates.voiceXPIncrement } } : {}),
            ...(updates.totalXPIncrement ? { totalXP: { increment: updates.totalXPIncrement } } : {}),
            ...(updates.voiceSecondsIncrement ? { voiceSeconds: { increment: updates.voiceSecondsIncrement } } : {}),
            ...(updates.level !== undefined ? { level: updates.level } : {}),
            ...(updates.lastMessageAt ? { lastMessageAt: updates.lastMessageAt } : {}),
          },
        });
        return updated as UserRecord;
      } catch (err) {
        console.warn('Prisma error in atomic update:', err);
      }
    }

    // Atomic in-memory update
    const updated: UserRecord = {
      ...user,
      chatXP: user.chatXP + (updates.chatXPIncrement || 0),
      voiceXP: user.voiceXP + (updates.voiceXPIncrement || 0),
      totalXP: user.totalXP + (updates.totalXPIncrement || 0),
      voiceSeconds: user.voiceSeconds + (updates.voiceSecondsIncrement || 0),
      level: updates.level !== undefined ? updates.level : user.level,
      lastMessageAt: updates.lastMessageAt || user.lastMessageAt,
      updatedAt: new Date(),
    };
    memoryStore.users.set(updated.id, updated);
    return updated;
  }

  public async setXP(guildId: string, discordUserId: string, totalXP: number, level: number): Promise<UserRecord> {
    const user = await this.getOrCreate(guildId, discordUserId);
    const prisma = getPrismaClient();
    if (prisma) {
      try {
        const updated = await prisma.user.update({
          where: { id: user.id },
          data: {
            totalXP,
            level,
          },
        });
        return updated as UserRecord;
      } catch (err) {
        console.warn('Prisma error in setXP:', err);
      }
    }

    const updated: UserRecord = {
      ...user,
      totalXP,
      level,
      updatedAt: new Date(),
    };
    memoryStore.users.set(updated.id, updated);
    return updated;
  }

  public async resetXP(guildId: string, discordUserId?: string): Promise<number> {
    const prisma = getPrismaClient();
    if (discordUserId) {
      const user = await this.findByGuildAndUser(guildId, discordUserId);
      if (!user) return 0;
      if (prisma) {
        try {
          await prisma.user.update({
            where: { id: user.id },
            data: { totalXP: 0, chatXP: 0, voiceXP: 0, level: 0, voiceSeconds: 0 },
          });
          return 1;
        } catch (err) {
          console.warn('Prisma reset error:', err);
        }
      }
      memoryStore.users.set(user.id, {
        ...user,
        totalXP: 0,
        chatXP: 0,
        voiceXP: 0,
        level: 0,
        voiceSeconds: 0,
        updatedAt: new Date(),
      });
      return 1;
    } else {
      // Reset entire guild
      if (prisma) {
        try {
          const res = await prisma.user.updateMany({
            where: { guildId },
            data: { totalXP: 0, chatXP: 0, voiceXP: 0, level: 0, voiceSeconds: 0 },
          });
          return res.count;
        } catch (err) {
          console.warn('Prisma reset guild error:', err);
        }
      }
      let count = 0;
      for (const [id, u] of memoryStore.users.entries()) {
        if (u.guildId === guildId) {
          memoryStore.users.set(id, {
            ...u,
            totalXP: 0,
            chatXP: 0,
            voiceXP: 0,
            level: 0,
            voiceSeconds: 0,
            updatedAt: new Date(),
          });
          count++;
        }
      }
      return count;
    }
  }

  public async getLeaderboard(
    guildId: string,
    sortField: 'totalXP' | 'chatXP' | 'voiceXP' = 'totalXP',
    limit = 10,
    offset = 0
  ): Promise<UserRecord[]> {
    const prisma = getPrismaClient();
    if (prisma) {
      try {
        const rows = await prisma.user.findMany({
          where: { guildId },
          orderBy: { [sortField]: 'desc' },
          take: limit,
          skip: offset,
        });
        return rows as UserRecord[];
      } catch (err) {
        console.warn('Prisma leaderboard error:', err);
      }
    }

    const filtered = Array.from(memoryStore.users.values()).filter((u) => u.guildId === guildId);
    filtered.sort((a, b) => b[sortField] - a[sortField]);
    return filtered.slice(offset, offset + limit);
  }

  public async getUserRank(
    guildId: string,
    discordUserId: string,
    sortField: 'totalXP' | 'chatXP' | 'voiceXP' = 'totalXP'
  ): Promise<number> {
    const target = await this.findByGuildAndUser(guildId, discordUserId);
    if (!target) return 0;

    const prisma = getPrismaClient();
    if (prisma) {
      try {
        const higherCount = await prisma.user.count({
          where: {
            guildId,
            [sortField]: { gt: target[sortField] },
          },
        });
        return higherCount + 1;
      } catch (err) {
        console.warn('Prisma rank count error:', err);
      }
    }

    const allInGuild = Array.from(memoryStore.users.values()).filter((u) => u.guildId === guildId);
    let rank = 1;
    for (const u of allInGuild) {
      if (u[sortField] > target[sortField]) {
        rank++;
      }
    }
    return rank;
  }

  public async countGuildUsers(guildId: string): Promise<number> {
    const prisma = getPrismaClient();
    if (prisma) {
      try {
        return await prisma.user.count({ where: { guildId } });
      } catch (err) {
        console.warn('Prisma count error:', err);
      }
    }
    return Array.from(memoryStore.users.values()).filter((u) => u.guildId === guildId).length;
  }
}

export const userRepository = new UserRepository();
