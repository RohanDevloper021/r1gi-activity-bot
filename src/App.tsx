import React, { useState, useEffect } from 'react';
import {
  Activity,
  Shield,
  Mic,
  MessageSquare,
  Trophy,
  Award,
  Settings,
  Terminal,
  Database,
  Cloud,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Users,
  Clock,
  Flame,
  ChevronRight,
  Plus,
  Trash2,
  Edit3,
  ExternalLink,
  Copy,
  Check,
  Radio,
  Sliders,
  Sparkles,
  Zap,
  Palette,
  Download,
  Image as ImageIcon,
  Save,
  Type,
  Maximize2,
} from 'lucide-react';
import { RankCardStudio } from './components/RankCardStudio.js';

interface BotStatus {
  connected: boolean;
  tag: string | null;
  id: string | null;
  guildCount: number;
  ping: number | null;
  uptime: number;
}

export interface UserItem {
  id: string;
  discordUserId: string;
  username?: string;
  displayName?: string;
  avatarUrl?: string | null;
  isBot?: boolean;
  totalXP: number;
  chatXP: number;
  voiceXP: number;
  level: number;
  voiceSeconds: number;
  rank: number;
}

interface LevelRole {
  id: string;
  guildId: string;
  level: number;
  roleId: string;
}

interface GuildConfig {
  id: string;
  guildId: string;
  chatXPMin: number;
  chatXPMax: number;
  chatCooldownSeconds: number;
  voiceXPPerInterval: number;
  voiceIntervalSeconds: number;
  minimumVoiceSessionSeconds: number;
  dailyChatXPLimit: number;
  dailyVoiceXPLimit: number;
  diminishingReturnsEnabled: boolean;
  diminishingReturnsThreshold: number;
  minimumVoiceParticipants: number;
  selfDeafenBlocksXP: boolean;
  selfMuteBlocksXP: boolean;
  vcRoleId: string | null;
  levelUpChannelId: string | null;
  levelUpMessageTemplate: string;
  removePreviousLevelRoles: boolean;
}

interface Transaction {
  id: string;
  userId: string;
  source: string;
  amount: number;
  reason: string;
  createdAt: string;
}

