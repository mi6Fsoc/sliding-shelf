import React, { useRef, useEffect, useState } from 'react';

interface DecadeTabsProps {
  activeDecade: string; // '1950s' | '1960s' | '1970s' | '1980s'
  onSelectDecade: (decade: string) => void;
  onSelectAll: () => void;
}

const TABS = [
  { id: 'all', label: 'ALL / すべて' },
  { id: '1950s', label: '1950s' },
  { id: '1960s', label: '1960s' },
  { id: '1970s', label: '1970s' },
  { id: '1980s', label: '1980s' },
];

export const DecadeTabs: React.FC<DecadeTabsProps> = ({
  activeDecade,
  onSelectDecade,
  onSelectAll,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [indicatorStyle, setIndicatorStyle] = useState<{
    width: number;
    transform: string;
    opacity: number;
  }>({
    width: 0,
    transform: 'translateX(0px)',
    opacity: 0,
  });

  const updateIndicator = () => {
    const activeBtn = buttonRefs.current[activeDecade];
    if (activeBtn) {
      setIndicatorStyle({
        width: activeBtn.offsetWidth,
        transform: `translateX(${activeBtn.offsetLeft}px)`,
        opacity: 1,
      });
    } else {
      setIndicatorStyle((prev) => ({ ...prev, opacity: 0 }));
    }
  };

  useEffect(() => {
    updateIndicator();
  }, [activeDecade]);

  useEffect(() => {
    window.addEventListener('resize', updateIndicator);
    return () => window.removeEventListener('resize', updateIndicator);
  }, [activeDecade]);

  return (
    <nav
      aria-label="Decades"
      className="fixed left-1/2 -translate-x-1/2 z-30 pointer-events-auto"
      style={{
        top: 'calc(50% - var(--H) / 2 - 86px)',
      }}
    >
      <div
        ref={containerRef}
        className="relative inline-flex items-center flex-nowrap whitespace-nowrap"
      >
        {/* Sliding cobalt indicator block */}
        <div
          className="absolute top-0 bottom-0 bg-[var(--cobalt)] pointer-events-none transition-all duration-[600ms] ease-[var(--ease)]"
          style={{
            height: '23px',
            width: `${indicatorStyle.width}px`,
            transform: indicatorStyle.transform,
            opacity: indicatorStyle.opacity,
          }}
        />

        {/* Five boxed buttons */}
        {TABS.map((tab, idx) => {
          const isActive = tab.id === activeDecade;
          return (
            <button
              key={tab.id}
              ref={(el) => {
                buttonRefs.current[tab.id] = el;
              }}
              type="button"
              onClick={() => {
                if (tab.id === 'all') {
                  onSelectAll();
                } else {
                  onSelectDecade(tab.id);
                }
              }}
              className={`relative z-10 box lbl text-[10.5px] max-md:text-[9px] h-[23px] px-[11px] max-md:px-[7px] border border-[var(--rule)] ${
                idx > 0 ? '-ml-[1px]' : ''
              } transition-colors duration-[450ms] ease-[var(--ease)] cursor-pointer select-none ${
                isActive ? 'text-white' : 'text-[var(--ink)] hover:text-[var(--cobalt)]'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
