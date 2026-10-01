# ⚡ Activity Engine — Production Discord XP & Leveling Bot

Activity Engine is an enterprise-grade, anti-farming Discord bot that tracks **Chat Activity** and **Voice Activity**, calculates levels with a nonlinear XP curve, awards fully customizable level-based roles, manages temporary VC roles, and provides real-time leaderboards and member profiles.

Built with **Node.js, TypeScript, discord.js v14, PostgreSQL, Prisma ORM, Zod, and Vitest**.

---

## 🌟 Key Features

* 💬 **Chat XP Engine**: Randomized XP awards with cooldowns, burst protection, Levenshtein message similarity detection, and daily limits.
* 🎙️ **Voice XP Engine**: Verified session tracking, human participant verification (no bots, no alone-in-VC farming), deafen/mute policies, AFK channel exclusion, and short session protection.
* 🎖️ **Fully Customizable Level-Role Milestones**:
  * Administrators can define any level milestone (e.g. Level 5 ➔ @Active, Level 10 ➔ @Regular, Level 20 ➔ @Veteran).
  * Toggle between **stacking roles** or **removing previous level roles** upon advancing.
  * No hardcoded limits or source code modifications needed.
* 🔊 **Temporary VC Role**: Automatically assigns a role (e.g. `@In Voice`) while in eligible voice channels and strips it upon leaving.
* 🏆 **Real-Time Leaderboards**: Paginated rankings for Total XP, Chat XP, and Voice Activity.
* 👤 **Member Profiles & Rank Cards**: Discord embeds displaying levels, XP bars, voice hours, and server ranks.
* 🛡️ **Anti-Abuse & Anti-Farming**:
  * Message burst protection and anti-spam detection.
  * 85% Levenshtein similarity duplicate rejection.
  * Configurable daily chat & voice XP limits.
  * Diminishing returns on excessive activity.
* 💾 **PostgreSQL & Atomic Ledger**:
  * Every XP change is recorded in an immutable `XPTransaction` audit ledger.
  * Mutex-locked atomic operations prevent race conditions and concurrent event exploits.
  * Automatic state reconciliation on startup (closes zombie sessions, reconciles VC roles).
* 🌐 **Web Management Dashboard & Event Simulator**:
  * Live status, configuration manager, level-role builder, leaderboard browser, audit ledger, and interactive event simulator.
* 🚀 **24/7 Free Hosting on Render**: Ready-to-deploy configuration with `render.yaml` and health check.

---

## 📋 Table of Contents

