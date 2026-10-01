import { env } from '../config/env.js';

let prismaInstance: any = null;
let hasAttemptedLoad = false;

export function getPrismaClient(): any {
  if (hasAttemptedLoad) return prismaInstance;

  if (process.env.DATABASE_URL && process.env.DATABASE_URL.startsWith('postgres')) {
    try {
      // Dynamic require / import to avoid crashing if prisma generate has not been run
      const { PrismaClient } = (globalThis as any).prismaClientConstructor || require('@prisma/client');
      prismaInstance = new PrismaClient({
        log: env.LOG_LEVEL === 'debug' ? ['query', 'info', 'warn', 'error'] : ['error'],
      });
    } catch (err) {
      console.warn('⚠️ [Prisma] Could not initialize PrismaClient. Using memory repository layer.', err);
      prismaInstance = null;
    }
  }

  hasAttemptedLoad = true;
  return prismaInstance;
}

export const prisma = getPrismaClient();
