import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, MapPin, Trash2, Calendar, X, Heart, MessageSquare, Coffee, Plane, Star, Clock } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { supabase } from '../lib/supabase';
import { formatDateLocale } from '../lib/dateUtils';

interface TimelineEvent {
  id: string;
  title: string;
  date: string;
  event_type: string;
  story?: string;
  location?: string;
  photos?: string[];
  created_at?: string;
}

const DEFAULT_TIMELINE: TimelineEvent[] = [
  {
    id: 'tl-1',
    title: 'Lần Đầu Gặp Gỡ',
    date: '2026-05-18',
    event_type: 'first_meet',
    story: 'Khoảnh khắc đầu tiên hai đứa chạm mắt nhau, thời gian dường như ngưng đọng trong không gian tĩnh lặng.',
    location: 'Quán Cafe hẹn ước',
    photos: [],
  },
  {
    id: 'tl-2',
    title: 'Tin Nhắn Làm Quen Đầu Tiên',
    date: '2026-05-20',
    event_type: 'first_message',
    story: 'Những dòng tin nhắn vụng về nhưng ngập tràn háo hức thâu đêm suốt sáng.',
    location: 'Hà Nội & Sài Gòn',
    photos: [],
  },
  {
    id: 'tl-3',
    title: 'Chuyến Đi Chơi Đầu Tiên',
    date: '2026-06-15',
    event_type: 'first_trip',
    story: 'Cùng nhau vi vu trên những cung đường lộng gió, ngắm hoàng hôn buông xuống chân mây.',
    location: 'Đà Lạt mộng mơ',
    photos: [],
  },
];

const typeIcons: Record<string, any> = {
  first_meet: Heart,
  first_message: MessageSquare,
  first_date: Coffee,
  first_trip: Plane,
  anniversary: Clock,
  custom: Star,
};

