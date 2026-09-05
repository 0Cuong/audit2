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
  Edit3,
} from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { usePersonalization } from '../contexts/PersonalizationContext';
import { calculateTimeTogether, getDaysUntilAnniversary, formatDateLocale } from '../lib/dateUtils';
import { safeGetStorage } from '../lib/storage';
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

export default function Dashboard() {
  const { t, profile, lang } = useApp();
  const { blocks, isEditMode, setIsEditMode, setIsStudioOpen } = usePersonalization();

  const [showWidgetsSection, setShowWidgetsSection] = useState(false);

  // Real couple names & dates
  const p1Name = profile?.partner1_name || 'Cường';
  const p2Name = profile?.partner2_name || 'Nghi';
  const p1Avatar = profile?.partner1_avatar || '/590610904_1909263110009109_2160755825373491978_n.jpg';
  const p2Avatar = profile?.partner2_avatar || '/605572670_122215932062047100_7842864668271503382_n.jpg';
  const startDate = profile?.relationship_start;

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
        date: '2024-05-18',
        is_favorite: true,
        location: { name: 'The Little Cafe, Sài Gòn' },
      },
      {
        id: 'mem-2',
        title: 'Ảnh đôi đầu tiên bên bờ hồ',
        description: 'Tấm hình chụp chung đầu tiên đầy kỷ niệm của hai đứa sau chuyến đi dạo.',
        media_type: 'photo',
        url: '/590610904_1909263110009109_2160755825373491978_n.jpg',
        date: '2024-05-18',
        is_favorite: true,
        location: { name: 'Bờ hồ Tây' },
      }
    ]);
  }, []);

  // Featured memory: prioritized favorite or first photo
  const featuredMemory = useMemo(() => {
    return memories.find((m) => m.is_favorite && m.url) || memories[0] || null;
  }, [memories]);

  // Load real upcoming anniversaries
  const anniversaries = useMemo(() => {
    return safeGetStorage<AnniversaryEvent[]>('cuongisme_anniversaries', [
      {
        id: 'ann-1',
        title: 'Kỷ Niệm Ngày Yêu Nhau',
        date: '2024-05-18',
        anniversary_type: 'yearly',
        recurrence: 'yearly',
      },
      {
        id: 'ann-4',
        title: 'Kỷ Niệm Ngày 18 Hàng Tháng',
        date: '2024-05-18',
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
      }
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

  // Check for unfinished draft in journal
  const hasJournalDraft = useMemo(() => {
    const draft = safeGetStorage<any>('cuongisme_journal_draft_v2', null);
    return Boolean(draft?.content?.trim() || draft?.title?.trim());
  }, []);

  // Check letters
  const letters = useMemo(() => {
    return safeGetStorage<any[]>('cuongisme_letters', []);
  }, []);

  // Check bucket list items
  const bucketList = useMemo(() => {
    return safeGetStorage<any[]>('cuongisme_bucket', [
      { id: 'b-1', title: 'Cùng nhau ngắm hoàng hôn trên bãi biển', completed: true },
      { id: 'b-2', title: 'Đi du lịch Đà Lạt mùa dã quỳ', completed: false },
      { id: 'b-3', title: 'Nấu một bữa tối thật thịnh soạn cùng nhau', completed: false },
    ]);
  }, []);

  const nextWish = useMemo(() => {
    return bucketList.find((item) => !item.completed) || bucketList[0] || null;
  }, [bucketList]);

  return (
    <main className="pt-20 sm:pt-24 pb-28 min-h-screen text-zinc-100 relative">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 space-y-12">
        
        {/* ============================================================ */}
        {/* 1. IDENTITY HEADER: WHO ARE WE?                              */}
        {/* ============================================================ */}
        <section 
          aria-label="Thông tin đôi mình"
          className="pt-4 pb-2 border-b border-white/[0.07]"
        >
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-3">
              {/* Couple Portraits & Private Badge */}
              <div className="flex items-center gap-3">
                <div className="flex -space-x-3 items-center">
                  <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-[#121214] ring-1 ring-white/10 bg-zinc-800">
                    <img
                      src={p1Avatar}
                      alt={p1Name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-[#121214] ring-1 ring-white/10 bg-zinc-800">
                    <img
                      src={p2Avatar}
                      alt={p2Name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>

                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.04] border border-white/10 text-[11px] font-mono text-zinc-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Không gian riêng tư</span>
                </div>
              </div>

              {/* Names & Editorial Subline */}
              <div>
                <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-normal tracking-tight text-zinc-100">
                  {p1Name} &amp; {p2Name}
                </h1>
                <p className="text-xs sm:text-sm text-zinc-400 font-light mt-1">
                  Đồng hành cùng nhau từ ngày 18 Tháng 5, 2024 · Sài Gòn
                </p>
              </div>
            </div>

            {/* Quiet Action Buttons */}
            <div className="flex items-center gap-2.5 shrink-0">
              <button
                type="button"
                onClick={() => setIsStudioOpen(true)}
                className="px-3.5 py-1.5 rounded-full bg-white/[0.04] hover:bg-white/10 border border-white/10 text-xs font-mono text-zinc-300 hover:text-white transition flex items-center gap-1.5 active:scale-95"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-amber-400/80" />
                <span>Studio</span>
              </button>

              <Link
                to="/memories"
                className="px-4 py-1.5 rounded-full bg-zinc-100 hover:bg-white text-zinc-950 text-xs font-semibold shadow-sm transition active:scale-95 flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5 text-zinc-900" />
                <span>Xem kỷ niệm</span>
              </Link>
            </div>
          </div>
        </section>

        {/* ============================================================ */}
        {/* 2. TODAY: WHAT MATTERS TODAY?                                */}
        {/* ============================================================ */}
        <section aria-label="Hôm nay của tụi mình" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-mono uppercase tracking-[0.2em] text-zinc-400 flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5 text-amber-400/80" />
              <span>Hôm nay</span>
            </h2>
            <span className="text-xs text-zinc-500 font-mono">
              {new Date().toLocaleDateString(lang === 'vi' ? 'vi-VN' : 'en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Days Together Counter Card */}
            <div className="p-5 rounded-2xl bg-zinc-900/60 border border-white/[0.08] flex flex-col justify-between">
              <span className="text-xs text-zinc-400 font-light">
                Thời gian bên nhau
              </span>
              {startDate ? (
                <>
                  <div className="my-3">
                    <div className="font-serif text-3xl sm:text-4xl text-zinc-100 font-normal tracking-tight">
                      {timeTogether.totalDays}{' '}
                      <span className="text-xs sm:text-sm font-sans text-zinc-400">ngày</span>
                    </div>
                    <div className="text-[11px] font-mono text-zinc-500 mt-1 flex items-center gap-2">
                      <span>{timeTogether.years} năm</span>
                      <span>·</span>
                      <span>{timeTogether.months} tháng</span>
                      <span>·</span>
                      <span>{timeTogether.days} ngày</span>
                    </div>
                  </div>
                  <div className="text-[11px] text-zinc-500 font-mono">
                    {timeTogether.hours}h {timeTogether.minutes}m {timeTogether.seconds}s
                  </div>
                </>
              ) : (
                <div className="my-3">
                  <p className="text-xs text-zinc-400 mb-2 font-light">Chưa thiết lập ngày bắt đầu yêu</p>
                  <Link
                    to="/settings"
                    className="inline-flex items-center gap-1.5 text-xs text-rose-400 hover:text-rose-300 font-mono transition"
                  >
                    <span>Thiết lập ngay</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              )}
            </div>

            {/* Nearest Milestone / Anniversary */}
            <div className="p-5 rounded-2xl bg-zinc-900/60 border border-white/[0.08] flex flex-col justify-between">
              <span className="text-xs text-zinc-400 font-light">
                Cột mốc sắp tới
              </span>
              {nearestMilestone ? (
                <div className="my-3 space-y-1">
                  <h3 className="text-base font-serif text-zinc-100 font-normal line-clamp-1">
                    {nearestMilestone.event.title}
                  </h3>
                  <p className="text-2xl font-serif text-amber-300 font-normal">
                    {nearestMilestone.isToday ? (
                      'Hôm nay là ngày kỷ niệm!'
                    ) : (
                      <>
                        còn {nearestMilestone.daysLeft}{' '}
                        <span className="text-xs font-sans text-zinc-400">ngày nữa</span>
                      </>
                    )}
                  </p>
                </div>
              ) : (
                <p className="text-xs text-zinc-500 my-3">Chưa có ngày kỷ niệm</p>
              )}
              <Link
                to="/anniversary"
                className="text-[11px] text-zinc-400 hover:text-white transition flex items-center gap-1 font-mono"
              >
                <span>Xem tất cả mốc kỷ niệm</span>
                <ChevronRight className="w-3 h-3" />
              </Link>
            </div>

            {/* Recent Message or Thought */}
            <div className="p-5 rounded-2xl bg-zinc-900/60 border border-white/[0.08] flex flex-col justify-between">
              <span className="text-xs text-zinc-400 font-light">
                Lời nhắn gửi gần nhất
              </span>
              <div className="my-3">
                {letters.length > 0 ? (
                  <p className="text-xs text-zinc-300 italic line-clamp-3 leading-relaxed font-light">
                    "{letters[0].content || letters[0].title}"
                  </p>
                ) : (
                  <p className="text-xs text-zinc-400 italic line-clamp-3 leading-relaxed font-light">
                    "Gửi người anh yêu thương nhất: Cảm ơn em vì đã luôn ở bên anh qua từng ngày bình dị."
                  </p>
                )}
              </div>
              <Link
                to="/letters"
                className="text-[11px] text-zinc-400 hover:text-white transition flex items-center gap-1 font-mono"
              >
                <span>Mở hộp thư tình</span>
                <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </section>

        {/* ============================================================ */}
        {/* 3. FEATURED MEMORY: ONE STRONG MEMORY WITH VISUAL WEIGHT     */}
        {/* ============================================================ */}
        {featuredMemory && (
          <section aria-label="Kỷ niệm nổi bật" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-mono uppercase tracking-[0.2em] text-zinc-400 flex items-center gap-2">
                <Heart className="w-3.5 h-3.5 text-rose-400/80" />
                <span>Khoảnh khắc đáng nhớ</span>
              </h2>
              <Link
                to="/memories"
                className="text-xs text-zinc-400 hover:text-white transition font-mono flex items-center gap-1"
              >
                <span>Toàn bộ kỷ niệm</span>
                <ChevronRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="rounded-3xl overflow-hidden bg-zinc-900/70 border border-white/[0.08] grid grid-cols-1 md:grid-cols-12 shadow-xl">
              {/* Image Frame */}
              <div className="md:col-span-7 aspect-[4/3] md:aspect-auto md:min-h-[360px] relative bg-zinc-800 overflow-hidden">
                <img
                  src={featuredMemory.url}
                  alt={featuredMemory.title}
                  className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent md:hidden" />
              </div>

              {/* Editorial Caption Side */}
              <div className="md:col-span-5 p-6 sm:p-8 flex flex-col justify-between space-y-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-xs font-mono text-zinc-400">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{formatDateLocale(featuredMemory.date, lang)}</span>
                    {featuredMemory.location?.name && (
                      <>
                        <span>·</span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-amber-400/80" />
                          <span className="line-clamp-1">{featuredMemory.location.name}</span>
                        </span>
                      </>
                    )}
                  </div>

                  <h3 className="font-serif text-2xl sm:text-3xl font-normal text-zinc-100 leading-snug">
                    {featuredMemory.title}
                  </h3>

                  <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed font-light">
                    {featuredMemory.description}
                  </p>
                </div>

                <div className="pt-4 border-t border-white/[0.06] flex items-center justify-between">
                  <span className="text-[11px] font-mono text-zinc-500">
                    Kỷ niệm được ghim
                  </span>
                  <Link
                    to="/memories"
                    className="px-4 py-1.5 rounded-full bg-white/[0.06] hover:bg-white/10 border border-white/10 text-xs font-mono text-zinc-200 transition"
                  >
                    Xem chi tiết
                  </Link>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ============================================================ */}
        {/* 4. CONTINUE: WHAT CAN WE CONTINUE?                           */}
        {/* ============================================================ */}
        <section aria-label="Tiếp tục" className="space-y-4">
          <h2 className="text-xs font-mono uppercase tracking-[0.2em] text-zinc-400 flex items-center gap-2">
            <Edit3 className="w-3.5 h-3.5 text-amber-400/80" />
            <span>Tiếp tục</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Action 1: Journal */}
            <Link
              to="/journal"
              className="p-5 rounded-2xl bg-zinc-900/60 hover:bg-zinc-900/90 border border-white/[0.08] hover:border-white/20 transition-all group flex flex-col justify-between space-y-4"
            >
              <div className="flex items-center justify-between">
                <div className="w-9 h-9 rounded-xl bg-white/[0.04] border border-white/10 flex items-center justify-center text-amber-400 group-hover:scale-105 transition-transform">
                  <BookOpen className="w-4 h-4" />
                </div>
                <span className="text-[11px] font-mono text-zinc-500">Nhật ký</span>
              </div>
              <div>
                <h3 className="text-sm font-medium text-zinc-100 group-hover:text-white">
                  {hasJournalDraft ? 'Tiếp tục bản nháp nhật ký' : 'Viết dòng nhật ký hôm nay'}
                </h3>
                <p className="text-xs text-zinc-400 font-light mt-1 line-clamp-2">
                  {hasJournalDraft
                    ? 'Bạn đang có một bản nháp chưa lưu hoàn tất.'
                    : 'Ghi lại những cảm xúc nhỏ bé và ấm áp trong ngày.'}
                </p>
              </div>
              <span className="text-xs text-amber-400/90 font-mono flex items-center gap-1">
                <span>Viết ngay</span>
                <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
              </span>
            </Link>

            {/* Action 2: Wishlist Goal */}
            <Link
              to="/bucket-list"
              className="p-5 rounded-2xl bg-zinc-900/60 hover:bg-zinc-900/90 border border-white/[0.08] hover:border-white/20 transition-all group flex flex-col justify-between space-y-4"
            >
              <div className="flex items-center justify-between">
                <div className="w-9 h-9 rounded-xl bg-white/[0.04] border border-white/10 flex items-center justify-center text-rose-400 group-hover:scale-105 transition-transform">
                  <ListTodo className="w-4 h-4" />
                </div>
                <span className="text-[11px] font-mono text-zinc-500">Wishlist</span>
              </div>
              <div>
                <h3 className="text-sm font-medium text-zinc-100 group-hover:text-white">
                  {nextWish ? nextWish.title : 'Dự định muốn cùng nhau làm'}
                </h3>
                <p className="text-xs text-zinc-400 font-light mt-1 line-clamp-2">
                  Cùng nhau hoàn thành từng điều ước nhỏ trong danh sách chung.
                </p>
              </div>
              <span className="text-xs text-rose-400/90 font-mono flex items-center gap-1">
                <span>Xem danh sách ước nguyện</span>
                <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
              </span>
            </Link>

            {/* Action 3: Music Playlist */}
            <Link
              to="/music"
              className="p-5 rounded-2xl bg-zinc-900/60 hover:bg-zinc-900/90 border border-white/[0.08] hover:border-white/20 transition-all group flex flex-col justify-between space-y-4"
            >
              <div className="flex items-center justify-between">
                <div className="w-9 h-9 rounded-xl bg-white/[0.04] border border-white/10 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform">
                  <Music className="w-4 h-4" />
                </div>
                <span className="text-[11px] font-mono text-zinc-500">Giai điệu</span>
              </div>
              <div>
                <h3 className="text-sm font-medium text-zinc-100 group-hover:text-white">
                  Những bài hát của hai đứa
                </h3>
                <p className="text-xs text-zinc-400 font-light mt-1 line-clamp-2">
                  Bật playlist nhẹ nhàng cùng nghe trong lúc ngắm nhìn không gian.
                </p>
              </div>
              <span className="text-xs text-emerald-400/90 font-mono flex items-center gap-1">
                <span>Nghe ngay</span>
                <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
              </span>
            </Link>
          </div>
        </section>

        {/* ============================================================ */}
        {/* 5. EXPLORE: WHERE CAN WE EXPLORE?                            */}
        {/* ============================================================ */}
        <section aria-label="Khám phá các góc nhỏ" className="space-y-4">
          <h2 className="text-xs font-mono uppercase tracking-[0.2em] text-zinc-400 flex items-center gap-2">
            <Compass className="w-3.5 h-3.5 text-zinc-400" />
            <span>Khám phá không gian</span>
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {[
              { to: '/timeline', label: 'Dòng thời gian', desc: 'Các mốc từ ngày đầu', icon: Clock },
              { to: '/memories', label: 'Kho kỷ niệm', desc: 'Hình ảnh & ghi âm', icon: Sparkles },
              { to: '/letters', label: 'Thư tình', desc: 'Những lá thư tay', icon: Mail },
              { to: '/journal', label: 'Nhật ký chung', desc: 'Trang viết mỗi ngày', icon: BookOpen },
              { to: '/map', label: 'Bản đồ kỷ niệm', desc: 'Những góc quán quen', icon: MapPin },
              { to: '/music', label: 'Giai điệu', desc: 'Bài hát của tụi mình', icon: Music },
              { to: '/anniversary', label: 'Ngày kỷ niệm', desc: 'Đếm ngược cột mốc', icon: Calendar },
              { to: '/bucket-list', label: 'Điều ước', desc: 'Mục tiêu cùng làm', icon: ListTodo },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className="p-4 rounded-2xl bg-zinc-900/40 hover:bg-zinc-900/80 border border-white/[0.06] hover:border-white/15 transition-all group"
                >
                  <div className="w-8 h-8 rounded-lg bg-white/[0.03] border border-white/10 flex items-center justify-center text-zinc-400 group-hover:text-zinc-100 group-hover:border-white/20 transition-all mb-2.5">
                    <Icon className="w-4 h-4" />
                  </div>
                  <h3 className="text-xs sm:text-sm font-medium text-zinc-200 group-hover:text-white">
                    {item.label}
                  </h3>
                  <p className="text-[11px] text-zinc-500 font-light mt-0.5 line-clamp-1">
                    {item.desc}
                  </p>
                </Link>
              );
            })}
          </div>
        </section>

        {/* ============================================================ */}
        {/* 6. COMPOSABLE WIDGETS SECTION (COLLAPSIBLE / OPTIONAL)       */}
        {/* ============================================================ */}
        {blocks.length > 0 && (
          <section aria-label="Widget tùy biến" className="pt-6 border-t border-white/[0.06] space-y-4">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setShowWidgetsSection((prev) => !prev)}
                className="text-xs font-mono uppercase tracking-[0.2em] text-zinc-400 hover:text-zinc-200 transition flex items-center gap-2"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Widget tùy biến ({blocks.length})</span>
                <span className="text-[10px] text-zinc-500 font-sans">
                  {showWidgetsSection ? '— Ẩn bớt' : '— Nhấn để xem'}
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
