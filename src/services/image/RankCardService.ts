import { createCanvas, loadImage } from '@napi-rs/canvas';

export interface RankCardOptions {
  username: string;
  displayName: string;
  avatarUrl?: string | null;
  level: number;
  rank: number | string;
  currentLevelXP: number;
  nextLevelXP: number;
  totalXP: number;
  percentage: number;
  isLevelUp?: boolean;
  roleRewardName?: string | null;

  // SIZES (A to Z)
  cardWidth?: number; // default 934
  cardHeight?: number; // default 282
  cardRadius?: number; // default 24
  avatarSize?: number; // default 65 (radius)
  avatarShape?: 'circle' | 'square' | 'hexagon'; // default 'circle'
  avatarBorderWidth?: number; // default 4
  progressBarHeight?: number; // default 22
  progressBarRadius?: number; // default 11

  // MESSAGES & TEXT (A to Z)
  bannerMessage?: string | null;
  footerMessage?: string | null;
  nameFormat?: 'both' | 'display' | 'username';
  showRankBadge?: boolean;
  showLevelBadge?: boolean;
  showTotalXP?: boolean;
  showNextLevelXP?: boolean;
  showPercentage?: boolean;

  // IMAGES & COLORS (A to Z)
  backgroundUrl?: string | null;
  bgTheme?: string | null;
  bgOverlayOpacity?: number; // default 0.75 (0.1 to 0.95)
  primaryTextColor?: string | null;
  secondaryTextColor?: string | null;
  accentColor?: string | null;
  accentColorEnd?: string | null;
}

