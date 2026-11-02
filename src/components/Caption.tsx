import React, { useEffect, useRef } from 'react';
import { Film } from '../data/films';

interface CaptionProps {
  film: Film;
  direction: number; // +1 = right, -1 = left
}

export const Caption: React.FC<CaptionProps> = ({ film, direction }) => {
  const titleContainerRef = useRef<HTMLDivElement>(null);
  const subtitleContainerRef = useRef<HTMLDivElement>(null);
  const yearContainerRef = useRef<HTMLDivElement>(null);

  const prevFilmIdRef = useRef<string>(film.id);

  const swapText = (
    container: HTMLDivElement | null,
    text: string,
    className: string,
    dir: number
  ) => {
    if (!container) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      container.innerHTML = `<span class="${className}">${text}</span>`;
      return;
    }

    const effectiveDir = dir === 0 ? 1 : dir;
    const oldSpans = Array.from(container.querySelectorAll('span'));

    const newSpan = document.createElement('span');
    newSpan.className = className;
    newSpan.textContent = text;
    newSpan.style.display = 'block';
    newSpan.style.position = oldSpans.length > 0 ? 'absolute' : 'relative';
    newSpan.style.top = '0';
    newSpan.style.left = '0';
    newSpan.style.right = '0';

    container.appendChild(newSpan);

    newSpan.animate(
      [
        { transform: `translateY(${effectiveDir * 105}%)` },
        { transform: 'translateY(0%)' },
      ],
      {
        duration: 650,
        easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)',
        fill: 'both',
      }
    );

    oldSpans.forEach((old) => {
      const anim = old.animate(
        [
          { transform: 'translateY(0%)' },
          { transform: `translateY(${-effectiveDir * 105}%)` },
        ],
        {
          duration: 650,
          easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)',
          fill: 'both',
        }
      );
      anim.onfinish = () => {
        try {
          old.remove();
        } catch {
          // Ignore if already unmounted
        }
      };
    });
  };

  useEffect(() => {
    // Initial mount
    if (titleContainerRef.current && titleContainerRef.current.children.length === 0) {
      const t = document.createElement('span');
      t.className = 'font-serif-vasari font-normal text-[31px] max-md:text-[24px] leading-[1.12] tracking-[-0.01em] text-[var(--ink)] block';
      t.textContent = film.title;
      titleContainerRef.current.appendChild(t);

      const s = document.createElement('span');
      s.className = 'lbl font-medium text-[var(--cobalt)] block';
      s.textContent = `${film.romaji} / ${film.kanji}`;
      subtitleContainerRef.current?.appendChild(s);

      const y = document.createElement('span');
      y.className = 'font-sans-vasari font-medium text-[11px] tracking-[0.08em] text-[var(--ink)] block';
      y.textContent = String(film.year);
      yearContainerRef.current?.appendChild(y);

      prevFilmIdRef.current = film.id;
      return;
    }

    if (prevFilmIdRef.current !== film.id) {
      prevFilmIdRef.current = film.id;
      swapText(
        titleContainerRef.current,
        film.title,
        'font-serif-vasari font-normal text-[31px] max-md:text-[24px] leading-[1.12] tracking-[-0.01em] text-[var(--ink)] block',
        direction
      );
      swapText(
        subtitleContainerRef.current,
        `${film.romaji} / ${film.kanji}`,
        'lbl font-medium text-[var(--cobalt)] block',
        direction
      );
      swapText(
        yearContainerRef.current,
        String(film.year),
        'font-sans-vasari font-medium text-[11px] tracking-[0.08em] text-[var(--ink)] block',
        direction
      );
    }
  }, [film, direction]);

  return (
    <div
      aria-live="polite"
      className="fixed left-1/2 -translate-x-1/2 z-30 pointer-events-none select-none text-center flex flex-col items-center gap-[9px]"
      style={{
        top: 'calc(50% + var(--H) / 2 + 30px)',
        width: 'min(92vw, 760px)',
      }}
    >
      {/* Title mask */}
      <div
        ref={titleContainerRef}
        className="relative overflow-hidden w-full text-center min-h-[38px] max-md:min-h-[30px]"
      />

      {/* Subtitle mask */}
      <div
        ref={subtitleContainerRef}
        className="relative overflow-hidden w-full text-center min-h-[16px]"
      />

      {/* Year mask */}
      <div
        ref={yearContainerRef}
        className="relative overflow-hidden w-full text-center min-h-[16px]"
      />
    </div>
  );
};
