import React, { useState } from 'react';
import {
  Palette,
  Sparkles,
  Maximize2,
  Type,
  Image as ImageIcon,
  Save,
  Check,
  CheckCircle,
  ExternalLink,
  Users,
} from 'lucide-react';
import type { UserItem } from '../App.js';

interface RankCardStudioProps {
  guildId: string;
  users: UserItem[];
  previewUser: UserItem | null;
  onSelectUser: (user: UserItem | null) => void;
  onClose?: () => void;
  isModal?: boolean;

  // Customizer state & setters
  studioTab: 'image' | 'size' | 'msg' | 'color';
  setStudioTab: (tab: 'image' | 'size' | 'msg' | 'color') => void;

  cardTheme: string;
  setCardTheme: (t: string) => void;
  cardCustomBgUrl: string;
  setCardCustomBgUrl: (url: string) => void;
  cardBgOpacity: number;
  setCardBgOpacity: (op: number) => void;

  cardWidth: number;
  setCardWidth: (w: number) => void;
  cardHeight: number;
  setCardHeight: (h: number) => void;
  cardRadius: number;
  setCardRadius: (r: number) => void;
  avatarSize: number;
  setAvatarSize: (s: number) => void;
  avatarShape: 'circle' | 'square' | 'hexagon';
  setAvatarShape: (s: 'circle' | 'square' | 'hexagon') => void;
  avatarBorderWidth: number;
  setAvatarBorderWidth: (b: number) => void;
  progressBarHeight: number;
  setProgressBarHeight: (h: number) => void;

  bannerMessage: string;
  setBannerMessage: (m: string) => void;
  footerMessage: string;
  setFooterMessage: (m: string) => void;
  levelUpTemplate: string;
  setLevelUpTemplate: (t: string) => void;
  nameFormat: 'both' | 'display' | 'username';
  setNameFormat: (f: 'both' | 'display' | 'username') => void;
  showRankBadge: boolean;
  setShowRankBadge: (v: boolean) => void;
  showLevelBadge: boolean;
  setShowLevelBadge: (v: boolean) => void;
  showTotalXP: boolean;
  setShowTotalXP: (v: boolean) => void;
  showNextLevelXP: boolean;
  setShowNextLevelXP: (v: boolean) => void;
  showPercentage: boolean;
  setShowPercentage: (v: boolean) => void;

  cardTextColor: string;
  setCardTextColor: (c: string) => void;
  cardSecColor: string;
  setCardSecColor: (c: string) => void;
  cardAccentColor: string;
  setCardAccentColor: (c: string) => void;
  cardAccentColorEnd: string;
  setCardAccentColorEnd: (c: string) => void;
  cardIsLevelUpPreview: boolean;
  setCardIsLevelUpPreview: (v: boolean) => void;

  cardConfigSaved: boolean;
  onSave: () => void;
}

