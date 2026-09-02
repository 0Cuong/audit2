import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Smile, TrendingUp, Trash2 } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { supabase } from '../lib/supabase';
import { formatDateLocale } from '../lib/dateUtils';

interface MoodEntry {
  id: string;
  mood: string;
  note?: string;
  partner?: string;
  created_at: string;
}

const DEFAULT_MOODS: MoodEntry[] = [
  { id: 'm-1', mood: 'loved', note: 'Được người ấy ôm từ phía sau, ấm áp vô cùng!', partner: 'partner1', created_at: new Date(Date.now() - 3600000 * 2).toISOString() },
  { id: 'm-2', mood: 'happy', note: 'Đi ăn lẩu cùng nhau, cười nói suốt buổi.', partner: 'partner2', created_at: new Date(Date.now() - 3600000 * 24).toISOString() },
  { id: 'm-3', mood: 'calm', note: 'Ngồi ngắm hoàng hôn bên bờ sông yên ả.', partner: 'partner1', created_at: new Date(Date.now() - 3600000 * 48).toISOString() },
];

const moods = [
  { key: 'loved', emoji: '🥰', label: 'Ngập tràn yêu', bg: 'bg-rose-500/15', text: 'text-rose-400', bar: 'bg-rose-500' },
  { key: 'happy', emoji: '😊', label: 'Vui vẻ', bg: 'bg-yellow-500/15', text: 'text-yellow-400', bar: 'bg-yellow-500' },
  { key: 'excited', emoji: '🤩', label: 'Hào hứng', bg: 'bg-orange-500/15', text: 'text-orange-400', bar: 'bg-orange-500' },
  { key: 'calm', emoji: '😌', label: 'Bình yên', bg: 'bg-blue-500/15', text: 'text-blue-400', bar: 'bg-blue-500' },
  { key: 'stressed', emoji: '😰', label: 'Căng thẳng', bg: 'bg-red-500/15', text: 'text-red-400', bar: 'bg-red-500' },
  { key: 'sad', emoji: '😢', label: 'Buồn bã', bg: 'bg-indigo-500/15', text: 'text-indigo-400', bar: 'bg-indigo-500' },
];

