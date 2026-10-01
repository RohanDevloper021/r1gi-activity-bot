import {
  SlashCommandBuilder,
  type ChatInputCommandInteraction,
} from 'discord.js';
import { profileService } from '../../services/profile/ProfileService.js';

export const data = new SlashCommandBuilder()
  .setName('profile')
  .setDescription('View an extensive activity profile card with full XP breakdown and statistics')
  .addUserOption((option) =>
    option.setName('member').setDescription('Member profile to inspect (defaults to you)').setRequired(false)
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  if (!interaction.guildId || !interaction.guild) return;

  const targetUser = interaction.options.getUser('member') || interaction.user;
  const member = await interaction.guild.members.fetch(targetUser.id).catch(() => null);

  const embed = await profileService.createProfileEmbed(interaction.guildId, targetUser, member);
  await interaction.reply({ embeds: [embed] });
}
