import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="fixed bottom-[26px] max-md:bottom-[18px] left-8 max-md:left-4 right-8 max-md:right-4 z-30 flex items-center justify-between pointer-events-auto select-none">
      <div className="lbl text-[var(--ink)]">
        © LEON VASARI. ALL RIGHTS RESERVED.
      </div>
      <div className="lbl text-[var(--ink)] flex items-center gap-2">
        <a
          href="#facebook"
          className="hover:text-[var(--cobalt)] transition-colors no-underline cursor-pointer"
          onClick={(e) => e.preventDefault()}
        >
          FB
        </a>
        <span>/</span>
        <a
          href="#twitter"
          className="hover:text-[var(--cobalt)] transition-colors no-underline cursor-pointer"
          onClick={(e) => e.preventDefault()}
        >
          TW
        </a>
      </div>
    </footer>
  );
};
