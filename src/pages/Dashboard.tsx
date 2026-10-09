import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Heart,
  Calendar,
  Sparkles,
  BookOpen,
  Mail,
  Music,
  MapPin,
  Clock,
  ListTodo,
  SlidersHorizontal,
  ChevronRight,
  Layers,
  Smile,
  ArrowUpRight,
  Gift,
} from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { usePersonalization } from '../contexts/PersonalizationContext';
import { useMemories } from '../data/domain/useMemories';
import { useAnniversaries } from '../data/domain/useAnniversaries';
import { useTimeline } from '../data/domain/useTimeline';
import { useMoods } from '../data/domain/useMoods';
import { calculateTimeTogether, getDaysUntilAnniversary, formatDateLocale, parseDateInput } from '../lib/dateUtils';
import BlockContainer from '../components/blocks/BlockContainer';
import { renderWidget } from '../components/widgets/WidgetRegistry';
import Avatar from '../components/ui/Avatar';

const QUICK_MOODS = [
  { key: 'loved', emoji: '🥰', label: 'Yêu thương' },
  { key: 'happy', emoji: '😊', label: 'Vui vẻ' },
  { key: 'calm', emoji: '😌', label: 'Bình yên' },
  { key: 'excited', emoji: '🤩', label: 'Hào hứng' },
];

// Destination links for the exploration section — varied layout
const DESTINATIONS = [
  { to: '/letters', label: 'Thư tình', desc: 'Thư tay gửi nhau', icon: Mail, featured: true },
  { to: '/journal', label: 'Nhật ký', desc: 'Trang viết mỗi ngày', icon: BookOpen, featured: false },
  { to: '/map', label: 'Bản đồ', desc: 'Quán quen kỷ niệm', icon: MapPin, featured: false },
  { to: '/music', label: 'Giai điệu', desc: 'Những bài hát đôi', icon: Music, featured: true },
  { to: '/bucket-list', label: 'Wishlist', desc: 'Điều ước cùng làm', icon: ListTodo, featured: false },
  { to: '/gifts', label: 'Quà tặng', desc: 'Ý tưởng & kỷ vật', icon: Gift, featured: false },
];

