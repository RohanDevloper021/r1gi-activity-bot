import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { DEFAULT_CONFIG } from '../config/constants.js';
import type {
  GuildRecord,
  UserRecord,
  GuildConfigRecord,
  VoiceSessionRecord,
  XPTransactionRecord,
  LevelRoleRecord,
} from '../types/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, '../../data');
const DATA_FILE = path.join(DATA_DIR, 'activity_store.json');

class InMemoryStore {
  public guilds = new Map<string, GuildRecord>();
  public configs = new Map<string, GuildConfigRecord>();
  public users = new Map<string, UserRecord>();
  public voiceSessions = new Map<string, VoiceSessionRecord>();
  public xpTransactions = new Map<string, XPTransactionRecord>();
  public levelRoles = new Map<string, LevelRoleRecord>();
  public rankCardConfigs = new Map<string, any>();

  constructor() {
    this.loadFromDisk();
    this.purgeFakeDemoData();
  }

  /**
   * Remove any legacy hardcoded fake demo users, demo guilds, or fake transactions
   */
  public purgeFakeDemoData() {
    // Purge fake demo guild
    this.guilds.delete('guild-demo-1');
    this.configs.delete('cfg-1');

    // Purge fake mock users
    const fakeUserIds = ['usr-1', 'usr-2', 'usr-3', 'usr-4', 'usr-5'];
    const fakeDiscordIds = ['98765432101', '98765432102', '98765432103', '98765432104', '98765432105'];

    for (const [id, u] of Array.from(this.users.entries())) {
      if (fakeUserIds.includes(id) || fakeDiscordIds.includes(u.discordUserId) || u.guildId === 'guild-demo-1') {
        this.users.delete(id);
      }
    }

    // Purge fake transactions
    for (const [id, tx] of Array.from(this.xpTransactions.entries())) {
      if (fakeUserIds.includes(tx.userId) || tx.guildId === 'guild-demo-1') {
        this.xpTransactions.delete(id);
      }
    }

    // Purge fake demo level roles
    for (const [id, lr] of Array.from(this.levelRoles.entries())) {
      if (lr.guildId === 'guild-demo-1' || lr.roleId.startsWith('role-')) {
        this.levelRoles.delete(id);
      }
    }
  }

  public saveToDisk() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      const data = {
        guilds: Array.from(this.guilds.entries()),
        configs: Array.from(this.configs.entries()),
        users: Array.from(this.users.entries()),
        voiceSessions: Array.from(this.voiceSessions.entries()),
        xpTransactions: Array.from(this.xpTransactions.entries()),
        levelRoles: Array.from(this.levelRoles.entries()),
        rankCardConfigs: Array.from(this.rankCardConfigs.entries()),
      };
      fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
    } catch (e) {
      // Ignore disk save errors in restricted envs
    }
  }

  public loadFromDisk(): boolean {
    try {
      if (fs.existsSync(DATA_FILE)) {
        const raw = fs.readFileSync(DATA_FILE, 'utf8');
        const data = JSON.parse(raw);
        if (data.guilds && Array.isArray(data.guilds)) {
          this.guilds = new Map(data.guilds);
          this.configs = new Map(
            data.configs.map(([id, c]: [string, any]) => [
              id,
              {
                ...c,
                dailyChatXPLimit: c.dailyChatXPLimit === 2000 ? 0 : (c.dailyChatXPLimit ?? 0),
                dailyVoiceXPLimit: c.dailyVoiceXPLimit === 3000 ? 0 : (c.dailyVoiceXPLimit ?? 0),
                minimumVoiceParticipants: c.minimumVoiceParticipants === 2 ? 1 : (c.minimumVoiceParticipants ?? 1),
                levelUpFrequency: c.levelUpFrequency || 'milestones',
              },
            ])
          );
          this.users = new Map(
            data.users.map(([id, u]: [string, any]) => [
              id,
              {
                ...u,
                createdAt: new Date(u.createdAt),
                updatedAt: new Date(u.updatedAt),
                lastMessageAt: u.lastMessageAt ? new Date(u.lastMessageAt) : null,
              },
            ])
          );
          this.voiceSessions = new Map(
            data.voiceSessions.map(([id, v]: [string, any]) => [
              id,
              {
                ...v,
                startedAt: new Date(v.startedAt),
                endedAt: v.endedAt ? new Date(v.endedAt) : null,
              },
            ])
          );
          this.xpTransactions = new Map(
            data.xpTransactions.map(([id, t]: [string, any]) => [
              id,
              {
                ...t,
                createdAt: new Date(t.createdAt),
              },
            ])
          );
          this.levelRoles = new Map(
            data.levelRoles.map(([id, r]: [string, any]) => [
              id,
              {
                ...r,
                createdAt: new Date(r.createdAt),
                updatedAt: new Date(r.updatedAt),
              },
            ])
          );
          if (data.rankCardConfigs && Array.isArray(data.rankCardConfigs)) {
            this.rankCardConfigs = new Map(data.rankCardConfigs);
          }
          return true;
        }
      }
    } catch (e) {
      // Ignore disk load errors
    }
    return false;
  }

  public clearAll() {
    this.guilds.clear();
    this.configs.clear();
    this.users.clear();
    this.voiceSessions.clear();
    this.xpTransactions.clear();
    this.levelRoles.clear();
  }
}

export const memoryStore = new InMemoryStore();
