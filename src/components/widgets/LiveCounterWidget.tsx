import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Heart, Clock } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { usePersonalization } from '../../contexts/PersonalizationContext';
import { calculateTimeTogether } from '../../lib/dateUtils';
import { type WorkspaceBlock } from '../../types/personalization';

interface LiveCounterWidgetProps {
  block?: WorkspaceBlock;
}

export default function LiveCounterWidget({ block: _block }: LiveCounterWidgetProps) {
  const { profile } = useApp();
  const { identity } = usePersonalization();

  const startDate = profile?.relationship_start;
  const [time, setTime] = useState(() => calculateTimeTogether(startDate));

  useEffect(() => {
    const tick = () => setTime(calculateTimeTogether(startDate));
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [startDate]);

  const counters = [
    { value: time.years, label: 'NĂM' },
    { value: time.months, label: 'THÁNG' },
    { value: time.days, label: 'NGÀY' },
    { value: time.hours, label: 'GIỜ' },
  ];

  const partner1Name = profile?.partner1_name || identity.partner1Name || 'Partner 1';
  const partner2Name = profile?.partner2_name || identity.partner2Name || 'Partner 2';
  const partner1Avatar = profile?.partner1_avatar || identity.partner1Avatar;
  const partner2Avatar = profile?.partner2_avatar || identity.partner2Avatar;

  return (
    <section className="text-center py-4 relative select-none">
      {/* Identity Badges */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 flex flex-col items-center"
      >
        <div className="flex items-center justify-center gap-3 sm:gap-4 mb-3">
          {/* Partner 1 */}
          <div className="flex items-center gap-2.5 bg-zinc-900/80 border border-white/10 px-3.5 py-1.5 rounded-full shadow-lg backdrop-blur-md">
            {partner1Avatar ? (
              <img
                src={partner1Avatar}
                alt={partner1Name}
                className="w-8 h-8 rounded-full object-cover border border-white/20"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-zinc-800 border border-white/20 flex items-center justify-center text-white font-pixel text-xs">
                {partner1Name?.charAt(0) || 'M'}
              </div>
            )}
            <span className="text-sm sm:text-base font-bold tracking-wide text-zinc-100">
              {partner1Name}
            </span>
          </div>

          {/* Heart center */}
          <motion.div
            animate={{ scale: [1, 1.2, 1.05, 1.2, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            className="flex items-center justify-center"
            style={{ color: identity.profileAccent || '#f43f5e' }}
          >
            <Heart className="w-5 h-5 fill-current drop-shadow-[0_0_8px_rgba(244,63,94,0.5)]" />
          </motion.div>

          {/* Partner 2 */}
          <div className="flex items-center gap-2.5 bg-zinc-900/80 border border-white/10 px-3.5 py-1.5 rounded-full shadow-lg backdrop-blur-md">
            <span className="text-sm sm:text-base font-bold tracking-wide text-zinc-100">
              {partner2Name}
            </span>
            {partner2Avatar ? (
              <img
                src={partner2Avatar}
                alt={partner2Name}
                className="w-8 h-8 rounded-full object-cover border border-white/20"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-zinc-800 border border-white/20 flex items-center justify-center text-white font-pixel text-xs">
                {partner2Name?.charAt(0) || 'N'}
              </div>
            )}
          </div>
        </div>

        {/* Subtitle / Bio */}
        <p className="font-script text-2xl sm:text-3xl text-zinc-300 tracking-wide font-normal">
          {identity.statusMessage ? `"${identity.statusMessage}"` : 'Tụi mình đã bên nhau được'}
        </p>
      </motion.div>

      {/* 4 Counter Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 max-w-2xl mx-auto">
        {counters.map((item) => (
          <div
            key={item.label}
            className="glass p-4 sm:p-5 shadow-xl hover:border-white/20 transition-all duration-300 group"
          >
            <div className="font-serif text-3xl sm:text-4xl lg:text-5xl font-medium tracking-tight text-zinc-100 tabular-nums group-hover:scale-105 transition-transform duration-300">
              {String(item.value).padStart(2, '0')}
            </div>
            <div className="font-mono text-[10px] sm:text-[11px] text-zinc-400 mt-2 font-semibold uppercase tracking-[0.25em]">
              {item.label}
            </div>
          </div>
        ))}
      </div>

      {/* Live Total Pill */}
      {time.totalDays > 0 && (
        <div className="mt-4 flex items-center justify-center gap-2">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/[0.03] border border-white/10 text-xs font-mono text-zinc-400 backdrop-blur-md">
            <span>Tổng cộng:</span>
            <span className="text-zinc-100 font-bold font-mono tracking-wider">
              {time.totalDays.toLocaleString()}
            </span>
            <span>ngày yêu thương</span>
            <span className="text-zinc-600">•</span>
            <span className="text-zinc-300 font-mono tabular-nums">
              {String(time.minutes).padStart(2, '0')}:{String(time.seconds).padStart(2, '0')}s
            </span>
          </div>
        </div>
      )}

      {/* Setup Prompt if not configured */}
      {!startDate && (
        <div className="mt-4 flex items-center justify-center">
          <Link
            to="/settings"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-rose-500/10 border border-rose-500/20 text-xs font-mono text-rose-300 hover:bg-rose-500/20 transition"
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Thiết lập ngày bắt đầu yêu trong Cài đặt</span>
          </Link>
        </div>
      )}
    </section>
  );
}
