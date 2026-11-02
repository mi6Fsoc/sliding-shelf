import React from 'react';

export type CursorMode = 'default' | 'spine' | 'btn' | 'open';

interface CustomCursorProps {
  x: number;
  y: number;
  mode: CursorMode;
  visible: boolean;
}

export const CustomCursor: React.FC<CustomCursorProps> = ({
  x,
  y,
  mode,
  visible,
}) => {
  if (!visible) return null;

  // Derive scales and styles based on mode
  let ringScale = 1;
  let ringBg = 'transparent';
  let ringBorder = 'var(--ink)';
  let dotScale = 1;
  let labelScale = 0;

  if (mode === 'spine') {
    ringScale = 0.72;
    dotScale = 1;
    labelScale = 0;
  } else if (mode === 'btn') {
    ringScale = 0.55;
    dotScale = 0;
    labelScale = 0;
  } else if (mode === 'open') {
    ringScale = 1.75;
    ringBg = 'var(--cobalt)';
    ringBorder = 'var(--cobalt)';
    dotScale = 0;
    labelScale = 1;
  }

  return (
    <div
      aria-hidden="true"
      className="fixed pointer-events-none select-none z-[100] w-[58px] h-[58px] -ml-[29px] -mt-[29px] left-0 top-0 max-md:hidden"
      style={{
        transform: `translate3d(${x}px, ${y}px, 0)`,
        willChange: 'transform',
      }}
    >
      {/* Outer Ring */}
      <div
        className="w-full h-full rounded-full border-[1.5px] flex items-center justify-center transition-all ease-[var(--ease)] duration-500"
        style={{
          transform: `scale(${ringScale})`,
          backgroundColor: ringBg,
          borderColor: ringBorder,
        }}
      >
        {/* Center dot */}
        <div
          className="w-[6px] h-[6px] rounded-full bg-[var(--ink)] absolute transition-transform ease-[var(--ease)] duration-400"
          style={{
            transform: `scale(${dotScale})`,
          }}
        />

        {/* OPEN / 開く label */}
        <div
          className="flex flex-col items-center justify-center text-white text-[10px] leading-[1.25] font-semibold tracking-[0.1em] uppercase text-center transition-transform ease-[var(--ease)] duration-[450ms]"
          style={{
            transform: `scale(${labelScale})`,
          }}
        >
          <span>OPEN</span>
          <span className="text-[8.5px] leading-tight">開く</span>
        </div>
      </div>
    </div>
  );
};
