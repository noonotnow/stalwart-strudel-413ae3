/**
 * Canvas-based single-image card renderer for the individual export feature.
 * Produces a Pokémon-style card with metadata overlay.
 */

import { loadExportCardFonts, readExportCardColors } from './exportCanvas';

// ── Card dimensions ────────────────────────────────────────────────
const CARD_W = 800;
const CARD_H = 1120;
const PAD = 48;
const IMG_AREA_H = 860;
const FOOTER_H = CARD_H - IMG_AREA_H;

// ── Types ──────────────────────────────────────────────────────────

export interface CardMetadata {
  actorName: string;
  vibeEmoji: string;
  vibeLabel: string;
  vibeLabelEn: string;
  date: string;
  imageUrl: string;
  accentColor?: string;
}

// ── Image loading ──────────────────────────────────────────────────

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${url}`));
    img.src = url;
  });
}

// ── Render ─────────────────────────────────────────────────────────

/**
 * Renders a Pokémon-style card with metadata overlay.
 * Returns a Blob of the PNG image.
 */
export async function renderCard(metadata: CardMetadata): Promise<Blob> {
  await loadExportCardFonts();

  const colors = readExportCardColors(metadata.accentColor);

  const canvas = document.createElement('canvas');
  canvas.width = CARD_W;
  canvas.height = CARD_H;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context not supported');

  // ── Background ───────────────────────────────────────────────────
  ctx.fillStyle = colors.bg;
  ctx.fillRect(0, 0, CARD_W, CARD_H);

  // Subtle radial accent glow
  const glow = ctx.createRadialGradient(
    CARD_W / 2, CARD_H * 0.35, 40,
    CARD_W / 2, CARD_H * 0.35, 500,
  );
  glow.addColorStop(0, `${colors.accent}28`); // ~16% opacity
  glow.addColorStop(1, `${colors.accent}00`);
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, CARD_W, CARD_H);

  // ── Card border (thin gold frame) ─────────────────────────────────
  const borderRadius = 24;
  ctx.save();
  ctx.strokeStyle = `${colors.gold}66`;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.roundRect(1, 1, CARD_W - 2, CARD_H - 2, borderRadius);
  ctx.stroke();
  ctx.restore();

  // ── Main image (center-crop to fill area) ────────────────────────
  const img = await loadImage(metadata.imageUrl);

  const imgPad = PAD;
  const imgMaxW = CARD_W - imgPad * 2;
  const imgMaxH = IMG_AREA_H - imgPad;
  const imgX = imgPad;
  const imgY = imgPad;
  const imgRadius = 8;

  // Center-crop: scale image to cover the target area, then center
  const targetRatio = imgMaxW / imgMaxH;
  const srcRatio = img.naturalWidth / img.naturalHeight;
  let sx: number, sy: number, sw: number, sh: number;

  if (srcRatio > targetRatio) {
    // Image is wider — crop sides
    sh = img.naturalHeight;
    sw = sh * targetRatio;
    sx = (img.naturalWidth - sw) / 2;
    sy = 0;
  } else {
    // Image is taller — crop top/bottom
    sw = img.naturalWidth;
    sh = sw / targetRatio;
    sx = 0;
    sy = (img.naturalHeight - sh) / 2;
  }

  // Rounded clip for image
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(imgX, imgY, imgMaxW, imgMaxH, imgRadius);
  ctx.clip();
  ctx.drawImage(img, sx, sy, sw, sh, imgX, imgY, imgMaxW, imgMaxH);

  // Dark gradient overlay on image bottom for depth
  const grad = ctx.createLinearGradient(0, imgY + imgMaxH * 0.6, 0, imgY + imgMaxH);
  grad.addColorStop(0, 'rgba(0, 0, 0, 0)');
  grad.addColorStop(1, 'rgba(0, 0, 0, 0.45)');
  ctx.fillStyle = grad;
  ctx.fillRect(imgX, imgY, imgMaxW, imgMaxH);

  ctx.restore();

  // Subtle inner shadow on image frame
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(imgX, imgY, imgMaxW, imgMaxH, imgRadius);
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.restore();

  // ── Metadata footer ──────────────────────────────────────────────
  const footerY = IMG_AREA_H;
  ctx.textAlign = 'center';
  const cx = CARD_W / 2;

  // Solid dark background for metadata area
  ctx.fillStyle = colors.bg;
  ctx.fillRect(0, footerY, CARD_W, FOOTER_H);

  // Actor name (gold, commanding)
  ctx.save();
  ctx.font = 'bold 40px "Noto Sans SC", "Inter", sans-serif';
  ctx.fillStyle = colors.gold;
  ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
  ctx.shadowBlur = 4;
  ctx.shadowOffsetY = 2;
  ctx.fillText(metadata.actorName, cx, footerY + 52);
  ctx.restore();

  // Vibe label with emoji
  ctx.save();
  ctx.font = '600 26px "Noto Sans SC", "Inter", sans-serif';
  ctx.fillStyle = colors.text;
  ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
  ctx.shadowBlur = 3;
  ctx.shadowOffsetY = 1;
  ctx.fillText(
    `${metadata.vibeEmoji} ${metadata.vibeLabel} · ${metadata.vibeLabelEn}`,
    cx,
    footerY + 96,
  );
  ctx.restore();

  // Date (smaller, less prominent)
  ctx.font = '400 16px "Inter", sans-serif';
  ctx.fillStyle = colors.textMuted;
  ctx.fillText(metadata.date, cx, footerY + 130);

  // Watermark (subtle)
  ctx.font = 'bold 12px "Inter", "Noto Sans SC", sans-serif';
  ctx.fillStyle = `${colors.gold}99`;
  ctx.globalAlpha = 0.6;
  ctx.fillText('VIBE ATLAS — 氛围图鉴 — fandom.justlikekatie.com', cx, footerY + FOOTER_H - 20);
  ctx.globalAlpha = 1.0;

  // ── Convert to blob ──────────────────────────────────────────────
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('Failed to create PNG blob'));
        return;
      }
      resolve(blob);
    }, 'image/png');
  });
}
