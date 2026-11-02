import React from 'react';

/**
 * Fixed full-screen paper grain overlay (z-index 40, pointer-events none)
 * 220x220 inline SVG tile with feTurbulence fractalNoise and feColorMatrix
 */
export const PaperGrain: React.FC = () => {
  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none z-40 select-none overflow-hidden"
      style={{
        mixBlendMode: 'multiply',
        opacity: 0.55,
      }}
    >
      <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <filter id="paper-grain-filter" x="0%" y="0%" width="100%" height="100%">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.85"
              numOctaves="3"
              stitchTiles="stitch"
              result="noise"
            />
            <feColorMatrix
              type="matrix"
              values="0 0 0 0 0.45
                      0 0 0 0 0.42
                      0 0 0 0 0.38
                      0 0 0 0.22 0"
            />
          </filter>
          <pattern
            id="paper-grain-pattern"
            width="220"
            height="220"
            patternUnits="userSpaceOnUse"
          >
            <rect width="220" height="220" filter="url(#paper-grain-filter)" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#paper-grain-pattern)" />
      </svg>
    </div>
  );
};