export default function Timeline() {
  const { t, lang, profile } = useApp();
  const [events, setEvents] = useState<TimelineEvent[]>(() => {
    const saved = localStorage.getItem('cuongisme_timeline');
    return saved ? JSON.parse(saved) : DEFAULT_TIMELINE;
  });
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({
    title: '',
    date: new Date().toISOString().split('T')[0],
    event_type: 'custom',
    story: '',
    location: '',
  });

  useEffect(() => {
    supabase
      .from('timeline_events')
      .select('*')
      .order('date', { ascending: true })
      .then(({ data, error }) => {
        if (!error && data && data.length > 0) {
          setEvents(data);
          localStorage.setItem('cuongisme_timeline', JSON.stringify(data));
        }
      });
  }, []);

  const addEvent = async () => {
    if (!form.title || !form.date) return;

    const newEntry: TimelineEvent = {
      id: 'local-' + Date.now(),
      couple_id: profile?.id,
      ...form,
      photos: [],
      created_at: new Date().toISOString(),
    } as any;

    const updated = [...events, newEntry].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    setEvents(updated);
    localStorage.setItem('cuongisme_timeline', JSON.stringify(updated));
    setShowAdd(false);
    setForm({
      title: '',
      date: new Date().toISOString().split('T')[0],
      event_type: 'custom',
      story: '',
      location: '',
    });

    try {
      const { data } = await supabase
        .from('timeline_events')
        .insert({
          title: form.title,
          date: form.date,
          event_type: form.event_type,
          story: form.story,
          location: form.location,
          couple_id: profile?.id && profile.id !== 'default-profile' ? profile.id : undefined,
        })
        .select()
        .maybeSingle();

      if (data) {
        setEvents((prev) => prev.map((e) => (e.id === newEntry.id ? data : e)));
      }
    } catch (e) {
      console.warn('Saved timeline milestone locally');
    }
  };

  const deleteEvent = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa cột mốc này không?')) return;
    const updated = events.filter((e) => e.id !== id);
    setEvents(updated);
    localStorage.setItem('cuongisme_timeline', JSON.stringify(updated));

    try {
      await supabase.from('timeline_events').delete().eq('id', id);
    } catch (e) {
      console.warn('Deleted timeline milestone locally');
    }
  };

  return (
    <main className="pt-28 sm:pt-36 pb-28 min-h-screen text-zinc-100 relative selection:bg-[#E5A93C]/30 selection:text-white">
      <div className="section-container max-w-4xl mx-auto px-4 sm:px-6 relative z-10">
        
        {/* 4D Temporal Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="mb-12 flex flex-col sm:flex-row sm:items-center justify-between gap-4 select-none"
        >
          <div>
            <h1 className="font-serif text-3xl sm:text-5xl font-normal tracking-tight text-zinc-100">
              {t('timeline.title')}
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 mt-2">
              Các cột mốc quan trọng của hai đứa
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowAdd(true)}
            className="px-5 py-2.5 rounded-full bg-zinc-100 hover:bg-white text-zinc-950 text-xs font-semibold transition-all shadow-md active:scale-95 flex items-center gap-1.5 self-start sm:self-auto"
          >
            <Plus className="w-3.5 h-3.5 text-zinc-950" />
            <span>Thêm Cột Mốc Mới</span>
          </button>
        </motion.div>

        {/* 4D Temporal Axis Continuum */}
        <div className="relative pl-7 sm:pl-9 ml-2 border-l border-white/10 space-y-8">
          {events.map((event, i) => {
            const IconComponent = typeIcons[event.event_type] || Clock;
            return (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.08, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="relative group"
              >
                {/* Gravitational Temporal Node */}
                <div className="absolute -left-[35px] sm:-left-[43px] top-5 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#09090D] border border-white/20 flex items-center justify-center text-[#E5A93C] shadow-xl transition-all duration-300 group-hover:border-[#E5A93C] group-hover:scale-110">
                  <IconComponent className="w-4 h-4" />
                </div>

                {/* Milestone Monolith Card */}
                <div className="bg-[#09090D]/90 backdrop-blur-2xl rounded-3xl p-6 sm:p-7 border border-white/[0.08] hover:border-white/20 transition-all duration-300 shadow-[0_20px_50px_rgba(0,0,0,0.6)] relative group/card">
                  {/* Subtle Top Rim Light */}
                  <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-[#E5A93C]/20 to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity duration-300" />

                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1.5">
                        <Calendar className="w-3.5 h-3.5 text-[#E5A93C]" />
                        <span className="text-xs font-mono font-semibold text-[#E5A93C] tracking-wide">
                          {formatDateLocale(event.date, lang)}
                        </span>
                      </div>
                      <h3 className="font-serif text-lg sm:text-xl font-medium text-zinc-100 group-hover/card:text-white transition-colors">
                        {event.title}
                      </h3>
                    </div>

                    <button
                      type="button"
                      onClick={() => deleteEvent(event.id)}
                      className="p-2 rounded-xl opacity-0 group-hover/card:opacity-100 hover:bg-rose-500/10 text-zinc-500 hover:text-rose-400 transition"
                      title="Xóa cột mốc"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {event.story && (
                    <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed mt-2.5 whitespace-pre-wrap">
                      {event.story}
                    </p>
                  )}

                  {event.location && (
                    <div className="flex items-center gap-1.5 mt-4 text-xs font-mono text-zinc-400">
                      <MapPin className="w-3.5 h-3.5 text-[#E5A93C]" />
                      <span>{event.location}</span>
                    </div>
                  )}

                  {event.photos && event.photos.length > 0 && (
                    <div className="flex gap-3 mt-4 overflow-x-auto pb-1">
                      {event.photos.map((url: string, j: number) => (
                        <img
                          key={j}
                          src={url}
                          alt=""
                          className="w-24 h-24 rounded-2xl object-cover border border-white/10"
                          loading="lazy"
                        />
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}

          {events.length === 0 && (
            <div className="bg-[#09090D]/80 backdrop-blur-2xl rounded-3xl p-12 text-center border border-white/[0.08]">
              <Clock className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
              <p className="text-sm text-zinc-400">
                Chưa có cột mốc nào. Hãy ghi lại kỷ niệm đầu tiên của hai đứa!
              </p>
            </div>
          )}
        </div>

        {/* Add Modal */}
        <AnimatePresence>
          {showAdd && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-2xl"
              onClick={() => setShowAdd(false)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 12 }}
                className="bg-[#09090D] rounded-3xl p-7 w-full max-w-md border border-white/15 shadow-[0_25px_70px_rgba(0,0,0,0.9)] relative text-zinc-100"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#E5A93C]" />
                    <h3 className="font-serif text-lg font-medium text-zinc-100">
                      Thêm Cột Mốc Thời Gian
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowAdd(false)}
                    className="p-1.5 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                      Tiêu đề sự kiện *
                    </label>
                    <input
                      type="text"
                      value={form.title}
                      onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                      placeholder="Ví dụ: Buổi hẹn hò đầu tiên..."
                      className="w-full px-4 py-2.5 bg-zinc-900/90 rounded-xl text-xs text-zinc-100 border border-white/10 outline-none focus:border-[#E5A93C] transition"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                        Ngày diễn ra *
                      </label>
                      <input
                        type="date"
                        value={form.date}
                        onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))}
                        className="w-full px-3 py-2.5 bg-zinc-900/90 rounded-xl text-xs text-zinc-100 border border-white/10 outline-none focus:border-[#E5A93C]"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                        Loại sự kiện
                      </label>
                      <select
                        value={form.event_type}
                        onChange={(e) => setForm((p) => ({ ...p, event_type: e.target.value }))}
                        className="w-full px-3 py-2.5 bg-zinc-900 rounded-xl text-xs text-zinc-100 border border-white/10 outline-none"
                      >
                        <option value="first_meet">Lần đầu gặp gỡ</option>
                        <option value="first_message">Tin nhắn làm quen</option>
                        <option value="first_date">Buổi hẹn đầu tiên</option>
                        <option value="first_trip">Chuyến đi đầu tiên</option>
                        <option value="anniversary">Kỷ niệm</option>
                        <option value="custom">Cột mốc khác</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                      Địa điểm
                    </label>
                    <input
                      type="text"
                      value={form.location}
                      onChange={(e) => setForm((p) => ({ ...p, location: e.target.value }))}
                      placeholder="Ví dụ: Phố đi bộ Nguyễn Huệ..."
                      className="w-full px-4 py-2.5 bg-zinc-900/90 rounded-xl text-xs text-zinc-100 border border-white/10 outline-none focus:border-[#E5A93C] transition"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                      Câu chuyện kể lại
                    </label>
                    <textarea
                      value={form.story}
                      onChange={(e) => setForm((p) => ({ ...p, story: e.target.value }))}
                      placeholder="Viết lại những cảm xúc khó quên..."
                      rows={3}
                      className="w-full px-4 py-2.5 bg-zinc-900/90 rounded-xl text-xs text-zinc-100 border border-white/10 outline-none resize-none focus:border-[#E5A93C] transition leading-relaxed"
                    />
                  </div>

                  <div className="flex gap-2.5 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowAdd(false)}
                      className="flex-1 py-2.5 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white transition"
                    >
                      Hủy
                    </button>
                    <button
                      type="button"
                      onClick={addEvent}
                      disabled={!form.title || !form.date}
                      className="flex-1 py-2.5 bg-zinc-100 hover:bg-white text-zinc-950 font-semibold rounded-xl text-xs transition disabled:opacity-40 shadow-md"
                    >
                      Lưu Cột Mốc
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </div>
    </main>
  );
}
