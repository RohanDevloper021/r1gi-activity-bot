import {
  SlashCommandBuilder,
  type ChatInputCommandInteraction,
} from 'discord.js';
import * as helplevelCmd from './helplevel.js';

export const data = new SlashCommandBuilder()
  .setName('help')
  .setDescription('Directory of all Leveling, Role Rewards, Activity & Admin commands with descriptions')
  .addStringOption((option) =>
    option
      .setName('category')
      .setDescription('Filter by command category')
      .setRequired(false)
      .addChoices(
        { name: 'All Commands & Directory', value: 'all' },
        { name: 'User & Activity Commands', value: 'user' },
        { name: 'Level Role Rewards', value: 'levelroles' },
        { name: 'Admin & Setup Commands', value: 'admin' },
        { name: 'How XP & Anti-Abuse Works', value: 'antiabuse' }
      )
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  return helplevelCmd.execute(interaction);
}
