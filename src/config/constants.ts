export const XPSource = {
  CHAT: 'CHAT',
  VOICE: 'VOICE',
  ADMIN: 'ADMIN',
  BONUS: 'BONUS',
  PENALTY: 'PENALTY',
} as const;

export type XPSourceType = (typeof XPSource)[keyof typeof XPSource];

export const COLORS = {
  PRIMARY: 0x5865F2,   // Blurple
  SUCCESS: 0x57F287,   // Green
  WARNING: 0xFEE75C,   // Yellow
  DANGER: 0xED4245,    // Red
  GOLD: 0xF1C40F,      // Gold for #1 rank
  SILVER: 0xBDC3C7,    // Silver for #2 rank
  BRONZE: 0xCD7F32,    // Bronze for #3 rank
  DARK: 0x2B2D31,      // Discord dark theme background
  VOICE: 0x3BA55D,     // Voice active green
} as const;

export const DEFAULT_CONFIG = {
  chatXPMin: 5,
  chatXPMax: 10,
  chatCooldownSeconds: 45,
  voiceXPPerInterval: 10,
  voiceIntervalSeconds: 60,
  minimumVoiceSessionSeconds: 120,
  dailyChatXPLimit: 0, // 0 = Unlimited (no daily cap)
  dailyVoiceXPLimit: 0, // 0 = Unlimited (no daily cap)
  diminishingReturnsEnabled: true,
  diminishingReturnsThreshold: 1000,
  minimumVoiceParticipants: 1, // 1 = Solo voice allowed (no 2-person requirement)
  selfDeafenBlocksXP: true,
  selfMuteBlocksXP: false,
  removePreviousLevelRoles: false,
  levelUpFrequency: 'milestones', // 'milestones' (every 5 levels + roles), 'all' (every level), 'roles_only'
  levelUpMessageTemplate: '🎉 Congratulations {user}! You reached **Level {level}**! (Total XP: {totalXP})',
} as const;

export const ANTI_ABUSE = {
  SIMILARITY_THRESHOLD: 0.85,          // 85% Levenshtein similarity = duplicate/spam
  BURST_WINDOW_SECONDS: 10,             // Check within 10 seconds
  BURST_MAX_MESSAGES: 4,               // Max messages in burst window
  MIN_MESSAGE_LENGTH: 3,               // Ignore < 3 characters
} as const;
