import React from 'react';

interface TopBarProps {
  onBackClick?: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({ onBackClick }) => {
  return (
    <header className="fixed top-0 left-0 right-0 z-30 h-[84px] max-md:h-[64px] px-8 max-md:px-4 grid grid-cols-[1fr_auto_1fr] items-center pointer-events-auto">
      {/* Left: Boxed back button */}
      <div className="flex items-center justify-start">
        <button
          type="button"
          onClick={onBackClick}
          aria-label="Back to top"
          className="box lbl text-[var(--ink)] hover:bg-[rgba(20,20,20,0.04)] transition-colors cursor-pointer"
        >
          BACK / 戻る
        </button>
      </div>

      {/* Centre: Two-line cobalt logo */}
      <div className="flex flex-col items-center justify-center text-[var(--cobalt)] gap-[5px] select-none">
        <span className="font-logo-sc font-bold text-[22px] max-md:text-[17px] tracking-[0.04em] leading-none">
          莱昂·瓦萨里
        </span>
        <span
          className="lbl text-[9px] max-md:text-[7.5px] tracking-[0.34em] pl-[0.34em] text-[var(--cobalt)] leading-none text-center"
        >
          LEON VASARI
        </span>
      </div>

      {/* Right: Career label (hidden on mobile) */}
      <div className="flex items-center justify-end max-md:hidden">
        <span className="lbl text-[var(--ink)]">
          CAREER 1958年〜1989年
        </span>
      </div>
    </header>
  );
};
