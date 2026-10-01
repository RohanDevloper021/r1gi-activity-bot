import { getPrismaClient } from '../database/prisma.js';
import { memoryStore } from './memoryStore.js';
import type { XPTransactionRecord } from '../types/index.js';

export class XPRepository {
  public async recordTransaction(
    guildId: string,
    userId: string,
    source: string,
    amount: number,
    reason: string
  ): Promise<XPTransactionRecord> {
    const prisma = getPrismaClient();
    if (prisma) {
      try {
        const created = await prisma.xPTransaction.create({
          data: {
            guildId,
            userId,
            source,
            amount,
            reason,
          },
        });
        return created as XPTransactionRecord;
      } catch (err) {
        console.warn('Prisma error recording XP transaction:', err);
      }
    }

    const id = `tx-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const tx: XPTransactionRecord = {
      id,
      guildId,
      userId,
      source,
      amount,
      reason,
      createdAt: new Date(),
    };
    memoryStore.xpTransactions.set(id, tx);
    return tx;
  }

  public async getDailyXP(guildId: string, userId: string, source?: string): Promise<number> {
    const since = new Date();
    since.setHours(0, 0, 0, 0); // start of day UTC

    const prisma = getPrismaClient();
    if (prisma) {
      try {
        const aggregate = await prisma.xPTransaction.aggregate({
          where: {
            guildId,
            userId,
            ...(source ? { source } : {}),
            createdAt: { gte: since },
          },
          _sum: {
            amount: true,
          },
        });
        return aggregate._sum.amount || 0;
      } catch (err) {
        console.warn('Prisma aggregate error:', err);
      }
    }

    let sum = 0;
    for (const tx of memoryStore.xpTransactions.values()) {
      if (
        tx.guildId === guildId &&
        tx.userId === userId &&
        (!source || tx.source === source) &&
        tx.createdAt >= since
      ) {
        sum += tx.amount;
      }
    }
    return sum;
  }

  public async getRecentTransactions(guildId: string, limit = 25): Promise<XPTransactionRecord[]> {
    const prisma = getPrismaClient();
    if (prisma) {
      try {
        const list = await prisma.xPTransaction.findMany({
          where: { guildId },
          orderBy: { createdAt: 'desc' },
          take: limit,
        });
        return list as XPTransactionRecord[];
      } catch (err) {
        console.warn('Prisma recent transactions error:', err);
      }
    }

    const all = Array.from(memoryStore.xpTransactions.values()).filter((t) => t.guildId === guildId);
    all.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    return all.slice(0, limit);
  }
}

export const xpRepository = new XPRepository();
