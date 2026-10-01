import { type Client, ActivityType, REST, Routes } from 'discord.js';
import { recoveryService } from '../services/recovery/RecoveryService.js';
import { voiceSessionService } from '../services/voice/VoiceSessionService.js';
import { getAllSlashCommandData } from '../loaders/commandRegistry.js';
import { extractClientIdFromToken, generateBotInviteUrl } from '../utils/discordAuth.js';
import { env } from '../config/env.js';

export async function onReady(client: Client) {
  const botTag = client.user?.tag;
  const botId = client.user?.id;
  console.log(`🤖 [ActivityEngine] Logged in successfully as ${botTag} (${botId})`);

  // Set rich Discord presence
  client.user?.setPresence({
    activities: [
      {
        name: 'Chat & Voice | R1gi',
        type: ActivityType.Watching,
      },
    ],
    status: 'online',
  });

  // Start background voice processing interval
  voiceSessionService.startInterval(client, 60000);

  // Execute failure-safe state recovery & reconciliation
  await recoveryService.reconcileVoiceState(client);

  // Determine Client ID:
  // 1. From client.user.id
  // 2. From env.DISCORD_CLIENT_ID
  // 3. Extracted from bot token
  const clientId = client.user?.id || env.DISCORD_CLIENT_ID || extractClientIdFromToken(env.DISCORD_TOKEN);
  const token = env.DISCORD_TOKEN;

  if (clientId) {
    const inviteUrl = generateBotInviteUrl(clientId);
    console.log(`🔗 [ActivityEngine] Bot Invite URL (1-Click):\n${inviteUrl}`);
  }

  // Register slash commands
  if (clientId && token) {
    try {
      console.log('🔄 [ActivityEngine] Registering slash commands with Discord API...');
      const rest = new REST({ version: '10' }).setToken(token);
      const slashCommands = getAllSlashCommandData();

      // If specific server ID (guild ID) is provided, register to it directly for INSTANT availability
      if (env.DISCORD_GUILD_ID) {
        await rest.put(
          Routes.applicationGuildCommands(clientId, env.DISCORD_GUILD_ID),
          { body: slashCommands }
        );
        console.log(`✅ [ActivityEngine] Instantly registered ${slashCommands.length} commands to server ${env.DISCORD_GUILD_ID}`);
      }

      // Also register to any guilds the bot is currently in for instant access
      for (const [gid, g] of client.guilds.cache.entries()) {
        if (gid !== env.DISCORD_GUILD_ID) {
          try {
            await rest.put(Routes.applicationGuildCommands(clientId, gid), {
              body: slashCommands,
            });
            console.log(`✅ [ActivityEngine] Registered commands to connected server: ${g.name} (${gid})`);
          } catch (gErr) {
            // Non-fatal if missing access
          }
        }
      }

      // Also register globally
      await rest.put(Routes.applicationCommands(clientId), {
        body: slashCommands,
      });
      console.log(`✅ [ActivityEngine] Registered ${slashCommands.length} global slash commands`);
    } catch (err) {
      console.warn('⚠️ [ActivityEngine] Could not register slash commands:', err);
    }
  }
}
