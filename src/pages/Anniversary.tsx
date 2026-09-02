import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Calendar, Flame, Trash2, X, AlertCircle, Image } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { supabase } from '../lib/supabase';
import { getDaysUntilAnniversary, formatDateLocale } from '../lib/dateUtils';

interface AnniversaryEvent {
  id: string;
  title: string;
  date: string;
  anniversary_type: 'yearly' | 'monthly' | 'birthday' | 'custom';
  recurrence?: string;
  photo_url?: string | null;
}

const DEFAULT_ANNIVERSARIES: AnniversaryEvent[] = [
  {
    id: 'ann-1',
    title: 'Ngày Chính Thức Yêu Nhau',
    date: '2024-05-18',
    anniversary_type: 'yearly',
    recurrence: 'yearly',
    photo_url: '/590610904_1909263110009109_2160755825373491978_n.jpg',
  },
  {
    id: 'ann-2',
    title: 'Sinh Nhật Xnghi',
    date: '2005-01-03',
    anniversary_type: 'birthday',
    recurrence: 'birthday',
    photo_url: '/605572670_122215932062047100_7842864668271503382_n.jpg',
  },
  {
    id: 'ann-3',
    title: 'Sinh Nhật Mcuong',
    date: '2004-09-12',
    anniversary_type: 'birthday',
    recurrence: 'birthday',
  },
  {
    id: 'ann-4',
    title: 'Kỷ Niệm Ngày 18 Hàng Tháng',
    date: '2024-05-18',
    anniversary_type: 'monthly',
    recurrence: 'monthly',
  }
];

