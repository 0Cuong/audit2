import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Heart,
  Calendar,
  Sparkles,
  BookOpen,
  Mail,
  Compass,
  Music,
  MapPin,
  Clock,
  ListTodo,
  SlidersHorizontal,
  ChevronRight,
  Layers,
  Smile,
  ArrowUpRight,
  Check,
} from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { usePersonalization } from '../contexts/PersonalizationContext';
import { calculateTimeTogether, getDaysUntilAnniversary, formatDateLocale, parseDateInput } from '../lib/dateUtils';
import { safeGetStorage, safeSetStorage } from '../lib/storage';
import BlockContainer from '../components/blocks/BlockContainer';
import { renderWidget } from '../components/widgets/WidgetRegistry';

interface MemoryItem {
  id: string;
  title: string;
  description: string;
  media_type: string;
  url: string;
  date: string;
  is_favorite?: boolean;
  location?: { name?: string };
}

interface AnniversaryEvent {
  id: string;
  title: string;
  date: string;
  anniversary_type: string;
  recurrence?: string;
  photo_url?: string | null;
}

interface TimelineEvent {
  id: string;
  title: string;
  date: string;
  event_type: string;
  story?: string;
  location?: string;
}

interface MoodEntry {
  id: string;
  mood: string;
  note?: string;
  partner?: string;
  created_at: string;
}

const QUICK_MOODS = [
  { key: 'loved', emoji: '🥰', label: 'Yêu thương' },
  { key: 'happy', emoji: '😊', label: 'Vui vẻ' },
  { key: 'calm', emoji: '😌', label: 'Bình yên' },
  { key: 'excited', emoji: '🤩', label: 'Hào hứng' },
];

