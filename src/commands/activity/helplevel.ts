import {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  type ChatInputCommandInteraction,
  type ButtonInteraction,
} from 'discord.js';
import { COLORS } from '../../config/constants.js';

export function buildHelpPayload(category: string = 'all', botAvatarUrl?: string | null) {
  const embed = new EmbedBuilder()
    .setColor(COLORS.PRIMARY)
    .setTitle('📚 Activity Engine — Complete Command Directory')
    .setThumbnail(botAvatarUrl || null)
    .setFooter({
      text: 'Activity Engine • Dual Chat & Voice Leveling System',
      iconURL: botAvatarUrl || undefined,
    })
    .setTimestamp();

  if (category === 'all' || category === 'user') {
    embed.addFields({
      name: '📊 Member & Activity Commands (Available to Everyone)',
      value: [
        '`/helplevel` — Complete command directory & guide for leveling, roles, and XP.',
        '`/rank [member]` — View your (or another member\'s) Level, Rank, XP bar, and progress.',
        '`/leaderboard [type]` — View server leaderboards (Total XP, Chat, or Voice).',
        '`/profile [member]` — Complete activity stats card including voice time logged & rank.',
        '`/topxp` — Quick top 10 ranking for total accumulated XP.',
        '`/topchat` — Quick top 10 ranking for most active chatters.',
        '`/topvoice` — Quick top 10 ranking for longest voice channel members.',
      ].join('\n'),
      inline: false,
    });
  }

  if (category === 'all' || category === 'levelroles') {
    embed.addFields({
      name: '🎖️ Level Role Rewards (Requires Manage Roles)',
      value: [
        '`/levelrole-add <level> <role>` — Automatically grant a role when reaching a milestone level.',
        '`/levelrole-remove <level>` — Delete a level role reward from a specific milestone level.',
        '`/levelrole-list` — List all configured level roles, milestone requirements, and stacking mode.',
        '`/levelrole-settings <mode> [remove_on_demote]` — Configure role reward mode:\n  • `stack`: Members keep all earned roles.\n  • `highest_only`: Members only keep their highest milestone role.\n  • `remove_on_demote`: Whether to take roles away if XP is manually deducted.',
      ].join('\n'),
      inline: false,
    });
  }

  if (category === 'all' || category === 'admin') {
    embed.addFields({
      name: '⚙️ Admin & Server Configuration (Requires Administrator)',
      value: [
        '`/setup` — View server XP multipliers, cooldowns, voice settings, and channels.',
        '`/setchannel <channel> [frequency]` — Configure dedicated level-up announcement channel and milestone frequency.',
        '`/addxp <target> <amount>` — Award bonus XP to a member (triggers level-up rank card if level increases).',
        '`/setxp <target> <xp>` — Set a user\'s total XP directly (triggers level-up rank card if level increases).',
        '`/setlevel <target> <level>` — Set a user\'s level directly (triggers rank card & syncs roles).',
        '`/setvcrole <role>` — Assign an automatic role to members while actively in a voice channel.',
        '`/resetxp <target>` — Reset XP for a specific member or all server members.',
        '`/xpstats` — View server-wide stats, total XP awarded, and anti-abuse logs.',
      ].join('\n'),
      inline: false,
    });
  }

  if (category === 'all' || category === 'antiabuse') {
    embed.addFields({
      name: '🛡️ How XP Works & Anti-Abuse Protections',
      value: [
        '**💬 Chat XP System:** Earn 15–25 XP per minute for meaningful chat messages.',
        '• **Rate Limiting:** 60-second cooldown between XP gains prevents spam.',
        '• **Levenshtein Anti-Spam:** Copy-pasted or repeated messages award **0 XP**.',
        '• **Diminishing Returns:** Sending rapid bursts gradually lowers XP payout.',
        '• **Daily Cap:** Unlimited (No daily XP limit — earn as much XP as you participate).',
        '',
        '**🎙️ Voice XP System:** Earn 10 XP per minute of active voice participation.',
        '• **Solo Voice Allowed:** Earn voice XP even if you are alone in the channel (no 2-person minimum).',
        '• **Mute / Deafen Check:** Deafened members earn **0 XP** (unmuted/talking members earn full XP).',
        '• **Failure Recovery:** Voice sessions are safely reconciled if bot restarts.',
      ].join('\n'),
      inline: false,
    });
  }

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId('help_all')
      .setLabel('All Commands')
      .setStyle(category === 'all' ? ButtonStyle.Primary : ButtonStyle.Secondary)
      .setEmoji('📚'),
    new ButtonBuilder()
      .setCustomId('help_user')
      .setLabel('Member')
      .setStyle(category === 'user' ? ButtonStyle.Primary : ButtonStyle.Secondary)
      .setEmoji('📊'),
    new ButtonBuilder()
      .setCustomId('help_levelroles')
      .setLabel('Level Roles')
      .setStyle(category === 'levelroles' ? ButtonStyle.Primary : ButtonStyle.Secondary)
      .setEmoji('🎖️'),
    new ButtonBuilder()
      .setCustomId('help_admin')
      .setLabel('Admin')
      .setStyle(category === 'admin' ? ButtonStyle.Primary : ButtonStyle.Secondary)
      .setEmoji('⚙️'),
    new ButtonBuilder()
      .setCustomId('help_antiabuse')
      .setLabel('Anti-Abuse')
      .setStyle(category === 'antiabuse' ? ButtonStyle.Primary : ButtonStyle.Secondary)
      .setEmoji('🛡️')
  );

  return { embeds: [embed], components: [row] };
}

export const data = new SlashCommandBuilder()
  .setName('helplevel')
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
  const category = interaction.options.getString('category') || 'all';
  const payload = buildHelpPayload(category, interaction.client.user?.displayAvatarURL());
  await interaction.reply(payload);
}

export async function handleButton(interaction: ButtonInteraction) {
  const customId = interaction.customId;
  const category = customId.replace('help_', '');
  const payload = buildHelpPayload(category, interaction.client.user?.displayAvatarURL());
  await interaction.update(payload);
}
