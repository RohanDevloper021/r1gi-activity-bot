import type { ChatInputCommandInteraction } from 'discord.js';
import type { XPSourceType } from '../config/constants.js';

export interface UserRecord {
  id: string;
  guildId: string;
  discordUserId: string;
  totalXP: number;
  chatXP: number;
  voiceXP: number;
  level: number;
  voiceSeconds: number;
  lastMessageAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface GuildRecord {
  id: string;
  discordGuildId: string;
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface GuildConfigRecord {
  id: string;
  guildId: string;
  chatXPMin: number;
  chatXPMax: number;
  chatCooldownSeconds: number;
  voiceXPPerInterval: number;
  voiceIntervalSeconds: number;
  minimumVoiceSessionSeconds: number;
  dailyChatXPLimit: number;
  dailyVoiceXPLimit: number;
  diminishingReturnsEnabled: boolean;
  diminishingReturnsThreshold: number;
  minimumVoiceParticipants: number;
  selfDeafenBlocksXP: boolean;
  selfMuteBlocksXP: boolean;
  vcRoleId: string | null;
  levelUpChannelId: string | null;
  levelUpFrequency: string; // 'milestones' | 'all' | 'roles_only'
  levelUpMessageTemplate: string;
  ignoredTextChannels: string; // JSON string array
  ignoredVoiceChannels: string; // JSON string array
  removePreviousLevelRoles: boolean;
}

export interface VoiceSessionRecord {
  id: string;
  guildId: string;
  userId: string;
  channelId: string;
  startedAt: Date;
  endedAt: Date | null;
  eligibleSeconds: number;
  xpAwarded: number;
  active: boolean;
}

export interface XPTransactionRecord {
  id: string;
  guildId: string;
  userId: string;
  source: XPSourceType | string;
  amount: number;
  reason: string;
  createdAt: Date;
}

export interface LevelRoleRecord {
  id: string;
  guildId: string;
  level: number;
  roleId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Command {
  name: string;
  description: string;
  options?: any[];
  defaultMemberPermissions?: bigint;
  execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
}

export interface UserRankInfo {
  user: UserRecord;
  rank: number;
  nextLevelXP: number;
  currentLevelXP: number;
  progressPercent: number;
}