export default function Dashboard() {
  const { profile, lang } = useApp();
  const { blocks, isEditMode, setIsEditMode, setIsStudioOpen } = usePersonalization();

  const [showWidgetsSection, setShowWidgetsSection] = useState(false);
  const [selectedMoodKey, setSelectedMoodKey] = useState<string | null>(null);

  // Real couple names & dates
  const p1Name = profile?.partner1_name || 'Cường';
  const p2Name = profile?.partner2_name || 'Nghi';
  const p1Avatar = profile?.partner1_avatar || '/590610904_1909263110009109_2160755825373491978_n.jpg';
  const p2Avatar = profile?.partner2_avatar || '/605572670_122215932062047100_7842864668271503382_n.jpg';
  const startDate = profile?.relationship_start;

  const formattedStartDate = useMemo(() => {
    if (!startDate) return '18 Tháng 5, 2026';
    const d = parseDateInput(startDate);
    if (!d) return '18 Tháng 5, 2026';
    return `${d.getDate()} Tháng ${d.getMonth() + 1}, ${d.getFullYear()}`;
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

  // Load real memories
  const memories = useMemo(() => {
    return safeGetStorage<MemoryItem[]>('cuongisme_memories_v2', [
      {
        id: 'mem-1',
        title: 'Nụ cười tỏa nắng của em',
        description: 'Khoảnh khắc chụp lại lúc em cười tươi rạng rỡ nhất tại quán cà phê góc phố.',
        media_type: 'photo',
        url: '/605572670_122215932062047100_7842864668271503382_n.jpg',
        date: '2026-05-18',
        is_favorite: true,
        location: { name: 'The Little Cafe, Sài Gòn' },
      },
      {
        id: 'mem-2',
        title: 'Ảnh đôi đầu tiên bên bờ hồ',
        description: 'Tấm hình chụp chung đầu tiên đầy kỷ niệm của hai đứa sau chuyến đi dạo.',
        media_type: 'photo',
        url: '/590610904_1909263110009109_2160755825373491978_n.jpg',
        date: '2026-05-18',
        is_favorite: true,
        location: { name: 'Bờ hồ Tây' },
      },
    ]);
  }, []);

  // Spotlight Memory: prioritized favorite or first photo
  const spotlightMemory = useMemo(() => {
    return memories.find((m) => m.is_favorite && m.url) || memories[0] || null;
  }, [memories]);

  // Load real upcoming anniversaries
  const anniversaries = useMemo(() => {
    return safeGetStorage<AnniversaryEvent[]>('cuongisme_anniversaries', [
      {
        id: 'ann-1',
        title: 'Kỷ Niệm Ngày Yêu Nhau',
        date: '2026-05-18',
        anniversary_type: 'yearly',
        recurrence: 'yearly',
      },
      {
        id: 'ann-4',
        title: 'Kỷ Niệm Ngày 18 Hàng Tháng',
        date: '2026-05-18',
        anniversary_type: 'monthly',
        recurrence: 'monthly',
      },
      {
        id: 'ann-2',
        title: 'Sinh Nhật Xuân Nghi',
        date: '2005-01-03',
        anniversary_type: 'birthday',
        recurrence: 'birthday',
      },
      {
        id: 'ann-3',
        title: 'Sinh Nhật Mạnh Cường',
        date: '2004-09-12',
        anniversary_type: 'birthday',
        recurrence: 'birthday',
      },
    ]);
  }, []);

  // Compute nearest milestone
  const nearestMilestone = useMemo(() => {
    if (!anniversaries || anniversaries.length === 0) return null;

    let nearest = {
      event: anniversaries[0],
      daysLeft: 9999,
      isToday: false,
    };

    for (const event of anniversaries) {
      const res = getDaysUntilAnniversary(event.date, (event.recurrence as any) || 'yearly');
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

  // Load real timeline events for visual chronology
  const timelineEvents = useMemo(() => {
    return safeGetStorage<TimelineEvent[]>('cuongisme_timeline', [
      {
        id: 'tl-1',
        title: 'Lần Đầu Gặp Gỡ',
        date: '2026-05-18',
        event_type: 'first_meet',
        story: 'Khoảnh khắc đầu tiên hai đứa chạm mắt nhau, thời gian dường như ngưng đọng.',
        location: 'Quán Cafe hẹn ước',
      },
      {
        id: 'tl-2',
        title: 'Tin Nhắn Làm Quen Đầu Tiên',
        date: '2026-05-20',
        event_type: 'first_message',
        story: 'Những dòng tin nhắn vụng về nhưng ngập tràn háo hức thâu đêm.',
        location: 'Hà Nội & Sài Gòn',
      },
      {
        id: 'tl-3',
        title: 'Chuyến Đi Chơi Đầu Tiên',
        date: '2026-06-15',
        event_type: 'first_trip',
        story: 'Cùng nhau vi vu trên những cung đường lộng gió, ngắm hoàng hôn buông xuống.',
        location: 'Đà Lạt mộng mơ',
      },
    ]);
  }, []);

  // Load mood entries
  const [moodEntries, setMoodEntries] = useState<MoodEntry[]>(() => {
    return safeGetStorage<MoodEntry[]>('cuongisme_moods', [
      {
        id: 'm-1',
        mood: 'loved',
        note: 'Được người ấy ôm từ phía sau, ấm áp vô cùng!',
        partner: 'partner1',
        created_at: new Date().toISOString(),
      },
    ]);
  });

  const latestMood = moodEntries[0] || null;

  const handleQuickLogMood = (moodKey: string) => {
    setSelectedMoodKey(moodKey);
    const newEntry: MoodEntry = {
      id: 'local-' + Date.now(),
      mood: moodKey,
      note: 'Ghi nhanh từ trang chủ',
      partner: 'partner1',
      created_at: new Date().toISOString(),
    };
    const updated = [newEntry, ...moodEntries];
    setMoodEntries(updated);
    safeSetStorage('cuongisme_moods', updated);
  };

  return (
    <main className="pt-20 sm:pt-24 pb-28 min-h-screen text-zinc-100 relative">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 space-y-16">
        
        {/* ============================================================ */}
        {/* 1. OUR WORLD HERO: NAMES × STATEMENT × LIVING COUNTER       */}
        {/* ============================================================ */}
        <section 
          aria-label="Khởi đầu thế giới của hai đứa"
          className="pt-6 sm:pt-10 pb-6 border-b border-white/[0.08]"
        >
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
            <div className="space-y-4 max-w-2xl">
              {/* Couple portraits & privacy indicator */}
              <div className="flex items-center gap-3">
                <div className="flex -space-x-3 items-center">
                  <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-[#09090c] ring-1 ring-white/15 bg-zinc-800">
                    <img
                      src={p1Avatar}
                      alt={p1Name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-[#09090c] ring-1 ring-white/15 bg-zinc-800">
                    <img
                      src={p2Avatar}
                      alt={p2Name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>

                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.04] border border-white/10 text-[11px] font-mono text-zinc-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Không gian riêng tư</span>
                </div>
              </div>

              {/* Large Names: CƯỜNG × NGHI */}
              <div className="space-y-2">
                <h1 className="font-serif text-3xl sm:text-5xl md:text-6xl font-normal tracking-tight text-zinc-100 flex items-center gap-3 sm:gap-4 flex-wrap">
                  <span>{p1Name.toUpperCase()}</span>
                  <span className="text-amber-400/80 font-light text-2xl sm:text-4xl">×</span>
                  <span>{p2Name.toUpperCase()}</span>
                </h1>
                <p className="text-xs sm:text-sm text-zinc-400 font-light leading-relaxed">
                  Không gian số lưu giữ hành trình và những lát cắt bình dị của hai đứa.
                </p>
                <p className="text-xs font-mono text-zinc-500 uppercase tracking-wider">
                  Đồng hành cùng nhau từ ngày {formattedStartDate}
                </p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2.5 shrink-0 self-start md:self-end">
              <button
                type="button"
                onClick={() => setIsStudioOpen(true)}
                className="px-3.5 py-2 rounded-full bg-white/[0.04] hover:bg-white/10 border border-white/10 text-xs font-mono text-zinc-300 hover:text-white transition flex items-center gap-1.5 active:scale-95"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-amber-400/80" />
                <span>Studio</span>
              </button>

              <Link
                to="/memories"
                className="px-4 py-2 rounded-full bg-zinc-100 hover:bg-white text-zinc-950 text-xs font-semibold shadow-sm transition active:scale-95 flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5 text-zinc-900" />
                <span>Kho kỷ niệm</span>
              </Link>
            </div>
          </div>

          {/* Living Relationship Counter Bar */}
          <div className="mt-8 pt-6 border-t border-white/[0.05] grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
              <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">Năm bên nhau</span>
              <p className="font-serif text-2xl sm:text-3xl text-zinc-100 font-normal mt-1">
                {startDate ? `${timeTogether.years} năm` : '—'}
              </p>
            </div>
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
              <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">Tháng bên nhau</span>
              <p className="font-serif text-2xl sm:text-3xl text-zinc-100 font-normal mt-1">
                {startDate ? `${timeTogether.months} tháng` : '—'}
              </p>
            </div>
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
              <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">Tổng số ngày</span>
              <p className="font-serif text-2xl sm:text-3xl text-amber-300 font-normal mt-1">
                {startDate ? `${timeTogether.totalDays} ngày` : '—'}
              </p>
            </div>
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] flex flex-col justify-between">
              <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">Thời gian sống động</span>
              <p className="font-mono text-sm sm:text-base text-zinc-300 mt-1">
                {startDate ? `${timeTogether.hours}h ${timeTogether.minutes}m ${timeTogether.seconds}s` : 'Chưa thiết lập'}
              </p>
            </div>
          </div>
        </section>

        {/* ============================================================ */}
        {/* 2. MEMORY SPOTLIGHT: RESTRAINED METADATA & STRONG PHOTOGRAPHY */}
        {/* ============================================================ */}
        {spotlightMemory && (
          <section aria-label="Kỷ niệm tiêu điểm" className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase tracking-[0.2em] text-zinc-400 flex items-center gap-2">
                <Heart className="w-3.5 h-3.5 text-rose-400" />
                <span>Khoảnh khắc tiêu điểm</span>
              </span>
              <Link
                to="/memories"
                className="text-xs font-mono text-zinc-400 hover:text-white transition flex items-center gap-1"
              >
                <span>Toàn bộ kỷ niệm</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="rounded-3xl overflow-hidden bg-[#111115] border border-white/[0.08] grid grid-cols-1 md:grid-cols-12 shadow-2xl group">
              {/* Image Frame with Subtle Zoom on Hover */}
              <div className="md:col-span-7 aspect-[4/3] md:aspect-auto md:min-h-[420px] relative bg-zinc-900 overflow-hidden">
                <img
                  src={spotlightMemory.url}
                  alt={spotlightMemory.title}
                  className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                  loading="eager"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#111115] via-transparent to-transparent md:hidden" />
              </div>

              {/* Editorial Typography & Metadata */}
              <div className="md:col-span-5 p-6 sm:p-10 flex flex-col justify-between space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3 text-xs font-mono text-zinc-400">
                    <span className="text-amber-400/90 font-medium">
                      {formatDateLocale(spotlightMemory.date, lang)}
                    </span>
                    {spotlightMemory.location?.name && (
                      <>
                        <span>·</span>
                        <span className="flex items-center gap-1 line-clamp-1">
                          <MapPin className="w-3 h-3 text-zinc-500" />
                          <span>{spotlightMemory.location.name}</span>
                        </span>
                      </>
                    )}
                  </div>

                  <h2 className="font-serif text-2xl sm:text-3xl font-normal text-zinc-100 leading-snug">
                    {spotlightMemory.title}
                  </h2>

                  <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed font-light">
                    {spotlightMemory.description}
                  </p>
                </div>

                <div className="pt-4 border-t border-white/[0.06] flex items-center justify-between">
                  <span className="text-[11px] font-mono text-zinc-500 uppercase tracking-widest">
                    Khoảnh khắc đặc biệt
                  </span>
                  <Link
                    to="/memories"
                    className="px-4 py-1.5 rounded-full bg-white/[0.06] hover:bg-white/10 border border-white/10 text-xs font-mono text-zinc-200 hover:text-white transition"
                  >
                    Xem chi tiết
                  </Link>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ============================================================ */}
        {/* 3. TIMELINE PREVIEW: VISUAL CHRONOLOGY NOT A LIST OF CARDS   */}
        {/* ============================================================ */}
        <section aria-label="Dòng thời gian trực quan" className="space-y-6">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase tracking-[0.2em] text-zinc-400 flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>Dòng thời gian · Những cột mốc đầu tiên</span>
            </span>
            <Link
              to="/timeline"
              className="text-xs font-mono text-zinc-400 hover:text-white transition flex items-center gap-1"
            >
              <span>Xem toàn bộ dòng thời gian</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="relative pl-6 sm:pl-8 border-l border-white/10 space-y-8">
            {timelineEvents.slice(0, 3).map((event, idx) => (
              <div key={event.id} className="relative group">
                {/* Visual node on the timeline line */}
                <div className="absolute -left-[31px] sm:-left-[39px] top-1 w-3.5 h-3.5 rounded-full bg-[#09090c] border-2 border-amber-400/80 group-hover:border-amber-300 group-hover:scale-125 transition-transform" />
                
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-xs font-mono text-zinc-400">
                    <span className="text-amber-300/90 font-medium">
                      {formatDateLocale(event.date, lang)}
                    </span>
                    {event.location && (
                      <>
                        <span>·</span>
                        <span className="text-zinc-500">{event.location}</span>
                      </>
                    )}
                  </div>

                  <h3 className="font-serif text-lg sm:text-xl font-normal text-zinc-100 group-hover:text-amber-200 transition-colors">
                    {event.title}
                  </h3>

                  {event.story && (
                    <p className="text-xs sm:text-sm text-zinc-400 font-light leading-relaxed max-w-2xl">
                      {event.story}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ============================================================ */}
        {/* 4. TODAY & UPCOMING MOMENT (INTERACTIVE & HONEST DATA)       */}
        {/* ============================================================ */}
        <section aria-label="Hôm nay và khoảnh khắc sắp tới" className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Daily State: Lightweight Emotional Interaction */}
          <div className="p-6 rounded-2xl bg-[#111115] border border-white/[0.08] flex flex-col justify-between space-y-5">
            <div className="space-y-1">
              <span className="text-xs font-mono uppercase tracking-[0.2em] text-zinc-400 flex items-center gap-2">
                <Smile className="w-3.5 h-3.5 text-amber-400" />
                <span>Hôm nay · Chúng mình thế nào?</span>
              </span>
              <p className="text-xs text-zinc-400 font-light">
                Ghi nhanh cảm xúc hôm nay để lưu lại trong hành trình chung
              </p>
            </div>

            {/* Quick Mood Selection */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {QUICK_MOODS.map((item) => {
                const isSelected = selectedMoodKey === item.key || (latestMood && latestMood.mood === item.key && !selectedMoodKey);
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => handleQuickLogMood(item.key)}
                    className={`p-3 rounded-xl border text-center transition flex flex-col items-center gap-1.5 ${
                      isSelected
                        ? 'bg-amber-400/10 border-amber-400/40 text-white shadow-sm'
                        : 'bg-white/[0.02] border-white/[0.06] text-zinc-300 hover:bg-white/[0.06] hover:text-white'
                    }`}
                  >
                    <span className="text-xl">{item.emoji}</span>
                    <span className="text-[11px] font-medium">{item.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-white/[0.06]">
              <span className="text-[11px] font-mono text-zinc-500">
                {latestMood ? `Gần nhất: ${latestMood.note || latestMood.mood}` : 'Chưa ghi nhật ký cảm xúc'}
              </span>
              <Link
                to="/mood"
                className="text-xs font-mono text-zinc-400 hover:text-white transition flex items-center gap-1"
              >
                <span>Xem chi tiết</span>
                <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
          </div>

          {/* Upcoming Moment: Real Persisted Dates */}
          <div className="p-6 rounded-2xl bg-[#111115] border border-white/[0.08] flex flex-col justify-between space-y-5">
            <div className="space-y-1">
              <span className="text-xs font-mono uppercase tracking-[0.2em] text-zinc-400 flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5 text-rose-400" />
                <span>Cột mốc sắp tới</span>
              </span>
              <p className="text-xs text-zinc-400 font-light">
                Thời gian mong đợi cho ngày đặc biệt tiếp theo
              </p>
            </div>

            {nearestMilestone ? (
              <div className="space-y-2 py-2">
                <h3 className="font-serif text-2xl text-zinc-100 font-normal">
                  {nearestMilestone.event.title}
                </h3>
                <p className="text-3xl sm:text-4xl font-serif text-amber-300 font-normal">
                  {nearestMilestone.isToday ? (
                    'Hôm nay là ngày kỷ niệm!'
                  ) : (
                    <>
                      còn {nearestMilestone.daysLeft}{' '}
                      <span className="text-sm font-sans text-zinc-400">ngày nữa</span>
                    </>
                  )}
                </p>
              </div>
            ) : (
              <div className="py-4 text-xs text-zinc-500 font-light">
                Chưa có cột mốc nào được lưu. Bạn có thể thêm ngày kỷ niệm trong mục Ngày kỷ niệm.
              </div>
            )}

            <div className="flex items-center justify-between pt-2 border-t border-white/[0.06]">
              <span className="text-[11px] font-mono text-zinc-500">
                Lịch trình đôi mình
              </span>
              <Link
                to="/anniversary"
                className="text-xs font-mono text-zinc-400 hover:text-white transition flex items-center gap-1"
              >
                <span>Mở lịch kỷ niệm</span>
                <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </section>

        {/* ============================================================ */}
        {/* 5. QUIET CURATED EXPLORATION DESTINATIONS                    */}
        {/* ============================================================ */}
        <section aria-label="Khám phá các góc nhỏ" className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase tracking-[0.2em] text-zinc-400 flex items-center gap-2">
              <Compass className="w-3.5 h-3.5 text-zinc-400" />
              <span>Góc nhỏ trong không gian</span>
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { to: '/letters', label: 'Thư tình', desc: 'Thư tay gửi nhau', icon: Mail },
              { to: '/journal', label: 'Nhật ký', desc: 'Trang viết mỗi ngày', icon: BookOpen },
              { to: '/map', label: 'Bản đồ', desc: 'Góc quán kỷ niệm', icon: MapPin },
              { to: '/music', label: 'Giai điệu', desc: 'Những bài hát đôi', icon: Music },
              { to: '/bucket-list', label: 'Wishlist', desc: 'Điều ước cùng làm', icon: ListTodo },
              { to: '/hub', label: 'Lời nhắn', desc: 'Ghi chú nhanh', icon: Heart },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className="p-4 rounded-2xl bg-[#111115]/60 hover:bg-[#111115] border border-white/[0.06] hover:border-white/20 transition-all group flex flex-col justify-between"
                >
                  <div className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/10 flex items-center justify-center text-zinc-400 group-hover:text-amber-300 transition-colors mb-3">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-medium text-zinc-200 group-hover:text-white">
                      {item.label}
                    </h3>
                    <p className="text-[10px] text-zinc-500 font-light mt-0.5 line-clamp-1">
                      {item.desc}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        {/* ============================================================ */}
        {/* 6. COMPOSABLE PERSONAL WIDGETS (OPTIONAL / COLLAPSIBLE)      */}
        {/* ============================================================ */}
        {blocks.length > 0 && (
          <section aria-label="Widget tùy biến" className="pt-8 border-t border-white/[0.06] space-y-4">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setShowWidgetsSection((prev) => !prev)}
                className="text-xs font-mono uppercase tracking-[0.2em] text-zinc-400 hover:text-zinc-200 transition flex items-center gap-2"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Widget tùy biến ({blocks.length})</span>
                <span className="text-[10px] text-zinc-500 font-sans">
                  {showWidgetsSection ? '— Ẩn bớt' : '— Nhấn để mở'}
                </span>
              </button>

              {showWidgetsSection && (
                <button
                  type="button"
                  onClick={() => setIsEditMode((prev) => !prev)}
                  className="text-xs font-mono text-zinc-400 hover:text-white transition"
                >
                  {isEditMode ? '✓ Xong bố cục' : 'Sắp xếp widget'}
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
