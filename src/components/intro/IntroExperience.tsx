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
}

function PortraitCard({ name, avatarUrl, role }: PortraitProps) {
  const [currentSrc, setCurrentSrc] = useState<string>(avatarUrl);
  const [hasError, setHasError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setCurrentSrc(avatarUrl);
    setHasError(false);
    setIsLoaded(false);
  }, [avatarUrl]);

  const handleError = () => {
    if (currentSrc === '/xnghi.jpg') {
      setCurrentSrc('/xuannghi.jpg');
      return;
    }
    if (currentSrc === '/xuannghi.jpg') {
      setCurrentSrc('/xnghi.jpg');
      return;
    }
    setHasError(true);
  };

  const initials = useMemo(() => {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.charAt(0).toUpperCase() || (role === 'partner1' ? 'C' : 'N');
  }, [name, role]);

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-32 h-44 sm:w-40 sm:h-52 md:w-48 md:h-64 overflow-hidden bg-zinc-900 border border-white/10">
        {!hasError && currentSrc ? (
          <>
            {!isLoaded && (
              <div className="absolute inset-0 bg-zinc-900 flex items-center justify-center">
                <span className="text-zinc-600 font-serif text-lg">{initials}</span>
              </div>
            )}
            <img
              src={currentSrc}
              alt={`Ảnh chân dung của ${name}`}
              loading="eager"
              onLoad={() => setIsLoaded(true)}
              onError={handleError}
              className={`w-full h-full object-cover object-center transition-opacity duration-300 ${
                isLoaded ? 'opacity-100' : 'opacity-0'
              }`}
            />
          </>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-900 text-zinc-500 p-4">
            <span className="font-serif text-2xl sm:text-3xl text-zinc-400 font-light mb-1">
              {initials}
            </span>
            <User className="w-4 h-4 text-zinc-600 opacity-60" />
          </div>
        )}
      </div>
    </div>
  );
}

export default function IntroExperience({
  onComplete,
  forceReplay = false,
}: IntroExperienceProps) {
  const { profile } = useApp();
  const shouldReduceMotion = useReducedMotion();
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
    if (!rawDate) return null;
    const parsed = parseDateInput(rawDate);
    if (!parsed) return null;
    const day = parsed.getDate();
    const month = parsed.getMonth() + 1;
    const year = parsed.getFullYear();
    return `Bắt đầu từ ngày ${day}/${month}/${year}`;
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

    // Calm auto-advance timer
    const autoTimer = setTimeout(() => {
      finish();
    }, 4000);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        finish();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      clearTimeout(autoTimer);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [finish, forceReplay, onComplete]);

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: shouldReduceMotion ? 0.1 : 0.35, ease: [0.16, 1, 0.3, 1] }}
        className="fixed inset-0 z-[100] bg-[#09090c] flex flex-col items-center justify-center p-4 sm:p-6 select-none cursor-pointer overflow-hidden"
        onClick={finish}
        role="dialog"
        aria-modal="true"
        aria-label="Màn hình mở đầu"
      >
        {/* Top-Right Quiet CTA */}
        <div className="absolute top-5 right-5 sm:top-7 sm:right-7 z-30">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              finish();
            }}
            className="group flex items-center gap-1.5 text-xs font-normal tracking-wide text-zinc-400 hover:text-zinc-200 transition-colors py-1.5 px-3 focus:outline-none"
            aria-label="Vào không gian"
          >
            <span>Vào ngay</span>
            <ArrowRight className="w-3.5 h-3.5 text-zinc-500 group-hover:text-zinc-300 group-hover:translate-x-0.5 transition-all" />
          </button>
        </div>

        {/* Center Editorial Diptych and Hierarchy */}
        <div className="relative z-20 max-w-xl w-full flex flex-col items-center text-center">
          {/* Couple's Editorial Diptych */}
          <div className="flex items-center justify-center gap-4 sm:gap-6">
            <PortraitCard
              name={p1Name}
              avatarUrl={p1Avatar}
              role="partner1"
            />
            <PortraitCard
              name={p2Name}
              avatarUrl={p2Avatar}
              role="partner2"
            />
          </div>

          {/* Editorial Names & Authentic Date */}
          <div className="mt-8 sm:mt-10 space-y-2 max-w-md px-2">
            <h1 className="font-serif text-2xl sm:text-3xl md:text-4xl font-normal tracking-tight text-zinc-100">
              <span>{p1Name}</span>
              <span className="font-light text-zinc-400 mx-2">&</span>
              <span>{p2Name}</span>
            </h1>

            {relationshipSubtitle && (
              <p className="text-xs sm:text-sm font-normal text-zinc-400 tracking-wide">
                {relationshipSubtitle}
              </p>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
