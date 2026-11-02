import React from 'react';

interface NavigationArrowsProps {
  onPrev: () => void;
  onNext: () => void;
}

export const NavigationArrows: React.FC<NavigationArrowsProps> = ({ onPrev, onNext }) => {
  return (
    <>
      {/* Left button */}
      <button
        type="button"
        onClick={onPrev}
        aria-label="Previous film"
        className="fixed left-5 max-md:left-[6px] z-30 w-[44px] h-[44px] flex items-center justify-center text-[var(--ink)] hover:text-[var(--cobalt)] transition-colors cursor-pointer select-none"
        style={{
          top: 'calc(50% + var(--H) / 2 + 40px)',
        }}
      >
        <svg
          width="18"
          height="10"
          viewBox="0 0 18 10"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M5 1L1 5L5 9" />
          <path d="M1 5H17" />
        </svg>
      </button>

      {/* Right button */}
      <button
        type="button"
        onClick={onNext}
        aria-label="Next film"
        className="fixed right-5 max-md:right-[6px] z-30 w-[44px] h-[44px] flex items-center justify-center text-[var(--ink)] hover:text-[var(--cobalt)] transition-colors cursor-pointer select-none"
        style={{
          top: 'calc(50% + var(--H) / 2 + 40px)',
        }}
      >
        <svg
          width="18"
          height="10"
          viewBox="0 0 18 10"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M13 1L17 5L13 9" />
          <path d="M1 5H17" />
        </svg>
      </button>
    </>
  );
};
