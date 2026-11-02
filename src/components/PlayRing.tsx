import React from 'react';

interface PlayRingProps {
  left: number;
  top: number;
  scale: number;
  onClick: () => void;
}

export const PlayRing: React.FC<PlayRingProps> = ({
  left,
  top,
  scale,
  onClick,
}) => {
  const isVisible = scale > 0.001;

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Open film"
      style={{
        left: `${left}px`,
        top: `${top}px`,
        transform: `translate(-50%, -50%) scale(${scale})`,
        pointerEvents: isVisible ? 'auto' : 'none',
        visibility: isVisible ? 'visible' : 'hidden',
      }}
      className="fixed z-30 w-[42px] h-[42px] rounded-full border border-[var(--cobalt)] bg-[rgba(237,235,230,0.75)] backdrop-blur-[2px] flex items-center justify-center text-[var(--cobalt)] shadow-sm hover:bg-[rgba(237,235,230,0.95)] transition-colors cursor-pointer select-none"
    >
      {/* 12px solid play triangle nudged 2px right */}
      <svg
        width="12"
        height="12"
        viewBox="0 0 12 12"
        fill="currentColor"
        className="translate-x-[2px]"
      >
        <path d="M2.5 1.5L10.5 6L2.5 10.5Z" />
      </svg>
    </button>
  );
};
