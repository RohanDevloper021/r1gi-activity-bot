import { getPrismaClient } from '../database/prisma.js';
import { memoryStore } from './memoryStore.js';
import type { VoiceSessionRecord } from '../types/index.js';

export class VoiceSessionRepository {
  public async findActiveSession(guildId: string, userId: string): Promise<VoiceSessionRecord | null> {
    const prisma = getPrismaClient();
    if (prisma) {
      try {
        const found = await prisma.voiceSession.findFirst({
          where: {
            guildId,
            userId,
            active: true,
          },
        });
        return found as VoiceSessionRecord | null;
      } catch (err) {
        console.warn('Prisma active voice session error:', err);
      }
    }

    for (const session of memoryStore.voiceSessions.values()) {
      if (session.guildId === guildId && session.userId === userId && session.active) {
        return session;
      }
    }
    return null;
  }

  public async createSession(guildId: string, userId: string, channelId: string): Promise<VoiceSessionRecord> {
    const prisma = getPrismaClient();
    if (prisma) {
      try {
        const session = await prisma.voiceSession.create({
          data: {
            guildId,
            userId,
            channelId,
            active: true,
            eligibleSeconds: 0,
            xpAwarded: 0,
          },
        });
        return session as VoiceSessionRecord;
      } catch (err) {
        console.warn('Prisma create session error:', err);
      }
    }

    const id = `vs-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const session: VoiceSessionRecord = {
      id,
      guildId,
      userId,
      channelId,
      startedAt: new Date(),
      endedAt: null,
      eligibleSeconds: 0,
      xpAwarded: 0,
      active: true,
    };
    memoryStore.voiceSessions.set(id, session);
    return session;
  }

  public async updateSession(
    id: string,
    updates: Partial<VoiceSessionRecord>
  ): Promise<VoiceSessionRecord | null> {
    const prisma = getPrismaClient();
    if (prisma) {
      try {
        const updated = await prisma.voiceSession.update({
          where: { id },
          data: updates,
        });
        return updated as VoiceSessionRecord;
      } catch (err) {
        console.warn('Prisma update session error:', err);
      }
    }

    const existing = memoryStore.voiceSessions.get(id);
    if (!existing) return null;
    const updated: VoiceSessionRecord = {
      ...existing,
      ...updates,
    };
    memoryStore.voiceSessions.set(id, updated);
    return updated;
  }

  public async endSession(id: string, eligibleSeconds: number, xpAwarded: number): Promise<VoiceSessionRecord | null> {
    return this.updateSession(id, {
      active: false,
      endedAt: new Date(),
      eligibleSeconds,
      xpAwarded,
    });
  }

  public async listActiveSessions(guildId?: string): Promise<VoiceSessionRecord[]> {
    const prisma = getPrismaClient();
    if (prisma) {
      try {
        const list = await prisma.voiceSession.findMany({
          where: {
            active: true,
            ...(guildId ? { guildId } : {}),
          },
        });
        return list as VoiceSessionRecord[];
      } catch (err) {
        console.warn('Prisma list active sessions error:', err);
      }
    }

    return Array.from(memoryStore.voiceSessions.values()).filter(
      (s) => s.active && (!guildId || s.guildId === guildId)
    );
  }
}

export const voiceSessionRepository = new VoiceSessionRepository();
