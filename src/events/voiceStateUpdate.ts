import type { VoiceState } from 'discord.js';
import { voiceSessionService } from '../services/voice/VoiceSessionService.js';

export async function onVoiceStateUpdate(oldState: VoiceState, newState: VoiceState) {
  try {
    await voiceSessionService.handleVoiceStateUpdate(oldState, newState);
  } catch (error) {
    console.error('[Event: voiceStateUpdate] Error handling voice state:', error);
  }
}
