import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Heart } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';

export interface IntroExperienceProps {
  onComplete?: () => void;
  forceReplay?: boolean;
  brandName?: string;
  tagline?: string;
}

export default function IntroExperience({
  onComplete,
  forceReplay = false,
  brandName = 'Cường & Nghi',
  tagline = 'Không gian riêng tư của hai đứa',
}: IntroExperienceProps) {
  const { profile } = useApp();
  const [step, setStep] = useState<number>(0);
  const [isVisible, setIsVisible] = useState(true);
  const completedRef = useRef(false);

  const p1 = profile?.partner1_name || 'Cường';
  const p2 = profile?.partner2_name || 'Nghi';
  const namesTitle = profile ? `${p1} & ${p2}` : brandName;

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
    }, 300);
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
      const t = setTimeout(finish, 1000);
      return () => clearTimeout(t);
    }

    // Step 1: Names emerge at 300ms
    const t1 = setTimeout(() => setStep(1), 300);
    // Step 2: Meaningful memory emerges at 1600ms
    const t2 = setTimeout(() => setStep(2), 1600);
    // Step 3: Transition into app at 3600ms
    const t3 = setTimeout(() => finish(), 3800);

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
        transition={{ duration: 0.45, ease: 'easeInOut' }}
        className="fixed inset-0 z-[100] bg-[#0c0c0f] flex flex-col items-center justify-center p-6 select-none cursor-pointer overflow-hidden"
        onClick={finish}
        role="dialog"
        aria-modal="true"
        aria-label="Lời chào ban đầu"
      >
        {/* Subtle Ambient Background Warmth */}
        <div className="absolute inset-0 pointer-events-none opacity-40">
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-amber-500/10 blur-[120px]" />
          <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 w-[400px] h-[400px] rounded-full bg-rose-500/5 blur-[100px]" />
        </div>

        {/* Skip button top-right */}
        <div className="absolute top-6 right-6 z-20">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              finish();
            }}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/[0.06] hover:bg-white/15 border border-white/10 text-xs font-mono text-zinc-300 hover:text-white transition active:scale-95"
          >
            <span>Bỏ qua</span>
            <ArrowRight className="w-3 h-3 text-zinc-400" />
          </button>
        </div>

        {/* Central Intimate Narrative Sequence */}
        <div className="relative z-10 max-w-sm w-full text-center flex flex-col items-center">
          {/* Phase 1: Names & Quiet Subline */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col items-center gap-2 mb-6"
          >
            <div className="w-8 h-8 rounded-full bg-white/[0.04] border border-white/10 flex items-center justify-center text-amber-300/80 mb-1">
              <Heart className="w-3.5 h-3.5 fill-amber-300/20" />
            </div>

            <h1 className="font-serif text-2xl sm:text-3xl font-normal tracking-tight text-zinc-100">
              {namesTitle}
            </h1>

            <p className="text-xs text-zinc-400 font-light tracking-wide max-w-xs">
              {tagline}
            </p>
          </motion.div>

          {/* Phase 2: Meaningful Memory Card Emerges */}
          <AnimatePresence>
            {step >= 2 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.94, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="w-full max-w-[260px] rounded-2xl overflow-hidden bg-zinc-900/90 border border-white/10 shadow-2xl p-2.5 backdrop-blur-md"
              >
                <div className="aspect-[4/3] rounded-xl overflow-hidden bg-zinc-800 relative mb-2.5">
                  <img
                    src="/590610904_1909263110009109_2160755825373491978_n.jpg"
                    alt="Khoảnh khắc đôi mình"
                    className="w-full h-full object-cover"
                    loading="eager"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  <span className="absolute bottom-2 left-2.5 text-[10px] font-mono text-white/90 tracking-wider">
                    18.05.2024
                  </span>
                </div>
                <p className="text-[11px] text-zinc-300 leading-snug px-1 text-center font-light">
                  Nơi lưu giữ từng khoảnh khắc bình yên
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Click hint footer */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            transition={{ delay: 1.2, duration: 0.6 }}
            className="text-[10px] text-zinc-500 font-mono tracking-widest uppercase mt-8"
          >
            Chạm bất kỳ đâu để vào không gian
          </motion.p>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
