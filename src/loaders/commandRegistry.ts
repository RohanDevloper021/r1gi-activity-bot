import type { ChatInputCommandInteraction } from 'discord.js';

import * as setupCmd from '../commands/admin/setup.js';
import * as setxpCmd from '../commands/admin/setxp.js';
import * as addxpCmd from '../commands/admin/addxp.js';
import * as setlevelCmd from '../commands/admin/setlevel.js';
import * as setchannelCmd from '../commands/admin/setchannel.js';
import * as setvcroleCmd from '../commands/admin/setvcrole.js';
import * as resetxpCmd from '../commands/admin/resetxp.js';
import * as xpstatsCmd from '../commands/admin/xpstats.js';

import * as lrAddCmd from '../commands/levelrole/add.js';
import * as lrRemoveCmd from '../commands/levelrole/remove.js';
import * as lrEditCmd from '../commands/levelrole/edit.js';
import * as lrListCmd from '../commands/levelrole/list.js';
import * as lrSettingsCmd from '../commands/levelrole/settings.js';

import * as leaderboardCmd from '../commands/activity/leaderboard.js';
import * as rankCmd from '../commands/activity/rank.js';
import * as profileCmd from '../commands/activity/profile.js';
import * as topxpCmd from '../commands/activity/topxp.js';
import * as topchatCmd from '../commands/activity/topchat.js';
import * as topvoiceCmd from '../commands/activity/topvoice.js';
import * as helplevelCmd from '../commands/activity/helplevel.js';
import * as helpCmd from '../commands/activity/help.js';

export interface CommandModule {
  data: any;
  execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
}

export const commands = new Map<string, CommandModule>();

const allCommandModules = [
  setupCmd,
  setxpCmd,
  addxpCmd,
  setlevelCmd,
  setchannelCmd,
  setvcroleCmd,
  resetxpCmd,
  xpstatsCmd,
  lrAddCmd,
  lrRemoveCmd,
  lrEditCmd,
  lrListCmd,
  lrSettingsCmd,
  leaderboardCmd,
  rankCmd,
  profileCmd,
  topxpCmd,
  topchatCmd,
  topvoiceCmd,
  helplevelCmd,
  helpCmd,
];

for (const mod of allCommandModules) {
  if (mod.data?.name) {
    commands.set(mod.data.name, mod as CommandModule);
  }
}

export function getAllSlashCommandData() {
  return Array.from(commands.values()).map((c) => c.data.toJSON());
}
