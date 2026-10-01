import type { Message, PartialMessage } from 'discord.js';

export async function onMessageDelete(message: Message | PartialMessage) {
  // Activity Engine does not retroactively deduct XP on message deletion,
  // preventing negative XP exploits and griefing.
}