export default function Dashboard() {
  const { profile, lang } = useApp();
  const { blocks, isEditMode, setIsEditMode, setIsStudioOpen } = usePersonalization();

  const { memories } = useMemories();
  const { anniversaries } = useAnniversaries();
  const { events: timelineEvents } = useTimeline();
  const { moods: moodEntries, addMood } = useMoods();

  const [showWidgetsSection, setShowWidgetsSection] = useState(false);
  const [selectedMoodKey, setSelectedMoodKey] = useState<string | null>(null);

  // Real couple names & dates
  const p1Name = profile?.partner1_name || 'Cường';
  const p2Name = profile?.partner2_name || 'Nghi';
  const p1Avatar = profile?.partner1_avatar && !profile.partner1_avatar.includes('590610904')
    ? profile.partner1_avatar
    : '/mcuong.jpg';
  const p2Avatar = profile?.partner2_avatar && !profile.partner2_avatar.includes('605572670')
    ? profile.partner2_avatar
    : '/xnghi.jpg';
  const startDate = profile?.relationship_start;

  const formattedStartDate = useMemo(() => {
    if (!startDate) return '';
    const d = parseDateInput(startDate);
    if (!d) return '';
    return `${d.getDate()} tháng ${d.getMonth() + 1}, ${d.getFullYear()}`;
  }, [startDate]);

  // Real-time counter
  const [timeTogether, setTimeTogether] = useState(() => calculateTimeTogether(startDate));

  useEffect(() => {
    setTimeTogether(calculateTimeTogether(startDate));
    const timer = setInterval(() => {
      setTimeTogether(calculateTimeTogether(startDate));
    }, 1000);
    return () => clearInterval(timer);
  }, [startDate]);

  // Spotlight Memory: prioritized favorite or first photo
  const spotlightMemory = useMemo(() => {
    return memories.find((m) => m.is_favorite && m.url) || memories.find((m) => m.url) || memories[0] || null;
  }, [memories]);

  // Compute nearest milestone
  const nearestMilestone = useMemo(() => {
    if (!anniversaries || anniversaries.length === 0) return null;

    let nearest = {
      event: anniversaries[0],
      daysLeft: 9999,
      isToday: false,
    };

    for (const event of anniversaries) {
      const res = getDaysUntilAnniversary(event.date, ((event as any).recurrence as any) || 'yearly');
      if (res.daysLeft < nearest.daysLeft) {
        nearest = {
          event,
          daysLeft: res.daysLeft,
          isToday: res.isToday,
        };
      }
    }
    return nearest;
  }, [anniversaries]);

  const latestMood = moodEntries[0] || null;

  const handleQuickLogMood = async (moodKey: string) => {
    setSelectedMoodKey(moodKey);
    try {
      await addMood({
        mood: moodKey,
        note: 'Ghi nhanh từ trang chủ',
        date: new Date().toISOString(),
        intensity: 4,
      });
    } catch {
      // Handled in hook
    }
  };

  return (
    <main className="pt-20 sm:pt-24 pb-28 min-h-[100dvh] text-zinc-100 relative">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 space-y-14">

        {/* ============================================================ */}
        {/* 1. HERO — IDENTITY + COUNTER                                  */}
        {/* ============================================================ */}
        <section
          aria-label="Không gian của hai đứa"
          className="pt-6 sm:pt-10 border-b border-white/[0.07]"
        >
          {/* Top row: avatars + privacy badge + studio shortcut */}
          <div className="flex items-start justify-between gap-4 mb-8">
            <div className="flex items-center gap-3">
              <div className="flex -space-x-3 items-center">
                <Avatar
                  src={p1Avatar}
                  alt={p1Name}
                  className="w-11 h-11 rounded-full border-2 border-[#09090c] ring-1 ring-white/15"
                />
                <Avatar
                  src={p2Avatar}
                  alt={p2Name}
                  className="w-11 h-11 rounded-full border-2 border-[#09090c] ring-1 ring-white/15"
                />
              </div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/[0.04] border border-white/10 text-[10px] font-mono text-zinc-500">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>Không gian riêng tư</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsStudioOpen(true)}
              className="shrink-0 px-3 py-1.5 rounded-full bg-white/[0.04] hover:bg-white/10 border border-white/10 text-[11px] font-mono text-zinc-300 hover:text-white transition flex items-center gap-1.5 active:scale-95"
            >
              <SlidersHorizontal className="w-3 h-3 text-amber-400/80" />
              <span>Studio</span>
            </button>
          </div>

          {/* Hero names — editorial, not all-caps */}
          <div className="space-y-2 mb-10">
            <h1 className="font-serif text-4xl sm:text-6xl md:text-7xl font-normal tracking-tight text-zinc-100 leading-[1.05]">
              <span>{p1Name}</span>
              <span className="text-amber-400/60 font-light mx-3 sm:mx-4 text-3xl sm:text-5xl md:text-6xl">&</span>
              <span>{p2Name}</span>
            </h1>
            <p className="text-sm text-zinc-400 font-light leading-relaxed max-w-lg">
              Không gian số lưu giữ hành trình và những lát cắt bình dị của hai đứa.
            </p>
            {formattedStartDate && (
              <p className="text-[11px] font-mono text-zinc-600 tracking-wider">
                Bắt đầu từ {formattedStartDate}
              </p>
            )}
          </div>

          {/* Counter — differentiated cells, highlight total days */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pb-10">
            {/* Years — standard */}
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.05] space-y-1">
              <span className="text-[9px] font-mono uppercase tracking-[0.14em] text-zinc-600">Năm</span>
              <p className="font-serif text-2xl sm:text-3xl text-zinc-200 font-normal leading-none">
                {startDate ? timeTogether.years : '0'}
              </p>
            </div>

            {/* Months — standard */}
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.05] space-y-1">
              <span className="text-[9px] font-mono uppercase tracking-[0.14em] text-zinc-600">Tháng</span>
              <p className="font-serif text-2xl sm:text-3xl text-zinc-200 font-normal leading-none">
                {startDate ? timeTogether.months : '0'}
              </p>
            </div>

            {/* Total Days — hero cell, visually highlighted */}
            <div className="p-4 rounded-xl bg-amber-400/[0.06] border border-amber-400/20 space-y-1 relative overflow-hidden">
              <span className="text-[9px] font-mono uppercase tracking-[0.14em] text-amber-500/70">Tổng số ngày</span>
              <p className="font-serif text-2xl sm:text-3xl text-amber-300 font-normal leading-none">
                {startDate ? timeTogether.totalDays.toLocaleString('vi-VN') : '0'}
              </p>
            </div>

            {/* Live clock — monospace, secondary */}
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.05] space-y-1 flex flex-col justify-between">
              <span className="text-[9px] font-mono uppercase tracking-[0.14em] text-zinc-600">Thời gian thực</span>
              <p className="font-mono text-[11px] sm:text-xs text-zinc-500 leading-snug tabular-nums">
                {startDate
                  ? `${timeTogether.hours}h ${timeTogether.minutes}m ${timeTogether.seconds}s`
                  : 'Chưa thiết lập'}
              </p>
            </div>
          </div>
        </section>

        {/* ============================================================ */}
        {/* 2. MEMORY SPOTLIGHT — EDITORIAL MAGAZINE LAYOUT               */}
        {/* ============================================================ */}
        {spotlightMemory && (
          <section aria-label="Kỷ niệm tiêu điểm" className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-zinc-400">
                <Heart className="w-3.5 h-3.5 text-rose-400" />
                <span className="text-xs font-light">Khoảnh khắc nổi bật</span>
              </div>
              <Link
                to="/memories"
                className="text-xs font-mono text-zinc-500 hover:text-white transition flex items-center gap-1"
              >
                <span>Toàn bộ kỷ niệm</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="rounded-3xl overflow-hidden bg-[#111115] border border-white/[0.07] grid grid-cols-1 md:grid-cols-12 shadow-2xl group">
              {/* Image Frame */}
              <div className="md:col-span-7 aspect-[4/3] md:aspect-auto md:min-h-[400px] relative bg-zinc-900 overflow-hidden">
                <img
                  src={spotlightMemory.url}
                  alt={spotlightMemory.title}
                  className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-[1.03]"
                  loading="eager"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#111115] via-transparent to-transparent md:hidden" />
              </div>

              {/* Editorial Typography & Metadata */}
              <div className="md:col-span-5 p-6 sm:p-8 flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-xs font-mono text-zinc-500">
                    <span className="text-amber-400/90">
                      {formatDateLocale(spotlightMemory.date, lang)}
                    </span>
                    {spotlightMemory.location?.name && (
                      <>
                        <span>·</span>
                        <span className="flex items-center gap-1 line-clamp-1">
                          <MapPin className="w-3 h-3 text-zinc-600" />
                          <span>{spotlightMemory.location.name}</span>
                        </span>
                      </>
                    )}
                  </div>

                  <h2 className="font-serif text-2xl sm:text-3xl font-normal text-zinc-100 leading-snug">
                    {spotlightMemory.title}
                  </h2>

                  {spotlightMemory.description && (
                    <p className="text-sm text-zinc-400 leading-relaxed font-light line-clamp-4">
                      {spotlightMemory.description}
                    </p>
                  )}
                </div>

                <div className="pt-4 border-t border-white/[0.06] flex items-center justify-between">
                  <span className="text-[10px] font-mono text-zinc-600 uppercase tracking-wider">
                    Khoảnh khắc đặc biệt
                  </span>
                  <Link
                    to="/memories"
                    className="px-4 py-1.5 rounded-full bg-white/[0.05] hover:bg-white/10 border border-white/10 text-xs font-mono text-zinc-300 hover:text-white transition"
                  >
                    Xem chi tiết
                  </Link>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ============================================================ */}
        {/* 3. TODAY & UPCOMING — MOOD + MILESTONE SIDE BY SIDE           */}
        {/* ============================================================ */}
        <section aria-label="Hôm nay và khoảnh khắc sắp tới" className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Daily Mood */}
          <div className="p-6 rounded-2xl bg-[#111115] border border-white/[0.07] flex flex-col justify-between gap-5">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-zinc-400 mb-1">
                <Smile className="w-3.5 h-3.5 text-amber-400/80" />
                <span className="text-xs font-light">Hôm nay — chúng mình thế nào?</span>
              </div>
              <p className="text-[11px] text-zinc-600 font-light">
                Ghi nhanh cảm xúc hôm nay để lưu trong hành trình chung
              </p>
            </div>

            {/* Quick Mood Selection */}
            <div className="grid grid-cols-4 gap-2">
              {QUICK_MOODS.map((item) => {
                const isSelected = selectedMoodKey === item.key || (latestMood && latestMood.mood === item.key && !selectedMoodKey);
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => handleQuickLogMood(item.key)}
                    className={`p-2.5 rounded-xl border text-center transition flex flex-col items-center gap-1 active:scale-95 ${
                      isSelected
                        ? 'bg-amber-400/10 border-amber-400/30 text-white'
                        : 'bg-white/[0.02] border-white/[0.06] text-zinc-300 hover:bg-white/[0.06] hover:text-white'
                    }`}
                  >
                    <span className="text-lg leading-none">{item.emoji}</span>
                    <span className="text-[10px] font-medium leading-none">{item.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-white/[0.05]">
              <span className="text-[10px] font-mono text-zinc-600">
                {latestMood ? `Gần nhất: ${latestMood.note || latestMood.mood}` : 'Chưa ghi nhật ký cảm xúc'}
              </span>
              <Link
                to="/mood"
                className="text-[11px] font-mono text-zinc-500 hover:text-white transition flex items-center gap-1"
              >
                <span>Xem chi tiết</span>
                <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
          </div>

          {/* Upcoming Milestone */}
          <div className="p-6 rounded-2xl bg-[#111115] border border-white/[0.07] flex flex-col justify-between gap-5">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-zinc-400 mb-1">
                <Calendar className="w-3.5 h-3.5 text-rose-400/80" />
                <span className="text-xs font-light">Cột mốc sắp tới</span>
              </div>
              <p className="text-[11px] text-zinc-600 font-light">
                Thời gian mong đợi cho ngày đặc biệt tiếp theo
              </p>
            </div>

            {nearestMilestone ? (
              <div className="space-y-1 flex-grow flex flex-col justify-center py-2">
                <p className="text-xs font-mono text-zinc-500 uppercase tracking-wider">
                  {nearestMilestone.event.title}
                </p>
                <p className="font-serif text-4xl sm:text-5xl text-amber-300 font-normal leading-none">
                  {nearestMilestone.isToday ? 'Hôm nay!' : nearestMilestone.daysLeft}
                </p>
                {!nearestMilestone.isToday && (
                  <p className="text-xs text-zinc-500 font-light">ngày nữa</p>
                )}
              </div>
            ) : (
              <div className="flex-grow flex items-center">
                <p className="text-xs text-zinc-600 font-light leading-relaxed">
                  Chưa có cột mốc nào. Thêm ngày kỷ niệm để đếm ngược cùng nhau.
                </p>
              </div>
            )}

            <div className="flex items-center justify-between pt-2 border-t border-white/[0.05]">
              <span className="text-[10px] font-mono text-zinc-600">Lịch trình đôi mình</span>
              <Link
                to="/anniversary"
                className="text-[11px] font-mono text-zinc-500 hover:text-white transition flex items-center gap-1"
              >
                <span>Mở lịch kỷ niệm</span>
                <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </section>

        {/* ============================================================ */}
        {/* 4. TIMELINE — VISUAL CHRONOLOGY                               */}
        {/* ============================================================ */}
        {timelineEvents.length > 0 && (
          <section aria-label="Dòng thời gian" className="space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-zinc-400">
                <Clock className="w-3.5 h-3.5 text-amber-400/80" />
                <span className="text-xs font-light">Những cột mốc đầu tiên</span>
              </div>
              <Link
                to="/timeline"
                className="text-[11px] font-mono text-zinc-500 hover:text-white transition flex items-center gap-1"
              >
                <span>Toàn bộ dòng thời gian</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="relative pl-6 sm:pl-8 border-l border-white/[0.08] space-y-7">
              {timelineEvents.slice(0, 3).map((event) => (
                <div key={event.id} className="relative group">
                  {/* Visual node */}
                  <div className="absolute -left-[31px] sm:-left-[39px] top-1 w-3 h-3 rounded-full bg-[#09090c] border-2 border-amber-400/70 group-hover:border-amber-300 group-hover:scale-125 transition-transform" />

                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-[11px] font-mono text-zinc-500">
                      <span className="text-amber-400/80">
                        {formatDateLocale(event.date, lang)}
                      </span>
                      {(event as any).location && (
                        <>
                          <span>·</span>
                          <span className="text-zinc-600">{(event as any).location}</span>
                        </>
                      )}
                    </div>

                    <h3 className="font-serif text-lg sm:text-xl font-normal text-zinc-100 group-hover:text-amber-200 transition-colors leading-snug">
                      {event.title}
                    </h3>

                    {((event as any).story || (event as any).description) && (
                      <p className="text-sm text-zinc-500 font-light leading-relaxed max-w-2xl line-clamp-2">
                        {(event as any).story || (event as any).description}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ============================================================ */}
        {/* 5. EXPLORATION — VARIED LAYOUT, NOT EQUAL GRID               */}
        {/* ============================================================ */}
        <section aria-label="Các góc nhỏ trong không gian" className="space-y-4">
          <div className="flex items-center gap-2 text-zinc-400">
            <Sparkles className="w-3.5 h-3.5 text-zinc-500" />
            <span className="text-xs font-light">Góc nhỏ trong không gian</span>
          </div>

          {/* Asymmetric grid: 2 featured (wider) + 4 compact */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {DESTINATIONS.map((item, idx) => {
              const Icon = item.icon;
              const isFeatured = item.featured;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`group flex flex-col justify-between rounded-2xl border transition-all hover:border-white/20 active:scale-[0.98] ${
                    isFeatured
                      ? 'p-5 bg-[#111115] border-white/[0.08] hover:bg-[#141418] sm:col-span-1'
                      : 'p-4 bg-[#0e0e12] border-white/[0.05] hover:bg-[#111115]'
                  }`}
                  style={{ animationDelay: `${idx * 40}ms` }}
                >
                  <div className={`rounded-xl border flex items-center justify-center mb-3 shrink-0 ${
                    isFeatured
                      ? 'w-9 h-9 bg-amber-400/[0.08] border-amber-400/20 text-amber-300/80'
                      : 'w-8 h-8 bg-white/[0.04] border-white/10 text-zinc-400 group-hover:text-amber-300/70 transition-colors'
                  }`}>
                    <Icon className={isFeatured ? 'w-4.5 h-4.5' : 'w-4 h-4'} />
                  </div>
                  <div>
                    <h3 className={`font-medium text-zinc-200 group-hover:text-white transition-colors ${isFeatured ? 'text-sm' : 'text-xs'}`}>
                      {item.label}
                    </h3>
                    <p className="text-[10px] text-zinc-600 font-light mt-0.5 line-clamp-1">
                      {item.desc}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Secondary destinations row */}
          <div className="flex flex-wrap gap-2 pt-1">
            {[
              { to: '/hub', label: 'Lời nhắn', icon: Heart },
              { to: '/zodiac', label: 'Cung hoàng đạo', icon: Sparkles },
              { to: '/anniversary', label: 'Ngày kỷ niệm', icon: Calendar },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.06] hover:border-white/15 text-[11px] font-mono text-zinc-400 hover:text-zinc-200 transition-all"
                >
                  <Icon className="w-3 h-3" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </section>

        {/* ============================================================ */}
        {/* 6. PERSONAL WIDGETS (OPTIONAL / COLLAPSIBLE)                  */}
        {/* ============================================================ */}
        {blocks.length > 0 && (
          <section aria-label="Widget tùy biến" className="pt-6 border-t border-white/[0.05] space-y-4">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setShowWidgetsSection((prev) => !prev)}
                className="text-xs font-mono text-zinc-500 hover:text-zinc-200 transition flex items-center gap-2"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Widget tùy biến ({blocks.length})</span>
                <span className="text-[10px] text-zinc-600 font-sans">
                  {showWidgetsSection ? '(Ẩn bớt)' : '(Nhấn để mở)'}
                </span>
              </button>

              {showWidgetsSection && (
                <button
                  type="button"
                  onClick={() => setIsEditMode((prev) => !prev)}
                  className="text-xs font-mono text-zinc-500 hover:text-white transition"
                >
                  {isEditMode ? 'Xong bố cục' : 'Sắp xếp widget'}
                </button>
              )}
            </div>

            <AnimatePresence>
              {showWidgetsSection && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-4"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {blocks.map((block, idx) => (
                      <BlockContainer
                        key={block.id}
                        block={block}
                        index={idx}
                        totalBlocks={blocks.length}
                      >
                        {renderWidget(block)}
                      </BlockContainer>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </section>
        )}

      </div>
    </main>
  );
}
