import { useState, useRef, MouseEvent } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { Globe, ArrowUpRight, Check, Copy } from 'lucide-react';

export interface FounderSocial {
  label: string;
  url: string;
  type: 'facebook' | 'instagram' | 'discord' | 'github' | 'email' | 'custom';
  handle?: string;
}

export interface FounderProfile {
  id: 'founder-1' | 'founder-2';
  index: string;
  name: string;
  role: string;
  title: string;
  disciplines: string[];
  avatar: string;
  bio: string;
  location: string;
  timezone: string;
  accent: string; // Hex color (e.g. #E5A93C or #8B5CF6)
  accentGlow: string;
  socials: FounderSocial[];
}

interface FounderMonolithProps {
  founder: FounderProfile;
}

export default function FounderMonolith({ founder }: FounderMonolithProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [copiedLabel, setCopiedLabel] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);

  // 3D Tilt Motion Values
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x, { stiffness: 140, damping: 20 });
  const mouseYSpring = useSpring(y, { stiffness: 140, damping: 20 });

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ['6.5deg', '-6.5deg']);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ['-6.5deg', '6.5deg']);

  // Specular reflection position tracking (0% to 100%)
  const specularX = useTransform(mouseXSpring, [-0.5, 0.5], [20, 80]);
  const specularY = useTransform(mouseYSpring, [-0.5, 0.5], [20, 80]);

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    const mouseXFromCenter = e.clientX - rect.left - width / 2;
    const mouseYFromCenter = e.clientY - rect.top - height / 2;

    x.set(mouseXFromCenter / width);
    y.set(mouseYFromCenter / height);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  const handleCopyHandle = (text: string, label: string, e: MouseEvent) => {
    e.preventDefault();
    navigator.clipboard.writeText(text);
    setCopiedLabel(label);
    setTimeout(() => setCopiedLabel(null), 2000);
  };

  const isGoldAccent = founder.accent === '#E5A93C';

  return (
    <div 
      className="relative w-full max-w-md mx-auto"
      style={{ perspective: 1200 }}
    >
      <motion.div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{
          rotateX,
          rotateY,
          transformStyle: 'preserve-3d',
        }}
        className="relative rounded-3xl bg-[#09090D]/90 border border-white/[0.08] backdrop-blur-2xl shadow-[0_24px_60px_-15px_rgba(0,0,0,0.8)] overflow-hidden transition-shadow duration-500 group"
      >
        {/* ============================================================ */}
        {/* LAYER 0: SPECULAR RESPONSE & AMBIENT HORIZON SHEEN           */}
        {/* ============================================================ */}
        <motion.div
          className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10"
          style={{
            background: `radial-gradient(600px circle at ${specularX}% ${specularY}%, ${
              isGoldAccent ? 'rgba(229, 169, 60, 0.12)' : 'rgba(139, 92, 246, 0.12)'
            }, transparent 65%)`,
          }}
        />

        {/* Ambient Top Rim Metallic Border Light */}
        <div
          className="absolute top-0 inset-x-0 h-[1px] opacity-60 pointer-events-none"
          style={{
            background: `linear-gradient(90deg, transparent 0%, ${founder.accent} 50%, transparent 100%)`,
          }}
        />

        {/* ============================================================ */}
        {/* LAYER 1: STRUCTURAL FOUNDER HEADER & TECHNICAL INDEX         */}
        {/* ============================================================ */}
        <div 
          className="p-6 sm:p-7 relative z-20"
          style={{ transform: 'translateZ(20px)' }}
        >
          {/* Top Bar: Index + Synchronized Status */}
          <div className="flex items-center justify-between pb-5 border-b border-white/[0.06] mb-6">
            <span className="text-xs text-zinc-400">
              {founder.role}
            </span>

            <div className="flex items-center gap-2 text-[10px] text-zinc-400">
              <span>{founder.location}</span>
              <span className="text-zinc-600">•</span>
              <span>{founder.timezone}</span>
            </div>
          </div>

          {/* ============================================================ */}
          {/* LAYER 2: FOUNDER PORTRAIT & IDENTITY HERO                    */}
          {/* ============================================================ */}
          <div className="flex items-start gap-4 mb-6">
            {/* Portrait Housing */}
            <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden bg-zinc-900 border border-white/10 shrink-0 shadow-xl group-hover:border-white/20 transition-all duration-300">
              {/* Backlight Ambient Glow */}
              <div 
                className="absolute inset-0 opacity-25 filter blur-md"
                style={{ backgroundColor: founder.accent }}
              />

              {!imageError && founder.avatar ? (
                <img
                  src={founder.avatar}
                  alt={founder.name}
                  onError={() => setImageError(true)}
                  className="w-full h-full object-cover relative z-10 transition-transform duration-500 group-hover:scale-105 filter grayscale-[25%] contrast-[105%]"
                  loading="lazy"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center font-serif text-2xl font-bold text-zinc-200 relative z-10 bg-zinc-950">
                  {founder.name.charAt(0)}
                </div>
              )}

              {/* Subtle Gradient Occlusion Mask on Portrait Bottom */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#09090D] via-transparent to-transparent opacity-60 z-20 pointer-events-none" />
            </div>

            {/* Name, Title & Editorial Bio */}
            <div className="flex-1 min-w-0">
              <h3 className="font-serif text-2xl sm:text-3xl font-medium tracking-tight text-zinc-100 group-hover:text-white transition-colors">
                {founder.name}
              </h3>
              <p 
                className="text-xs font-mono font-medium tracking-wide mt-1"
                style={{ color: founder.accent }}
              >
                {founder.title}
              </p>
              <p className="text-xs text-zinc-400 mt-2.5 leading-relaxed line-clamp-3">
                {founder.bio}
              </p>
            </div>
          </div>

          <div className="space-y-2 pt-4 border-t border-white/[0.06]">
            <div className="text-xs text-zinc-500 mb-2">
              Liên kết
            </div>

            <div className="grid grid-cols-1 gap-2">
              {founder.socials.map((social) => {
                const isCopied = copiedLabel === social.label;
                return (
                  <a
                    key={social.label}
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:border-white/20 hover:bg-white/[0.05] transition-all duration-200 group/link active:scale-[0.99]"
                    aria-label={`Open ${social.label} of ${founder.name}`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div 
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-300 border border-white/10 group-hover/link:border-white/30 transition-all shrink-0 bg-black/40"
                      >
                        {social.type === 'facebook' && (
                          <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                          </svg>
                        )}
                        {social.type === 'instagram' && (
                          <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                          </svg>
                        )}
                        {social.type === 'discord' && (
                          <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                            <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.094 13.094 0 0 1-1.873-.894.077.077 0 0 1-.008-.128c.126-.093.252-.19.372-.287a.075.075 0 0 1 .077-.011c3.92 1.793 8.18 1.793 12.061 0a.073.073 0 0 1 .078.009c.12.099.246.195.373.289a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.894.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.156-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.156 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.156-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.156 2.418z"/>
                          </svg>
                        )}
                        {(social.type === 'github' || social.type === 'email' || social.type === 'custom') && (
                          <Globe className="w-3.5 h-3.5" />
                        )}
                      </div>
                      <div className="truncate">
                        <span className="text-xs font-semibold text-zinc-200 group-hover/link:text-white transition-colors block truncate">
                          {social.label}
                        </span>
                        {social.handle && (
                          <span className="text-[10px] font-mono text-zinc-500 group-hover/link:text-zinc-400 block truncate">
                            {social.handle}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 text-zinc-500 group-hover/link:text-zinc-300">
                      {social.handle && (
                        <button
                          type="button"
                          onClick={(e) => handleCopyHandle(social.handle!, social.label, e)}
                          title="Copy Handle"
                          className="p-1 hover:text-white transition"
                        >
                          {isCopied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        </button>
                      )}
                      <ArrowUpRight className="w-3.5 h-3.5 group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5 transition-transform" />
                    </div>
                  </a>
                );
              })}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
