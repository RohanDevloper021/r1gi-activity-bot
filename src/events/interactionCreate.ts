import type { Interaction } from 'discord.js';
import { commands } from '../loaders/commandRegistry.js';
import { handleButton as handleHelpButton } from '../commands/activity/helplevel.js';

export async function onInteractionCreate(interaction: Interaction) {
  if (interaction.isButton()) {
    if (interaction.customId.startsWith('help_')) {
      try {
        await handleHelpButton(interaction);
      } catch (err) {
        console.error('[Interaction] Error handling help button:', err);
      }
    }
    return;
  }

  if (!interaction.isChatInputCommand()) return;

  const command = commands.get(interaction.commandName);
  if (!command) {
    console.warn(`[Interaction] Unknown command received: ${interaction.commandName}`);
    return;
  }

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(`[Interaction] Error executing command ${interaction.commandName}:`, error);

    const errorMessage = '❌ An error occurred while executing this command.';
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({ content: errorMessage, ephemeral: true }).catch(() => {});
    } else {
      await interaction.reply({ content: errorMessage, ephemeral: true }).catch(() => {});
    }
  }
}