export const RankCardStudio: React.FC<RankCardStudioProps> = ({
  guildId,
  users,
  previewUser,
  onSelectUser,
  onClose,
  isModal = false,
  studioTab,
  setStudioTab,
  cardTheme,
  setCardTheme,
  cardCustomBgUrl,
  setCardCustomBgUrl,
  cardBgOpacity,
  setCardBgOpacity,
  cardWidth,
  setCardWidth,
  cardHeight,
  setCardHeight,
  cardRadius,
  setCardRadius,
  avatarSize,
  setAvatarSize,
  avatarShape,
  setAvatarShape,
  avatarBorderWidth,
  setAvatarBorderWidth,
  progressBarHeight,
  setProgressBarHeight,
  bannerMessage,
  setBannerMessage,
  footerMessage,
  setFooterMessage,
  levelUpTemplate,
  setLevelUpTemplate,
  nameFormat,
  setNameFormat,
  showRankBadge,
  setShowRankBadge,
  showLevelBadge,
  setShowLevelBadge,
  showTotalXP,
  setShowTotalXP,
  showNextLevelXP,
  setShowNextLevelXP,
  showPercentage,
  setShowPercentage,
  cardTextColor,
  setCardTextColor,
  cardSecColor,
  setCardSecColor,
  cardAccentColor,
  setCardAccentColor,
  cardAccentColorEnd,
  setCardAccentColorEnd,
  cardIsLevelUpPreview,
  setCardIsLevelUpPreview,
  cardConfigSaved,
  onSave,
}) => {
  // If no user is explicitly selected, fall back to the top user or a placeholder
  const activeUser = previewUser || users[0] || {
    id: 'placeholder',
    discordUserId: '758169660369403916',
    username: 'rohan',
    displayName: 'R O H A N ツ',
    avatarUrl: undefined,
    level: 14,
    totalXP: 14850,
    chatXP: 9200,
    voiceXP: 5650,
    voiceSeconds: 24500,
    rank: 1,
  };

  const previewParams = new URLSearchParams({
    theme: cardTheme,
    bg: cardCustomBgUrl,
    bgOverlayOpacity: String(cardBgOpacity),
    width: String(cardWidth),
    height: String(cardHeight),
    radius: String(cardRadius),
    avatarSize: String(avatarSize),
    avatarShape,
    avatarBorderWidth: String(avatarBorderWidth),
    progressBarHeight: String(progressBarHeight),
    bannerMessage,
    footerMessage,
    nameFormat,
    showRankBadge: String(showRankBadge),
    showLevelBadge: String(showLevelBadge),
    showTotalXP: String(showTotalXP),
    showNextLevelXP: String(showNextLevelXP),
    showPercentage: String(showPercentage),
    textColor: cardTextColor,
    secColor: cardSecColor,
    accentColor: cardAccentColor,
    accentColorEnd: cardAccentColorEnd,
    levelup: cardIsLevelUpPreview ? 'true' : 'false',
  });

  const cardImageUrl = `/api/guilds/${guildId}/users/${activeUser.discordUserId}/card?${previewParams.toString()}`;

  const formatHours = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${h}h ${m}m`;
  };

  return (
    <div className={`space-y-6 ${isModal ? '' : 'bg-neutral-900 border border-neutral-800/80 rounded-2xl p-6'}`}>
      {/* Studio Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-neutral-800 pb-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <Palette className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-semibold text-white text-base">
              Rank Card Visual Studio
            </h2>
            <p className="text-xs text-neutral-400">
              Customize card dimensions, avatar styling, level-up banners, wallpapers, and colors
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2.5 w-full sm:w-auto justify-end">
          <button
            type="button"
            onClick={onSave}
            className={`px-3.5 py-2 rounded-lg text-xs font-medium flex items-center gap-1.5 transition ${
              cardConfigSaved
                ? 'bg-emerald-600 text-white'
                : 'bg-indigo-600 hover:bg-indigo-500 text-white'
            }`}
          >
            {cardConfigSaved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            <span>{cardConfigSaved ? 'Saved as Default' : 'Save Default Style'}</span>
          </button>

          {isModal && onClose && (
            <button
              onClick={onClose}
              className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-xl transition text-base"
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* Member Preview Selector & Mini Profile Bar */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-4 rounded-2xl bg-neutral-950/70 border border-neutral-800/80">
        <div className="flex items-center space-x-3.5">
          {activeUser.avatarUrl ? (
            <img
              src={activeUser.avatarUrl}
              alt=""
              className="w-12 h-12 rounded-2xl border border-indigo-500/40 object-cover"
            />
          ) : (
            <div className="w-12 h-12 rounded-2xl bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-lg font-bold text-indigo-400">
              {(activeUser.displayName || activeUser.username || activeUser.discordUserId || 'U').slice(0, 2).toUpperCase()}
            </div>
          )}
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-white text-sm">
                {activeUser.displayName || activeUser.username || `Member_${activeUser.discordUserId.slice(-4)}`}
              </span>
              {activeUser.username && (
                <span className="text-[11px] text-neutral-400">@{activeUser.username}</span>
              )}
            </div>
            <p className="text-xs text-neutral-400">
              Server Rank: #{activeUser.rank || '1'} • Level {activeUser.level} • {activeUser.totalXP.toLocaleString()} XP
            </p>
          </div>
        </div>

        {/* Member Selector Dropdown */}
        {users.length > 0 && (
          <div className="flex items-center space-x-2 text-xs">
            <span className="text-neutral-400 flex items-center gap-1">
              <Users className="w-3.5 h-3.5" />
              Preview with Member:
            </span>
            <select
              value={activeUser.discordUserId}
              onChange={(e) => {
                const found = users.find((u) => u.discordUserId === e.target.value);
                if (found) onSelectUser(found);
              }}
              className="px-3 py-1.5 rounded-xl bg-neutral-900 border border-neutral-700 text-white text-xs focus:outline-none focus:border-indigo-500"
            >
              {users.map((u) => (
                <option key={u.discordUserId} value={u.discordUserId}>
                  #{u.rank || '1'} {u.displayName || u.username} (Lvl {u.level})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* LIVE IMAGE PREVIEW CANVAS */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-neutral-300 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Live Rendered Discord Rank Card ({cardWidth} × {cardHeight} px)</span>
          </span>
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => setCardIsLevelUpPreview(!cardIsLevelUpPreview)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition flex items-center gap-1.5 ${
                cardIsLevelUpPreview
                  ? 'bg-amber-500/10 text-amber-300 border-amber-500/40'
                  : 'bg-neutral-800 text-neutral-400 border-neutral-700 hover:text-white'
              }`}
            >
              <span>{cardIsLevelUpPreview ? 'Celebration Banner: Enabled' : 'Celebration Banner: Disabled'}</span>
            </button>
            <a
              href={cardImageUrl}
              target="_blank"
              rel="noreferrer"
              className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white border border-neutral-700 text-xs font-medium transition flex items-center gap-1.5"
            >
              <span>Full PNG</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        <div className="rounded-xl overflow-hidden border border-neutral-800 bg-neutral-950 p-2 relative flex items-center justify-center min-h-[180px]">
          <img
            key={`${activeUser.discordUserId}-${cardTheme}-${cardCustomBgUrl}-${cardBgOpacity}-${cardWidth}-${cardHeight}-${cardRadius}-${avatarSize}-${avatarShape}-${avatarBorderWidth}-${progressBarHeight}-${bannerMessage}-${footerMessage}-${nameFormat}-${showRankBadge}-${showLevelBadge}-${showTotalXP}-${showNextLevelXP}-${showPercentage}-${cardTextColor}-${cardSecColor}-${cardAccentColor}-${cardAccentColorEnd}-${cardIsLevelUpPreview}`}
            src={cardImageUrl}
            alt="Visual Rank Card"
            className="w-full h-auto rounded-lg object-contain shadow-md max-h-[340px]"
            loading="eager"
          />
        </div>
      </div>

      {/* STUDIO TABS NAVIGATION */}
      <div className="flex border-b border-neutral-800 gap-1 pb-1">
        {[
          { id: 'image', label: 'Background & Themes', icon: ImageIcon },
          { id: 'size', label: 'Layout & Dimensions', icon: Maximize2 },
          { id: 'msg', label: 'Labels & Announcements', icon: Type },
          { id: 'color', label: 'Color Palette', icon: Palette },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setStudioTab(tab.id as any)}
              className={`px-3 py-2 rounded-lg text-xs font-medium transition flex items-center gap-1.5 ${
                studioTab === tab.id
                  ? 'bg-neutral-800 text-white border border-neutral-700 shadow-sm'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-800/50'
              }`}
            >
              <Icon className="w-3.5 h-3.5 text-neutral-400" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* STUDIO CONTROLS PANELS */}
      <div className="p-4 rounded-2xl bg-neutral-950/70 border border-neutral-800/80">
        {/* TAB 1: BACKGROUND & WALLPAPERS */}
        {studioTab === 'image' && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                Theme Presets
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
                {[
                  { id: 'midnight', label: 'Midnight' },
                  { id: 'cyberpunk', label: 'Cyberpunk' },
                  { id: 'nebula', label: 'Nebula' },
                  { id: 'sunset', label: 'Sunset' },
                  { id: 'emerald', label: 'Emerald' },
                  { id: 'matrix', label: 'Matrix' },
                  { id: 'gold', label: 'Royal Gold' },
                ].map((thm) => (
                  <button
                    key={thm.id}
                    type="button"
                    onClick={() => {
                      setCardTheme(thm.id);
                      setCardCustomBgUrl('');
                    }}
                    className={`px-2.5 py-1.5 rounded-xl text-xs font-medium border transition text-center truncate ${
                      cardTheme === thm.id && !cardCustomBgUrl
                        ? 'bg-indigo-600/30 border-indigo-500 text-white shadow-md shadow-indigo-500/20'
                        : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white'
                    }`}
                  >
                    {thm.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Curated Wallpaper Backgrounds */}
            <div className="space-y-1.5">
              <span className="block text-xs font-semibold text-neutral-300">
                Curated Wallpapers (Click to Apply):
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
                {[
                  {
                    name: 'Galaxy Nebula',
                    url: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?w=934&q=80',
                  },
                  {
                    name: 'Cyber City',
                    url: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=934&q=80',
                  },
                  {
                    name: 'Dark Abstract',
                    url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=934&q=80',
                  },
                  {
                    name: 'Northern Aurora',
                    url: 'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=934&q=80',
                  },
                  {
                    name: 'Dark Synthwave',
                    url: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=934&q=80',
                  },
                  {
                    name: 'Neon Arcade',
                    url: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=934&q=80',
                  },
                ].map((wp) => (
                  <button
                    key={wp.name}
                    type="button"
                    onClick={() => setCardCustomBgUrl(wp.url)}
                    className={`relative group rounded-xl overflow-hidden border transition text-left h-14 ${
                      cardCustomBgUrl === wp.url
                        ? 'border-indigo-500 ring-2 ring-indigo-500/40'
                        : 'border-neutral-800 hover:border-neutral-600'
                    }`}
                  >
                    <img
                      src={wp.url}
                      alt={wp.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition"
                    />
                    <span className="absolute inset-0 bg-black/45 flex items-center justify-center text-[10px] font-bold text-white drop-shadow text-center px-1">
                      {wp.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Image URL & Dimming Slider */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">
                  Custom Background Wallpaper Image URL:
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    placeholder="https://example.com/wallpaper.jpg"
                    value={cardCustomBgUrl}
                    onChange={(e) => setCardCustomBgUrl(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-700 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-indigo-500"
                  />
                  {cardCustomBgUrl && (
                    <button
                      type="button"
                      onClick={() => setCardCustomBgUrl('')}
                      className="px-2.5 py-1 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between text-xs font-semibold text-neutral-300 mb-1">
                  <span>Background Scrim / Darkness Overlay:</span>
                  <span className="font-mono text-indigo-400">{Math.round(cardBgOpacity * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.10"
                  max="0.95"
                  step="0.05"
                  value={cardBgOpacity}
                  onChange={(e) => setCardBgOpacity(Number(e.target.value))}
                  className="w-full accent-indigo-500"
                />
                <p className="text-[11px] text-neutral-500 mt-1">
                  Higher opacity ensures text and avatar remain 100% legible over bright wallpapers.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: SIZES & DIMENSIONS */}
        {studioTab === 'size' && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                Card Dimension Presets
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: 'Standard Discord (934 × 282)', w: 934, h: 282 },
                  { label: 'Compact Banner (800 × 240)', w: 800, h: 240 },
                  { label: 'Cinematic Wide (1020 × 300)', w: 1020, h: 300 },
                ].map((sz) => (
                  <button
                    key={sz.label}
                    type="button"
                    onClick={() => {
                      setCardWidth(sz.w);
                      setCardHeight(sz.h);
                    }}
                    className={`px-3 py-2 rounded-xl text-xs font-medium border transition ${
                      cardWidth === sz.w && cardHeight === sz.h
                        ? 'bg-indigo-600/30 border-indigo-500 text-white'
                        : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white'
                    }`}
                  >
                    {sz.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-1">
              <div className="p-3 rounded-xl bg-neutral-900/60 border border-neutral-800">
                <div className="flex justify-between text-xs font-medium text-neutral-300 mb-1">
                  <span>Card Width</span>
                  <span className="font-mono text-indigo-400">{cardWidth}px</span>
                </div>
                <input
                  type="range"
                  min="650"
                  max="1200"
                  step="10"
                  value={cardWidth}
                  onChange={(e) => setCardWidth(Number(e.target.value))}
                  className="w-full accent-indigo-500"
                />
              </div>

              <div className="p-3 rounded-xl bg-neutral-900/60 border border-neutral-800">
                <div className="flex justify-between text-xs font-medium text-neutral-300 mb-1">
                  <span>Card Height</span>
                  <span className="font-mono text-indigo-400">{cardHeight}px</span>
                </div>
                <input
                  type="range"
                  min="200"
                  max="380"
                  step="10"
                  value={cardHeight}
                  onChange={(e) => setCardHeight(Number(e.target.value))}
                  className="w-full accent-indigo-500"
                />
              </div>

              <div className="p-3 rounded-xl bg-neutral-900/60 border border-neutral-800">
                <div className="flex justify-between text-xs font-medium text-neutral-300 mb-1">
                  <span>Card Corner Radius</span>
                  <span className="font-mono text-indigo-400">{cardRadius}px</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="36"
                  step="2"
                  value={cardRadius}
                  onChange={(e) => setCardRadius(Number(e.target.value))}
                  className="w-full accent-indigo-500"
                />
              </div>

              <div className="p-3 rounded-xl bg-neutral-900/60 border border-neutral-800">
                <div className="flex justify-between text-xs font-medium text-neutral-300 mb-1">
                  <span>Avatar Size</span>
                  <span className="font-mono text-indigo-400">{avatarSize * 2}px</span>
                </div>
                <input
                  type="range"
                  min="40"
                  max="85"
                  step="5"
                  value={avatarSize}
                  onChange={(e) => setAvatarSize(Number(e.target.value))}
                  className="w-full accent-indigo-500"
                />
              </div>

              <div className="p-3 rounded-xl bg-neutral-900/60 border border-neutral-800">
                <span className="block text-xs font-medium text-neutral-300 mb-1.5">Avatar Shape</span>
                <div className="grid grid-cols-3 gap-1">
                  {[
                    { id: 'circle', label: '⚪ Circle' },
                    { id: 'square', label: '🔲 Squircle' },
                    { id: 'hexagon', label: '⬡ Hexagon' },
                  ].map((shp) => (
                    <button
                      key={shp.id}
                      type="button"
                      onClick={() => setAvatarShape(shp.id as any)}
                      className={`py-1 text-[11px] rounded-lg border font-medium ${
                        avatarShape === shp.id
                          ? 'bg-indigo-600/30 border-indigo-500 text-white'
                          : 'bg-neutral-900 border-neutral-800 text-neutral-400'
                      }`}
                    >
                      {shp.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-neutral-900/60 border border-neutral-800">
                <div className="flex justify-between text-xs font-medium text-neutral-300 mb-1">
                  <span>Avatar Border Thickness</span>
                  <span className="font-mono text-indigo-400">{avatarBorderWidth}px</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="10"
                  step="1"
                  value={avatarBorderWidth}
                  onChange={(e) => setAvatarBorderWidth(Number(e.target.value))}
                  className="w-full accent-indigo-500"
                />
              </div>

              <div className="p-3 rounded-xl bg-neutral-900/60 border border-neutral-800">
                <div className="flex justify-between text-xs font-medium text-neutral-300 mb-1">
                  <span>Progress Bar Thickness</span>
                  <span className="font-mono text-indigo-400">{progressBarHeight}px</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="36"
                  step="2"
                  value={progressBarHeight}
                  onChange={(e) => setProgressBarHeight(Number(e.target.value))}
                  className="w-full accent-indigo-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: MESSAGES & TEXT */}
        {studioTab === 'msg' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">
                  Celebration Banner Text:
                </label>
                <input
                  type="text"
                  value={bannerMessage}
                  onChange={(e) => setBannerMessage(e.target.value)}
                  placeholder="e.g. 🎉 LEVEL UP! or 🚀 LEVEL UNLOCKED!"
                  className="w-full px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-700 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-indigo-500"
                />
                <p className="text-[11px] text-neutral-500 mt-1">
                  Displayed in the top pill badge during announcements.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">
                  Card Footer Subtitle:
                </label>
                <input
                  type="text"
                  value={footerMessage}
                  onChange={(e) => setFooterMessage(e.target.value)}
                  placeholder="e.g. ⭐ Activity Engine • 300 Levels Milestone Progression"
                  className="w-full px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-700 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-indigo-500"
                />
                <p className="text-[11px] text-neutral-500 mt-1">
                  Displayed along the bottom edge of the rank card.
                </p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1">
                Discord Message Announcement Template:
              </label>
              <input
                type="text"
                value={levelUpTemplate}
                onChange={(e) => setLevelUpTemplate(e.target.value)}
                placeholder="🎉 Congratulations {user} on reaching **Level {level}**!"
                className="w-full px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-700 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-indigo-500 font-mono"
              />
              <div className="flex flex-wrap gap-2 text-[11px] text-neutral-400 mt-1.5">
                <span>Available Variables:</span>
                <code className="px-1.5 py-0.5 rounded bg-neutral-800 text-indigo-300">{'{user}'}</code>
                <code className="px-1.5 py-0.5 rounded bg-neutral-800 text-indigo-300">{'{username}'}</code>
                <code className="px-1.5 py-0.5 rounded bg-neutral-800 text-indigo-300">{'{level}'}</code>
                <code className="px-1.5 py-0.5 rounded bg-neutral-800 text-indigo-300">{'{rank}'}</code>
                <code className="px-1.5 py-0.5 rounded bg-neutral-800 text-indigo-300">{'{totalXP}'}</code>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                  Member Name Display Style
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { id: 'both', label: 'Display + @Tag' },
                    { id: 'display', label: 'Display Only' },
                    { id: 'username', label: '@Username Only' },
                  ].map((fmt) => (
                    <button
                      key={fmt.id}
                      type="button"
                      onClick={() => setNameFormat(fmt.id as any)}
                      className={`py-1.5 px-2 rounded-xl border text-xs font-medium text-center truncate ${
                        nameFormat === fmt.id
                          ? 'bg-indigo-600/30 border-indigo-500 text-white'
                          : 'bg-neutral-900 border-neutral-800 text-neutral-400'
                      }`}
                    >
                      {fmt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                  Visible Elements
                </label>
                <div className="flex flex-wrap gap-3 text-xs">
                  <label className="flex items-center space-x-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showTotalXP}
                      onChange={(e) => setShowTotalXP(e.target.checked)}
                      className="w-3.5 h-3.5 rounded text-indigo-600"
                    />
                    <span className="text-neutral-300">Total XP</span>
                  </label>
                  <label className="flex items-center space-x-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showNextLevelXP}
                      onChange={(e) => setShowNextLevelXP(e.target.checked)}
                      className="w-3.5 h-3.5 rounded text-indigo-600"
                    />
                    <span className="text-neutral-300">Next XP</span>
                  </label>
                  <label className="flex items-center space-x-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showPercentage}
                      onChange={(e) => setShowPercentage(e.target.checked)}
                      className="w-3.5 h-3.5 rounded text-indigo-600"
                    />
                    <span className="text-neutral-300">Percentage</span>
                  </label>
                  <label className="flex items-center space-x-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showRankBadge}
                      onChange={(e) => setShowRankBadge(e.target.checked)}
                      className="w-3.5 h-3.5 rounded text-indigo-600"
                    />
                    <span className="text-neutral-300">Rank Badge</span>
                  </label>
                  <label className="flex items-center space-x-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showLevelBadge}
                      onChange={(e) => setShowLevelBadge(e.target.checked)}
                      className="w-3.5 h-3.5 rounded text-indigo-600"
                    />
                    <span className="text-neutral-300">Level Badge</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: COLORS & GRADIENTS */}
        {studioTab === 'color' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-3.5 rounded-2xl bg-neutral-900/60 border border-neutral-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-neutral-300">Primary Text Color</span>
                  <span className="text-[11px] font-mono text-neutral-400">{cardTextColor}</span>
                </div>
                <div className="flex items-center gap-2">
                  {['#ffffff', '#fef08a', '#86efac', '#7dd3fc', '#f472b6', '#fed7aa'].map((col) => (
                    <button
                      key={col}
                      type="button"
                      onClick={() => setCardTextColor(col)}
                      className={`w-7 h-7 rounded-full border-2 transition ${
                        cardTextColor === col
                          ? 'border-indigo-500 scale-110 shadow-md shadow-indigo-500/30'
                          : 'border-transparent hover:scale-105'
                      }`}
                      style={{ backgroundColor: col }}
                    />
                  ))}
                  <input
                    type="color"
                    value={cardTextColor}
                    onChange={(e) => setCardTextColor(e.target.value)}
                    className="w-7 h-7 rounded-full cursor-pointer bg-transparent border border-neutral-700"
                  />
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-neutral-900/60 border border-neutral-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-neutral-300">Secondary Text Color</span>
                  <span className="text-[11px] font-mono text-neutral-400">{cardSecColor}</span>
                </div>
                <div className="flex items-center gap-2">
                  {['#94a3b8', '#64748b', '#cbd5e1', '#a1a1aa', '#facc15', '#38bdf8'].map((col) => (
                    <button
                      key={col}
                      type="button"
                      onClick={() => setCardSecColor(col)}
                      className={`w-7 h-7 rounded-full border-2 transition ${
                        cardSecColor === col
                          ? 'border-indigo-500 scale-110 shadow-md shadow-indigo-500/30'
                          : 'border-transparent hover:scale-105'
                      }`}
                      style={{ backgroundColor: col }}
                    />
                  ))}
                  <input
                    type="color"
                    value={cardSecColor}
                    onChange={(e) => setCardSecColor(e.target.value)}
                    className="w-7 h-7 rounded-full cursor-pointer bg-transparent border border-neutral-700"
                  />
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-neutral-900/60 border border-neutral-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-neutral-300">Progress Bar Start Color</span>
                  <span className="text-[11px] font-mono text-neutral-400">{cardAccentColor}</span>
                </div>
                <div className="flex items-center gap-2">
                  {['#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'].map((col) => (
                    <button
                      key={col}
                      type="button"
                      onClick={() => setCardAccentColor(col)}
                      className={`w-7 h-7 rounded-full border-2 transition ${
                        cardAccentColor === col
                          ? 'border-white scale-110 shadow-md shadow-white/30'
                          : 'border-transparent hover:scale-105'
                      }`}
                      style={{ backgroundColor: col }}
                    />
                  ))}
                  <input
                    type="color"
                    value={cardAccentColor}
                    onChange={(e) => setCardAccentColor(e.target.value)}
                    className="w-7 h-7 rounded-full cursor-pointer bg-transparent border border-neutral-700"
                  />
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-neutral-900/60 border border-neutral-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-neutral-300">Progress Bar End Color</span>
                  <span className="text-[11px] font-mono text-neutral-400">{cardAccentColorEnd}</span>
                </div>
                <div className="flex items-center gap-2">
                  {['#a855f7', '#3b82f6', '#14b8a6', '#eab308', '#f43f5e', '#d946ef'].map((col) => (
                    <button
                      key={col}
                      type="button"
                      onClick={() => setCardAccentColorEnd(col)}
                      className={`w-7 h-7 rounded-full border-2 transition ${
                        cardAccentColorEnd === col
                          ? 'border-white scale-110 shadow-md shadow-white/30'
                          : 'border-transparent hover:scale-105'
                      }`}
                      style={{ backgroundColor: col }}
                    />
                  ))}
                  <input
                    type="color"
                    value={cardAccentColorEnd}
                    onChange={(e) => setCardAccentColorEnd(e.target.value)}
                    className="w-7 h-7 rounded-full cursor-pointer bg-transparent border border-neutral-700"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => {
                  setCardTheme('midnight');
                  setCardCustomBgUrl('');
                  setCardBgOpacity(0.75);
                  setCardWidth(934);
                  setCardHeight(282);
                  setCardRadius(24);
                  setAvatarSize(65);
                  setAvatarShape('circle');
                  setAvatarBorderWidth(4);
                  setProgressBarHeight(22);
                  setBannerMessage('🎉 LEVEL UP!');
                  setFooterMessage('⭐ Activity Engine • 300 Levels Milestone Progression');
                  setLevelUpTemplate('🎉 Congratulations {user} on reaching **Level {level}**!');
                  setNameFormat('both');
                  setShowRankBadge(true);
                  setShowLevelBadge(true);
                  setShowTotalXP(true);
                  setShowNextLevelXP(true);
                  setShowPercentage(true);
                  setCardTextColor('#ffffff');
                  setCardSecColor('#94a3b8');
                  setCardAccentColor('#6366f1');
                  setCardAccentColorEnd('#a855f7');
                  setCardIsLevelUpPreview(false);
                }}
                className="text-xs text-neutral-500 hover:text-neutral-300 transition"
              >
                Reset All Customizations to Default
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Footer Banner */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-neutral-800">
        <div className="text-xs text-neutral-400">
          {cardConfigSaved ? (
            <span className="text-emerald-400 font-semibold flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4" />
              Settings saved! Level-ups and /rank in Discord will automatically use this custom rank card.
            </span>
          ) : (
            <span>Click <strong>"Save as Server Default"</strong> to apply this card design across all Discord level-up announcements.</span>
          )}
        </div>
        <button
          type="button"
          onClick={onSave}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition flex items-center gap-1.5 shadow-md shadow-indigo-600/20"
        >
          <Save className="w-4 h-4" />
          <span>Save as Server Default</span>
        </button>
      </div>
    </div>
  );
};
