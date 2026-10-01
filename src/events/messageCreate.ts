import type { Message } from 'discord.js';
import { chatXPService } from '../services/xp/ChatXPService.js';
import { buildHelpPayload } from '../commands/activity/helplevel.js';

export async function onMessageCreate(message: Message) {
  if (message.author.bot) return;

  const content = message.content.trim().toLowerCase();
  const isHelpCommand =
    content === '!helplevel' ||
    content === '!help' ||
    content === '/helplevel' ||
    content === '/help' ||
    content === '.helplevel' ||
    content === '?helplevel';

  if (isHelpCommand) {
    try {
      const payload = buildHelpPayload('all', message.client.user?.displayAvatarURL());
      await message.reply(payload);
    } catch (e) {
      // Non-fatal if missing permissions in channel
    }
  }

  try {
    await chatXPService.processMessage(message);
  } catch (error) {
    console.error('[Event: messageCreate] Error processing message:', error);
  }
}
