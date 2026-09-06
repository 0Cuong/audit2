import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { ArrowRight, User } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { parseDateInput } from '../../lib/dateUtils';

export interface IntroExperienceProps {
  onComplete?: () => void;
  forceReplay?: boolean;
}

interface PortraitProps {
  name: string;
  avatarUrl: string;
  role: 'partner1' | 'partner2';
  delay: number;
}

function PortraitCard({ name, avatarUrl, role, delay }: PortraitProps) {
  const [imageError, setImageError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const shouldReduceMotion = useReducedMotion();

  // Reset error when URL changes
  useEffect(() => {
    setImageError(false);
    setIsLoaded(false);
  }, [avatarUrl]);

  const initials = useMemo(() => {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.charAt(0).toUpperCase() || (role === 'partner1' ? 'C' : 'N');
  }, [name, role]);

  return (
    <motion.div
      initial={shouldReduceMotion ? false : { opacity: 0, y: 16, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        duration: shouldReduceMotion ? 0.2 : 0.8,
        delay: shouldReduceMotion ? 0 : delay,
        ease: [0.16, 1, 0.3, 1],
      }}
      className="group relative flex flex-col items-center"
    >
      <div className="relative w-28 h-36 sm:w-36 sm:h-48 md:w-44 md:h-56 rounded-2xl overflow-hidden bg-zinc-900/90 border border-white/[0.12] shadow-2xl transition-transform duration-500 group-hover:scale-[1.02]">
        {/* Subtle inner sheen */}
        <div className="absolute inset-0 z-10 pointer-events-none rounded-2xl ring-1 ring-inset ring-white/[0.08]" />

        {!imageError && avatarUrl ? (
          <>
            {!isLoaded && (
              <div className="absolute inset-0 bg-zinc-900 flex items-center justify-center animate-pulse">
                <span className="text-zinc-600 font-serif text-lg">{initials}</span>
              </div>
            )}
            <img
              src={avatarUrl}
              alt={`Ảnh chân dung của ${name}`}
              loading="eager"
              onLoad={() => setIsLoaded(true)}
              onError={() => setImageError(true)}
              className={`w-full h-full object-cover object-center transition-opacity duration-700 ${
                isLoaded ? 'opacity-100' : 'opacity-0'
              }`}
            />
          </>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-900/90 text-zinc-400 p-4">
            <span className="font-serif text-2xl sm:text-3xl text-zinc-300 font-light mb-1">
              {initials}
            </span>
            <User className="w-4 h-4 text-zinc-600 opacity-60" />
          </div>
        )}

        {/* Gentle bottom gradient for atmosphere */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none z-10" />

        {/* Individual partner label */}
        <div className="absolute bottom-2.5 inset-x-0 z-20 text-center px-2 pointer-events-none">
          <p className="text-xs sm:text-sm font-medium text-white/90 drop-shadow-md truncate">
            {name}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

export default function IntroExperience({
  onComplete,
  forceReplay = false,
}: IntroExperienceProps) {
  const { profile } = useApp();
  const shouldReduceMotion = useReducedMotion();

  const [phase, setPhase] = useState<'revealing' | 'settled'>('revealing');
  const [isVisible, setIsVisible] = useState(true);
  const completedRef = useRef(false);

  // Canonical Identity
  const p1Name = profile?.partner1_name?.trim() || 'Cường';
  const p2Name = profile?.partner2_name?.trim() || 'Nghi';

  const p1Avatar = profile?.partner1_avatar && !profile.partner1_avatar.includes('590610904')
    ? profile.partner1_avatar
    : '/mcuong.jpg';

  const p2Avatar = profile?.partner2_avatar && !profile.partner2_avatar.includes('605572670')
    ? profile.partner2_avatar
    : '/xnghi.jpg';

  // Authentic Date Formatting (Strictly NO fake fallback date)
  const relationshipSubtitle = useMemo(() => {
    const rawDate = profile?.relationship_start;
    if (!rawDate) {
      return {
        isDate: false,
        text: 'Một không gian riêng cho hai người',
      };
    }
    const parsed = parseDateInput(rawDate);
    if (!parsed) {
      return {
        isDate: false,
        text: 'Một không gian riêng cho hai người',
      };
    }
    const day = parsed.getDate();
    const month = parsed.getMonth() + 1;
    const year = parsed.getFullYear();
    return {
      isDate: true,
      text: `Bắt đầu từ ngày ${day} tháng ${month}, ${year}`,
    };
  }, [profile?.relationship_start]);

  const finish = useCallback(() => {
    if (completedRef.current) return;
    completedRef.current = true;
    setIsVisible(false);

    try {
      sessionStorage.setItem('cuongisme_intro_seen_session', 'true');
      localStorage.setItem('cuongisme_intro_visited', 'true');
    } catch {
      // Storage sandbox safety
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

    if (shouldReduceMotion) {
      const timer = setTimeout(() => {
        setPhase('settled');
      }, 300);
      return () => clearTimeout(timer);
    }

    // Sequence Phasing: Total ~3.8s confident flow
    const t1 = setTimeout(() => setPhase('settled'), 400);
    const t2 = setTimeout(() => finish(), 3900);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        finish();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [finish, forceReplay, onComplete, shouldReduceMotion]);

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="fixed inset-0 z-[100] bg-[#060608] flex flex-col items-center justify-center p-4 sm:p-6 select-none cursor-pointer overflow-hidden"
        onClick={finish}
        role="dialog"
        aria-modal="true"
        aria-label="Khởi đầu không gian riêng tư"
      >
        {/* Subtle Quiet Warm Ambient Glow - Restrained, single soft center */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[420px] sm:w-[580px] h-[420px] sm:h-[580px] rounded-full bg-amber-500/[0.04] blur-[120px]" />
        </div>

        {/* Skip / Enter Action */}
        <div className="absolute top-5 right-5 sm:top-7 sm:right-7 z-30">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              finish();
            }}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] text-xs font-medium text-zinc-300 hover:text-white transition duration-200 active:scale-95"
            aria-label="Vào không gian ngay"
          >
            <span>Vào ngay</span>
            <ArrowRight className="w-3.5 h-3.5 text-zinc-400" />
          </button>
        </div>

        {/* Main Center Editorial Content */}
        <div className="relative z-20 max-w-xl w-full flex flex-col items-center text-center">
          {/* Couple's Editorial Diptych (Two Identities Entering the Space) */}
          <div className="flex items-center justify-center gap-3 sm:gap-6 mb-7 sm:mb-8">
            <PortraitCard
              name={p1Name}
              avatarUrl={p1Avatar}
              role="partner1"
              delay={0.1}
            />

            {/* Quiet Linking Amper / Multiply Symbol */}
            <motion.div
              initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{
                duration: shouldReduceMotion ? 0.2 : 0.6,
                delay: shouldReduceMotion ? 0 : 0.3,
                ease: [0.16, 1, 0.3, 1],
              }}
              className="text-amber-400/70 font-serif text-2xl sm:text-3xl font-light select-none px-1"
            >
              ×
            </motion.div>

            <PortraitCard
              name={p2Name}
              avatarUrl={p2Avatar}
              role="partner2"
              delay={0.2}
            />
          </div>

          {/* Editorial Names & Authentic Date */}
          <motion.div
            initial={shouldReduceMotion ? false : { opacity: 0, y: 12 }}
            animate={{
              opacity: phase === 'settled' ? 1 : 0.8,
              y: phase === 'settled' ? 0 : 6,
            }}
            transition={{
              duration: shouldReduceMotion ? 0.2 : 0.7,
              delay: shouldReduceMotion ? 0 : 0.35,
              ease: [0.16, 1, 0.3, 1],
            }}
            className="space-y-2.5 max-w-md px-2"
          >
            <h1 className="font-serif text-2xl sm:text-3xl md:text-4xl font-normal tracking-tight text-zinc-100">
              <span>{p1Name}</span>
              <span className="text-amber-400/80 font-light mx-2.5">×</span>
              <span>{p2Name}</span>
            </h1>

            <p className="text-xs sm:text-sm font-light text-zinc-400/90 leading-relaxed">
              {relationshipSubtitle.text}
            </p>
          </motion.div>

          {/* Minimal, restrained interactive cue */}
          <motion.div
            initial={shouldReduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{
              delay: shouldReduceMotion ? 0 : 1.0,
              duration: 0.6,
            }}
            className="mt-10 sm:mt-12 flex items-center justify-center gap-2 text-zinc-500 text-xs font-light tracking-wide"
          >
            <span>Nhấn bất kỳ đâu để bắt đầu</span>
          </motion.div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
