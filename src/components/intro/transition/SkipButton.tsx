// ============================================================================
// SKIP BUTTON
// Minimalist, accessible keyboard-focusable micro-transition trigger
// ============================================================================

import { useEffect, memo } from 'react';
import { motion } from 'framer-motion';
import { FastForward } from 'lucide-react';

interface SkipButtonProps {
  progress: number; // 0 to 1
  onSkip: () => void;
}

export const SkipButton = memo(function SkipButton({ progress, onSkip }: SkipButtonProps) {
  // Listen for Escape or Space to skip
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onSkip();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onSkip]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4, duration: 0.6 }}
      className="fixed bottom-6 right-6 z-40 select-none"
    >
      <button
        type="button"
        onClick={onSkip}
        aria-label="Bỏ qua phần giới thiệu (Skip Intro)"
        className="group relative flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#09090D]/80 border border-white/10 hover:border-[#E5A93C]/40 hover:bg-white/[0.08] backdrop-blur-xl text-zinc-400 hover:text-zinc-100 transition-all duration-300 active:scale-95 focus:outline-none focus:ring-2 focus:ring-[#E5A93C]/50"
      >
        {/* Circular Progress Ring */}
        <div className="relative w-3.5 h-3.5 flex items-center justify-center">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 24 24">
            <circle
              cx="12"
              cy="12"
              r="10"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="text-white/10"
            />
            <circle
              cx="12"
              cy="12"
              r="10"
              fill="none"
              stroke="#E5A93C"
              strokeWidth="2.5"
              strokeDasharray={62.83}
              strokeDashoffset={62.83 * (1 - progress)}
              className="transition-all duration-75"
            />
          </svg>
        </div>

        <span className="text-[11px] font-mono tracking-wider uppercase font-medium">
          Skip
        </span>

        <FastForward className="w-3 h-3 opacity-60 group-hover:opacity-100 transition-opacity text-[#E5A93C]" />

        <span className="hidden sm:inline-block text-[9px] font-mono text-zinc-600 border border-white/5 px-1 rounded">
          ESC
        </span>
      </button>
    </motion.div>
  );
});