export default function App() {
  const [activeTab, setActiveTab] = useState<
    'dashboard' | 'card' | 'config' | 'roles' | 'simulator' | 'ledger' | 'hosting'
  >('dashboard');

  const [botStatus, setBotStatus] = useState<BotStatus>({
    connected: false,
    tag: null,
    id: null,
    guildCount: 1,
    ping: null,
    uptime: 0,
  });

  const [leaderboardCategory, setLeaderboardCategory] = useState<'totalXP' | 'chatXP' | 'voiceXP'>('totalXP');
  const [leaderboard, setLeaderboard] = useState<UserItem[]>([]);
  const [levelRoles, setLevelRoles] = useState<LevelRole[]>([]);
  const [config, setConfig] = useState<GuildConfig | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserItem | null>(null);

  const [activeGuildId, setActiveGuildId] = useState<string>('1509855612945829978');
  const [activeGuildName, setActiveGuildName] = useState<string>("R O H A N ツ's server");
  const [activeGuildIcon, setActiveGuildIcon] = useState<string | null>(null);
  const [realMemberCount, setRealMemberCount] = useState<number>(19);
  const [serverRoles, setServerRoles] = useState<{ id: string; name: string; color: string }[]>([]);

  const [loading, setLoading] = useState(false);
  const [tokenInput, setTokenInput] = useState('');
  const [serverIdInput, setServerIdInput] = useState('');
  const [derivedClientId, setDerivedClientId] = useState<string | null>(null);
  const [botInviteUrl, setBotInviteUrl] = useState<string | null>(null);
  const [tokenConnecting, setTokenConnecting] = useState(false);
  const [connectMessage, setConnectMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [copiedRenderYaml, setCopiedRenderYaml] = useState(false);

  // Rank Card Customizer States (A to Z)
  const [studioTab, setStudioTab] = useState<'image' | 'size' | 'msg' | 'color'>('image');
  const [cardTheme, setCardTheme] = useState<string>('midnight');
  const [cardCustomBgUrl, setCardCustomBgUrl] = useState<string>('');
  const [cardBgOpacity, setCardBgOpacity] = useState<number>(0.75);

  // Sizes (A to Z)
  const [cardWidth, setCardWidth] = useState<number>(934);
  const [cardHeight, setCardHeight] = useState<number>(282);
  const [cardRadius, setCardRadius] = useState<number>(24);
  const [avatarSize, setAvatarSize] = useState<number>(65);
  const [avatarShape, setAvatarShape] = useState<'circle' | 'square' | 'hexagon'>('circle');
  const [avatarBorderWidth, setAvatarBorderWidth] = useState<number>(4);
  const [progressBarHeight, setProgressBarHeight] = useState<number>(22);

  // Messages (A to Z)
  const [bannerMessage, setBannerMessage] = useState<string>('🎉 LEVEL UP!');
  const [footerMessage, setFooterMessage] = useState<string>('⭐ Activity Engine • 300 Levels Milestone Progression');
  const [levelUpTemplate, setLevelUpTemplate] = useState<string>('🎉 Congratulations {user} on reaching **Level {level}**!');
  const [nameFormat, setNameFormat] = useState<'both' | 'display' | 'username'>('both');
  const [showRankBadge, setShowRankBadge] = useState<boolean>(true);
  const [showLevelBadge, setShowLevelBadge] = useState<boolean>(true);
  const [showTotalXP, setShowTotalXP] = useState<boolean>(true);
  const [showNextLevelXP, setShowNextLevelXP] = useState<boolean>(true);
  const [showPercentage, setShowPercentage] = useState<boolean>(true);

  // Colors
  const [cardTextColor, setCardTextColor] = useState<string>('#ffffff');
  const [cardSecColor, setCardSecColor] = useState<string>('#94a3b8');
  const [cardAccentColor, setCardAccentColor] = useState<string>('#6366f1');
  const [cardAccentColorEnd, setCardAccentColorEnd] = useState<string>('#a855f7');
  const [cardIsLevelUpPreview, setCardIsLevelUpPreview] = useState<boolean>(false);
  const [cardConfigSaved, setCardConfigSaved] = useState<boolean>(false);

  // Level Role Form
  const [newRoleLevel, setNewRoleLevel] = useState(5);
  const [newRoleId, setNewRoleId] = useState('');

  // Simulator Form State
  const [simUserId, setSimUserId] = useState('');
  const [simMessage, setSimMessage] = useState('Hey everyone, how is the project going today?');
  const [simChatResult, setSimChatResult] = useState<any>(null);

  const [simVoiceSeconds, setSimVoiceSeconds] = useState(180);
  const [simVoiceHumans, setSimVoiceHumans] = useState(1);
  const [simMuted, setSimMuted] = useState(false);
  const [simDeafened, setSimDeafened] = useState(false);
  const [simAFK, setSimAFK] = useState(false);
  const [simVoiceResult, setSimVoiceResult] = useState<any>(null);

  const guildId = activeGuildId;

  // Fetch initial data
  const fetchData = async () => {
    try {
      const statusRes = await fetch('/api/status').then((r) => r.json()).catch(() => null);
      if (statusRes?.bot) setBotStatus(statusRes.bot);
      if (statusRes?.inviteUrl) setBotInviteUrl(statusRes.inviteUrl);
      if (statusRes?.clientId) setDerivedClientId(statusRes.clientId);
      if (statusRes?.serverId && !serverIdInput) setServerIdInput(statusRes.serverId);

      const targetGuild = statusRes?.connectedGuilds?.[0] || statusRes?.activeGuild;
      const targetGuildId = targetGuild?.id || statusRes?.serverId || activeGuildId || '1509855612945829978';
      if (targetGuildId !== activeGuildId) {
        setActiveGuildId(targetGuildId);
      }
      if (targetGuild?.name) setActiveGuildName(targetGuild.name);
      if (targetGuild?.icon) setActiveGuildIcon(targetGuild.icon);
      if (targetGuild?.memberCount) setRealMemberCount(targetGuild.memberCount);

      const [configRes, rolesRes, lbRes, txRes, srvRolesRes, statsRes, cardCfgRes] = await Promise.all([
        fetch(`/api/guilds/${targetGuildId}/config`).then((r) => r.json()).catch(() => null),
        fetch(`/api/guilds/${targetGuildId}/level-roles`).then((r) => r.json()).catch(() => null),
        fetch(`/api/guilds/${targetGuildId}/leaderboard?type=${leaderboardCategory}`).then((r) => r.json()).catch(() => null),
        fetch(`/api/guilds/${targetGuildId}/transactions`).then((r) => r.json()).catch(() => null),
        fetch(`/api/guilds/${targetGuildId}/roles`).then((r) => r.json()).catch(() => null),
        fetch(`/api/guilds/${targetGuildId}/stats`).then((r) => r.json()).catch(() => null),
        fetch(`/api/guilds/${targetGuildId}/rank-card-config`).then((r) => r.json()).catch(() => null),
      ]);

      if (configRes) setConfig(configRes);
      if (rolesRes) setLevelRoles(rolesRes);
      if (cardCfgRes) {
        if (cardCfgRes.cardWidth) setCardWidth(cardCfgRes.cardWidth);
        if (cardCfgRes.cardHeight) setCardHeight(cardCfgRes.cardHeight);
        if (cardCfgRes.cardRadius !== undefined) setCardRadius(cardCfgRes.cardRadius);
        if (cardCfgRes.avatarSize) setAvatarSize(cardCfgRes.avatarSize);
        if (cardCfgRes.avatarShape) setAvatarShape(cardCfgRes.avatarShape);
        if (cardCfgRes.avatarBorderWidth !== undefined) setAvatarBorderWidth(cardCfgRes.avatarBorderWidth);
        if (cardCfgRes.progressBarHeight) setProgressBarHeight(cardCfgRes.progressBarHeight);
        if (cardCfgRes.bannerMessage) setBannerMessage(cardCfgRes.bannerMessage);
        if (cardCfgRes.footerMessage) setFooterMessage(cardCfgRes.footerMessage);
        if (cardCfgRes.levelUpAnnouncementTemplate) setLevelUpTemplate(cardCfgRes.levelUpAnnouncementTemplate);
        if (cardCfgRes.nameFormat) setNameFormat(cardCfgRes.nameFormat);
        if (cardCfgRes.showRankBadge !== undefined) setShowRankBadge(cardCfgRes.showRankBadge);
        if (cardCfgRes.showLevelBadge !== undefined) setShowLevelBadge(cardCfgRes.showLevelBadge);
        if (cardCfgRes.showTotalXP !== undefined) setShowTotalXP(cardCfgRes.showTotalXP);
        if (cardCfgRes.showNextLevelXP !== undefined) setShowNextLevelXP(cardCfgRes.showNextLevelXP);
        if (cardCfgRes.showPercentage !== undefined) setShowPercentage(cardCfgRes.showPercentage);
        if (cardCfgRes.bgTheme) setCardTheme(cardCfgRes.bgTheme);
        if (cardCfgRes.backgroundUrl !== undefined) setCardCustomBgUrl(cardCfgRes.backgroundUrl || '');
        if (cardCfgRes.bgOverlayOpacity !== undefined) setCardBgOpacity(cardCfgRes.bgOverlayOpacity);
        if (cardCfgRes.primaryTextColor) setCardTextColor(cardCfgRes.primaryTextColor);
        if (cardCfgRes.secondaryTextColor) setCardSecColor(cardCfgRes.secondaryTextColor);
        if (cardCfgRes.accentColor) setCardAccentColor(cardCfgRes.accentColor);
        if (cardCfgRes.accentColorEnd) setCardAccentColorEnd(cardCfgRes.accentColorEnd);
      }
      if (lbRes?.items) {
        setLeaderboard(lbRes.items);
        if (!simUserId && lbRes.items.length > 0) {
          setSimUserId(lbRes.items[0].discordUserId);
        }
      }
      if (lbRes?.realMemberCount) setRealMemberCount(lbRes.realMemberCount);
      if (lbRes?.guildName) setActiveGuildName(lbRes.guildName);
      if (lbRes?.guildIcon) setActiveGuildIcon(lbRes.guildIcon);
      if (txRes) setTransactions(txRes);
      if (srvRolesRes) setServerRoles(srvRolesRes);
      if (statsRes?.memberCount) setRealMemberCount(statsRes.memberCount);
    } catch (err) {
      console.error('Error fetching data:', err);
    }
  };

  const handleSaveCardConfig = async () => {
    try {
      const res = await fetch(`/api/guilds/${guildId}/rank-card-config`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cardWidth,
          cardHeight,
          cardRadius,
          avatarSize,
          avatarShape,
          avatarBorderWidth,
          progressBarHeight,
          bannerMessage,
          footerMessage,
          levelUpAnnouncementTemplate: levelUpTemplate,
          nameFormat,
          showRankBadge,
          showLevelBadge,
          showTotalXP,
          showNextLevelXP,
          showPercentage,
          backgroundUrl: cardCustomBgUrl,
          bgTheme: cardTheme,
          bgOverlayOpacity: cardBgOpacity,
          primaryTextColor: cardTextColor,
          secondaryTextColor: cardSecColor,
          accentColor: cardAccentColor,
          accentColorEnd: cardAccentColorEnd,
        }),
      });
      if (res.ok) {
        setCardConfigSaved(true);
        setTimeout(() => setCardConfigSaved(false), 3000);
      }
    } catch (err) {
      console.error('Error saving card config:', err);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 8000);
    return () => clearInterval(interval);
  }, [leaderboardCategory, activeGuildId]);

  const handleConnectBot = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!tokenInput.trim()) {
      setConnectMessage({ type: 'error', text: 'Please enter your Discord Bot Token.' });
      return;
    }
    setTokenConnecting(true);
    setConnectMessage(null);
    try {
      const res = await fetch('/api/bot/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: tokenInput.trim(), serverId: serverIdInput.trim() }),
      });
      const data = await res.json();
      if (data.status) setBotStatus(data.status);
      if (data.inviteUrl) setBotInviteUrl(data.inviteUrl);
      if (data.clientId) setDerivedClientId(data.clientId);
      if (data.success) {
        setConnectMessage({
          type: 'success',
          text: `Connected to Discord as ${data.status.tag || 'Bot'}! All 17 slash commands were registered to your server.`,
        });
      } else {
        setConnectMessage({
          type: 'error',
          text: 'Login failed. Please verify that your bot token is correct and that Privileged Gateway Intents (Message Content & Server Members) are enabled.',
        });
      }
      fetchData();
    } catch (err: any) {
      setConnectMessage({ type: 'error', text: `Connection error: ${err.message}` });
    } finally {
      setTokenConnecting(false);
    }
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!config) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/guilds/${guildId}/config`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
      const updated = await res.json();
      setConfig(updated);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddLevelRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoleId) return;
    try {
      await fetch(`/api/guilds/${guildId}/level-roles`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ level: newRoleLevel, roleId: newRoleId }),
      });
      setNewRoleId('');
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteLevelRole = async (level: number) => {
    try {
      await fetch(`/api/guilds/${guildId}/level-roles/${level}`, {
        method: 'DELETE',
      });
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSimulateChat = async (messageText?: string, isBot = false) => {
    const textToSend = messageText !== undefined ? messageText : simMessage;
    try {
      const res = await fetch(`/api/guilds/${guildId}/simulate-chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: simUserId,
          content: textToSend,
          isBot,
        }),
      });
      const data = await res.json();
      setSimChatResult(data);
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSimulateVoice = async () => {
    try {
      const res = await fetch(`/api/guilds/${guildId}/simulate-voice`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: simUserId,
          seconds: simVoiceSeconds,
          humanCount: simVoiceHumans,
          isSelfMuted: simMuted,
          isSelfDeafened: simDeafened,
          isAFK: simAFK,
        }),
      });
      const data = await res.json();
      setSimVoiceResult(data);
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedRenderYaml(true);
    setTimeout(() => setCopiedRenderYaml(false), 2000);
  };

  const formatHours = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${h}h ${m}m`;
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col font-sans">
      {/* Top Navigation */}
      <header className="border-b border-neutral-800 bg-neutral-900/95 backdrop-blur sticky top-0 z-50 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="font-semibold text-base text-white tracking-tight">ActivityBot</h1>
              {activeGuildName && (
                <>
                  <span className="text-neutral-600">·</span>
                  <span className="text-xs text-neutral-300 font-medium">{activeGuildName}</span>
                </>
              )}
            </div>
            <p className="text-[11px] text-neutral-400">Server Activity, XP & Level Rewards Dashboard</p>
          </div>
        </div>

        {/* Status & Actions */}
        <div className="flex items-center space-x-3 text-xs">
          <div className="flex items-center space-x-2 text-neutral-300">
            <span
              className={`w-2 h-2 rounded-full ${
                botStatus.connected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
              }`}
            />
            <span className="font-medium text-neutral-200">
              {botStatus.connected ? botStatus.tag : 'Simulator Ready'}
            </span>
            {botStatus.connected && botStatus.ping !== null && (
              <>
                <span className="text-neutral-600">·</span>
                <span className="text-neutral-400 font-mono">{botStatus.ping}ms</span>
              </>
            )}
          </div>

          <div className="h-4 w-px bg-neutral-800" />

          <button
            type="button"
            onClick={() => setActiveTab('card')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border transition text-xs font-medium ${
              activeTab === 'card'
                ? 'bg-neutral-800 text-white border-neutral-700 shadow-sm'
                : 'bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white border-neutral-800'
            }`}
          >
            <Palette className="w-3.5 h-3.5 text-indigo-400" />
            <span>Rank Card Studio</span>
          </button>

          <a
            href="https://discord.com/developers/applications"
            target="_blank"
            rel="noreferrer"
            className="hidden md:flex items-center space-x-1.5 text-xs text-neutral-400 hover:text-white bg-neutral-900 hover:bg-neutral-800 px-3 py-1.5 rounded-lg border border-neutral-800 transition"
          >
            <span>Dev Portal</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto p-4 md:p-6 gap-6">
        {/* Sidebar Nav */}
        <aside className="w-56 shrink-0 flex flex-col space-y-4">
          <div className="space-y-1">
            <span className="px-3 text-[10px] font-semibold text-neutral-500 uppercase tracking-wider">
              Management
            </span>
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg text-xs font-medium transition ${
                activeTab === 'dashboard'
                  ? 'bg-neutral-800 text-white shadow-sm'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-800/50'
              }`}
            >
              <Trophy className="w-4 h-4 text-neutral-400" />
              <span>Leaderboard</span>
            </button>

            <button
              onClick={() => setActiveTab('card')}
              className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg text-xs font-medium transition ${
                activeTab === 'card'
                  ? 'bg-neutral-800 text-white shadow-sm'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-800/50'
              }`}
            >
              <Palette className="w-4 h-4 text-neutral-400" />
              <span>Rank Card Studio</span>
            </button>

            <button
              onClick={() => setActiveTab('roles')}
              className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg text-xs font-medium transition ${
                activeTab === 'roles'
                  ? 'bg-neutral-800 text-white shadow-sm'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-800/50'
              }`}
            >
              <Award className="w-4 h-4 text-neutral-400" />
              <span>Level Roles</span>
            </button>

            <button
              onClick={() => setActiveTab('config')}
              className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg text-xs font-medium transition ${
                activeTab === 'config'
                  ? 'bg-neutral-800 text-white shadow-sm'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-800/50'
              }`}
            >
              <Sliders className="w-4 h-4 text-neutral-400" />
              <span>XP Settings</span>
            </button>
          </div>

          <div className="space-y-1">
            <span className="px-3 text-[10px] font-semibold text-neutral-500 uppercase tracking-wider">
              Diagnostics & Logs
            </span>
            <button
              onClick={() => setActiveTab('simulator')}
              className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg text-xs font-medium transition ${
                activeTab === 'simulator'
                  ? 'bg-neutral-800 text-white shadow-sm'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-800/50'
              }`}
            >
              <Terminal className="w-4 h-4 text-neutral-400" />
              <span>Activity Tester</span>
            </button>

            <button
              onClick={() => setActiveTab('ledger')}
              className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg text-xs font-medium transition ${
                activeTab === 'ledger'
                  ? 'bg-neutral-800 text-white shadow-sm'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-800/50'
              }`}
            >
              <Database className="w-4 h-4 text-neutral-400" />
              <span>XP Audit Log</span>
            </button>

            <button
              onClick={() => setActiveTab('hosting')}
              className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg text-xs font-medium transition ${
                activeTab === 'hosting'
                  ? 'bg-neutral-800 text-white shadow-sm'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-800/50'
              }`}
            >
              <Cloud className="w-4 h-4 text-neutral-400" />
              <span>Deployment Guide</span>
            </button>
          </div>

          {/* Bot Connection Widget */}
          <div className="mt-auto pt-4 border-t border-neutral-800">
            {botStatus.connected ? (
              <div className="p-3 rounded-xl bg-neutral-900/60 border border-neutral-800 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider">
                    Discord Gateway
                  </span>
                  <span className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    Online
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-7 h-7 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold text-xs">
                    {(botStatus.tag || 'B').slice(0, 2).toUpperCase()}
                  </div>
                  <div className="truncate">
                    <div className="font-semibold text-neutral-200 text-xs truncate">
                      {botStatus.tag || 'Bot'}
                    </div>
                    <div className="text-[10px] text-neutral-500 font-mono truncate">
                      {activeGuildName || 'Server'}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-neutral-900 border border-neutral-800 text-xs space-y-2">
                <div className="flex items-center gap-1.5 font-semibold text-neutral-200">
                  <Radio className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Connect Bot</span>
                </div>
                <p className="text-[11px] text-neutral-400 leading-relaxed">
                  Provide token to receive live server activity.
                </p>
                <form onSubmit={handleConnectBot} className="space-y-2">
                  <input
                    type="password"
                    value={tokenInput}
                    onChange={(e) => setTokenInput(e.target.value)}
                    placeholder="Bot Token..."
                    className="w-full px-2.5 py-1.5 rounded-lg bg-neutral-950 border border-neutral-700 text-neutral-200 placeholder-neutral-500 text-xs focus:outline-none focus:border-indigo-500 font-mono"
                  />
                  <button
                    type="submit"
                    disabled={tokenConnecting}
                    className="w-full py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs transition flex items-center justify-center space-x-1"
                  >
                    {tokenConnecting ? <RefreshCw className="w-3 h-3 animate-spin" /> : <span>Connect</span>}
                  </button>
                </form>
              </div>
            )}
          </div>
        </aside>

        {/* Tab Content Areas */}
        <main className="flex-1 overflow-y-auto">
          {/* TAB 1: DASHBOARD & LEADERBOARD */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              {/* Quick Connect Hero Banner (Token & Server ID) */}
              <div className="p-5 rounded-2xl bg-gradient-to-r from-indigo-950/70 via-neutral-900 to-neutral-900 border border-indigo-500/30 shadow-xl space-y-4">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 text-xs font-semibold flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5" />
                        Quick Connect
                      </span>
                      {botStatus.connected ? (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-semibold">
                          Connected & Active
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-400 border border-neutral-700 text-xs">
                          Ready for Setup
                        </span>
                      )}
                    </div>
                    <h2 className="text-base md:text-lg font-bold text-white mt-1">
                      Connect Bot with Token & Server ID
                    </h2>
                    <p className="text-xs text-neutral-400">
                      Paste your Bot Token and Server ID to instantly log in, register slash commands directly to your server, and generate your 1-click bot invite link.
                    </p>
                  </div>

                  {botInviteUrl && (
                    <a
                      href={botInviteUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="shrink-0 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center gap-2 shadow-lg shadow-indigo-600/30 transition"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Invite Bot to Server</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>

                <form onSubmit={handleConnectBot} className="grid grid-cols-1 md:grid-cols-12 gap-3 pt-1">
                  <div className="md:col-span-6">
                    <label className="block text-[11px] font-medium text-neutral-400 mb-1">
                      Discord Bot Token (from Discord Developer Portal &gt; Bot)
                    </label>
                    <input
                      type="password"
                      value={tokenInput}
                      onChange={(e) => setTokenInput(e.target.value)}
                      placeholder="Paste bot token (e.g. MTIzNDU2Nzg5...)"
                      className="w-full px-3 py-2 rounded-xl bg-neutral-950/80 border border-neutral-700/80 text-white text-xs font-mono placeholder-neutral-500 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div className="md:col-span-4">
                    <label className="block text-[11px] font-medium text-neutral-400 mb-1">
                      Discord Server ID (Guild ID)
                    </label>
                    <input
                      type="text"
                      value={serverIdInput}
                      onChange={(e) => setServerIdInput(e.target.value)}
                      placeholder="e.g. 123456789012345678"
                      className="w-full px-3 py-2 rounded-xl bg-neutral-950/80 border border-neutral-700/80 text-white text-xs font-mono placeholder-neutral-500 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div className="md:col-span-2 flex items-end">
                    <button
                      type="submit"
                      disabled={tokenConnecting}
                      className="w-full py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition flex items-center justify-center space-x-1.5 shadow-md shadow-indigo-600/20 disabled:opacity-50"
                    >
                      {tokenConnecting ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <span>Connect Bot</span>
                      )}
                    </button>
                  </div>
                </form>

                {connectMessage && (
                  <div
                    className={`p-3 rounded-xl text-xs font-medium flex items-center gap-2 border ${
                      connectMessage.type === 'success'
                        ? 'bg-emerald-950/40 text-emerald-300 border-emerald-800/80'
                        : 'bg-red-950/40 text-red-300 border-red-800/80'
                    }`}
                  >
                    {connectMessage.type === 'success' ? (
                      <CheckCircle className="w-4 h-4 shrink-0 text-emerald-400" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
                    )}
                    <span>{connectMessage.text}</span>
                  </div>
                )}

                {/* Checklist & Quick Tips */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1 text-[11px] text-neutral-400">
                  <div className="p-2.5 rounded-lg bg-neutral-950/60 border border-neutral-800/80 flex items-start gap-2">
                    <CheckCircle className="w-3.5 h-3.5 text-indigo-400 mt-0.5 shrink-0" />
                    <div>
                      <strong className="text-neutral-200">1. Privileged Intents:</strong> In Developer Portal &gt; Bot, enable <em>Presence</em>, <em>Server Members</em>, and <em>Message Content</em>.
                    </div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-neutral-950/60 border border-neutral-800/80 flex items-start gap-2">
                    <CheckCircle className="w-3.5 h-3.5 text-indigo-400 mt-0.5 shrink-0" />
                    <div>
                      <strong className="text-neutral-200">2. Instant Slash Commands:</strong> Providing your Server ID registers all commands to your server immediately with zero delay.
                    </div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-neutral-950/60 border border-neutral-800/80 flex items-start gap-2">
                    <CheckCircle className="w-3.5 h-3.5 text-indigo-400 mt-0.5 shrink-0" />
                    <div>
                      <strong className="text-neutral-200">3. Role Hierarchy:</strong> In Server Settings &gt; Roles, drag the Bot role above reward roles so it can assign them.
                    </div>
                  </div>
                </div>
              </div>
              {/* Stat Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-neutral-900 border border-neutral-800/80">
                  <div className="flex items-center justify-between text-neutral-400 mb-1">
                    <span className="text-xs uppercase font-semibold">Real Server Members</span>
                    <Users className="w-4 h-4 text-indigo-400" />
                  </div>
                  <div className="text-2xl font-bold text-white">{realMemberCount || leaderboard.length}</div>
                  <p className="text-xs text-neutral-500 mt-1 truncate">
                    {activeGuildName ? activeGuildName : 'Connected Discord server'}
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-neutral-900 border border-neutral-800/80">
                  <div className="flex items-center justify-between text-neutral-400 mb-1">
                    <span className="text-xs uppercase font-semibold">Top Total XP</span>
                    <Flame className="w-4 h-4 text-amber-400" />
                  </div>
                  <div className="text-2xl font-bold text-white">
                    {leaderboard[0]?.totalXP ? `${leaderboard[0].totalXP.toLocaleString()} XP` : '0 XP'}
                  </div>
                  <p className="text-xs text-neutral-500 mt-1 truncate">
                    {leaderboard[0]
                      ? `#1 ${leaderboard[0].displayName || leaderboard[0].username || 'Leader'}`
                      : 'No activity yet'}
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-neutral-900 border border-neutral-800/80">
                  <div className="flex items-center justify-between text-neutral-400 mb-1">
                    <span className="text-xs uppercase font-semibold">Level Roles</span>
                    <Award className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="text-2xl font-bold text-white">{levelRoles.length}</div>
                  <p className="text-xs text-neutral-500 mt-1">Milestones configured</p>
                </div>

                <div className="p-4 rounded-xl bg-neutral-900 border border-neutral-800/80">
                  <div className="flex items-center justify-between text-neutral-400 mb-1">
                    <span className="text-xs uppercase font-semibold">Anti-Abuse Engine</span>
                    <Shield className="w-4 h-4 text-purple-400" />
                  </div>
                  <div className="text-2xl font-bold text-emerald-400">Active</div>
                  <p className="text-xs text-neutral-500 mt-1">Burst & Levenshtein armed</p>
                </div>
              </div>

              {/* Leaderboard Section */}
              <div className="bg-neutral-900 border border-neutral-800/80 rounded-2xl p-5">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-5">
                  <div>
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                      <Trophy className="w-5 h-5 text-amber-400" />
                      <span>Server Activity Leaderboard</span>
                      {activeGuildName && (
                        <span className="px-2.5 py-0.5 rounded-full bg-neutral-800 border border-neutral-700 text-xs font-normal text-neutral-300">
                          {activeGuildName}
                        </span>
                      )}
                    </h2>
                    <p className="text-xs text-neutral-400">
                      Real-time member rankings with live XP tracking ({realMemberCount || leaderboard.length} real members)
                    </p>
                  </div>

                  {/* Category switcher */}
                  <div className="flex items-center bg-neutral-950 p-1 rounded-xl border border-neutral-800">
                    <button
                      onClick={() => setLeaderboardCategory('totalXP')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                        leaderboardCategory === 'totalXP'
                          ? 'bg-indigo-600 text-white'
                          : 'text-neutral-400 hover:text-white'
                      }`}
                    >
                      ⭐ Total XP
                    </button>
                    <button
                      onClick={() => setLeaderboardCategory('chatXP')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                        leaderboardCategory === 'chatXP'
                          ? 'bg-indigo-600 text-white'
                          : 'text-neutral-400 hover:text-white'
                      }`}
                    >
                      💬 Chat XP
                    </button>
                    <button
                      onClick={() => setLeaderboardCategory('voiceXP')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                        leaderboardCategory === 'voiceXP'
                          ? 'bg-indigo-600 text-white'
                          : 'text-neutral-400 hover:text-white'
                      }`}
                    >
                      🎙️ Voice XP
                    </button>
                  </div>

                  <button
                    onClick={() => setActiveTab('card')}
                    className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition transform hover:-translate-y-0.5"
                  >
                    <Palette className="w-3.5 h-3.5 text-amber-300" />
                    <span>🎨 Open Rank Card Studio (A to Z)</span>
                  </button>
                </div>

                {/* Leaderboard Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-neutral-800 text-xs font-semibold text-neutral-400 uppercase">
                        <th className="pb-3 px-3">Rank</th>
                        <th className="pb-3 px-3">Member</th>
                        <th className="pb-3 px-3">Level</th>
                        <th className="pb-3 px-3 text-right">
                          {leaderboardCategory === 'totalXP'
                            ? 'Total XP'
                            : leaderboardCategory === 'chatXP'
                            ? 'Chat XP'
                            : 'Voice XP'}
                        </th>
                        <th className="pb-3 px-3 text-right">Voice Time</th>
                        <th className="pb-3 px-3 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-800/60">
                      {leaderboard.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-xs text-neutral-400">
                            No member activity recorded yet. Chat in text channels or join voice to earn XP!
                          </td>
                        </tr>
                      ) : (
                        leaderboard.map((user, idx) => (
                          <tr key={user.id || user.discordUserId} className="hover:bg-neutral-800/40 transition">
                            <td className="py-3 px-3 font-bold">
                              {idx === 0 ? (
                                <span className="text-amber-400">🥇 #1</span>
                              ) : idx === 1 ? (
                                <span className="text-neutral-300">🥈 #2</span>
                              ) : idx === 2 ? (
                                <span className="text-amber-600">🥉 #3</span>
                              ) : (
                                <span className="text-neutral-500">#{idx + 1}</span>
                              )}
                            </td>
                            <td className="py-3 px-3">
                              <div className="flex items-center space-x-2.5">
                                {user.avatarUrl ? (
                                  <img
                                    src={user.avatarUrl}
                                    alt=""
                                    className="w-8 h-8 rounded-full border border-indigo-500/30 object-cover"
                                  />
                                ) : (
                                  <div className="w-8 h-8 rounded-full bg-indigo-600/30 border border-neutral-700 flex items-center justify-center font-bold text-xs text-indigo-400">
                                    {(user.displayName || user.username || user.discordUserId).slice(0, 2).toUpperCase()}
                                  </div>
                                )}
                                <div>
                                  <div className="font-semibold text-white text-xs flex items-center gap-1.5">
                                    <span>{user.displayName || user.username || `Member_${user.discordUserId.slice(-4)}`}</span>
                                    {user.isBot && (
                                      <span className="px-1 py-0.2 rounded bg-indigo-900/60 text-[9px] text-indigo-300 border border-indigo-700/50">
                                        BOT
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-[11px] text-neutral-500 font-mono">
                                    {user.username && user.username !== user.displayName ? `@${user.username} • ` : ''}ID: {user.discordUserId}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-3">
                              <span className="px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-bold">
                                Lvl {user.level}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-right font-mono font-semibold text-white">
                              {user[leaderboardCategory]?.toLocaleString() || 0} XP
                            </td>
                            <td className="py-3 px-3 text-right text-xs text-neutral-400">
                              {formatHours(user.voiceSeconds || 0)}
                            </td>
                            <td className="py-3 px-3 text-center">
                              <button
                                onClick={() => setSelectedUser(user)}
                                className="text-xs px-2.5 py-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600 border border-indigo-500/30 text-indigo-300 hover:text-white transition flex items-center gap-1.5 mx-auto font-medium"
                              >
                                <Palette className="w-3.5 h-3.5 text-amber-400" />
                                <span>Customize Card</span>
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Profile Card Inspector Modal (A to Z Customization Studio) */}
              {selectedUser && (
                <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
                  <div className="bg-neutral-900 border border-neutral-800 rounded-3xl max-w-4xl w-full p-6 shadow-2xl my-auto max-h-[94vh] overflow-y-auto">
                    <RankCardStudio
                      guildId={guildId}
                      users={leaderboard}
                      previewUser={selectedUser}
                      onSelectUser={(u) => setSelectedUser(u)}
                      onClose={() => setSelectedUser(null)}
                      isModal={true}
                      studioTab={studioTab}
                      setStudioTab={setStudioTab}
                      cardTheme={cardTheme}
                      setCardTheme={setCardTheme}
                      cardCustomBgUrl={cardCustomBgUrl}
                      setCardCustomBgUrl={setCardCustomBgUrl}
                      cardBgOpacity={cardBgOpacity}
                      setCardBgOpacity={setCardBgOpacity}
                      cardWidth={cardWidth}
                      setCardWidth={setCardWidth}
                      cardHeight={cardHeight}
                      setCardHeight={setCardHeight}
                      cardRadius={cardRadius}
                      setCardRadius={setCardRadius}
                      avatarSize={avatarSize}
                      setAvatarSize={setAvatarSize}
                      avatarShape={avatarShape}
                      setAvatarShape={setAvatarShape}
                      avatarBorderWidth={avatarBorderWidth}
                      setAvatarBorderWidth={setAvatarBorderWidth}
                      progressBarHeight={progressBarHeight}
                      setProgressBarHeight={setProgressBarHeight}
                      bannerMessage={bannerMessage}
                      setBannerMessage={setBannerMessage}
                      footerMessage={footerMessage}
                      setFooterMessage={setFooterMessage}
                      levelUpTemplate={levelUpTemplate}
                      setLevelUpTemplate={setLevelUpTemplate}
                      nameFormat={nameFormat}
                      setNameFormat={setNameFormat}
                      showRankBadge={showRankBadge}
                      setShowRankBadge={setShowRankBadge}
                      showLevelBadge={showLevelBadge}
                      setShowLevelBadge={setShowLevelBadge}
                      showTotalXP={showTotalXP}
                      setShowTotalXP={setShowTotalXP}
                      showNextLevelXP={showNextLevelXP}
                      setShowNextLevelXP={setShowNextLevelXP}
                      showPercentage={showPercentage}
                      setShowPercentage={setShowPercentage}
                      cardTextColor={cardTextColor}
                      setCardTextColor={setCardTextColor}
                      cardSecColor={cardSecColor}
                      setCardSecColor={setCardSecColor}
                      cardAccentColor={cardAccentColor}
                      setCardAccentColor={setCardAccentColor}
                      cardAccentColorEnd={cardAccentColorEnd}
                      setCardAccentColorEnd={setCardAccentColorEnd}
                      cardIsLevelUpPreview={cardIsLevelUpPreview}
                      setCardIsLevelUpPreview={setCardIsLevelUpPreview}
                      cardConfigSaved={cardConfigSaved}
                      onSave={handleSaveCardConfig}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB: RANK CARD STUDIO (DEDICATED FULL-PAGE VIEW) */}
          {activeTab === 'card' && (
            <RankCardStudio
              guildId={guildId}
              users={leaderboard}
              previewUser={selectedUser || leaderboard[0] || null}
              onSelectUser={(u) => setSelectedUser(u)}
              isModal={false}
              studioTab={studioTab}
              setStudioTab={setStudioTab}
              cardTheme={cardTheme}
              setCardTheme={setCardTheme}
              cardCustomBgUrl={cardCustomBgUrl}
              setCardCustomBgUrl={setCardCustomBgUrl}
              cardBgOpacity={cardBgOpacity}
              setCardBgOpacity={setCardBgOpacity}
              cardWidth={cardWidth}
              setCardWidth={setCardWidth}
              cardHeight={cardHeight}
              setCardHeight={setCardHeight}
              cardRadius={cardRadius}
              setCardRadius={setCardRadius}
              avatarSize={avatarSize}
              setAvatarSize={setAvatarSize}
              avatarShape={avatarShape}
              setAvatarShape={setAvatarShape}
              avatarBorderWidth={avatarBorderWidth}
              setAvatarBorderWidth={setAvatarBorderWidth}
              progressBarHeight={progressBarHeight}
              setProgressBarHeight={setProgressBarHeight}
              bannerMessage={bannerMessage}
              setBannerMessage={setBannerMessage}
              footerMessage={footerMessage}
              setFooterMessage={setFooterMessage}
              levelUpTemplate={levelUpTemplate}
              setLevelUpTemplate={setLevelUpTemplate}
              nameFormat={nameFormat}
              setNameFormat={setNameFormat}
              showRankBadge={showRankBadge}
              setShowRankBadge={setShowRankBadge}
              showLevelBadge={showLevelBadge}
              setShowLevelBadge={setShowLevelBadge}
              showTotalXP={showTotalXP}
              setShowTotalXP={setShowTotalXP}
              showNextLevelXP={showNextLevelXP}
              setShowNextLevelXP={setShowNextLevelXP}
              showPercentage={showPercentage}
              setShowPercentage={setShowPercentage}
              cardTextColor={cardTextColor}
              setCardTextColor={setCardTextColor}
              cardSecColor={cardSecColor}
              setCardSecColor={setCardSecColor}
              cardAccentColor={cardAccentColor}
              setCardAccentColor={setCardAccentColor}
              cardAccentColorEnd={cardAccentColorEnd}
              setCardAccentColorEnd={setCardAccentColorEnd}
              cardIsLevelUpPreview={cardIsLevelUpPreview}
              setCardIsLevelUpPreview={setCardIsLevelUpPreview}
              cardConfigSaved={cardConfigSaved}
              onSave={handleSaveCardConfig}
            />
          )}

          {/* TAB 2: LEVEL ROLES MANAGER */}
          {activeTab === 'roles' && (
            <div className="space-y-6">
              <div className="bg-neutral-900 border border-neutral-800/80 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                      <Award className="w-5 h-5 text-indigo-400" />
                      Customizable Level-Role Rewards
                    </h2>
                    <p className="text-xs text-neutral-400">
                      Configure milestones that automatically grant Discord roles when members level up.
                    </p>
                  </div>

                  {/* Setting Toggle for Remove Previous Roles */}
                  {config && (
                    <div className="flex items-center space-x-2 bg-neutral-950 p-2 rounded-xl border border-neutral-800 text-xs">
                      <span className="text-neutral-400">Remove Previous Roles:</span>
                      <button
                        type="button"
                        onClick={async () => {
                          const next = !config.removePreviousLevelRoles;
                          setConfig({ ...config, removePreviousLevelRoles: next });
                          await fetch(`/api/guilds/${guildId}/config`, {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ removePreviousLevelRoles: next }),
                          });
                        }}
                        className={`px-2.5 py-1 rounded-lg font-semibold transition ${
                          config.removePreviousLevelRoles
                            ? 'bg-amber-600 text-white'
                            : 'bg-neutral-800 text-neutral-400'
                        }`}
                      >
                        {config.removePreviousLevelRoles ? 'Enabled (Single Highest)' : 'Disabled (Stacking)'}
                      </button>
                    </div>
                  )}
                </div>

                {/* Add Milestone Form */}
                <form
                  onSubmit={handleAddLevelRole}
                  className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-xl bg-neutral-950 border border-neutral-800 mb-6"
                >
                  <div>
                    <label className="block text-xs font-medium text-neutral-400 mb-1">
                      Required Level
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="1000"
                      value={newRoleLevel}
                      onChange={(e) => setNewRoleLevel(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-lg bg-neutral-900 border border-neutral-700 text-white text-sm focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-neutral-400 mb-1">
                      Discord Server Role {serverRoles.length > 0 && `(${serverRoles.length} roles found)`}
                    </label>
                    {serverRoles.length > 0 ? (
                      <select
                        value={newRoleId}
                        onChange={(e) => setNewRoleId(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-neutral-900 border border-neutral-700 text-white text-sm focus:outline-none focus:border-indigo-500"
                      >
                        <option value="">-- Select Server Role --</option>
                        {serverRoles.map((r) => (
                          <option key={r.id} value={r.id}>
                            @{r.name}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        placeholder="Enter Discord Role ID..."
                        value={newRoleId}
                        onChange={(e) => setNewRoleId(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-neutral-900 border border-neutral-700 text-white text-sm focus:outline-none focus:border-indigo-500"
                      />
                    )}
                  </div>

                  <div className="flex items-end">
                    <button
                      type="submit"
                      disabled={!newRoleId}
                      className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-semibold transition flex items-center justify-center space-x-1.5 disabled:opacity-50"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add Milestone</span>
                    </button>
                  </div>
                </form>

                {/* Configured Milestones List */}
                <div className="space-y-3">
                  <h3 className="text-xs uppercase tracking-wider font-semibold text-neutral-400">
                    Active Milestones ({levelRoles.length})
                  </h3>

                  {levelRoles.length === 0 ? (
                    <div className="text-center py-8 text-neutral-500 text-sm">
                      No level role milestones configured yet. Select a role above or use{' '}
                      <code>/levelrole add</code> in Discord.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {levelRoles.map((role) => {
                        const matchingRole = serverRoles.find((sr) => sr.id === role.roleId);
                        return (
                          <div
                            key={role.id}
                            className="flex items-center justify-between p-3.5 rounded-xl bg-neutral-950 border border-neutral-800 hover:border-neutral-700 transition"
                          >
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center font-bold text-indigo-400 text-sm">
                                L{role.level}
                              </div>
                              <div>
                                <div className="font-semibold text-white text-sm">
                                  Level {role.level} Reward
                                </div>
                                <div className="text-xs text-neutral-400 font-mono flex items-center gap-1.5">
                                  {matchingRole?.color && matchingRole.color !== '#000000' && (
                                    <span
                                      className="w-2.5 h-2.5 rounded-full inline-block"
                                      style={{ backgroundColor: matchingRole.color }}
                                    />
                                  )}
                                  <span>Role: @{matchingRole ? matchingRole.name : role.roleId}</span>
                                </div>
                              </div>
                            </div>

                            <button
                              onClick={() => handleDeleteLevelRole(role.level)}
                              className="p-2 text-neutral-500 hover:text-red-400 hover:bg-neutral-900 rounded-lg transition"
                              title="Delete Milestone"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: XP CONFIGURATION */}
          {activeTab === 'config' && config && (
            <div className="space-y-5">
              {/* Rank Card Visual Studio Banner */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl bg-neutral-900 border border-neutral-800">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <Palette className="w-4 h-4 text-indigo-400" />
                    <h3 className="text-sm font-semibold text-white">
                      Rank Card Visual Design & Layout
                    </h3>
                  </div>
                  <p className="text-xs text-neutral-400">
                    Customize Discord card dimensions, avatar styling, celebration banners, wallpapers, and colors.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('card')}
                  className="px-3.5 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 hover:text-white border border-neutral-700 text-xs font-medium transition flex items-center gap-1.5 shrink-0"
                >
                  <span>Open Studio</span>
                  <ChevronRight className="w-3.5 h-3.5 text-neutral-400" />
                </button>
              </div>

              <form onSubmit={handleSaveConfig} className="space-y-5">
                {/* Chat XP Settings */}
                <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 space-y-4">
                  <div className="border-b border-neutral-800/80 pb-3">
                    <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-indigo-400" />
                      <span>Chat Activity Settings</span>
                    </h3>
                    <p className="text-xs text-neutral-400 mt-0.5">
                      Configure XP yields and anti-spam cooldowns for text channel messages.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                        Minimum Chat XP / Message
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={config.chatXPMin}
                        onChange={(e) => setConfig({ ...config, chatXPMin: Number(e.target.value) })}
                        className="w-full px-3 py-2 rounded-lg bg-neutral-950 border border-neutral-800 text-neutral-100 text-xs focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                        Maximum Chat XP / Message
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={config.chatXPMax}
                        onChange={(e) => setConfig({ ...config, chatXPMax: Number(e.target.value) })}
                        className="w-full px-3 py-2 rounded-lg bg-neutral-950 border border-neutral-800 text-neutral-100 text-xs focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                        Message Cooldown (Seconds)
                      </label>
                      <input
                        type="number"
                        min="5"
                        value={config.chatCooldownSeconds}
                        onChange={(e) =>
                          setConfig({ ...config, chatCooldownSeconds: Number(e.target.value) })
                        }
                        className="w-full px-3 py-2 rounded-lg bg-neutral-950 border border-neutral-800 text-neutral-100 text-xs focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                      />
                    </div>
                  </div>
                </div>

                {/* Voice XP Settings */}
                <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 space-y-4">
                  <div className="border-b border-neutral-800/80 pb-3">
                    <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                      <Mic className="w-4 h-4 text-emerald-400" />
                      <span>Voice Channel Activity Settings</span>
                    </h3>
                    <p className="text-xs text-neutral-400 mt-0.5">
                      Reward members for active voice participation and enforce verification gates.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                        XP per Interval
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={config.voiceXPPerInterval}
                        onChange={(e) =>
                          setConfig({ ...config, voiceXPPerInterval: Number(e.target.value) })
                        }
                        className="w-full px-3 py-2 rounded-lg bg-neutral-950 border border-neutral-800 text-neutral-100 text-xs focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                        Interval Duration (Seconds)
                      </label>
                      <input
                        type="number"
                        min="10"
                        value={config.voiceIntervalSeconds}
                        onChange={(e) =>
                          setConfig({ ...config, voiceIntervalSeconds: Number(e.target.value) })
                        }
                        className="w-full px-3 py-2 rounded-lg bg-neutral-950 border border-neutral-800 text-neutral-100 text-xs focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                        Minimum Session (Seconds)
                      </label>
                      <input
                        type="number"
                        min="30"
                        value={config.minimumVoiceSessionSeconds}
                        onChange={(e) =>
                          setConfig({ ...config, minimumVoiceSessionSeconds: Number(e.target.value) })
                        }
                        className="w-full px-3 py-2 rounded-lg bg-neutral-950 border border-neutral-800 text-neutral-100 text-xs focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
                    <div>
                      <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                        Required Humans in Channel
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={config.minimumVoiceParticipants}
                        onChange={(e) =>
                          setConfig({ ...config, minimumVoiceParticipants: Number(e.target.value) })
                        }
                        className="w-full px-3 py-2 rounded-lg bg-neutral-950 border border-neutral-800 text-neutral-100 text-xs focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                      />
                      <p className="text-[11px] text-neutral-500 mt-1">Excludes bots</p>
                    </div>

                    <div className="flex items-center space-x-2.5 pt-6">
                      <input
                        type="checkbox"
                        id="selfDeafen"
                        checked={config.selfDeafenBlocksXP}
                        onChange={(e) =>
                          setConfig({ ...config, selfDeafenBlocksXP: e.target.checked })
                        }
                        className="w-4 h-4 rounded text-indigo-600 bg-neutral-950 border-neutral-700"
                      />
                      <label htmlFor="selfDeafen" className="text-xs text-neutral-300 font-medium cursor-pointer">
                        Deafened members earn 0 XP
                      </label>
                    </div>

                    <div className="flex items-center space-x-2.5 pt-6">
                      <input
                        type="checkbox"
                        id="selfMute"
                        checked={config.selfMuteBlocksXP}
                        onChange={(e) =>
                          setConfig({ ...config, selfMuteBlocksXP: e.target.checked })
                        }
                        className="w-4 h-4 rounded text-indigo-600 bg-neutral-950 border-neutral-700"
                      />
                      <label htmlFor="selfMute" className="text-xs text-neutral-300 font-medium cursor-pointer">
                        Muted members earn 0 XP
                      </label>
                    </div>
                  </div>
                </div>

                {/* Anti-Farming & Daily Limits */}
                <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 space-y-4">
                  <div className="border-b border-neutral-800/80 pb-3">
                    <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                      <Shield className="w-4 h-4 text-purple-400" />
                      <span>Daily Activity Caps & Anti-Farming</span>
                    </h3>
                    <p className="text-xs text-neutral-400 mt-0.5">
                      Prevent farming and configure daily XP caps and diminishing returns.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                        Daily Chat XP Limit (0 = No Cap)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={config.dailyChatXPLimit}
                        onChange={(e) =>
                          setConfig({ ...config, dailyChatXPLimit: Math.max(0, Number(e.target.value)) })
                        }
                        className="w-full px-3 py-2 rounded-lg bg-neutral-950 border border-neutral-800 text-neutral-100 text-xs focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                      />
                      <p className="text-[11px] text-neutral-500 mt-1">
                        {config.dailyChatXPLimit === 0 ? 'No daily cap configured' : `Max ${config.dailyChatXPLimit.toLocaleString()} XP per day`}
                      </p>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                        Daily Voice XP Limit (0 = No Cap)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={config.dailyVoiceXPLimit}
                        onChange={(e) =>
                          setConfig({ ...config, dailyVoiceXPLimit: Math.max(0, Number(e.target.value)) })
                        }
                        className="w-full px-3 py-2 rounded-lg bg-neutral-950 border border-neutral-800 text-neutral-100 text-xs focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                      />
                      <p className="text-[11px] text-neutral-500 mt-1">
                        {config.dailyVoiceXPLimit === 0 ? 'No daily cap configured' : `Max ${config.dailyVoiceXPLimit.toLocaleString()} XP per day`}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                    <div className="flex items-center space-x-2.5 pt-6">
                      <input
                        type="checkbox"
                        id="diminishing"
                        checked={config.diminishingReturnsEnabled}
                        onChange={(e) =>
                          setConfig({ ...config, diminishingReturnsEnabled: e.target.checked })
                        }
                        className="w-4 h-4 rounded text-indigo-600 bg-neutral-950 border-neutral-700"
                      />
                      <label htmlFor="diminishing" className="text-xs text-neutral-300 font-medium cursor-pointer">
                        Enable Diminishing Returns for High Daily Volume
                      </label>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                        Diminishing Returns Threshold (XP)
                      </label>
                      <input
                        type="number"
                        min="100"
                        value={config.diminishingReturnsThreshold}
                        onChange={(e) =>
                          setConfig({ ...config, diminishingReturnsThreshold: Number(e.target.value) })
                        }
                        className="w-full px-3 py-2 rounded-lg bg-neutral-950 border border-neutral-800 text-neutral-100 text-xs focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  {saveSuccess ? (
                    <span className="text-emerald-400 text-xs flex items-center gap-1.5 font-medium">
                      <CheckCircle className="w-4 h-4" /> Settings updated successfully
                    </span>
                  ) : <div />}
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold transition shadow-sm disabled:opacity-50"
                  >
                    {loading ? 'Saving Changes...' : 'Save Settings'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 4: EVENT & ANTI-ABUSE SIMULATOR */}
          {activeTab === 'simulator' && (
            <div className="space-y-6">
              <div className="bg-neutral-900 border border-neutral-800/80 rounded-2xl p-6">
                <div className="mb-4">
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <Terminal className="w-5 h-5 text-indigo-400" />
                    Interactive Activity & Anti-Abuse Playground
                  </h2>
                  <p className="text-xs text-neutral-400">
                    Directly test Chat & Voice algorithms in real time. Watch anti-spam, duplicate checks,
                    cooldowns, and atomic database mutations execute live!
                  </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Chat Activity Simulator */}
                  <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-4">
                    <h3 className="font-semibold text-white text-sm flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-indigo-400" />
                      Chat XP Simulation
                    </h3>

                    <div>
                      <label className="block text-xs font-medium text-neutral-400 mb-1">
                        Message Content
                      </label>
                      <input
                        type="text"
                        value={simMessage}
                        onChange={(e) => setSimMessage(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-neutral-900 border border-neutral-700 text-white text-sm"
                      />
                    </div>

                    {/* Quick Test Triggers */}
                    <div className="space-y-1.5">
                      <span className="text-[11px] text-neutral-500 font-semibold uppercase">
                        Quick Edge-Case Tests:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleSimulateChat('Great discussion in the development channel!')}
                          className="text-xs px-2.5 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300"
                        >
                          Valid Message
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSimulateChat(simMessage)}
                          className="text-xs px-2.5 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-amber-300"
                        >
                          Duplicate / Repeat
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSimulateChat('hi')}
                          className="text-xs px-2.5 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300"
                        >
                          Short Message (&lt; 3 chars)
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSimulateChat('/setup')}
                          className="text-xs px-2.5 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300"
                        >
                          Command Invocations
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSimulateChat('Beep boop', true)}
                          className="text-xs px-2.5 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-purple-300"
                        >
                          Bot Author
                        </button>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleSimulateChat()}
                      className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold transition"
                    >
                      Send Message Event
                    </button>

                    {simChatResult && (
                      <div
                        className={`p-3 rounded-lg border text-xs font-mono space-y-1 ${
                          simChatResult.awarded
                            ? 'bg-emerald-950/40 border-emerald-800/80 text-emerald-300'
                            : 'bg-red-950/40 border-red-800/80 text-red-300'
                        }`}
                      >
                        <div className="font-bold flex items-center gap-1.5">
                          {simChatResult.awarded ? (
                            <>
                              <CheckCircle className="w-3.5 h-3.5" />
                              <span>XP AWARDED: +{simChatResult.amount} XP</span>
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3.5 h-3.5" />
                              <span>BLOCKED: {simChatResult.reason}</span>
                            </>
                          )}
                        </div>
                        {simChatResult.awarded && (
                          <div className="text-[11px] text-neutral-400">
                            Base: {simChatResult.baseXP} XP | Multiplier: {simChatResult.multiplier}x |
                            Total: {simChatResult.awardResult?.newXP} XP
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Voice Activity Simulator */}
                  <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-4">
                    <h3 className="font-semibold text-white text-sm flex items-center gap-2">
                      <Mic className="w-4 h-4 text-emerald-400" />
                      Voice VC Simulation
                    </h3>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-neutral-400 mb-1">
                          Session Duration (sec)
                        </label>
                        <input
                          type="number"
                          value={simVoiceSeconds}
                          onChange={(e) => setSimVoiceSeconds(Number(e.target.value))}
                          className="w-full px-3 py-2 rounded-lg bg-neutral-900 border border-neutral-700 text-white text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-neutral-400 mb-1">
                          Human Count in VC
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={simVoiceHumans}
                          onChange={(e) => setSimVoiceHumans(Number(e.target.value))}
                          className="w-full px-3 py-2 rounded-lg bg-neutral-900 border border-neutral-700 text-white text-sm"
                        />
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-4 text-xs pt-1">
                      <label className="flex items-center space-x-1.5">
                        <input
                          type="checkbox"
                          checked={simMuted}
                          onChange={(e) => setSimMuted(e.target.checked)}
                          className="w-3.5 h-3.5 rounded text-indigo-600"
                        />
                        <span className="text-neutral-300">Self-Muted</span>
                      </label>
                      <label className="flex items-center space-x-1.5">
                        <input
                          type="checkbox"
                          checked={simDeafened}
                          onChange={(e) => setSimDeafened(e.target.checked)}
                          className="w-3.5 h-3.5 rounded text-indigo-600"
                        />
                        <span className="text-neutral-300">Self-Deafened</span>
                      </label>
                      <label className="flex items-center space-x-1.5">
                        <input
                          type="checkbox"
                          checked={simAFK}
                          onChange={(e) => setSimAFK(e.target.checked)}
                          className="w-3.5 h-3.5 rounded text-indigo-600"
                        />
                        <span className="text-neutral-300">In AFK Channel</span>
                      </label>
                    </div>

                    <button
                      type="button"
                      onClick={handleSimulateVoice}
                      className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold transition"
                    >
                      Process Voice Session
                    </button>

                    {simVoiceResult && (
                      <div
                        className={`p-3 rounded-lg border text-xs font-mono space-y-1 ${
                          simVoiceResult.awarded
                            ? 'bg-emerald-950/40 border-emerald-800/80 text-emerald-300'
                            : 'bg-red-950/40 border-red-800/80 text-red-300'
                        }`}
                      >
                        <div className="font-bold flex items-center gap-1.5">
                          {simVoiceResult.awarded ? (
                            <>
                              <CheckCircle className="w-3.5 h-3.5" />
                              <span>VOICE XP AWARDED: +{simVoiceResult.amount} XP</span>
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3.5 h-3.5" />
                              <span>BLOCKED: {simVoiceResult.reason}</span>
                            </>
                          )}
                        </div>
                        {simVoiceResult.awarded && (
                          <div className="text-[11px] text-neutral-400">
                            Duration: {simVoiceResult.durationSeconds}s | Multiplier:{' '}
                            {simVoiceResult.multiplier}x
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: XP AUDIT LEDGER */}
          {activeTab === 'ledger' && (
            <div className="bg-neutral-900 border border-neutral-800/80 rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <Database className="w-5 h-5 text-indigo-400" />
                    Immutable XP Transaction Ledger
                  </h2>
                  <p className="text-xs text-neutral-400">
                    Every XP increment is logged with source, reason, and atomic timestamp.
                  </p>
                </div>
                <button
                  onClick={fetchData}
                  className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-xs text-white transition flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Refresh</span>
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-neutral-800 text-neutral-400 uppercase font-semibold">
                      <th className="pb-3 px-3">Timestamp</th>
                      <th className="pb-3 px-3">User</th>
                      <th className="pb-3 px-3">Source</th>
                      <th className="pb-3 px-3 text-right">Amount</th>
                      <th className="pb-3 px-3">Reason / Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-800/60 font-mono">
                    {transactions.map((tx) => (
                      <tr key={tx.id} className="hover:bg-neutral-800/40 transition">
                        <td className="py-2.5 px-3 text-neutral-500">
                          {new Date(tx.createdAt).toLocaleTimeString()}
                        </td>
                        <td className="py-2.5 px-3 text-white">User_{tx.userId.slice(-6)}</td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              tx.source === 'CHAT'
                                ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                                : tx.source === 'VOICE'
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                : 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                            }`}
                          >
                            {tx.source}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold text-emerald-400">
                          +{tx.amount} XP
                        </td>
                        <td className="py-2.5 px-3 text-neutral-300 font-sans">{tx.reason}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 6: 24/7 HOSTING GUIDE */}
          {activeTab === 'hosting' && (
            <div className="space-y-6">
              <div className="bg-neutral-900 border border-neutral-800/80 rounded-2xl p-6 space-y-6">
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <Cloud className="w-5 h-5 text-indigo-400" />
                    24/7 Free Hosting on Render
                  </h2>
                  <p className="text-xs text-neutral-400">
                    Host Activity Engine with zero cost on Render using the included Blueprint config.
                  </p>
                </div>

                <div className="space-y-4 text-xs leading-relaxed text-neutral-300">
                  <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-2">
                    <h4 className="font-bold text-white text-sm flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs">
                        1
                      </span>
                      Push Code to GitHub
                    </h4>
                    <p className="text-neutral-400">
                      Commit this repository to GitHub or GitLab. The project already includes{' '}
                      <code>render.yaml</code>, <code>Dockerfile</code>, health check route at{' '}
                      <code>/health</code>, and Prisma migrations.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-2">
                    <h4 className="font-bold text-white text-sm flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs">
                        2
                      </span>
                      Deploy via Render Blueprints
                    </h4>
                    <p className="text-neutral-400">
                      Log in to <a href="https://dashboard.render.com" target="_blank" rel="noreferrer" className="text-indigo-400 underline">Render.com</a>, click <strong>New +</strong> &gt; <strong>Blueprint</strong>, and select your repository. Render automatically provisions:
                    </p>
                    <ul className="list-disc list-inside text-neutral-400 space-y-1 pl-2">
                      <li>Free Web Service running Node.js + Express + Discord Gateway</li>
                      <li>Free PostgreSQL Database with automatic <code>DATABASE_URL</code> injection</li>
                      <li>Automated uptime health checking at <code>/health</code></li>
                    </ul>
                  </div>

                  <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-2">
                    <h4 className="font-bold text-white text-sm flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs">
                        3
                      </span>
                      Set Discord Environment Variables
                    </h4>
                    <p className="text-neutral-400">
                      In Render Service &gt; Environment, provide:
                    </p>
                    <div className="p-2.5 rounded bg-neutral-900 font-mono text-[11px] text-neutral-300 space-y-1">
                      <div>DISCORD_TOKEN=your_token_from_developer_portal</div>
                      <div>DISCORD_CLIENT_ID=your_client_id</div>
                    </div>
                  </div>
                </div>

                {/* render.yaml copy box */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                      Included render.yaml
                    </span>
                    <button
                      onClick={() =>
                        copyToClipboard(`services:
  - type: web
    name: activity-engine
    env: node
    plan: free
    buildCommand: npm install && npm run build
    startCommand: npm run start
    healthCheckPath: /health
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 3000
      - key: DISCORD_TOKEN
        sync: false
      - key: DISCORD_CLIENT_ID
        sync: false
      - key: DATABASE_URL
        fromDatabase:
          name: activity-engine-db
          property: connectionString

databases:
  - name: activity-engine-db
    plan: free
    databaseName: activity_engine
    user: activity_engine_user`)
                      }
                      className="text-xs px-2.5 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 flex items-center gap-1 transition"
                    >
                      {copiedRenderYaml ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedRenderYaml ? 'Copied!' : 'Copy YAML'}</span>
                    </button>
                  </div>
                  <pre className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800 text-[11px] font-mono text-neutral-300 overflow-x-auto">
{`services:
  - type: web
    name: activity-engine
    env: node
    plan: free
    buildCommand: npm install && npm run build
    startCommand: npm run start
    healthCheckPath: /health
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 3000
      - key: DISCORD_TOKEN
        sync: false
      - key: DISCORD_CLIENT_ID
        sync: false
      - key: DATABASE_URL
        fromDatabase:
          name: activity-engine-db
          property: connectionString

databases:
  - name: activity-engine-db
    plan: free
    databaseName: activity_engine
    user: activity_engine_user`}
                  </pre>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
