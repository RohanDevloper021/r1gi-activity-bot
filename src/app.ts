import { Client, GatewayIntentBits, Partials } from 'discord.js';
import { onReady } from './events/ready.js';
import { onInteractionCreate } from './events/interactionCreate.js';
import { onMessageCreate } from './events/messageCreate.js';
import { onVoiceStateUpdate } from './events/voiceStateUpdate.js';
import { onMessageDelete } from './events/messageDelete.js';
import { onMessageUpdate } from './events/messageUpdate.js';
import { onGuildMemberRemove } from './events/guildMemberRemove.js';
import { env } from './config/env.js';

export class ActivityEngineBot {
  public client: Client;
  private isStarted = false;

  constructor() {
    this.client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
      ],
      partials: [Partials.Message, Partials.Channel, Partials.Reaction, Partials.GuildMember],
    });

    this.registerEvents();
  }

  private registerEvents() {
    this.client.once('ready', (c) => onReady(c));
    this.client.on('interactionCreate', (i) => onInteractionCreate(i));
    this.client.on('messageCreate', (m) => onMessageCreate(m));
    this.client.on('voiceStateUpdate', (o, n) => onVoiceStateUpdate(o, n));
    this.client.on('messageDelete', (m) => onMessageDelete(m));
    this.client.on('messageUpdate', (o, n) => onMessageUpdate(o, n));
    this.client.on('guildMemberRemove', (m) => onGuildMemberRemove(m));
  }

  public async start(token?: string): Promise<boolean> {
    const botToken = token || env.DISCORD_TOKEN;
    if (!botToken || botToken.trim() === '' || botToken === 'your_bot_token_here') {
      console.log('ℹ️ [ActivityEngine] DISCORD_TOKEN not configured. Bot will run in Web/Dashboard mode.');
      return false;
    }

    try {
      console.log('🚀 [ActivityEngine] Connecting to Discord Gateway...');
      await this.client.login(botToken);
      this.isStarted = true;
      return true;
    } catch (error) {
      console.error('❌ [ActivityEngine] Discord login failed:', error);
      return false;
    }
  }

  public async stop(): Promise<void> {
    if (this.isStarted) {
      await this.client.destroy();
      this.isStarted = false;
      console.log('🛑 [ActivityEngine] Bot disconnected.');
    }
  }

  public getStatus() {
    const isReady = this.client.isReady();
    return {
      connected: isReady,
      tag: isReady ? this.client.user?.tag : null,
      id: isReady ? this.client.user?.id : null,
      guildCount: isReady ? this.client.guilds.cache.size : 0,
      ping: isReady ? this.client.ws.ping : null,
      uptime: isReady ? this.client.uptime : 0,
    };
  }
}

export const bot = new ActivityEngineBot();