export default function MoodTracker() {
  const { t, tc, profile, lang } = useApp();
  const [entries, setEntries] = useState<MoodEntry[]>(() => {
    const saved = localStorage.getItem('cuongisme_moods');
    return saved ? JSON.parse(saved) : DEFAULT_MOODS;
  });
  const [note, setNote] = useState('');
  const [selectedPartner, setSelectedPartner] = useState<'partner1' | 'partner2'>('partner1');

  useEffect(() => {
    supabase
      .from('mood_entries')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(30)
      .then(({ data, error }) => {
        if (!error && data && data.length > 0) {
          setEntries(data);
          localStorage.setItem('cuongisme_moods', JSON.stringify(data));
        }
      });
  }, []);

  const logMood = async (moodKey: string) => {
    const newEntry: MoodEntry = {
      id: 'local-' + Date.now(),
      mood: moodKey,
      note: note.trim() || undefined,
      partner: selectedPartner,
      created_at: new Date().toISOString(),
    };

    const updated = [newEntry, ...entries];
    setEntries(updated);
    localStorage.setItem('cuongisme_moods', JSON.stringify(updated));
    setNote('');

    try {
      const { data } = await supabase.from('mood_entries').insert({
        mood: moodKey,
        note: note.trim() || null,
        partner: selectedPartner,
      }).select().maybeSingle();

      if (data) {
        setEntries(prev => prev.map(m => m.id === newEntry.id ? data : m));
      }
    } catch (e) {
      // Local
    }
  };

  const deleteEntry = async (id: string) => {
    const updated = entries.filter(e => e.id !== id);
    setEntries(updated);
    localStorage.setItem('cuongisme_moods', JSON.stringify(updated));

    try {
      await supabase.from('mood_entries').delete().eq('id', id);
    } catch (e) {
      // Local
    }
  };

  // Stats calculation
  const moodCounts: Record<string, number> = {};
  entries.forEach(e => {
    moodCounts[e.mood] = (moodCounts[e.mood] || 0) + 1;
  });
  const maxCount = Math.max(...Object.values(moodCounts), 1);

  const p1 = profile?.partner1_name || 'Mcuong';
  const p2 = profile?.partner2_name || 'Xnghi';

  return (
    <main className="pt-24 pb-12 min-h-screen">
      <div className="section-container max-w-4xl mx-auto px-4">
        
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="page-title mb-1">{t('mood.title')}</h1>
          <p className="text-xs sm:text-sm text-zinc-400">Lắng nghe và thấu hiểu cảm xúc của nhau mỗi ngày</p>
        </motion.div>

        {/* Log Mood Section */}
        <div className="bg-zinc-900/65 backdrop-blur-xl rounded-3xl p-6 border border-white/[0.08] mb-8 shadow-xl">
          <div className="flex items-center justify-between gap-4 mb-4">
            <p className="text-sm font-bold text-zinc-100">Hôm nay bạn đang cảm thấy thế nào?</p>
            
            {/* Partner toggle */}
            <div className="flex gap-1 p-1 bg-zinc-950/80 rounded-full border border-white/10">
              <button
                type="button"
                onClick={() => setSelectedPartner('partner1')}
                className={`px-3.5 py-1 text-xs font-medium rounded-full transition-all ${
                  selectedPartner === 'partner1' ? 'bg-white/15 text-white shadow-sm border border-white/15' : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {p1}
              </button>
              <button
                type="button"
                onClick={() => setSelectedPartner('partner2')}
                className={`px-3.5 py-1 text-xs font-medium rounded-full transition-all ${
                  selectedPartner === 'partner2' ? 'bg-white/15 text-white shadow-sm border border-white/15' : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {p2}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5 sm:gap-3 mb-4">
            {moods.map(m => (
              <button 
                key={m.key} 
                onClick={() => logMood(m.key)}
                className={`flex flex-col items-center justify-center gap-1.5 p-3.5 sm:p-4 glass rounded-2xl border ${tc.border} hover-lift transition-all group`}
              >
                <span className="text-3xl transition-transform group-hover:scale-125">{m.emoji}</span>
                <span className={`text-[11px] font-semibold ${tc.textMuted} group-hover:${tc.text}`}>
                  {m.label}
                </span>
              </button>
            ))}
          </div>

          <div className="relative">
            <input 
              type="text" 
              value={note} 
              onChange={e => setNote(e.target.value)} 
              placeholder="Thêm một vài dòng ghi chú cảm xúc (tùy chọn)..."
              className={`w-full px-4 py-2.5 glass rounded-2xl text-xs sm:text-sm ${tc.text} bg-transparent border ${tc.border} outline-none focus:border-rose-500 transition-all`} 
            />
          </div>
        </div>

        {/* Trends & History Grid */}
        <div className="grid md:grid-cols-3 gap-6">
          
          {/* Trends Breakdown */}
          <div className={`md:col-span-1 glass rounded-3xl p-6 border ${tc.border} shadow-sm h-fit`}>
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className={`w-4 h-4 ${tc.accentText}`} />
              <h3 className={`text-sm font-bold ${tc.text}`}>{t('mood.trends')}</h3>
            </div>

            <div className="space-y-3">
              {moods.map(m => {
                const count = moodCounts[m.key] || 0;
                const percent = Math.round((count / Math.max(1, entries.length)) * 100);
                return (
                  <div key={m.key} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1.5 font-medium">
                        <span>{m.emoji}</span>
                        <span className={tc.textMuted}>{m.label}</span>
                      </span>
                      <span className="font-mono text-[11px] opacity-70">{count} ({percent}%)</span>
                    </div>
                    <div className="h-2 rounded-full bg-black/10 dark:bg-white/10 overflow-hidden">
                      <div className={`h-full rounded-full ${m.bar} transition-all duration-500`} style={{ width: `${(count / maxCount) * 100}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recent Mood Logs */}
          <div className="md:col-span-2 space-y-3">
            <h3 className={`text-sm font-bold ${tc.text} mb-2`}>
              Nhật ký gần đây
            </h3>

            {entries.map((e, i) => {
              const currentMood = moods.find(m => m.key === e.mood) || moods[0];
              const partnerName = e.partner === 'partner2' ? p2 : p1;

              return (
                <motion.div 
                  key={e.id} 
                  initial={{ opacity: 0, y: 10 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  transition={{ delay: i * 0.02 }}
                  className={`glass rounded-2xl p-4 border ${tc.border} flex items-center justify-between gap-3.5 group hover-lift shadow-sm`}
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className={`w-10 h-10 rounded-2xl ${currentMood.bg} flex items-center justify-center text-xl shrink-0`}>
                      {currentMood.emoji}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-bold ${currentMood.text}`}>{currentMood.label}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full ${tc.accentMuted} ${tc.accentText} font-semibold`}>
                          {partnerName}
                        </span>
                      </div>
                      {e.note && (
                        <p className={`text-xs sm:text-sm ${tc.text} mt-0.5 truncate`}>{e.note}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-[11px] font-mono ${tc.textMuted}`}>
                      {formatDateLocale(e.created_at, lang)}
                    </span>
                    <button 
                      onClick={() => deleteEntry(e.id)}
                      className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-500/10 text-zinc-400 hover:text-red-400 transition"
                      title="Xóa"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </motion.div>
              );
            })}

            {entries.length === 0 && (
              <div className={`glass rounded-3xl p-12 text-center border ${tc.border}`}>
                <Smile className={`w-8 h-8 ${tc.textMuted} opacity-40 mx-auto mb-2`} />
                <p className={`text-sm ${tc.textMuted}`}>Chưa có ghi chép cảm xúc nào.</p>
              </div>
            )}
          </div>

        </div>

      </div>
    </main>
  );
}
