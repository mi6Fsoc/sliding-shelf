/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { FILMS, preloadSheets, Film } from './data/films';
import {
  smoothstep,
  computeRelativeIndex,
  computeTapeX,
  getDecadeForYear,
  getShortestLoopTarget,
} from './utils/math';
import { TopBar } from './components/TopBar';
import { DecadeTabs } from './components/DecadeTabs';
import { Shelf3D } from './components/Shelf3D';
import { Caption } from './components/Caption';
import { NavigationArrows } from './components/NavigationArrows';
import { PlayRing } from './components/PlayRing';
import { Footer } from './components/Footer';
import { CustomCursor, CursorMode } from './components/CustomCursor';
import { DetailDialog } from './components/DetailDialog';
import { PaperGrain } from './components/PaperGrain';

export default function App() {
  // s: current scroll position, starts at 17 (Noon in Ashes, film index 5 in 2nd copy)
  const sRef = useRef<number>(17);
  // T: target scroll position
  const tRef = useRef<number>(17);

  // Active film index for React UI (0..11)
  const [activeFilmIndex, setActiveFilmIndex] = useState<number>(5);
  const [slideDirection, setSlideDirection] = useState<number>(1);
  const [activeDecade, setActiveDecade] = useState<string>('1970s');

  // Detail dialog state
  const [isDetailOpen, setIsDetailOpen] = useState<boolean>(false);

  // Custom cursor state
  const [cursorPos, setCursorPos] = useState<{ x: number; y: number }>({ x: -100, y: -100 });
  const [cursorMode, setCursorMode] = useState<CursorMode>('default');
  const [cursorVisible, setCursorVisible] = useState<boolean>(false);

  // Play ring position and scale
  const [playRingState, setPlayRingState] = useState<{ left: number; top: number; scale: number }>({
    left: 0,
    top: 0,
    scale: 1,
  });

  // Dragging and interaction tracking
  const isDraggingRef = useRef<boolean>(false);
  const dragStartXRef = useRef<number>(0);
  const dragStartTRef = useRef<number>(17);
  const hasMovedSignificantlyRef = useRef<boolean>(false);
  const wheelTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hoveredVRef = useRef<number>(-1);

  // Physics and tilt state
  const mxRef = useRef<number>(window.innerWidth / 2);
  const myRef = useRef<number>(window.innerHeight / 2);
  const cxRef = useRef<number>(window.innerWidth / 2);
  const cyRef = useRef<number>(window.innerHeight / 2);
  const tiltXRef = useRef<number>(0);
  const tiltYRef = useRef<number>(0);
  const isOnCoverRef = useRef<boolean>(false);
  const liftRef = useRef<number[]>(new Array(36).fill(0));

  // Geometry ref: [H, ws, d, gap]
  const geomRef = useRef<{ H: number; ws: number; d: number; gap: number }>({
    H: 350,
    ws: 59,
    d: 184,
    gap: 10.5,
  });

  // DOM Refs
  const probeRef = useRef<HTMLDivElement>(null);
  const shelfRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const tapeRefs = useRef<(HTMLDivElement | null)[]>([]);
  const coverRefs = useRef<(HTMLDivElement | null)[]>([]);
  const spineRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Update geometry from probe element
  const updateGeometry = useCallback(() => {
    let measuredH = 350;
    if (probeRef.current) {
      measuredH = probeRef.current.getBoundingClientRect().height || 350;
    } else {
      const vh = window.innerHeight;
      const vw = window.innerWidth;
      measuredH = vw <= 767 ? Math.min(vw * 0.6, vh * 0.4) : Math.min(vh * 0.46, vw * 0.31);
    }
    const H = measuredH;
    const ws = (H * 142) / 840;
    const d = (H * 474) / 900;
    const gap = H * 0.03;
    geomRef.current = { H, ws, d, gap };

    if (stageRef.current) {
      stageRef.current.style.setProperty('--ws', `${ws}px`);
      stageRef.current.style.setProperty('--d', `${d}px`);
    }
  }, []);

  // Preload sheets on mount
  useEffect(() => {
    preloadSheets();
    updateGeometry();
    window.addEventListener('resize', updateGeometry);
    return () => window.removeEventListener('resize', updateGeometry);
  }, [updateGeometry]);

  // Main animation loop
  useEffect(() => {
    let lastTime = performance.now();
    let animId: number;

    const tick = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;

      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const { H, ws, d, gap } = geomRef.current;
      const W = window.innerWidth;
      const shelfCenterY = window.innerHeight / 2;

      // 1. Spring update for s
      if (prefersReducedMotion) {
        sRef.current = tRef.current;
      } else {
        const k = isDraggingRef.current ? 18 : 5.2;
        const diff = tRef.current - sRef.current;
        if (Math.abs(diff) < 1e-4) {
          sRef.current = tRef.current;
        } else {
          sRef.current += diff * (1 - Math.exp(-k * dt));
        }
      }

      // Normalise if s drifts beyond +/- 4 loops
      if (Math.abs(sRef.current - 17) > 48) {
        const shift = 12 * Math.round((sRef.current - 17) / 12);
        sRef.current -= shift;
        tRef.current -= shift;
      }

      // 2. Active film determination
      const currentFilmIdx = ((Math.round(sRef.current) % 12) + 12) % 12;
      if (currentFilmIdx !== activeFilmIndex) {
        const dir = Math.sign(tRef.current - sRef.current) || 1;
        setSlideDirection(dir);
        setActiveFilmIndex(currentFilmIdx);
        setActiveDecade(getDecadeForYear(FILMS[currentFilmIdx].year));
      }

      // 3. Cursor smoothing
      cxRef.current += (mxRef.current - cxRef.current) * (1 - Math.exp(-16 * dt));
      cyRef.current += (myRef.current - cyRef.current) * (1 - Math.exp(-16 * dt));
      setCursorPos({ x: cxRef.current, y: cyRef.current });

      // 4. Tilt calculation towards cursor
      const isOnCover =
        Math.abs(mxRef.current - W / 2) <= 0.55 * d &&
        Math.abs(myRef.current - shelfCenterY) <= 0.55 * H &&
        !isDetailOpen &&
        Math.abs(tRef.current - sRef.current) < 0.3;

      isOnCoverRef.current = isOnCover;

      let targetTiltY = 0;
      let targetTiltX = 0;
      if (isOnCover) {
        targetTiltY = ((mxRef.current - W / 2) / (0.55 * d)) * 9;
        targetTiltX = (-(myRef.current - shelfCenterY) / (H / 2)) * 6;
      } else {
        targetTiltY = ((mxRef.current - W / 2) / W) * 5;
        targetTiltX = 0;
      }

      tiltYRef.current += (targetTiltY - tiltYRef.current) * (1 - Math.exp(-7 * dt));
      tiltXRef.current += (targetTiltX - tiltXRef.current) * (1 - Math.exp(-7 * dt));

      // 5. Update lift targets for hovered tapes
      for (let v = 0; v < 36; v++) {
        const r = computeRelativeIndex(v, sRef.current);
        const targetLift =
          hoveredVRef.current === v && Math.abs(r) > 0.5 ? 1 : 0;
        liftRef.current[v] += (targetLift - liftRef.current[v]) * (1 - Math.exp(-12 * dt));
      }

      // 6. Update 3D transforms for all 36 tapes
      for (let v = 0; v < 36; v++) {
        const tapeEl = tapeRefs.current[v];
        if (!tapeEl) continue;

        const r = computeRelativeIndex(v, sRef.current);
        tapeEl.dataset.r = r.toFixed(4);

        const x = computeTapeX(r, ws, d, gap);

        // Cull tapes far off-screen
        if (Math.abs(x) > W / 2 + 1.5 * d) {
          tapeEl.style.visibility = 'hidden';
          continue;
        }

        tapeEl.style.visibility = 'visible';

        const o = smoothstep(Math.max(0, 1 - Math.abs(r)));
        const rotY = -90 * o + tiltYRef.current * o;
        const rotX = tiltXRef.current * o;
        const rotZ = -4.5 * o;
        const transZ = o * 0.2 * H;
        const transY = -o * 0.025 * H - liftRef.current[v] * 0.045 * H;

        tapeEl.style.transform = `translate3d(${x.toFixed(2)}px, ${transY.toFixed(
          2
        )}px, ${transZ.toFixed(2)}px) rotateZ(${rotZ.toFixed(2)}deg) rotateX(${rotX.toFixed(
          2
        )}deg) rotateY(${rotY.toFixed(2)}deg)`;
        tapeEl.style.zIndex = Math.round(100 - Math.abs(r) * 4).toString();

        // Shading
        const spineEl = spineRefs.current[v];
        if (spineEl) {
          const shade = spineEl.querySelector('.sp-shade') as HTMLElement | null;
          if (shade) shade.style.opacity = (o * 0.55).toFixed(3);
        }

        const coverEl = coverRefs.current[v];
        if (coverEl) {
          const shade = coverEl.querySelector('.cv-shade') as HTMLElement | null;
          if (shade) shade.style.opacity = ((1 - o) * 0.5).toFixed(3);
        }
      }

      // 7. Update PlayRing position and scale
      const ringLeft = W / 2 - 0.5 * d - 6;
      const ringTop = shelfCenterY + 0.36 * H;
      const ringScale = isDetailOpen
        ? 0
        : smoothstep(Math.max(0, 1 - Math.abs(tRef.current - sRef.current) * 3));

      setPlayRingState({ left: ringLeft, top: ringTop, scale: ringScale });

      // 8. Determine cursor mode
      if (isDetailOpen) {
        setCursorMode('default');
      } else if (isOnCover) {
        setCursorMode('open');
      } else if (hoveredVRef.current !== -1 && Math.abs(computeRelativeIndex(hoveredVRef.current, sRef.current)) > 0.5) {
        setCursorMode('spine');
      } else {
        setCursorMode('default');
      }

      animId = requestAnimationFrame(tick);
    };

    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, [activeFilmIndex, isDetailOpen]);

  // Pointer position tracking for cursor and tilt
  const handlePointerMoveGlobal = (e: PointerEvent) => {
    mxRef.current = e.clientX;
    myRef.current = e.clientY;
    setCursorVisible(true);
  };

  useEffect(() => {
    window.addEventListener('pointermove', handlePointerMoveGlobal);
    return () => window.removeEventListener('pointermove', handlePointerMoveGlobal);
  }, []);

  // Wheel scrubbing
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (isDetailOpen) return;
      const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      const { ws, gap } = geomRef.current;
      tRef.current += (delta / (ws + gap)) * 0.5;

      if (wheelTimeoutRef.current) clearTimeout(wheelTimeoutRef.current);
      wheelTimeoutRef.current = setTimeout(() => {
        tRef.current = Math.round(tRef.current);
      }, 160);
    };

    window.addEventListener('wheel', handleWheel, { passive: true });
    return () => window.removeEventListener('wheel', handleWheel);
  }, [isDetailOpen]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isDetailOpen) {
        if (e.key === 'Escape') setIsDetailOpen(false);
        return;
      }

      if (e.key === 'ArrowLeft') {
        tRef.current = Math.round(tRef.current) - 1;
      } else if (e.key === 'ArrowRight') {
        tRef.current = Math.round(tRef.current) + 1;
      } else if (e.key === 'Enter') {
        setIsDetailOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDetailOpen]);

  // Dragging handlers on Shelf
  const handleShelfPointerDown = (e: React.PointerEvent) => {
    isDraggingRef.current = true;
    dragStartXRef.current = e.clientX;
    dragStartTRef.current = tRef.current;
    hasMovedSignificantlyRef.current = false;
  };

  const handleShelfPointerMove = (e: React.PointerEvent) => {
    if (!isDraggingRef.current) return;
    const dx = e.clientX - dragStartXRef.current;
    if (Math.abs(dx) > 5) {
      hasMovedSignificantlyRef.current = true;
    }
    const { ws, gap } = geomRef.current;
    tRef.current = dragStartTRef.current - dx / (ws + gap);
  };

  const handleShelfPointerUp = () => {
    if (isDraggingRef.current) {
      isDraggingRef.current = false;
      tRef.current = Math.round(tRef.current);
    }
  };

  // Tape click handler
  const handleTapeClick = (r: number, isCenter: boolean) => {
    if (hasMovedSignificantlyRef.current) {
      hasMovedSignificantlyRef.current = false;
      return;
    }
    if (isCenter || Math.abs(r) < 0.5) {
      setIsDetailOpen(true);
    } else {
      tRef.current = Math.round(tRef.current + r);
    }
  };

  // Decade selection
  const handleSelectDecade = (decade: string) => {
    const targetFilm = FILMS.find((f) => getDecadeForYear(f.year) === decade);
    if (targetFilm) {
      tRef.current = getShortestLoopTarget(tRef.current, targetFilm.index);
    }
  };

  const handleSelectAll = () => {
    // ALL jumps to film 0 (The Silent Valley)
    tRef.current = getShortestLoopTarget(tRef.current, 0);
  };

  // Arrows navigation
  const handlePrevFilm = () => {
    tRef.current = Math.round(tRef.current) - 1;
  };

  const handleNextFilm = () => {
    tRef.current = Math.round(tRef.current) + 1;
  };

  // Get bounding client rect of current active cover for sheet growth animation
  const getActiveCoverRect = useCallback(() => {
    // Find tape with |r| < 0.5
    for (let v = 0; v < 36; v++) {
      const tapeEl = tapeRefs.current[v];
      if (tapeEl) {
        const r = parseFloat(tapeEl.dataset.r || '99');
        if (Math.abs(r) < 0.5) {
          const coverEl = coverRefs.current[v];
          if (coverEl) {
            return coverEl.getBoundingClientRect();
          }
        }
      }
    }
    return null;
  }, []);

  const activeFilm = FILMS[activeFilmIndex];

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-[var(--paper)] text-[var(--ink)]">
      {/* Hidden probe to measure --H accurately across devices */}
      <div
        ref={probeRef}
        aria-hidden="true"
        className="fixed -left-[9999px] -top-[9999px] pointer-events-none opacity-0"
        style={{ height: 'var(--H)' }}
      />

      {/* 1. Top bar */}
      <TopBar onBackClick={() => (tRef.current = getShortestLoopTarget(tRef.current, 0))} />

      {/* 2. Decade tabs */}
      <DecadeTabs
        activeDecade={activeDecade}
        onSelectDecade={handleSelectDecade}
        onSelectAll={handleSelectAll}
      />

      {/* 3. 3D Shelf */}
      <Shelf3D
        s={sRef.current}
        T={tRef.current}
        onTapeClick={handleTapeClick}
        onHoverTape={(v) => {
          hoveredVRef.current = v;
        }}
        onLeaveTape={(v) => {
          if (hoveredVRef.current === v) hoveredVRef.current = -1;
        }}
        onPointerDown={handleShelfPointerDown}
        onPointerMove={handleShelfPointerMove}
        onPointerUp={handleShelfPointerUp}
        onPointerCancel={handleShelfPointerUp}
        shelfRef={shelfRef}
        stageRef={stageRef}
        tapeRefs={tapeRefs}
        coverRefs={coverRefs}
        spineRefs={spineRefs}
        ws={geomRef.current.ws}
        d={geomRef.current.d}
        H={geomRef.current.H}
      />

      {/* 4. Play ring */}
      <PlayRing
        left={playRingState.left}
        top={playRingState.top}
        scale={playRingState.scale}
        onClick={() => setIsDetailOpen(true)}
      />

      {/* 5. Masked Caption */}
      <Caption film={activeFilm} direction={slideDirection} />

      {/* 6. Navigation Arrows */}
      <NavigationArrows onPrev={handlePrevFilm} onNext={handleNextFilm} />

      {/* 7. Footer */}
      <Footer />

      {/* Procedural paper grain overlay */}
      <PaperGrain />

      {/* 8. Custom interactive cursor */}
      <CustomCursor
        x={cursorPos.x}
        y={cursorPos.y}
        mode={cursorMode}
        visible={cursorVisible}
      />

      {/* Opening a film: Detail Paper Sheet & Ink Reveal */}
      <DetailDialog
        film={activeFilm}
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        getCoverRect={getActiveCoverRect}
      />
    </main>
  );
}
