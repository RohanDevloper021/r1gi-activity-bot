import { getPrismaClient } from '../database/prisma.js';
import { memoryStore } from './memoryStore.js';
import type { LevelRoleRecord } from '../types/index.js';

export class LevelRoleRepository {
  public async findByGuildAndLevel(guildId: string, level: number): Promise<LevelRoleRecord | null> {
    const prisma = getPrismaClient();
    if (prisma) {
      try {
        const found = await prisma.levelRole.findUnique({
          where: {
            guildId_level: {
              guildId,
              level,
            },
          },
        });
        return found as LevelRoleRecord | null;
      } catch (err) {
        console.warn('Prisma error finding level role:', err);
      }
    }

    for (const lr of memoryStore.levelRoles.values()) {
      if (lr.guildId === guildId && lr.level === level) {
        return lr;
      }
    }
    return null;
  }

  public async listByGuild(guildId: string): Promise<LevelRoleRecord[]> {
    const prisma = getPrismaClient();
    if (prisma) {
      try {
        const list = await prisma.levelRole.findMany({
          where: { guildId },
          orderBy: { level: 'asc' },
        });
        return list as LevelRoleRecord[];
      } catch (err) {
        console.warn('Prisma error listing level roles:', err);
      }
    }

    const roles = Array.from(memoryStore.levelRoles.values()).filter((lr) => lr.guildId === guildId);
    roles.sort((a, b) => a.level - b.level);
    return roles;
  }

  public async upsert(guildId: string, level: number, roleId: string): Promise<LevelRoleRecord> {
    const prisma = getPrismaClient();
    if (prisma) {
      try {
        const result = await prisma.levelRole.upsert({
          where: {
            guildId_level: {
              guildId,
              level,
            },
          },
          update: { roleId },
          create: { guildId, level, roleId },
        });
        return result as LevelRoleRecord;
      } catch (err) {
        console.warn('Prisma error upserting level role:', err);
      }
    }

    const existing = await this.findByGuildAndLevel(guildId, level);
    if (existing) {
      existing.roleId = roleId;
      existing.updatedAt = new Date();
      memoryStore.levelRoles.set(existing.id, existing);
      return existing;
    }

    const id = `lr-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const created: LevelRoleRecord = {
      id,
      guildId,
      level,
      roleId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    memoryStore.levelRoles.set(id, created);
    return created;
  }

  public async delete(guildId: string, level: number): Promise<boolean> {
    const prisma = getPrismaClient();
    if (prisma) {
      try {
        await prisma.levelRole.delete({
          where: {
            guildId_level: {
              guildId,
              level,
            },
          },
        });
        return true;
      } catch (err) {
        console.warn('Prisma error deleting level role:', err);
      }
    }

    for (const [id, lr] of memoryStore.levelRoles.entries()) {
      if (lr.guildId === guildId && lr.level === level) {
        memoryStore.levelRoles.delete(id);
        return true;
      }
    }
    return false;
  }
}

export const levelRoleRepository = new LevelRoleRepository();
