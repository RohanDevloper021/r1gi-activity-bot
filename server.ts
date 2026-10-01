import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { bot } from './src/app.js';
import { env } from './src/config/env.js';
import { guildRepository } from './src/repositories/GuildRepository.js';
import { guildConfigRepository } from './src/repositories/GuildConfigRepository.js';
import { levelRoleRepository } from './src/repositories/LevelRoleRepository.js';
import { userRepository } from './src/repositories/UserRepository.js';
import { xpRepository } from './src/repositories/XPRepository.js';
import { leaderboardService } from './src/services/leaderboard/LeaderboardService.js';
import { rankingService } from './src/services/leaderboard/RankingService.js';
import { xpService } from './src/services/xp/XPService.js';
import { levelService } from './src/services/xp/LevelService.js';
import { rankCardService } from './src/services/image/RankCardService.js';
import { rankCardConfigRepository } from './src/repositories/RankCardConfigRepository.js';
import { antiSpamService } from './src/services/antiabuse/AntiSpamService.js';
import { cooldownService } from './src/services/antiabuse/CooldownService.js';
import { messageSimilarityService } from './src/services/antiabuse/MessageSimilarityService.js';
import { dailyLimitService } from './src/services/antiabuse/DailyLimitService.js';
import { diminishingReturnsService } from './src/services/antiabuse/DiminishingReturnsService.js';
import { XPSource } from './src/config/constants.js';
import { extractClientIdFromToken, generateBotInviteUrl } from './src/utils/discordAuth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = process.env.NODE_ENV === 'production' && process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  app.use(express.json());

  // Helper to resolve the active Discord Guild
  const getDiscordGuild = (requestedGuildId?: string) => {
    if (!bot.client.isReady()) return null;
    if (requestedGuildId && requestedGuildId !== 'undefined' && requestedGuildId !== 'guild-demo-1') {
      const g = bot.client.guilds.cache.get(requestedGuildId);
      if (g) return g;
    }
    if (env.DISCORD_GUILD_ID) {
      const g = bot.client.guilds.cache.get(env.DISCORD_GUILD_ID);
      if (g) return g;
    }
    return bot.client.guilds.cache.first() || null;
  };

  // 1. Health check endpoint
  app.get('/health', (req, res) => {
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      bot: bot.getStatus(),
    });
  });

  // 2. Real Bot Status & Connected Discord Servers
  app.get('/api/status', (req, res) => {
    const currentClientId = bot.client.user?.id || env.DISCORD_CLIENT_ID || extractClientIdFromToken(env.DISCORD_TOKEN);
    const inviteUrl = currentClientId ? generateBotInviteUrl(currentClientId) : null;
    const connectedGuilds = bot.client.isReady()
      ? Array.from(bot.client.guilds.cache.values()).map((g) => ({
          id: g.id,
          name: g.name,
          memberCount: g.memberCount,
          icon: g.iconURL() || null,
        }))
      : [];

    const activeGuild = connectedGuilds[0] || null;

    res.json({
      bot: bot.getStatus(),
      clientId: currentClientId,
      inviteUrl,
      serverId: env.DISCORD_GUILD_ID || activeGuild?.id || null,
      activeGuild,
      connectedGuilds,
      envConfigured: Boolean(env.DISCORD_TOKEN && env.DISCORD_TOKEN !== 'your_bot_token_here'),
      databaseUrlConfigured: Boolean(env.DATABASE_URL && env.DATABASE_URL.startsWith('postgres')),
    });
  });

  // 3. Connect bot with new token & server ID dynamically
  app.post('/api/bot/connect', async (req, res) => {
    const { token, serverId } = req.body;
    if (!token) {
      return res.status(400).json({ error: 'Bot token is required' });
    }

    const cleanToken = token.trim();
    const cleanServerId = serverId ? serverId.trim() : '';

    (env as any).DISCORD_TOKEN = cleanToken;
    if (cleanServerId) {
      (env as any).DISCORD_GUILD_ID = cleanServerId;
    }

    const extractedClientId = extractClientIdFromToken(cleanToken);
    if (extractedClientId) {
      (env as any).DISCORD_CLIENT_ID = extractedClientId;
    }

    await bot.stop();
    const success = await bot.start(cleanToken);

    const finalClientId = bot.client.user?.id || extractedClientId || null;
    const inviteUrl = finalClientId ? generateBotInviteUrl(finalClientId) : null;

    res.json({
      success,
      status: bot.getStatus(),
      clientId: finalClientId,
      inviteUrl,
      serverId: cleanServerId,
    });
  });

  // 4. Guilds API
  app.get('/api/guilds', async (req, res) => {
    const guilds = await guildRepository.listAll();
    res.json(guilds);
  });

  // 5. Guild Config API
  app.get('/api/guilds/:guildId/config', async (req, res) => {
    const targetGuild = getDiscordGuild(req.params.guildId);
    const effectiveGuildId = targetGuild ? targetGuild.id : req.params.guildId;
    const config = await guildConfigRepository.getOrCreate(effectiveGuildId);
    res.json(config);
  });

  app.put('/api/guilds/:guildId/config', async (req, res) => {
    const targetGuild = getDiscordGuild(req.params.guildId);
    const effectiveGuildId = targetGuild ? targetGuild.id : req.params.guildId;
    const updated = await guildConfigRepository.update(effectiveGuildId, req.body);
    res.json(updated);
  });

  // 6. Level Roles API
  app.get('/api/guilds/:guildId/level-roles', async (req, res) => {
    const targetGuild = getDiscordGuild(req.params.guildId);
    const effectiveGuildId = targetGuild ? targetGuild.id : req.params.guildId;
    const roles = await levelRoleRepository.listByGuild(effectiveGuildId);
    res.json(roles);
  });

  app.post('/api/guilds/:guildId/level-roles', async (req, res) => {
    const targetGuild = getDiscordGuild(req.params.guildId);
    const effectiveGuildId = targetGuild ? targetGuild.id : req.params.guildId;
    const { level, roleId } = req.body;
    if (level === undefined || !roleId) {
      return res.status(400).json({ error: 'Level and roleId are required' });
    }
    const created = await levelRoleRepository.upsert(effectiveGuildId, Number(level), roleId);
    res.json(created);
  });

  app.delete('/api/guilds/:guildId/level-roles/:level', async (req, res) => {
    const targetGuild = getDiscordGuild(req.params.guildId);
    const effectiveGuildId = targetGuild ? targetGuild.id : req.params.guildId;
    const level = Number(req.params.level);
    const deleted = await levelRoleRepository.delete(effectiveGuildId, level);
    res.json({ success: deleted });
  });

  // 7. REAL SERVER MEMBERS & REAL LEADERBOARD API (No fake data!)
  app.get('/api/guilds/:guildId/leaderboard', async (req, res) => {
    const targetGuild = getDiscordGuild(req.params.guildId);
    const effectiveGuildId = targetGuild ? targetGuild.id : req.params.guildId;
    const type = (req.query.type as any) || 'totalXP';
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 50;

    const memberMap = new Map<
      string,
      { username: string; displayName: string; avatarUrl: string | null; isBot: boolean }
    >();

    if (targetGuild) {
      try {
        const fetched = await targetGuild.members.fetch();
        for (const [id, m] of fetched) {
          memberMap.set(id, {
            username: m.user.username,
            displayName: m.displayName || m.user.displayName || m.user.username,
            avatarUrl: m.user.displayAvatarURL(),
            isBot: m.user.bot,
          });
        }
      } catch (err) {
        for (const [id, m] of targetGuild.members.cache) {
          memberMap.set(id, {
            username: m.user.username,
            displayName: m.displayName || m.user.displayName || m.user.username,
            avatarUrl: m.user.displayAvatarURL(),
            isBot: m.user.bot,
          });
        }
      }

      // Ensure every real human member exists in our repository
      for (const [id, info] of memberMap.entries()) {
        if (!info.isBot) {
          await userRepository.getOrCreate(effectiveGuildId, id);
        }
      }
    }

    const leaderboardResult = await leaderboardService.getLeaderboardPage(
      effectiveGuildId,
      type,
      page,
      limit
    );

    // Merge with real Discord profiles and filter out bots or fake IDs
    const realItems = leaderboardResult.items
      .filter((item) => {
        if (memberMap.size > 0) {
          return memberMap.has(item.discordUserId) && !memberMap.get(item.discordUserId)?.isBot;
        }
        return true;
      })
      .map((item, idx) => {
        const discordInfo = memberMap.get(item.discordUserId);
        return {
          ...item,
          rank: (page - 1) * limit + idx + 1,
          username: discordInfo?.username || `Member_${item.discordUserId.slice(-4)}`,
          displayName: discordInfo?.displayName || discordInfo?.username || `Member_${item.discordUserId.slice(-4)}`,
          avatarUrl: discordInfo?.avatarUrl || null,
          isBot: discordInfo?.isBot || false,
        };
      });

    const totalRealMembers = targetGuild
      ? Array.from(memberMap.values()).filter((m) => !m.isBot).length || targetGuild.memberCount
      : realItems.length;

    res.json({
      items: realItems,
      totalCount: totalRealMembers,
      realMemberCount: targetGuild ? targetGuild.memberCount : totalRealMembers,
      humanMemberCount: totalRealMembers,
      guildName: targetGuild ? targetGuild.name : null,
      guildIcon: targetGuild ? targetGuild.iconURL() : null,
      page,
      totalPages: Math.ceil(totalRealMembers / limit) || 1,
    });
  });

  // 8. REAL DISCORD ROLES API
  app.get('/api/guilds/:guildId/roles', (req, res) => {
    const targetGuild = getDiscordGuild(req.params.guildId);
    if (!targetGuild) return res.json([]);

    const roles = Array.from(targetGuild.roles.cache.values())
      .filter((r) => r.name !== '@everyone' && !r.managed)
      .map((r) => ({
        id: r.id,
        name: r.name,
        color: r.hexColor,
        position: r.position,
      }))
      .sort((a, b) => b.position - a.position);

    res.json(roles);
  });

  // 9. REAL DISCORD CHANNELS API
  app.get('/api/guilds/:guildId/channels', (req, res) => {
    const targetGuild = getDiscordGuild(req.params.guildId);
    if (!targetGuild) return res.json({ textChannels: [], voiceChannels: [] });

    const textChannels = Array.from(targetGuild.channels.cache.values())
      .filter((c) => c.isTextBased())
      .map((c) => ({ id: c.id, name: c.name }));

    const voiceChannels = Array.from(targetGuild.channels.cache.values())
      .filter((c) => c.isVoiceBased())
      .map((c) => ({ id: c.id, name: c.name }));

    res.json({ textChannels, voiceChannels });
  });

  // 10. REAL SERVER STATS API
  app.get('/api/guilds/:guildId/stats', async (req, res) => {
    const targetGuild = getDiscordGuild(req.params.guildId);
    const effectiveGuildId = targetGuild ? targetGuild.id : req.params.guildId;

    let memberCount = targetGuild ? targetGuild.memberCount : 0;
    let humanCount = 0;
    let botCount = 0;

    if (targetGuild) {
      try {
        const members = await targetGuild.members.fetch();
        humanCount = members.filter((m) => !m.user.bot).size;
        botCount = members.filter((m) => m.user.bot).size;
        memberCount = members.size;
      } catch (e) {
        humanCount = targetGuild.members.cache.filter((m) => !m.user.bot).size;
        botCount = targetGuild.members.cache.filter((m) => m.user.bot).size;
      }
    }

    const leaderboard = await leaderboardService.getLeaderboardPage(effectiveGuildId, 'totalXP', 1, 100);
    const topUser = leaderboard.items[0];
    const topXP = topUser ? topUser.totalXP : 0;
    const totalXPAwarded = leaderboard.items.reduce((acc, u) => acc + u.totalXP, 0);
    const configuredRoles = await levelRoleRepository.listByGuild(effectiveGuildId);

    res.json({
      guildId: effectiveGuildId,
      guildName: targetGuild ? targetGuild.name : 'Discord Server',
      guildIcon: targetGuild ? targetGuild.iconURL() : null,
      memberCount,
      humanCount,
      botCount,
      topXP,
      totalXPAwarded,
      levelRolesCount: configuredRoles.length,
      connected: bot.client.isReady(),
    });
  });

  // 11. User Profile API
  app.get('/api/guilds/:guildId/users/:userId', async (req, res) => {
    const targetGuild = getDiscordGuild(req.params.guildId);
    const effectiveGuildId = targetGuild ? targetGuild.id : req.params.guildId;
    const rankInfo = await rankingService.getUserRankInfo(effectiveGuildId, req.params.userId);
    if (!rankInfo) {
      return res.status(404).json({ error: 'User not found in guild' });
    }

    // Try to get real discord member info
    let discordMember: any = null;
    if (targetGuild) {
      const m = await targetGuild.members.fetch(req.params.userId).catch(() => null);
      if (m) {
        discordMember = {
          username: m.user.username,
          displayName: m.displayName || m.user.displayName || m.user.username,
          avatarUrl: m.user.displayAvatarURL(),
        };
      }
    }

    res.json({
      ...rankInfo,
      username: discordMember?.username || `User_${req.params.userId}`,
      displayName: discordMember?.displayName || discordMember?.username || `User_${req.params.userId}`,
      avatarUrl: discordMember?.avatarUrl || null,
    });
  });

  // 11.5. Visual Rank Card Image API (A to Z Customization)
  app.get('/api/guilds/:guildId/users/:userId/card', async (req, res) => {
    try {
      const targetGuild = getDiscordGuild(req.params.guildId);
      const effectiveGuildId = targetGuild ? targetGuild.id : req.params.guildId;
      const userRecord = await userRepository.getOrCreate(effectiveGuildId, req.params.userId);
      const rankInfo = await rankingService.getUserRankInfo(effectiveGuildId, req.params.userId);
      const progress = levelService.getProgress(userRecord.totalXP);
      const savedConfig = await rankCardConfigRepository.getByGuildId(effectiveGuildId);

      let discordMember: any = null;
      if (targetGuild) {
        const m = await targetGuild.members.fetch(req.params.userId).catch(() => null);
        if (m) {
          discordMember = {
            username: m.user.username,
            displayName: m.displayName || m.user.displayName || m.user.username,
            avatarUrl: m.user.displayAvatarURL({ extension: 'png', size: 256 }),
          };
        }
      }

      // Sizes
      const cardWidth = req.query.width ? Number(req.query.width) : savedConfig.cardWidth;
      const cardHeight = req.query.height ? Number(req.query.height) : savedConfig.cardHeight;
      const cardRadius = req.query.radius ? Number(req.query.radius) : savedConfig.cardRadius;
      const avatarSize = req.query.avatarSize ? Number(req.query.avatarSize) : savedConfig.avatarSize;
      const avatarShape = (req.query.avatarShape as any) || savedConfig.avatarShape;
      const avatarBorderWidth = req.query.avatarBorderWidth !== undefined ? Number(req.query.avatarBorderWidth) : savedConfig.avatarBorderWidth;
      const progressBarHeight = req.query.progressBarHeight !== undefined ? Number(req.query.progressBarHeight) : savedConfig.progressBarHeight;

      // Messages
      const bannerMessage = req.query.bannerMessage !== undefined ? String(req.query.bannerMessage) : savedConfig.bannerMessage;
      const footerMessage = req.query.footerMessage !== undefined ? String(req.query.footerMessage) : savedConfig.footerMessage;
      const nameFormat = (req.query.nameFormat as any) || savedConfig.nameFormat;

      // Visibility toggles
      const showRankBadge = req.query.showRankBadge !== undefined ? req.query.showRankBadge === 'true' : savedConfig.showRankBadge;
      const showLevelBadge = req.query.showLevelBadge !== undefined ? req.query.showLevelBadge === 'true' : savedConfig.showLevelBadge;
      const showTotalXP = req.query.showTotalXP !== undefined ? req.query.showTotalXP === 'true' : savedConfig.showTotalXP;
      const showNextLevelXP = req.query.showNextLevelXP !== undefined ? req.query.showNextLevelXP === 'true' : savedConfig.showNextLevelXP;
      const showPercentage = req.query.showPercentage !== undefined ? req.query.showPercentage === 'true' : savedConfig.showPercentage;

      // Visuals & Colors
      const bgParam = req.query.bg !== undefined ? String(req.query.bg) : savedConfig.backgroundUrl;
      const themeParam = req.query.theme !== undefined ? String(req.query.theme) : savedConfig.bgTheme;
      const bgOverlayOpacity = req.query.bgOverlayOpacity !== undefined ? Number(req.query.bgOverlayOpacity) : savedConfig.bgOverlayOpacity;
      const textColorParam = req.query.textColor !== undefined ? String(req.query.textColor) : savedConfig.primaryTextColor;
      const secColorParam = req.query.secColor !== undefined ? String(req.query.secColor) : savedConfig.secondaryTextColor;
      const accentColorParam = req.query.accentColor !== undefined ? String(req.query.accentColor) : savedConfig.accentColor;
      const accentColorEndParam = req.query.accentColorEnd !== undefined ? String(req.query.accentColorEnd) : savedConfig.accentColorEnd;

      const cardBuffer = await rankCardService.generateRankCard({
        username: discordMember?.username || `user_${req.params.userId.slice(-4)}`,
        displayName: discordMember?.displayName || discordMember?.username || `Member_${req.params.userId.slice(-4)}`,
        avatarUrl: discordMember?.avatarUrl || null,
        level: userRecord.level,
        rank: rankInfo?.rank || 1,
        currentLevelXP: userRecord.totalXP - progress.currentLevelBaseXP,
        nextLevelXP: progress.nextLevelXP - progress.currentLevelBaseXP,
        totalXP: userRecord.totalXP,
        percentage: progress.percentage,
        isLevelUp: req.query.levelup === 'true',

        // A to Z sizes
        cardWidth,
        cardHeight,
        cardRadius,
        avatarSize,
        avatarShape,
        avatarBorderWidth,
        progressBarHeight,

        // A to Z messages
        bannerMessage,
        footerMessage,
        nameFormat,
        showRankBadge,
        showLevelBadge,
        showTotalXP,
        showNextLevelXP,
        showPercentage,

        // A to Z visuals
        backgroundUrl: bgParam || null,
        bgTheme: themeParam,
        bgOverlayOpacity,
        primaryTextColor: textColorParam,
        secondaryTextColor: secColorParam,
        accentColor: accentColorParam,
        accentColorEnd: accentColorEndParam,
      });

      res.setHeader('Content-Type', 'image/png');
      res.setHeader('Cache-Control', 'public, max-age=15');
      res.send(cardBuffer);
    } catch (err: any) {
      console.error('Error generating card image:', err);
      res.status(500).json({ error: 'Failed to generate rank card image' });
    }
  });

  // 11.6. Get Stored Rank Card Configuration for Guild
  app.get('/api/guilds/:guildId/rank-card-config', async (req, res) => {
    const targetGuild = getDiscordGuild(req.params.guildId);
    const effectiveGuildId = targetGuild ? targetGuild.id : req.params.guildId;
    const config = await rankCardConfigRepository.getByGuildId(effectiveGuildId);
    res.json(config);
  });

  // 11.7. Update & Persist Stored Rank Card Configuration for Guild
  app.put('/api/guilds/:guildId/rank-card-config', async (req, res) => {
    const targetGuild = getDiscordGuild(req.params.guildId);
    const effectiveGuildId = targetGuild ? targetGuild.id : req.params.guildId;
    const updated = await rankCardConfigRepository.update(effectiveGuildId, req.body);
    res.json(updated);
  });

  // 12. XP Transactions Audit Log API
  app.get('/api/guilds/:guildId/transactions', async (req, res) => {
    const targetGuild = getDiscordGuild(req.params.guildId);
    const effectiveGuildId = targetGuild ? targetGuild.id : req.params.guildId;
    const limit = Number(req.query.limit) || 30;
    const transactions = await xpRepository.getRecentTransactions(effectiveGuildId, limit);
    res.json(transactions);
  });

  // 13. Interactive Chat Activity Simulator
  app.post('/api/guilds/:guildId/simulate-chat', async (req, res) => {
    const targetGuild = getDiscordGuild(req.params.guildId);
    const effectiveGuildId = targetGuild ? targetGuild.id : req.params.guildId;
    const { userId, content, isBot, isWebhook, channelId } = req.body;

    const spamCheck = antiSpamService.validateMessage(
      effectiveGuildId,
      userId,
      content,
      Boolean(isBot),
      Boolean(isWebhook)
    );

    if (!spamCheck.valid) {
      return res.json({ awarded: false, reason: spamCheck.reason });
    }

    const config = await guildConfigRepository.getOrCreate(effectiveGuildId);

    // Cooldown check
    if (cooldownService.isOnChatCooldown(effectiveGuildId, userId, config.chatCooldownSeconds)) {
      const remaining = cooldownService.getRemainingChatCooldown(effectiveGuildId, userId, config.chatCooldownSeconds);
      return res.json({ awarded: false, reason: `On chat cooldown (${remaining}s remaining)` });
    }

    // Similarity check
    if (messageSimilarityService.isTooSimilar(effectiveGuildId, userId, content)) {
      return res.json({ awarded: false, reason: 'Message too similar to recent messages (duplicate blocked)' });
    }

    messageSimilarityService.recordMessage(effectiveGuildId, userId, content);

    // Calculate XP
    const minXP = config.chatXPMin;
    const maxXP = Math.max(minXP, config.chatXPMax);
    const baseXP = Math.floor(Math.random() * (maxXP - minXP + 1)) + minXP;

    const { allowedAmount, limitReached, currentDailyXP } = await dailyLimitService.getAvailableDailyXP(
      effectiveGuildId,
      userId,
      XPSource.CHAT,
      baseXP,
      config.dailyChatXPLimit
    );

    if (allowedAmount <= 0) {
      return res.json({ awarded: false, reason: 'Daily chat XP limit reached' });
    }

    const { finalXP, multiplier } = diminishingReturnsService.calculateAdjustedXP(
      allowedAmount,
      currentDailyXP,
      config.diminishingReturnsEnabled,
      config.diminishingReturnsThreshold
    );

    cooldownService.setChatCooldown(effectiveGuildId, userId);

    const awardResult = await xpService.awardXP({
      guildId: effectiveGuildId,
      discordUserId: userId,
      amount: finalXP,
      source: XPSource.CHAT,
      reason: `Simulated chat message in #${channelId || 'general'}`,
    });

    res.json({
      awarded: true,
      amount: finalXP,
      baseXP,
      multiplier,
      dailyLimitReached: limitReached,
      awardResult,
    });
  });

  // 14. Interactive Voice Activity Simulator
  app.post('/api/guilds/:guildId/simulate-voice', async (req, res) => {
    const targetGuild = getDiscordGuild(req.params.guildId);
    const effectiveGuildId = targetGuild ? targetGuild.id : req.params.guildId;
    const { userId, durationSeconds, humanParticipants, isMuted, isDeafened, isAFK } = req.body;

    const config = await guildConfigRepository.getOrCreate(effectiveGuildId);

    if (isDeafened && config.selfDeafenBlocksXP) {
      return res.json({ awarded: false, reason: 'Self-deafened in voice channel (XP blocked)' });
    }

    if (isMuted && config.selfMuteBlocksXP) {
      return res.json({ awarded: false, reason: 'Self-muted in voice channel (XP blocked)' });
    }

    if (isAFK) {
      return res.json({ awarded: false, reason: 'Member is currently in server AFK voice channel (XP blocked)' });
    }

    if (humanParticipants < config.minimumVoiceParticipants) {
      return res.json({
        awarded: false,
        reason: `Only ${humanParticipants} human(s) in voice channel; minimum required is ${config.minimumVoiceParticipants}`,
      });
    }

    const intervals = Math.floor(durationSeconds / config.voiceIntervalSeconds);
    const rawXP = intervals * config.voiceXPPerInterval;

    if (rawXP <= 0) {
      return res.json({
        awarded: false,
        reason: `Voice duration (${durationSeconds}s) is shorter than voice interval (${config.voiceIntervalSeconds}s)`,
      });
    }

    const { allowedAmount } = await dailyLimitService.getAvailableDailyXP(
      effectiveGuildId,
      userId,
      XPSource.VOICE,
      rawXP,
      config.dailyVoiceXPLimit
    );

    if (allowedAmount <= 0) {
      return res.json({ awarded: false, reason: 'Daily voice XP limit reached' });
    }

    const currentDailyXP = 0;
    const { finalXP, multiplier } = diminishingReturnsService.calculateAdjustedXP(
      allowedAmount,
      currentDailyXP,
      config.diminishingReturnsEnabled,
      config.diminishingReturnsThreshold
    );

    const awardResult = await xpService.awardXP({
      guildId: effectiveGuildId,
      discordUserId: userId,
      amount: finalXP,
      source: XPSource.VOICE,
      reason: `Simulated voice activity (${durationSeconds}s)`,
      voiceSeconds: durationSeconds,
    });

    res.json({
      awarded: true,
      amount: finalXP,
      durationSeconds,
      multiplier,
      awardResult,
    });
  });

  // 15. Vite or Static Files handling
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', async () => {
    console.log(`🌐 Activity Engine Web & API Server running on port ${PORT}`);
    // Start discord bot if token is present
    await bot.start();
  });
}

startServer().catch((err) => {
  console.error('Fatal error starting server:', err);
  process.exit(1);
});