export default function AnniversaryCenter() {
  const { t, tc, lang } = useApp();
  const [events, setEvents] = useState<AnniversaryEvent[]>(() => {
    const saved = localStorage.getItem('cuongisme_anniversaries');
    return saved ? JSON.parse(saved) : DEFAULT_ANNIVERSARIES;
  });
  const [showAdd, setShowAdd] = useState(false);
  
  const [form, setForm] = useState({ 
    title: '', 
    date: new Date().toISOString().split('T')[0], 
    anniversary_type: 'yearly' as 'yearly' | 'monthly' | 'birthday' | 'custom', 
    recurrence: 'yearly',
    photo_url: '' 
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    supabase.from('anniversaries').select('*').order('date').then(({ data, error }) => { 
      if (!error && data && data.length > 0) {
        setEvents(data); 
        localStorage.setItem('cuongisme_anniversaries', JSON.stringify(data));
      }
    });
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setForm(p => ({ ...p, photo_url: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const addEvent = async () => {
    if (!form.title || !form.date) return;
    
    const newEntry: AnniversaryEvent = {
      id: 'local-' + Date.now(),
      title: form.title,
      date: form.date,
      anniversary_type: form.anniversary_type,
      recurrence: form.anniversary_type,
      photo_url: form.photo_url || null,
    };

    const updated = [...events, newEntry];
    setEvents(updated);
    localStorage.setItem('cuongisme_anniversaries', JSON.stringify(updated));
    setShowAdd(false);
    setForm({ title: '', date: new Date().toISOString().split('T')[0], anniversary_type: 'yearly', recurrence: 'yearly', photo_url: '' });

    try {
      const { data } = await supabase.from('anniversaries').insert({
        title: form.title,
        date: form.date,
        anniversary_type: form.anniversary_type,
        recurrence: form.anniversary_type,
        photo_url: form.photo_url || null,
      }).select().maybeSingle();

      if (data) {
        setEvents(prev => prev.map(e => e.id === newEntry.id ? data : e));
      }
    } catch (e) {
      // Local
    }
  };

  const deleteEvent = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa ngày kỷ niệm này?')) return;
    const updated = events.filter(e => e.id !== id);
    setEvents(updated);
    localStorage.setItem('cuongisme_anniversaries', JSON.stringify(updated));

    try {
      await supabase.from('anniversaries').delete().eq('id', id);
    } catch (e) {
      // Local
    }
  };

  const removePhotoFromEvent = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = events.map(e => e.id === id ? { ...e, photo_url: null } : e);
    setEvents(updated);
    localStorage.setItem('cuongisme_anniversaries', JSON.stringify(updated));

    try {
      await supabase.from('anniversaries').update({ photo_url: null }).eq('id', id);
    } catch (e) {
      // Local
    }
  };

  const typeLabels: Record<string, string> = {
    monthly: t('anniversary.monthly'),
    yearly: t('anniversary.yearly'),
    birthday: t('anniversary.birthday'),
    custom: t('anniversary.special'),
  };

  return (
    <main className="pt-24 pb-12 min-h-screen">
      <div className="section-container max-w-5xl mx-auto px-4">
        
        {/* Hidden file selector */}
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileChange} 
          accept="image/*" 
          className="hidden" 
        />

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="page-title">{t('anniversary.title')}</h1>
              <p className="text-xs sm:text-sm mt-1 text-zinc-400">Đếm ngược từng khoảnh khắc ý nghĩa của đôi ta</p>
            </div>
            <button 
              onClick={() => setShowAdd(true)} 
              className="btn-pill self-start sm:self-auto"
            >
              <Plus className="w-3.5 h-3.5" /> {t('anniversary.add')}
            </button>
          </div>
        </motion.div>

        {/* Grid of Anniversary Cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence>
            {events.map((event, i) => {
              const { daysLeft, isToday } = getDaysUntilAnniversary(event.date, event.anniversary_type);
              const isSoon = daysLeft <= 30;

              return (
                <motion.div 
                  key={event.id} 
                  initial={{ opacity: 0, scale: 0.95 }} 
                  animate={{ opacity: 1, scale: 1 }} 
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2, delay: i * 0.04 }}
                  className={`bg-zinc-900/65 backdrop-blur-xl rounded-3xl p-5 border ${isSoon ? 'border-white/20 shadow-2xl' : 'border-white/[0.08]'} hover:border-white/25 transition-all shadow-xl relative group flex flex-col justify-between`}
                >
                  <div>
                    {/* Optional Photo Attachment */}
                    {event.photo_url && (
                      <div className="relative w-full h-36 rounded-2xl overflow-hidden mb-4 border border-white/10 group/img bg-black/20">
                        <img 
                          src={event.photo_url} 
                          alt={event.title} 
                          className="w-full h-full object-cover transition duration-300 group-hover/img:scale-105" 
                        />
                        <button 
                          onClick={(e) => removePhotoFromEvent(event.id, e)}
                          className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/70 text-white hover:text-red-400 transition opacity-0 group-hover/img:opacity-100"
                          title="Xóa ảnh"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}

                    {/* Tag badge & delete button */}
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[10px] font-mono uppercase tracking-wider px-2.5 py-1 rounded-full font-semibold bg-white/[0.06] border border-white/10 text-zinc-300">
                        {typeLabels[event.anniversary_type] || event.anniversary_type}
                      </span>
                      
                      <button 
                        onClick={() => deleteEvent(event.id)}
                        className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-white/10 text-zinc-500 hover:text-red-400 transition"
                        title="Delete Event"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Title & Date */}
                    <h3 className="text-base font-bold text-zinc-100 tracking-tight mb-1">
                      {event.title}
                    </h3>
                    <p className="text-xs font-mono text-zinc-400 mb-4">
                      {formatDateLocale(event.date, lang)}
                    </p>
                  </div>

                  {/* Countdown bottom row */}
                  <div className="flex items-center gap-2 pt-3 border-t border-white/[0.06]">
                    {isToday ? (
                      <Flame className="w-4 h-4 text-amber-400 animate-bounce" />
                    ) : (
                      <Calendar className="w-4 h-4 text-zinc-400" />
                    )}
                    <span className={`text-xs font-medium ${isToday ? 'text-amber-300 font-bold' : 'text-zinc-300'}`}>
                      {isToday ? (
                        <span>🎉 {t('common.today')}</span>
                      ) : (
                        <span>Còn <strong className="text-zinc-100 font-mono font-bold">{daysLeft}</strong> {t('common.daysLeft')}</span>
                      )}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {events.length === 0 && (
          <div className={`glass rounded-3xl flex flex-col items-center justify-center py-20 border ${tc.border}`}>
            <AlertCircle className={`w-8 h-8 ${tc.textMuted} opacity-40 mb-2`} />
            <p className={`text-xs ${tc.textMuted}`}>Chưa có ngày kỷ niệm nào được lưu lại.</p>
          </div>
        )}
      </div>

      {/* Add Modal */}
      <AnimatePresence>
        {showAdd && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md" 
            onClick={() => setShowAdd(false)}
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`glass-strong rounded-3xl p-6 w-full max-w-md border ${tc.border} shadow-2xl relative`}
              onClick={e => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className={`text-base font-bold ${tc.text}`}>{t('anniversary.add')}</h3>
                <button onClick={() => setShowAdd(false)} className="p-1 rounded-lg hover:bg-white/10 text-zinc-400 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3.5">
                <div>
                  <label className={`block text-[11px] font-bold uppercase tracking-wider ${tc.textMuted} mb-1`}>Hình ảnh kỷ niệm</label>
                  {form.photo_url ? (
                    <div className="relative w-full h-32 rounded-2xl overflow-hidden border border-white/10 bg-black/30 group">
                      <img src={form.photo_url} alt="Preview" className="w-full h-full object-cover" />
                      <button 
                        type="button" 
                        onClick={() => setForm(p => ({ ...p, photo_url: '' }))}
                        className="absolute top-2 right-2 p-1 rounded-full bg-black/80 text-white hover:text-rose-500 transition"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className={`w-full h-24 flex flex-col items-center justify-center gap-1.5 glass rounded-2xl border border-dashed ${tc.border} hover:bg-white/5 transition-all`}
                    >
                      <Image className={`w-5 h-5 ${tc.textMuted}`} />
                      <span className={`text-xs font-semibold ${tc.textMuted}`}>Chọn ảnh từ thiết bị</span>
                    </button>
                  )}
                </div>

                <div>
                  <label className={`block text-[11px] font-bold uppercase tracking-wider ${tc.textMuted} mb-1`}>Tên ngày kỷ niệm *</label>
                  <input 
                    type="text" 
                    value={form.title} 
                    onChange={e => setForm(p => ({ ...p, title: e.target.value }))} 
                    placeholder="Ví dụ: Ngày tỏ tình thành công..." 
                    className={`w-full px-4 py-2.5 glass rounded-xl text-sm ${tc.text} bg-transparent border ${tc.border} outline-none focus:border-rose-500`} 
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className={`block text-[11px] font-bold uppercase tracking-wider ${tc.textMuted} mb-1`}>Ngày kỷ niệm *</label>
                    <input 
                      type="date" 
                      value={form.date} 
                      onChange={e => setForm(p => ({ ...p, date: e.target.value }))} 
                      className={`w-full px-3 py-2 glass rounded-xl text-xs ${tc.text} bg-transparent border ${tc.border} outline-none`} 
                    />
                  </div>

                  <div>
                    <label className={`block text-[11px] font-bold uppercase tracking-wider ${tc.textMuted} mb-1`}>Loại ngày kỷ niệm</label>
                    <select 
                      value={form.anniversary_type} 
                      onChange={e => setForm(p => ({ ...p, anniversary_type: e.target.value as any }))} 
                      className={`w-full px-3 py-2 glass rounded-xl text-xs bg-neutral-900 ${tc.text} border ${tc.border} outline-none`}
                    >
                      <option value="yearly" className="bg-neutral-900 text-white">{t('anniversary.yearly')}</option>
                      <option value="monthly" className="bg-neutral-900 text-white">{t('anniversary.monthly')}</option>
                      <option value="birthday" className="bg-neutral-900 text-white">{t('anniversary.birthday')}</option>
                      <option value="custom" className="bg-neutral-900 text-white">{t('anniversary.special')}</option>
                    </select>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button 
                    type="button"
                    onClick={() => setShowAdd(false)} 
                    className={`flex-1 py-2.5 glass rounded-xl text-sm font-semibold ${tc.text} border ${tc.border} hover:bg-white/10 transition`}
                  >
                    {t('common.cancel')}
                  </button>
                  <button 
                    type="button"
                    onClick={addEvent} 
                    disabled={!form.title || !form.date}
                    className="flex-1 py-2.5 gradient-accent rounded-xl text-sm text-white font-semibold hover:opacity-90 transition disabled:opacity-50 shadow-md"
                  >
                    {t('common.save')}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </main>
  );
}