1. [Requirements](#requirements)
2. [Discord Developer Portal Setup](#discord-developer-portal-setup)
3. [Environment Configuration](#environment-configuration)
4. [Prisma & Database Setup](#prisma--database-setup)
5. [Local Development](#local-development)
6. [Automated Testing](#automated-testing)
7. [Deployment (24/7 Free Hosting on Render)](#deployment-247-free-hosting-on-render)
8. [Slash Commands Reference](#slash-commands-reference)
9. [Level-Role Configuration Guide](#level-role-configuration-guide)
10. [Anti-Abuse & Anti-Farming Specification](#anti-abuse--anti-farming-specification)
11. [Troubleshooting & FAQ](#troubleshooting--faq)

---

## 🔧 Requirements

* **Node.js**: v18.0.0 or higher (v20+ recommended)
* **TypeScript**: 5.x / 7.x
* **PostgreSQL**: 14+ (or hosted provider like Render, Supabase, Neon, Railway)
* **Discord Bot Token**: With Privileged Gateway Intents enabled

---

## 🤖 Discord Developer Portal Setup

1. Go to the [Discord Developer Portal](https://discord.com/developers/applications).
2. Click **New Application** and give it a name (e.g., `Activity Engine`).
3. Navigate to the **Bot** tab:
   * Click **Add Bot**.
   * Under **Privileged Gateway Intents**, enable:
     - ✅ **Presence Intent**
     - ✅ **Server Members Intent**
     - ✅ **Message Content Intent**
   * Click **Reset Token** and copy your token to `.env` as `DISCORD_TOKEN`.
4. Navigate to the **OAuth2** tab:
   * Copy the **Client ID** to `.env` as `DISCORD_CLIENT_ID`.
   * Under **OAuth2 URL Generator**:
     - Scopes: `bot`, `applications.commands`
     - Bot Permissions:
       - `Manage Roles` (required for level roles and temporary VC role)
       - `Send Messages`
       - `Embed Links`
       - `View Channels`
       - `Read Message History`
     - Copy the generated URL and invite the bot to your Discord server.
5. **Role Hierarchy Note**: In your Discord Server Settings > Roles, make sure the bot's role is placed **higher** than all the roles it needs to assign!

---

## ⚙️ Environment Configuration

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Fill in your configuration:

```env
DISCORD_TOKEN=your_bot_token_here
DISCORD_CLIENT_ID=your_client_id_here
DISCORD_GUILD_ID=your_test_guild_id_optional_for_instant_dev

DATABASE_URL="postgresql://postgres:password@localhost:5432/activity_engine?schema=public"

NODE_ENV=development
PORT=3000
LOG_LEVEL=info
```

---

## 🗄️ Prisma & Database Setup

1. Generate Prisma Client:
```bash
npm run prisma:generate
```

2. Run Database Migrations:
```bash
npx prisma db push
```

*Note: In development without a live PostgreSQL instance, Activity Engine automatically uses its high-performance in-memory ACID store, allowing you to run, test, and preview the system immediately.*

---

## 🚀 Local Development

1. Install dependencies:
```bash
npm install
```

2. Start the development server (runs Web Dashboard + Discord Bot):
```bash
npm run dev
```

Visit `http://localhost:3000` to access the Web Management Console.

---

## 🧪 Automated Testing

Activity Engine includes a full test suite with 33+ automated unit and integration tests across Chat XP, Voice XP, Leveling, and Database Isolation:

```bash
npm test
```

---

## 🌐 Deployment (24/7 Free Hosting on Render)

### Option 1: One-Click Render Blueprint

1. Push this repository to GitHub or GitLab.
2. In [Render Dashboard](https://dashboard.render.com), click **New +** > **Blueprint**.
3. Select your repository. Render will automatically read `render.yaml` and configure:
   * A **Web Service** running Node.js with health checks at `/health`.
   * A free **PostgreSQL Database** linked directly via `DATABASE_URL`.
4. Add your `DISCORD_TOKEN` and `DISCORD_CLIENT_ID` in the Render environment settings.
5. Deploy! Your bot and management dashboard will be online 24/7.

### Option 2: Render Web Service (Manual)

* **Build Command**: `npm install && npm run build`
* **Start Command**: `npm run start`
* **Health Check Path**: `/health`

---

## 📜 Slash Commands Reference

### 🛠️ Administrator Commands

| Command | Description | Permissions |
|---|---|---|
| `/setup` | View current guild activity configuration and active settings | Administrator |
| `/setxp @member <xp>` | Set a member's total XP directly | Administrator |
| `/setlevel @member <level>` | Set a member's level directly (auto-syncs roles) | Administrator |
| `/setchannel [#channel]` | Set or disable the channel for level-up announcements | Administrator |
| `/setvcrole [@role]` | Set or disable the temporary VC activity role | Administrator |
| `/resetxp [@member] [confirm]` | Reset XP for a specific member or the entire guild | Administrator |
| `/xpstats` | View server-wide activity statistics, voice time, and transactions | Administrator |

### 🎖️ Level-Role Reward Commands

| Command | Description | Permissions |
|---|---|---|
| `/levelrole-add <level> <@role>` | Add a milestone role awarded when reaching `<level>` | Manage Roles |
| `/levelrole-remove <level>` | Remove a milestone role configuration | Manage Roles |
| `/levelrole-edit <level> <@role>` | Update the role assigned for `<level>` | Manage Roles |
| `/levelrole-list` | Display all configured level milestones in ascending order | Everyone |
| `/levelrole-settings <remove_previous>` | Toggle whether previous roles are kept or removed | Manage Roles |

### 🏆 Activity & Profile Commands

| Command | Description | Permissions |
|---|---|---|
| `/rank [@member]` | View rank card, level progress bar, and stats | Everyone |
| `/profile [@member]` | View full activity profile with detailed statistics | Everyone |
| `/leaderboard [category] [page]` | View server leaderboard (Total XP, Chat XP, Voice XP) | Everyone |
| `/topxp` | View Top 10 members by Total XP | Everyone |
| `/topchat` | View Top 10 members by Chat Activity | Everyone |
| `/topvoice` | View Top 10 members by Voice Activity & VC Hours | Everyone |

---

## 🎖️ Level-Role Configuration Guide

Activity Engine gives administrators 100% control over role rewards without modifying code:

1. **Add Milestones**:
   ```text
   /levelrole-add level:5 role:@Active
   /levelrole-add level:10 role:@Regular
   /levelrole-add level:20 role:@Veteran
   ```

2. **Choose Progression Strategy**:
   * **Cumulative / Stacking** (`remove_previous: false`):
     A Level 20 member holds `@Active`, `@Regular`, and `@Veteran`.
   * **Single Highest Role** (`remove_previous: true`):
     When reaching Level 20, `@Regular` is automatically removed and `@Veteran` is assigned.
   ```text
   /levelrole-settings remove_previous:true
   ```

3. **Inspect Milestones**:
   ```text
   /levelrole-list
   ```

---

## 🛡️ Anti-Abuse & Anti-Farming Specification

* **Chat Anti-Abuse**:
  * **Cooldown**: Configurable window (default 45s) between XP-eligible messages.
  * **Burst Protection**: Limits message bursts within 10 seconds.
  * **Similarity Check**: Levenshtein comparison blocks repetitive and near-identical messages.
  * **Exclusions**: Bots, webhooks, empty messages, command invocations, and ignored channels earn 0 XP.
* **Voice Anti-Abuse**:
  * **Human Verification**: A channel must have at least 2 real humans (bots never count). Being alone in VC awards 0 XP.
  * **Short Session Defense**: Sessions shorter than `minimumVoiceSessionSeconds` (default 120s) yield 0 XP.
  * **Deafen & AFK**: Self-deafened and server-deafened users, and anyone in the Discord AFK channel, earn 0 XP.
  * **Self-Mute**: Allowed by default (muting alone does not indicate lack of participation).
* **Diminishing Returns & Daily Caps**:
  * Configurable daily chat and voice caps.
  * Activity beyond the threshold gradually yields reduced XP percentages (70% ➔ 40% ➔ 20%).

---

## ❓ Troubleshooting & FAQ

* **The bot cannot assign roles:**
  Ensure the bot's role in Discord (Server Settings > Roles) is located **above** the roles it is assigning, and that the bot has `Manage Roles` permission.
* **Slash commands are not showing up:**
  Global commands take up to an hour for Discord to propagate. To register instantly in development, set `DISCORD_GUILD_ID` in `.env`.
* **Prisma error on startup:**
  If running without an active PostgreSQL instance, Activity Engine automatically falls back to its persistent repository memory store. When deploying to production, supply a valid `DATABASE_URL`.