export class RankCardService {
  /**
   * Generates a fully customized visual Rank Card PNG buffer from A to Z
   */
  public async generateRankCard(options: RankCardOptions): Promise<Buffer> {
    const {
      username,
      displayName,
      avatarUrl,
      level,
      rank,
      currentLevelXP,
      nextLevelXP,
      totalXP,
      percentage,
      isLevelUp = false,
      roleRewardName,

      // Sizes
      cardWidth = 934,
      cardHeight = 282,
      cardRadius = 24,
      avatarSize = 65,
      avatarShape = 'circle',
      avatarBorderWidth = 4,
      progressBarHeight = 22,
      progressBarRadius = 11,

      // Messages
      bannerMessage,
      footerMessage,
      nameFormat = 'both',
      showRankBadge = true,
      showLevelBadge = true,
      showTotalXP = true,
      showNextLevelXP = true,
      showPercentage = true,

      // Visuals & Colors
      backgroundUrl,
      bgTheme = 'midnight',
      bgOverlayOpacity = 0.75,
      primaryTextColor = '#ffffff',
      secondaryTextColor = '#94a3b8',
      accentColor = '#6366f1',
      accentColorEnd,
    } = options;

    const width = Math.max(600, Math.min(1400, cardWidth));
    const height = Math.max(200, Math.min(600, cardHeight));
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    const activeTextColor = primaryTextColor || '#ffffff';
    const activeSecColor = secondaryTextColor || '#94a3b8';
    const activeAccent = accentColor || '#6366f1';
    const activeAccentEnd = accentColorEnd || (isLevelUp ? '#eab308' : '#a855f7');
    const overlayOpacity = Math.max(0.1, Math.min(0.98, bgOverlayOpacity));

    // 1. Base dark canvas background
    ctx.fillStyle = '#0b0d14';
    ctx.fillRect(0, 0, width, height);

    // 2. Custom Background Image or Procedural Theme
    let customBgLoaded = false;
    if (backgroundUrl && (backgroundUrl.startsWith('http://') || backgroundUrl.startsWith('https://'))) {
      try {
        const bgImg = await loadImage(backgroundUrl);
        ctx.save();
        const imgRatio = bgImg.width / bgImg.height;
        const canvasRatio = width / height;
        let sWidth = bgImg.width;
        let sHeight = bgImg.height;
        let sX = 0;
        let sY = 0;

        if (imgRatio > canvasRatio) {
          sWidth = bgImg.height * canvasRatio;
          sX = (bgImg.width - sWidth) / 2;
        } else {
          sHeight = bgImg.width / canvasRatio;
          sY = (bgImg.height - sHeight) / 2;
        }

        ctx.drawImage(bgImg, sX, sY, sWidth, sHeight, 0, 0, width, height);

        // Dark overlay scrim based on user opacity setting
        ctx.fillStyle = `rgba(11, 13, 20, ${overlayOpacity})`;
        ctx.fillRect(0, 0, width, height);
        ctx.restore();
        customBgLoaded = true;
      } catch (err) {
        // Fallback to procedural theme below
      }
    }

    if (!customBgLoaded) {
      ctx.save();
      if (bgTheme === 'cyberpunk') {
        const grad = ctx.createLinearGradient(0, 0, width, height);
        grad.addColorStop(0, '#1a062f');
        grad.addColorStop(0.5, '#0c0d1c');
        grad.addColorStop(1, '#051d2f');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);

        ctx.strokeStyle = 'rgba(236, 72, 153, 0.12)';
        ctx.lineWidth = 1;
        for (let x = 0; x < width; x += 40) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, height);
          ctx.stroke();
        }
      } else if (bgTheme === 'nebula') {
        const grad = ctx.createLinearGradient(0, 0, width, height);
        grad.addColorStop(0, '#150a2e');
        grad.addColorStop(1, '#090816');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);

        const neb = ctx.createRadialGradient(width * 0.3, height * 0.4, 20, width * 0.3, height * 0.4, width * 0.4);
        neb.addColorStop(0, 'rgba(168, 85, 247, 0.30)');
        neb.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = neb;
        ctx.fillRect(0, 0, width, height);
      } else if (bgTheme === 'sunset') {
        const grad = ctx.createLinearGradient(0, 0, width, height);
        grad.addColorStop(0, '#2e0a1a');
        grad.addColorStop(0.5, '#170c1c');
        grad.addColorStop(1, '#090914');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);
      } else if (bgTheme === 'emerald') {
        const grad = ctx.createLinearGradient(0, 0, width, height);
        grad.addColorStop(0, '#042216');
        grad.addColorStop(1, '#06110d');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);
      } else if (bgTheme === 'matrix') {
        const grad = ctx.createLinearGradient(0, 0, width, height);
        grad.addColorStop(0, '#021a0f');
        grad.addColorStop(1, '#030805');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);
      } else if (bgTheme === 'gold') {
        const grad = ctx.createLinearGradient(0, 0, width, height);
        grad.addColorStop(0, '#2b1d04');
        grad.addColorStop(0.5, '#151006');
        grad.addColorStop(1, '#0c0b07');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);
      } else {
        // Midnight default
        const grad = ctx.createLinearGradient(0, 0, width, height);
        grad.addColorStop(0, '#0f121d');
        grad.addColorStop(1, '#07080e');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);
      }
      ctx.restore();

      // Ambient radial accents
      const glow1 = ctx.createRadialGradient(avatarSize * 2, height / 2, 10, avatarSize * 2, height / 2, width * 0.3);
      glow1.addColorStop(0, isLevelUp ? 'rgba(234, 179, 8, 0.25)' : activeAccent + '33');
      glow1.addColorStop(1, 'rgba(11, 13, 20, 0)');
      ctx.fillStyle = glow1;
      ctx.fillRect(0, 0, width, height);
    }

    // 3. Card inner container with rounded corners and border
    const cardX = 14;
    const cardY = 14;
    const cardW = width - 28;
    const cardH = height - 28;
    const cRadius = Math.max(0, Math.min(48, cardRadius));

    ctx.save();
    ctx.beginPath();
    ctx.roundRect(cardX, cardY, cardW, cardH, cRadius);
    ctx.fillStyle = customBgLoaded ? `rgba(18, 21, 32, ${overlayOpacity})` : '#121520';
    ctx.fill();

    const cardGrad = ctx.createLinearGradient(cardX, cardY, cardX + cardW, cardY + cardH);
    cardGrad.addColorStop(0, 'rgba(255, 255, 255, 0.04)');
    cardGrad.addColorStop(1, 'rgba(0, 0, 0, 0.35)');
    ctx.fillStyle = cardGrad;
    ctx.fill();

    ctx.lineWidth = 2;
    ctx.strokeStyle = isLevelUp ? 'rgba(234, 179, 8, 0.7)' : activeAccent + '66';
    ctx.stroke();
    ctx.restore();

    // 4. Banner Message (Celebration or Custom Banner)
    const showBanner = isLevelUp || Boolean(bannerMessage);
    const effectiveBannerText = bannerMessage || (isLevelUp ? '🎉 LEVEL UP!' : '');

    let bannerOffsetRight = 0;
    if (showBanner && effectiveBannerText) {
      ctx.save();
      ctx.font = 'bold 13px sans-serif';
      const bMetrics = ctx.measureText(effectiveBannerText);
      const bannerW = Math.max(120, bMetrics.width + 32);
      const bannerH = 32;
      const bannerX = width - cardX - bannerW - 16;
      const bannerY = cardY + 16;

      ctx.beginPath();
      ctx.roundRect(bannerX, bannerY, bannerW, bannerH, 16);
      const bGrad = ctx.createLinearGradient(bannerX, bannerY, bannerX + bannerW, bannerY);
      if (isLevelUp) {
        bGrad.addColorStop(0, '#f59e0b');
        bGrad.addColorStop(1, '#eab308');
        ctx.fillStyle = bGrad;
      } else {
        bGrad.addColorStop(0, activeAccent);
        bGrad.addColorStop(1, activeAccentEnd);
        ctx.fillStyle = bGrad;
      }
      ctx.fill();

      ctx.fillStyle = isLevelUp ? '#0b0d14' : '#ffffff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(effectiveBannerText, bannerX + bannerW / 2, bannerY + bannerH / 2);
      ctx.restore();

      bannerOffsetRight = bannerW + 14;
    }

    // 5. Avatar drawing with custom shape and size
    const avatarCenterX = cardX + 18 + avatarSize;
    const avatarCenterY = height / 2;
    const avRadius = Math.max(30, Math.min(100, avatarSize));
    const bWidth = Math.max(0, Math.min(12, avatarBorderWidth));

    const drawAvatarPath = (radius: number) => {
      ctx.beginPath();
      if (avatarShape === 'square') {
        ctx.roundRect(
          avatarCenterX - radius,
          avatarCenterY - radius,
          radius * 2,
          radius * 2,
          Math.max(8, radius * 0.3)
        );
      } else if (avatarShape === 'hexagon') {
        for (let i = 0; i < 6; i++) {
          const angle = (Math.PI / 3) * i - Math.PI / 6;
          const x = avatarCenterX + radius * Math.cos(angle);
          const y = avatarCenterY + radius * Math.sin(angle);
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();
      } else {
        // default circle
        ctx.arc(avatarCenterX, avatarCenterY, radius, 0, Math.PI * 2);
      }
    };

    // Avatar glowing ring
    if (bWidth > 0) {
      ctx.save();
      drawAvatarPath(avRadius + bWidth);
      const ringGrad = ctx.createLinearGradient(
        avatarCenterX - avRadius,
        avatarCenterY - avRadius,
        avatarCenterX + avRadius,
        avatarCenterY + avRadius
      );
      if (isLevelUp) {
        ringGrad.addColorStop(0, '#eab308');
        ringGrad.addColorStop(1, '#f59e0b');
      } else {
        ringGrad.addColorStop(0, activeAccent);
        ringGrad.addColorStop(1, activeAccentEnd);
      }
      ctx.strokeStyle = ringGrad;
      ctx.lineWidth = bWidth;
      ctx.stroke();
      ctx.restore();
    }

    // Draw avatar image or fallback
    let avatarDrawn = false;
    if (avatarUrl) {
      try {
        let fetchUrl = avatarUrl;
        if (fetchUrl.includes('.webp')) {
          fetchUrl = fetchUrl.replace('.webp', '.png');
        }
        if (!fetchUrl.includes('?')) {
          fetchUrl += '?size=256';
        }
        const img = await loadImage(fetchUrl);
        ctx.save();
        drawAvatarPath(avRadius);
        ctx.clip();
        ctx.drawImage(
          img,
          avatarCenterX - avRadius,
          avatarCenterY - avRadius,
          avRadius * 2,
          avRadius * 2
        );
        ctx.restore();
        avatarDrawn = true;
      } catch (imgErr) {
        // fallback
      }
    }

    if (!avatarDrawn) {
      ctx.save();
      drawAvatarPath(avRadius);
      ctx.fillStyle = '#1e2235';
      ctx.fill();

      ctx.fillStyle = activeAccent;
      ctx.font = `bold ${Math.round(avRadius * 0.55)}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const initials = (displayName || username || 'U').slice(0, 2).toUpperCase();
      ctx.fillText(initials, avatarCenterX, avatarCenterY);
      ctx.restore();
    }

    // 6. User Names (Display Name & Handle)
    const contentStartX = avatarCenterX + avRadius + 22;
    const topRowY = cardY + 28;

    ctx.save();
    ctx.font = 'bold 28px sans-serif';
    ctx.fillStyle = activeTextColor;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';

    let cleanDisplayName = displayName || username || 'Member';
    if (nameFormat === 'username' && username) {
      cleanDisplayName = username;
    }
    if (cleanDisplayName.length > 22) {
      cleanDisplayName = cleanDisplayName.slice(0, 21) + '…';
    }
    ctx.fillText(cleanDisplayName, contentStartX, topRowY);

    const nameMetrics = ctx.measureText(cleanDisplayName);

    if (nameFormat === 'both' && username && username !== displayName) {
      ctx.font = '500 15px sans-serif';
      ctx.fillStyle = activeSecColor;
      ctx.fillText(`@${username}`, contentStartX + nameMetrics.width + 12, topRowY + 10);
    }
    ctx.restore();

    // 7. Badges (Rank & Level) on right
    let currentRightEdge = width - cardX - 20 - bannerOffsetRight;

    ctx.save();
    // Level Badge Pill
    if (showLevelBadge) {
      const lvlText = `LEVEL ${level}`;
      ctx.font = 'bold 15px sans-serif';
      const lvlMetrics = ctx.measureText(lvlText);
      const lvlPillW = lvlMetrics.width + 24;
      const lvlPillH = 32;
      const lvlPillX = currentRightEdge - lvlPillW;
      const lvlPillY = cardY + 24;

      ctx.beginPath();
      ctx.roundRect(lvlPillX, lvlPillY, lvlPillW, lvlPillH, 16);
      const lvlGrad = ctx.createLinearGradient(lvlPillX, lvlPillY, lvlPillX + lvlPillW, lvlPillY);
      if (isLevelUp) {
        lvlGrad.addColorStop(0, 'rgba(234, 179, 8, 0.25)');
        lvlGrad.addColorStop(1, 'rgba(245, 158, 11, 0.35)');
        ctx.strokeStyle = '#eab308';
      } else {
        lvlGrad.addColorStop(0, activeAccent + '33');
        lvlGrad.addColorStop(1, activeAccentEnd + '44');
        ctx.strokeStyle = activeAccent;
      }
      ctx.fillStyle = lvlGrad;
      ctx.fill();
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.fillStyle = isLevelUp ? '#fde047' : activeTextColor;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(lvlText, lvlPillX + lvlPillW / 2, lvlPillY + lvlPillH / 2);

      currentRightEdge = lvlPillX - 10;
    }

    // Rank Badge Pill
    if (showRankBadge) {
      const rankStr = typeof rank === 'number' ? `#${rank}` : String(rank);
      const rnkText = `RANK ${rankStr}`;
      ctx.font = 'bold 15px sans-serif';
      const rnkMetrics = ctx.measureText(rnkText);
      const rnkPillW = rnkMetrics.width + 22;
      const rnkPillH = 32;
      const rnkPillX = currentRightEdge - rnkPillW;
      const rnkPillY = cardY + 24;

      ctx.beginPath();
      ctx.roundRect(rnkPillX, rnkPillY, rnkPillW, rnkPillH, 16);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.fillStyle = rank === 1 || rank === '#1' ? '#fbbf24' : '#e2e8f0';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(rnkText, rnkPillX + rnkPillW / 2, rnkPillY + rnkPillH / 2);
    }
    ctx.restore();

    // 8. XP Stats Details (Middle Section)
    const midSectionY = height * 0.42;
    const barRightEdge = width - cardX - 24;

    ctx.save();
    if (showTotalXP) {
      ctx.font = '600 12px sans-serif';
      ctx.fillStyle = activeSecColor;
      ctx.textAlign = 'left';
      ctx.fillText('TOTAL XP', contentStartX, midSectionY);

      ctx.font = 'bold 22px sans-serif';
      ctx.fillStyle = activeTextColor;
      ctx.fillText(`${totalXP.toLocaleString()} XP`, contentStartX, midSectionY + 26);
    }

    if (showNextLevelXP) {
      const progText = `${currentLevelXP.toLocaleString()} / ${nextLevelXP.toLocaleString()} XP`;
      ctx.font = '600 12px sans-serif';
      ctx.fillStyle = activeSecColor;
      ctx.textAlign = 'right';
      const xpTextX = showPercentage ? barRightEdge - 70 : barRightEdge;
      ctx.fillText('NEXT LEVEL PROGRESS', xpTextX, midSectionY);

      ctx.font = 'bold 18px sans-serif';
      ctx.fillStyle = activeSecColor;
      ctx.fillText(progText, xpTextX, midSectionY + 26);
    }

    if (showPercentage) {
      const pct = Math.min(100, Math.max(0, percentage));
      ctx.font = 'bold 20px sans-serif';
      ctx.fillStyle = isLevelUp ? '#eab308' : activeAccent;
      ctx.textAlign = 'right';
      ctx.fillText(`${pct}%`, barRightEdge, midSectionY + 26);
    }
    ctx.restore();

    // 9. Modern Glowing Progress Bar
    const barX = contentStartX;
    const pbH = Math.max(8, Math.min(48, progressBarHeight));
    const barY = height * 0.59;
    const barW = barRightEdge - contentStartX;
    const pbRadius = Math.max(0, Math.min(pbH / 2, progressBarRadius));

    ctx.save();
    // Track background
    ctx.beginPath();
    ctx.roundRect(barX, barY, barW, pbH, pbRadius);
    ctx.fillStyle = '#1a1e2d';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Fill bar
    const pct = Math.min(100, Math.max(0, percentage));
    const fillW = Math.max(pbRadius * 2, Math.min(barW, (pct / 100) * barW));
    ctx.beginPath();
    ctx.roundRect(barX, barY, fillW, pbH, pbRadius);
    const pGrad = ctx.createLinearGradient(barX, barY, barX + fillW, barY);
    if (isLevelUp) {
      pGrad.addColorStop(0, '#f59e0b');
      pGrad.addColorStop(1, '#eab308');
    } else {
      pGrad.addColorStop(0, activeAccent);
      pGrad.addColorStop(1, activeAccentEnd);
    }
    ctx.fillStyle = pGrad;
    ctx.fill();

    // Inner top highlight
    if (pbH >= 14) {
      ctx.beginPath();
      ctx.roundRect(barX + 2, barY + 2, fillW - 4, pbH / 2 - 2, pbRadius / 2);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.fill();
    }
    ctx.restore();

    // 10. Card Footer Message & Milestone Reward
    ctx.save();
    const footerY = height - cardY - 20;

    ctx.font = '500 12px sans-serif';
    ctx.fillStyle = activeSecColor;
    ctx.textAlign = 'left';
    const effectiveFooter = footerMessage || '⭐ Activity Engine • 300 Levels Milestone Progression';
    ctx.fillText(effectiveFooter, contentStartX, footerY);

    if (roleRewardName) {
      ctx.textAlign = 'right';
      ctx.font = '600 12px sans-serif';
      ctx.fillStyle = '#eab308';
      ctx.fillText(`🎖️ Milestone Reward: @${roleRewardName}`, barRightEdge, footerY);
    }
    ctx.restore();

    return canvas.toBuffer('image/png');
  }
}

export const rankCardService = new RankCardService();
