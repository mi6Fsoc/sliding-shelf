import { CropBox, SheetInfo } from '../data/films';

/**
 * Standard smoothstep function: x^2 * (3 - 2x) clamped to [0, 1]
 */
export function smoothstep(x: number): number {
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  return x * x * (3 - 2 * x);
}

/**
 * Compute relative index r = (v - s) modulo 36 into range [-18, 18]
 */
export function computeRelativeIndex(v: number, s: number): number {
  let r = (v - s) % 36;
  if (r < -18) r += 36;
  if (r > 18) r -= 36;
  return r;
}

/**
 * Smooth transition function B(r) for horizontal spacing:
 * For |r| < 1: (r + sin(pi * r) / pi) / 2
 * Otherwise: ±0.5
 */
export function stepB(r: number): number {
  if (Math.abs(r) < 1) {
    return (r + Math.sin(Math.PI * r) / Math.PI) / 2;
  }
  return r > 0 ? 0.5 : -0.5;
}

/**
 * Compute horizontal position x of a tape on the 3D shelf
 * x = F(r) = r * (ws + gap) + (d - ws + 1.6 * gap) * B(r)
 */
export function computeTapeX(r: number, ws: number, d: number, gap: number): number {
  return r * (ws + gap) + (d - ws + 1.6 * gap) * stepB(r);
}

/**
 * Given film year, return decade key
 */
export function getDecadeForYear(year: number): string {
  if (year >= 1950 && year < 1960) return '1950s';
  if (year >= 1960 && year < 1970) return '1960s';
  if (year >= 1970 && year < 1980) return '1970s';
  if (year >= 1980 && year < 1990) return '1980s';
  return '1970s';
}

/**
 * Return the target scroll position T by navigating the shortest path
 * around the 12-film loop
 */
export function getShortestLoopTarget(currentT: number, targetFilmIndex: number): number {
  const roundedT = Math.round(currentT);
  const currentFilmIndex = ((roundedT % 12) + 12) % 12;
  let diff = (targetFilmIndex - currentFilmIndex) % 12;
  if (diff > 6) diff -= 12;
  if (diff < -6) diff += 12;
  return roundedT + diff;
}

/**
 * Compute CSS background styles for cropped sheet sprites
 */
export function calculateCropBgStyle(crop: CropBox, sheet: SheetInfo): {
  backgroundImage: string;
  backgroundSize: string;
  backgroundPosition: string;
  backgroundRepeat: string;
} {
  const bgSizeX = (sheet.w / crop.w) * 100;
  const bgSizeY = (sheet.h / crop.h) * 100;
  const bgPosX = sheet.w === crop.w ? 0 : (crop.x / (sheet.w - crop.w)) * 100;
  const bgPosY = sheet.h === crop.h ? 0 : (crop.y / (sheet.h - crop.h)) * 100;

  return {
    backgroundImage: `url("${sheet.url}")`,
    backgroundSize: `${bgSizeX.toFixed(4)}% ${bgSizeY.toFixed(4)}%`,
    backgroundPosition: `${bgPosX.toFixed(4)}% ${bgPosY.toFixed(4)}%`,
    backgroundRepeat: 'no-repeat',
  };
}

/**
 * Compute SVG image placement for the high-res detail poster
 */
export function calculatePosterSvgCoords(
  crop: CropBox,
  sheet: SheetInfo,
  targetW = 474,
  targetH = 900
): {
  x: number;
  y: number;
  width: number;
  height: number;
} {
  return {
    x: (-crop.x * targetW) / crop.w,
    y: (-crop.y * targetH) / crop.h,
    width: (sheet.w * targetW) / crop.w,
    height: (sheet.h * targetH) / crop.h,
  };
}
