import {
  SlashCommandBuilder,
  EmbedBuilder,
  type ChatInputCommandInteraction,
} from 'discord.js';
import { levelRoleRepository } from '../../repositories/LevelRoleRepository.js';
import { guildConfigRepository } from '../../repositories/GuildConfigRepository.js';
import { COLORS } from '../../config/constants.js';

export const data = new SlashCommandBuilder()
  .setName('levelrole-list')
  .setDescription('List all configured level role reward milestones');

export async function execute(interaction: ChatInputCommandInteraction) {
  if (!interaction.guildId) return;

  const roles = await levelRoleRepository.listByGuild(interaction.guildId);
  const config = await guildConfigRepository.getOrCreate(interaction.guildId);

  const embed = new EmbedBuilder()
    .setColor(COLORS.PRIMARY)
    .setTitle('🎖️ LEVEL REWARDS')
    .setFooter({
      text: config.removePreviousLevelRoles
        ? 'Settings: Previous level roles are removed upon advancing'
        : 'Settings: Cumulative rewards (previous roles kept)',
    });

  if (roles.length === 0) {
    embed.setDescription(
      'No level roles have been configured yet.\nAdministrators can add milestones using `/levelrole-add`.'
    );
  } else {
    const lines = roles.map((r) => `**Level ${r.level}** ➔ <@&${r.roleId}>`);
    embed.setDescription(lines.join('\n'));
  }

  await interaction.reply({ embeds: [embed] });
}
