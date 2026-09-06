import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { parseDateInput } from '../../lib/dateUtils';

export interface IntroExperienceProps {
  onComplete?: () => void;
  forceReplay?: boolean;
}

export default function IntroExperience({
  onComplete,
  forceReplay = false,
}: IntroExperienceProps) {
  const { profile } = useApp();
  const [step, setStep] = useState<number>(0);
  const [isVisible, setIsVisible] = useState(true);
  const completedRef = useRef(false);

  const p1 = (profile?.partner1_name || 'Cường').toUpperCase();
  const p2 = (profile?.partner2_name || 'Nghi').toUpperCase();
  const startDate = profile?.relationship_start;

  const formattedDate = useMemo(() => {
    if (!startDate) return '18 THÁNG 5, 2026';
    const d = parseDateInput(startDate);
    if (!d) return '18 THÁNG 5, 2026';
    return `${d.getDate()} THÁNG ${d.getMonth() + 1}, ${d.getFullYear()}`;
  }, [startDate]);

  const finish = useCallback(() => {
    if (completedRef.current) return;
    completedRef.current = true;
    setIsVisible(false);
    try {
      sessionStorage.setItem('cuongisme_intro_seen_session', 'true');
      localStorage.setItem('cuongisme_intro_visited', 'true');
    } catch {
      // Ignore storage restrictions
    }
    setTimeout(() => {
      onComplete?.();
    }, 350);
  }, [onComplete]);

  useEffect(() => {
    // Check if seen this session unless forced replay
    if (!forceReplay) {
      try {
        const seen = sessionStorage.getItem('cuongisme_intro_seen_session');
        if (seen === 'true') {
          completedRef.current = true;
          onComplete?.();
          return;
        }
      } catch {
        // Fall through
      }
    }

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      const t = setTimeout(finish, 800);
      return () => clearTimeout(t);
    }

    // Step 1: Emergence of names & date
    const t1 = setTimeout(() => setStep(1), 400);
    // Step 2: First memory photograph emerges
    const t2 = setTimeout(() => setStep(2), 1700);
    // Step 3: Enter world auto finish
    const t3 = setTimeout(() => finish(), 4000);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === ' ' || e.key === 'Enter') {
        finish();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [finish, forceReplay, onComplete]);

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="fixed inset-0 z-[100] bg-[#070709] flex flex-col items-center justify-center p-6 select-none cursor-pointer overflow-hidden"
        onClick={finish}
        role="dialog"
        aria-modal="true"
        aria-label="Khởi đầu không gian"
      >
        {/* Subtle Warm Atmospheric Light */}
        <div className="absolute inset-0 pointer-events-none opacity-30">
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-amber-500/[0.08] blur-[140px]" />
          <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 w-[450px] h-[450px] rounded-full bg-rose-500/[0.04] blur-[120px]" />
        </div>

        {/* Skip button */}
        <div className="absolute top-6 right-6 z-20">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              finish();
            }}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/[0.04] hover:bg-white/10 border border-white/10 text-xs font-mono text-zinc-400 hover:text-white transition active:scale-95"
          >
            <span>Bỏ qua</span>
            <ArrowRight className="w-3 h-3 text-zinc-500" />
          </button>
        </div>

        {/* Editorial Cinematic Sequence */}
        <div className="relative z-10 max-w-md w-full flex flex-col items-center text-center">
          {/* Timestamp Header */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            transition={{ duration: 0.8 }}
            className="text-[11px] font-mono tracking-[0.25em] text-zinc-400 uppercase mb-8"
          >
            00:00 · KHỞI ĐẦU
          </motion.div>

          {/* Phase 1: Large Names Typography & Date */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: step >= 1 ? 1 : 0, y: step >= 1 ? 0 : 12 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col items-center gap-3 mb-6"
          >
            <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-normal tracking-tight text-zinc-100 flex items-center gap-3">
              <span>{p1}</span>
              <span className="text-amber-400/80 font-light text-2xl sm:text-3xl">×</span>
              <span>{p2}</span>
            </h1>

            <p className="text-xs font-mono tracking-[0.2em] text-zinc-400 uppercase">
              {formattedDate}
            </p>
          </motion.div>

          {/* Phase 2: Meaningful First Memory */}
          <AnimatePresence>
            {step >= 2 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.96, y: 12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                className="w-full max-w-[280px] rounded-2xl overflow-hidden bg-[#121215] border border-white/10 shadow-2xl p-2.5"
              >
                <div className="aspect-[4/3] rounded-xl overflow-hidden bg-zinc-900 relative mb-2">
                  <img
                    src="/mcuong.jpg"
                    alt="Khoảnh khắc đầu tiên"
                    className="w-full h-full object-cover"
                    loading="eager"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  <span className="absolute bottom-2 left-2.5 text-[10px] font-mono text-zinc-300 tracking-wider">
                    {formattedDate}
                  </span>
                </div>
                <p className="text-[11px] text-zinc-400 font-light px-1 text-center line-clamp-1">
                  Không gian riêng tư của hai đứa
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Spatial Enter Cue */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            transition={{ delay: 1.4, duration: 0.6 }}
            className="text-[10px] text-zinc-500 font-mono tracking-[0.2em] uppercase mt-8"
          >
            Chạm bất kỳ đâu để vào không gian
          </motion.p>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
