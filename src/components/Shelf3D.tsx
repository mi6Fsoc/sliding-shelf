import React, { useRef, useEffect } from 'react';
import { FILMS, SHEETS } from '../data/films';
import {
  smoothstep,
  computeRelativeIndex,
  computeTapeX,
  calculateCropBgStyle,
} from '../utils/math';

interface Shelf3DProps {
  s: number;
  T: number;
  onTapeClick: (relativeIndex: number, isCenter: boolean) => void;
  onHoverTape: (vIndex: number) => void;
  onLeaveTape: (vIndex: number) => void;
  onPointerDown: (e: React.PointerEvent) => void;
  onPointerMove: (e: React.PointerEvent) => void;
  onPointerUp: (e: React.PointerEvent) => void;
  onPointerCancel: (e: React.PointerEvent) => void;
  shelfRef: React.RefObject<HTMLElement | null>;
  stageRef: React.RefObject<HTMLDivElement | null>;
  tapeRefs: React.MutableRefObject<(HTMLDivElement | null)[]>;
  coverRefs: React.MutableRefObject<(HTMLDivElement | null)[]>;
  spineRefs: React.MutableRefObject<(HTMLDivElement | null)[]>;
  ws: number;
  d: number;
  H: number;
}

export const Shelf3D: React.FC<Shelf3DProps> = ({
  onTapeClick,
  onHoverTape,
  onLeaveTape,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onPointerCancel,
  shelfRef,
  stageRef,
  tapeRefs,
  coverRefs,
  spineRefs,
  ws,
  d,
  H,
}) => {
  // Pre-calculate styles for each of the 12 films' spine and cover faces
  const filmCropStyles = React.useMemo(() => {
    return FILMS.map((film) => ({
      spine: calculateCropBgStyle(film.spineCrop, SHEETS[film.spineCrop.sheet]),
      cover: calculateCropBgStyle(film.coverCrop, SHEETS[film.coverCrop.sheet]),
    }));
  }, []);

  return (
    <section
      ref={shelfRef}
      aria-label="Filmography shelf"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
      className="fixed left-0 right-0 z-20 w-full overflow-visible select-none cursor-grab active:cursor-grabbing"
      style={{
        top: 'calc(50% - var(--H) / 2 - 40px)',
        height: 'calc(var(--H) + 80px)',
        perspective: '2200px',
        perspectiveOrigin: '50% 50%',
        touchAction: 'pan-y',
      }}
    >
      {/* 3D Stage */}
      <div
        ref={stageRef}
        className="stage absolute left-1/2 top-1/2 w-0 h-0"
        style={{
          transformStyle: 'preserve-3d',
        }}
      >
        {/* Render 36 tapes (3 copies of 12 films) */}
        {Array.from({ length: 36 }).map((_, v) => {
          const filmIndex = v % 12;
          const film = FILMS[filmIndex];
          const styles = filmCropStyles[filmIndex];

          return (
            <div
              key={v}
              ref={(el) => {
                tapeRefs.current[v] = el;
              }}
              data-v={v}
              onClick={(e) => {
                e.stopPropagation();
                const r = parseFloat((elRef(tapeRefs.current[v])?.dataset.r) || '0');
                const isCenter = Math.abs(r) < 0.5;
                onTapeClick(r, isCenter);
              }}
              onPointerEnter={() => onHoverTape(v)}
              onPointerLeave={() => onLeaveTape(v)}
              className="tape absolute left-0 top-0 w-0 h-0 cursor-pointer"
              style={{
                transformStyle: 'preserve-3d',
                willChange: 'transform',
              }}
            >
              {/* Spine face (.sp) */}
              <div
                ref={(el) => {
                  spineRefs.current[v] = el;
                }}
                className="sp absolute rounded-[2px] overflow-hidden"
                style={{
                  width: `${ws}px`,
                  height: `${H}px`,
                  top: `${-H / 2}px`,
                  left: `${-ws / 2}px`,
                  transform: `translateZ(${d / 2}px)`,
                  backfaceVisibility: 'hidden',
                  ...styles.spine,
                }}
              >
                {/* Darkening shading overlay */}
                <div
                  className="sp-shade absolute inset-0 bg-black pointer-events-none transition-opacity duration-75"
                  style={{ opacity: 0 }}
                />
              </div>

              {/* Cover face (.cv) */}
              <div
                ref={(el) => {
                  coverRefs.current[v] = el;
                }}
                className="cv absolute rounded-[2px] overflow-hidden shadow-[0_30px_60px_-28px_rgba(20,16,10,0.55)]"
                style={{
                  width: `${d}px`,
                  height: `${H}px`,
                  top: `${-H / 2}px`,
                  left: `${-d / 2}px`,
                  transform: `rotateY(90deg) translateZ(${ws / 2}px)`,
                  backfaceVisibility: 'hidden',
                  ...styles.cover,
                }}
              >
                {/* Darkening shading overlay */}
                <div
                  className="cv-shade absolute inset-0 bg-black pointer-events-none transition-opacity duration-75"
                  style={{ opacity: 0.5 }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

function elRef(el: HTMLElement | null): HTMLElement | null {
  return el;
}
