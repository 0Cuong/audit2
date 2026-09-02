import { useRef, MouseEvent } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';
import { ArrowUpRight, Radio, Send } from 'lucide-react';

interface CommLinkCardProps {
  onOpenTransmission: () => void;
}

export default function CommLinkCard({ onOpenTransmission }: CommLinkCardProps) {
  const buttonRef = useRef<HTMLAnchorElement>(null);

  const btnX = useMotionValue(0);
  const btnY = useMotionValue(0);

  const btnSpringX = useSpring(btnX, { stiffness: 150, damping: 15 });
  const btnSpringY = useSpring(btnY, { stiffness: 150, damping: 15 });

  const handleMagneticMove = (e: MouseEvent<HTMLAnchorElement>) => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    btnX.set((e.clientX - centerX) * 0.25);
    btnY.set((e.clientY - centerY) * 0.25);
  };

  const handleMagneticLeave = () => {
    btnX.set(0);
    btnY.set(0);
  };

  return (
    <div className="relative rounded-3xl bg-[#09090D]/90 border border-white/[0.08] backdrop-blur-2xl p-7 sm:p-9 shadow-[0_20px_50px_-15px_rgba(0,0,0,0.8)] overflow-hidden">
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8 relative z-10">
        <div className="flex items-start sm:items-center gap-5">
          <div className="w-14 h-14 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-center text-[#5865F2] shrink-0">
            <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
              <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.094 13.094 0 0 1-1.873-.894.077.077 0 0 1-.008-.128c.126-.093.252-.19.372-.287a.075.075 0 0 1 .077-.011c3.92 1.793 8.18 1.793 12.061 0a.073.073 0 0 1 .078.009c.12.099.246.195.373.289a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.894.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.156-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.156 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.156-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.156 2.418z"/>
            </svg>
          </div>

          <div>
            <h4 className="font-serif text-lg sm:text-xl font-medium text-zinc-100 mb-1.5">
              Discord
            </h4>
            <p className="text-xs sm:text-sm text-zinc-400 max-w-xl leading-relaxed">
              Tham gia máy chủ Discord để trò chuyện trực tiếp với Cuong &amp; Xuan Nghi.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto shrink-0">
          <button
            type="button"
            onClick={onOpenTransmission}
            className="px-5 py-3 rounded-2xl bg-white/[0.04] border border-white/10 hover:bg-white/[0.08] hover:border-white/25 text-xs font-semibold text-zinc-200 transition-all flex items-center justify-center gap-2 active:scale-95"
          >
            <Send className="w-3.5 h-3.5 text-[#E5A93C]" />
            <span>Gửi tin nhắn</span>
          </button>

          <motion.a
            ref={buttonRef}
            href="https://discord.gg/wZUDdwbq"
            target="_blank"
            rel="noopener noreferrer"
            onMouseMove={handleMagneticMove}
            onMouseLeave={handleMagneticLeave}
            style={{ x: btnSpringX, y: btnSpringY }}
            className="relative px-6 py-3 rounded-2xl bg-zinc-100 hover:bg-white text-zinc-950 font-semibold text-xs transition-all duration-300 flex items-center justify-center gap-2 active:scale-95"
          >
            <Radio className="w-3.5 h-3.5 text-zinc-800" />
            <span>Tham gia Discord</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-zinc-600" />
          </motion.a>
        </div>
      </div>
    </div>
  );
}
