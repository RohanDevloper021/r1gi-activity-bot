import type { Message, PartialMessage } from 'discord.js';

export async function onMessageUpdate(
  oldMessage: Message | PartialMessage,
  newMessage: Message | PartialMessage
) {
  // Activity Engine does not grant duplicate XP on message edit
}
