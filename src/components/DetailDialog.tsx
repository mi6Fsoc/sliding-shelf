import React, { useEffect, useRef, useState } from 'react';
import { Film, SHEETS } from '../data/films';
import { calculatePosterSvgCoords } from '../utils/math';

interface DetailDialogProps {
  film: Film;
  isOpen: boolean;
  onClose: () => void;
  getCoverRect: () => DOMRect | null;
}

const BLOBS = [
  { cx: 150, cy: 330, delay: 0 },
  { cx: 340, cy: 600, delay: 120 },
  { cx: 250, cy: 120, delay: 220 },
  { cx: 90, cy: 760, delay: 300 },
  { cx: 400, cy: 250, delay: 360 },
  { cx: 260, cy: 860, delay: 420 },
  { cx: 230, cy: 470, delay: 180 },
];

export const DetailDialog: React.FC<DetailDialogProps> = ({
  film,
  isOpen,
  onClose,
  getCoverRect,
}) => {
  const dialogRef = useRef<HTMLDivElement>(null);
  const textLineRefs = useRef<(HTMLDivElement | null)[]>([]);
  const blobRefs = useRef<(SVGCircleElement | null)[]>([]);
  const inkRafRef = useRef<number | null>(null);
  const isAnimatingRef = useRef<boolean>(false);
  const [isVisible, setIsVisible] = useState<boolean>(false);

  const sheet = SHEETS[film.coverCrop.sheet];
  const posterCoords = calculatePosterSvgCoords(film.coverCrop, sheet);

  // Manage open and close animations
  useEffect(() => {
    const dialogEl = dialogRef.current;
    if (!dialogEl) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (isOpen) {
      setIsVisible(true);
      isAnimatingRef.current = true;

      // Reset blobs
      blobRefs.current.forEach((circle) => {
        if (circle) circle.setAttribute('r', prefersReducedMotion ? '720' : '0');
      });

      const coverRect = getCoverRect();
      const vw = window.innerWidth;
      const vh = window.innerHeight;

      const top = coverRect ? Math.max(0, coverRect.top) : vh / 2 - 200;
      const left = coverRect ? Math.max(0, coverRect.left) : vw / 2 - 120;
      const bottom = coverRect ? Math.max(0, vh - coverRect.bottom) : vh / 2 - 200;
      const right = coverRect ? Math.max(0, vw - coverRect.right) : vw / 2 - 120;

      const originX = coverRect ? coverRect.left + coverRect.width / 2 : vw / 2;
      const originY = coverRect ? coverRect.top + coverRect.height / 2 : vh / 2;

      dialogEl.style.transformOrigin = `${originX}px ${originY}px`;

      if (prefersReducedMotion) {
        dialogEl.style.clipPath = 'inset(0px 0px 0px 0px round 0px)';
        dialogEl.style.transform = 'rotate(0deg)';
        isAnimatingRef.current = false;
        return;
      }

      // Step 2: Sheet grows out of cover
      const sheetAnim = dialogEl.animate(
        [
          {
            clipPath: `inset(${top}px ${right}px ${bottom}px ${left}px round 3px)`,
            transform: 'rotate(-4.5deg)',
          },
          {
            clipPath: 'inset(0px 0px 0px 0px round 0px)',
            transform: 'rotate(0deg)',
          },
        ],
        {
          duration: 1050,
          easing: 'cubic-bezier(0.76, 0, 0.18, 1)',
          fill: 'both',
        }
      );

      // Step 3: Text rises line by line
      textLineRefs.current.forEach((lineEl, idx) => {
        if (!lineEl) return;
        const lineSpan = lineEl.firstElementChild as HTMLElement | null;
        if (!lineSpan) return;

        lineSpan.animate(
          [
            { transform: 'translateY(110%)' },
            { transform: 'translateY(0%)' },
          ],
          {
            duration: 900,
            delay: 620 + idx * 75,
            easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)',
            fill: 'both',
          }
        );
      });

      // Step 4: Poster ink bleeds in
      const startTime = performance.now() + 520;
      const animateInk = (now: number) => {
        let allDone = true;
        BLOBS.forEach((blob, i) => {
          const circle = blobRefs.current[i];
          if (!circle) return;

          const elapsed = now - (startTime + blob.delay);
          if (elapsed <= 0) {
            circle.setAttribute('r', '0');
            allDone = false;
          } else {
            const progress = Math.min(1, elapsed / 1250);
            const easeOutCubic = 1 - Math.pow(1 - progress, 3);
            const r = easeOutCubic * 720;
            circle.setAttribute('r', r.toFixed(2));
            if (progress < 1) allDone = false;
          }
        });

        if (!allDone) {
          inkRafRef.current = requestAnimationFrame(animateInk);
        } else {
          isAnimatingRef.current = false;
        }
      };

      inkRafRef.current = requestAnimationFrame(animateInk);

      sheetAnim.onfinish = () => {
        isAnimatingRef.current = false;
      };
    } else if (isVisible) {
      // Close sequence
      if (inkRafRef.current) {
        cancelAnimationFrame(inkRafRef.current);
      }

      if (prefersReducedMotion) {
        setIsVisible(false);
        return;
      }

      const coverRect = getCoverRect();
      const vw = window.innerWidth;
      const vh = window.innerHeight;

      const top = coverRect ? Math.max(0, coverRect.top) : vh / 2 - 200;
      const left = coverRect ? Math.max(0, coverRect.left) : vw / 2 - 120;
      const bottom = coverRect ? Math.max(0, vh - coverRect.bottom) : vh / 2 - 200;
      const right = coverRect ? Math.max(0, vw - coverRect.right) : vw / 2 - 120;

      const originX = coverRect ? coverRect.left + coverRect.width / 2 : vw / 2;
      const originY = coverRect ? coverRect.top + coverRect.height / 2 : vh / 2;

      dialogEl.style.transformOrigin = `${originX}px ${originY}px`;

      const closeAnim = dialogEl.animate(
        [
          {
            clipPath: 'inset(0px 0px 0px 0px round 0px)',
            transform: 'rotate(0deg)',
          },
          {
            clipPath: `inset(${top}px ${right}px ${bottom}px ${left}px round 3px)`,
            transform: 'rotate(-4.5deg)',
          },
        ],
        {
          duration: 850,
          easing: 'cubic-bezier(0.76, 0, 0.18, 1)',
          fill: 'both',
        }
      );

      closeAnim.onfinish = () => {
        setIsVisible(false);
        dialogEl.getAnimations().forEach((anim) => anim.cancel());
      };
    }

    return () => {
      if (inkRafRef.current) {
        cancelAnimationFrame(inkRafRef.current);
      }
    };
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isVisible && !isOpen) return null;

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-label={`${film.title} detail sheet`}
      style={{
        backgroundColor: 'var(--sheet)',
        visibility: isVisible ? 'visible' : 'hidden',
      }}
      className="fixed inset-0 z-[60] overflow-y-auto overflow-x-hidden text-[var(--ink)] select-none"
    >
      {/* Top Header Bar inside Detail */}
      <div className="fixed top-0 left-0 right-0 h-[84px] max-md:h-[64px] px-8 max-md:px-4 flex items-center justify-between z-10 pointer-events-auto">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close detail"
          className="box lbl text-[var(--ink)] hover:bg-[rgba(20,20,20,0.05)] transition-colors cursor-pointer"
        >
          CLOSE / 閉じる
        </button>

        {/* Centred logo */}
        <div className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center justify-center text-[var(--cobalt)] gap-[5px] select-none">
          <span className="font-logo-sc font-bold text-[22px] max-md:text-[17px] tracking-[0.04em] leading-none">
            莱昂·瓦萨里
          </span>
          <span className="lbl text-[9px] max-md:text-[7.5px] tracking-[0.34em] pl-[0.34em] text-[var(--cobalt)] leading-none text-center">
            LEON VASARI
          </span>
        </div>

        <div className="w-[80px]" />
      </div>

      {/* Main Content Grid */}
      <div className="min-h-full w-full pt-[110px] pb-[56px] px-[7vw] max-md:pt-[84px] max-md:pb-[40px] max-md:px-[22px] grid grid-cols-2 max-md:grid-cols-1 items-center gap-[4vw] max-md:gap-[24px]">
        {/* Left Column: Film Information with line masks */}
        <div className="flex flex-col justify-center max-w-[520px] gap-[18px] max-md:order-2">
          {/* 1. Subtitle */}
          <div
            ref={(el) => {
              textLineRefs.current[0] = el;
            }}
            className="overflow-hidden"
          >
            <span className="lbl font-medium text-[var(--cobalt)] block">
              {film.romaji} / {film.kanji}
            </span>
          </div>

          {/* 2. Title */}
          <div
            ref={(el) => {
              textLineRefs.current[1] = el;
            }}
            className="overflow-hidden"
          >
            <h1 className="font-serif-vasari font-normal text-[clamp(44px,5.4vw,84px)] max-md:text-[42px] leading-none tracking-[-0.025em] text-[var(--ink)] m-0 block">
              {film.title}
            </h1>
          </div>

          {/* 3. Meta line */}
          <div
            ref={(el) => {
              textLineRefs.current[2] = el;
            }}
            className="overflow-hidden"
          >
            <span className="lbl text-[var(--muted)] block">
              {film.year} / {film.genre.toUpperCase()} / {film.minutes} MIN
            </span>
          </div>

          {/* 4. Synopsis */}
          <div
            ref={(el) => {
              textLineRefs.current[3] = el;
            }}
            className="overflow-hidden"
          >
            <p className="font-serif-vasari font-normal text-[17px] max-md:text-[16px] leading-[1.5] max-w-[42ch] text-[var(--ink)] m-0 block">
              {film.synopsis}
            </p>
          </div>

          {/* 5. Italic credit */}
          <div
            ref={(el) => {
              textLineRefs.current[4] = el;
            }}
            className="overflow-hidden"
          >
            <span className="font-serif-vasari italic text-[15px] text-[var(--muted)] block">
              Written and directed by Leon Vasari. 監督作品
            </span>
          </div>

          {/* 6. Watch button */}
          <div
            ref={(el) => {
              textLineRefs.current[5] = el;
            }}
            className="overflow-hidden pt-[10px]"
          >
            <button
              type="button"
              className="box lbl h-[44px] px-[20px] border border-[var(--cobalt)] text-[var(--cobalt)] hover:bg-[var(--cobalt)] hover:text-white transition-colors cursor-pointer inline-flex items-center"
              onClick={() => {
                // Interactive feedback
              }}
            >
              WATCH THE FILM / 映画を見る
            </button>
          </div>
        </div>

        {/* Right Column: Poster with Ragged Ink Bleed Blot Mask */}
        <div className="flex items-center justify-center max-md:order-1 w-full">
          <div className="relative w-full max-w-[440px] max-h-[78vh] max-md:h-[46svh] aspect-[474/900] flex items-center justify-center">
            <svg
              viewBox="0 0 474 900"
              className="w-full h-full shadow-[0_30px_70px_-25px_rgba(20,16,10,0.45)] rounded-[2px]"
              aria-hidden="true"
            >
              <defs>
                {/* Ink displacement filter */}
                <filter
                  id="ink-blot-filter"
                  x="-50%"
                  y="-50%"
                  width="200%"
                  height="200%"
                >
                  <feTurbulence
                    type="fractalNoise"
                    baseFrequency="0.011"
                    numOctaves="3"
                    seed="7"
                    result="noise"
                  />
                  <feDisplacementMap
                    in="SourceGraphic"
                    in2="noise"
                    scale="120"
                    xChannelSelector="R"
                    yChannelSelector="G"
                  />
                </filter>

                {/* Ragged ink mask */}
                <mask
                  id="ink-mask"
                  maskUnits="userSpaceOnUse"
                  x="-200"
                  y="-200"
                  width="874"
                  height="1300"
                >
                  <rect x="-200" y="-200" width="874" height="1300" fill="black" />
                  <g filter="url(#ink-blot-filter)">
                    {BLOBS.map((b, i) => (
                      <circle
                        key={i}
                        ref={(el) => {
                          blobRefs.current[i] = el;
                        }}
                        cx={b.cx}
                        cy={b.cy}
                        r="0"
                        fill="white"
                      />
                    ))}
                  </g>
                </mask>

                {/* Poster clipping rect */}
                <clipPath id="poster-clip">
                  <rect x="0" y="0" width="474" height="900" rx="2" />
                </clipPath>
              </defs>

              <g clipPath="url(#poster-clip)" mask="url(#ink-mask)">
                <image
                  href={sheet.url}
                  x={posterCoords.x}
                  y={posterCoords.y}
                  width={posterCoords.width}
                  height={posterCoords.height}
                  preserveAspectRatio="none"
                />
              </g>
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
};
