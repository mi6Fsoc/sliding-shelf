import test from 'node:test';
import assert from 'node:assert/strict';
import {
  smoothstep,
  computeRelativeIndex,
  stepB,
  computeTapeX,
  getDecadeForYear,
  getShortestLoopTarget,
  calculateCropBgStyle,
  calculatePosterSvgCoords,
} from './math';

test('smoothstep behavior', () => {
  assert.equal(smoothstep(0), 0);
  assert.equal(smoothstep(1), 1);
  assert.equal(smoothstep(-0.5), 0);
  assert.equal(smoothstep(1.5), 1);
  assert.equal(smoothstep(0.5), 0.5);
});

test('computeRelativeIndex wraps correctly within [-18, 18]', () => {
  // Middle copy at s = 17, film v = 17 -> r = 0
  assert.equal(computeRelativeIndex(17, 17), 0);
  // Tape at 18 with s = 17 -> r = 1
  assert.equal(computeRelativeIndex(18, 17), 1);
  // Tape at 16 with s = 17 -> r = -1
  assert.equal(computeRelativeIndex(16, 17), -1);
  // Opposite edge
  const rWrap = computeRelativeIndex(0, 18);
  assert.ok(rWrap >= -18 && rWrap <= 18);
});

test('stepB function bounds and continuity', () => {
  assert.equal(stepB(0), 0);
  assert.equal(stepB(1), 0.5);
  assert.equal(stepB(-1), -0.5);
  assert.equal(stepB(2), 0.5);
  assert.equal(stepB(-2), -0.5);
});

test('computeTapeX symmetric behavior', () => {
  const ws = 50;
  const d = 150;
  const gap = 10;
  const xCenter = computeTapeX(0, ws, d, gap);
  assert.equal(xCenter, 0);

  const xRight = computeTapeX(2, ws, d, gap);
  const xLeft = computeTapeX(-2, ws, d, gap);
  assert.equal(Math.round(xRight), Math.round(-xLeft));
});

test('getDecadeForYear mapping', () => {
  assert.equal(getDecadeForYear(1958), '1950s');
  assert.equal(getDecadeForYear(1966), '1960s');
  assert.equal(getDecadeForYear(1971), '1970s');
  assert.equal(getDecadeForYear(1989), '1980s');
});

test('getShortestLoopTarget moves along shortest arc', () => {
  // From film 5 (Noon in Ashes), jump to 6 (The Observer)
  assert.equal(getShortestLoopTarget(17, 6), 18);
  // Jump to 4
  assert.equal(getShortestLoopTarget(17, 4), 16);
  // Jump to 0 (Silent Valley)
  assert.equal(getShortestLoopTarget(17, 0), 12);
  // Jump across boundary: from index 0 to index 11 is -1 step
  assert.equal(getShortestLoopTarget(12, 11), 11);
});

test('calculateCropBgStyle generates valid CSS attributes', () => {
  const style = calculateCropBgStyle(
    { sheet: 'covers', x: 74, y: 72, w: 347, h: 659 },
    { url: 'https://example.com/test.webp', w: 1744, h: 2336 }
  );
  assert.ok(style.backgroundImage.includes('https://example.com/test.webp'));
  assert.ok(style.backgroundSize.includes('%'));
  assert.ok(style.backgroundPosition.includes('%'));
});

test('calculatePosterSvgCoords matches 474x900 viewport math', () => {
  const coords = calculatePosterSvgCoords(
    { sheet: 'covers', x: 74, y: 72, w: 347, h: 659 },
    { url: 'https://example.com/test.webp', w: 1744, h: 2336 }
  );
  assert.equal(Math.round(coords.x), Math.round((-74 * 474) / 347));
  assert.equal(Math.round(coords.y), Math.round((-72 * 900) / 659));
});
