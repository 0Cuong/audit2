import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Lock, Send, Clock, FileText, Trash2, X, Heart } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { useLetters } from '../data/domain/useLetters';
import { formatDateLocale } from '../lib/dateUtils';
import { LoveLetterEntity } from '../data/schemas/letter';

export default function Letters() {
  const { t, tc, profile, lang } = useApp();
  const { letters, addLetter, deleteLetter: removeLetter } = useLetters();
  
  const [filter, setFilter] = useState<'all' | 'drafts' | 'scheduled' | 'locked'>('all');
  const [showWrite, setShowWrite] = useState(false);
  const [readingLetter, setReadingLetter] = useState<LoveLetterEntity | null>(null);
  
  const [form, setForm] = useState({
    title: '',
    content: '',
    from_partner: 'partner1',
    to_partner: 'partner2',
    is_locked: false,
    is_future: false,
    scheduled_at: '',
  });

  const filtered = letters.filter(l => {
    if (filter === 'drafts') return l.is_draft;
    if (filter === 'scheduled') return l.scheduled_at && !l.is_draft && new Date(l.scheduled_at) > new Date();
    if (filter === 'locked') return l.is_locked;
    return true;
  });

  const sendLetter = async () => {
    if (!form.content) return;
    try {
      await addLetter({
        title: form.title || 'Thư Tình Yêu',
        content: form.content,
        from_partner: form.from_partner,
        to_partner: form.to_partner,
        is_draft: false,
        is_locked: form.is_locked,
        is_future: form.is_future,
        scheduled_at: form.scheduled_at || null,
        delivered_at: form.is_future ? null : new Date().toISOString(),
      });
      setShowWrite(false);
      setForm({ title: '', content: '', from_partner: 'partner1', to_partner: 'partner2', is_locked: false, is_future: false, scheduled_at: '' });
    } catch (err) {
      console.error(err);
    }
  };

  const saveDraft = async () => {
    if (!form.content && !form.title) return;
    try {
      await addLetter({
        title: form.title || 'Bản nháp thư tình',
        content: form.content,
        from_partner: form.from_partner,
        to_partner: form.to_partner,
        is_draft: true,
        is_locked: false,
        is_future: false,
      });
      setShowWrite(false);
      setForm({ title: '', content: '', from_partner: 'partner1', to_partner: 'partner2', is_locked: false, is_future: false, scheduled_at: '' });
    } catch (err) {
      console.error(err);
    }
  };

  const deleteLetter = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Bạn có chắc chắn muốn xóa lá thư này không?')) return;
    
    try {
      await removeLetter(id);
      if (readingLetter?.id === id) {
        setReadingLetter(null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filters = [
    { key: 'all' as const, label: t('memories.all') },
    { key: 'drafts' as const, label: t('letters.drafts') },
    { key: 'scheduled' as const, label: t('letters.scheduled') },
    { key: 'locked' as const, label: t('letters.locked') },
  ];

  const p1 = profile?.partner1_name || 'Cuong';
  const p2 = profile?.partner2_name || 'Love';

  return (
    <main className="pt-24 pb-12 min-h-screen">
      <div className="section-container max-w-5xl mx-auto px-4">
        
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center justify-between">
            <h1 className="page-title">{t('letters.title')}</h1>
            <button 
              onClick={() => setShowWrite(true)} 
              className="btn-pill"
            >
              <Plus className="w-3.5 h-3.5" /> {t('letters.write')}
            </button>
          </div>
        </motion.div>

        {/* Filter Pills */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {filters.map(f => (
            <button 
              key={f.key} 
              onClick={() => setFilter(f.key)}
              className={`px-4 py-1.5 text-xs font-medium rounded-full transition-all duration-200 ${
                filter === f.key ? 'bg-white/15 text-white border border-white/20 shadow-sm' : 'bg-white/[0.04] text-zinc-400 hover:text-zinc-100 hover:bg-white/10 border border-white/10'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Letters Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((letter, i) => (
            <motion.div 
              key={letter.id} 
              initial={{ opacity: 0, y: 15 }} 
              animate={{ opacity: 1, y: 0 }} 
              transition={{ delay: i * 0.04 }}
              onClick={() => setReadingLetter(letter)}
              className={`glass rounded-2xl p-5 sm:p-6 border ${tc.border} hover-lift group cursor-pointer flex flex-col justify-between relative`}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    {letter.is_locked && <Lock className="w-4 h-4 text-amber-400" />}
                    {letter.is_draft && <FileText className={`w-4 h-4 ${tc.textMuted}`} />}
                    {letter.scheduled_at && new Date(letter.scheduled_at) > new Date() && <Clock className="w-4 h-4 text-blue-400" />}
                  </div>

                  <button 
                    onClick={(e) => deleteLetter(letter.id, e)}
                    className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-500/10 text-zinc-400 hover:text-red-400 transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {letter.title && (
                  <h3 className={`text-base font-bold ${tc.text} mb-2 line-clamp-1`}>
                    {letter.title}
                  </h3>
                )}

                <p className={`text-xs sm:text-sm ${tc.textMuted} leading-relaxed line-clamp-4 font-serif italic`}>
                  "{letter.content}"
                </p>
              </div>

              <div className={`flex items-center justify-between mt-4 pt-3 border-t ${tc.border} text-xs ${tc.textMuted}`}>
                <span className="font-semibold">{letter.from_partner === 'partner1' ? p1 : p2} &rarr; {letter.to_partner === 'partner1' ? p1 : p2}</span>
                <span className="font-mono text-[11px]">{formatDateLocale(letter.created_at, lang)}</span>
              </div>
            </motion.div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-20">
            <Heart className={`w-8 h-8 ${tc.textMuted} opacity-40 mx-auto mb-2`} />
            <p className={`text-sm ${tc.textMuted}`}>{t('common.noResults')}</p>
          </div>
        )}
      </div>

      {/* Read Letter Modal */}
      <AnimatePresence>
        {readingLetter && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-md"
            onClick={() => setReadingLetter(null)}
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className={`glass-strong rounded-3xl p-6 sm:p-8 w-full max-w-lg border ${tc.border} shadow-2xl relative`}
              onClick={e => e.stopPropagation()}
            >
              <button 
                onClick={() => setReadingLetter(null)}
                className="absolute top-4 right-4 p-1.5 rounded-xl hover:bg-white/10 text-zinc-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-full gradient-accent flex items-center justify-center text-white">
                  <Heart className="w-4 h-4" fill="currentColor" />
                </div>
                <div>
                  <h3 className={`text-lg font-bold ${tc.text}`}>{readingLetter.title || 'Love Letter'}</h3>
                  <p className={`text-[11px] ${tc.textMuted}`}>
                    {readingLetter.from_partner === 'partner1' ? p1 : p2} gửi tặng {readingLetter.to_partner === 'partner1' ? p1 : p2}
                  </p>
                </div>
              </div>

              <div className="max-h-[50vh] overflow-y-auto pr-2 my-4">
                <p className={`text-sm sm:text-base ${tc.text} leading-relaxed whitespace-pre-wrap font-serif italic bg-black/5 dark:bg-white/[0.02] p-4 rounded-2xl border ${tc.border}`}>
                  {readingLetter.content}
                </p>
              </div>

              <div className="flex items-center justify-between pt-2 text-xs text-zinc-400 border-t border-white/5 font-mono">
                <span>{formatDateLocale(readingLetter.created_at, lang)}</span>
                {readingLetter.is_future && readingLetter.scheduled_at && (
                  <span className="text-blue-400">Scheduled: {formatDateLocale(readingLetter.scheduled_at, lang)}</span>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Write Letter Modal */}
      <AnimatePresence>
        {showWrite && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-md" 
            onClick={() => setShowWrite(false)}
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className={`glass-strong rounded-3xl p-6 sm:p-7 w-full max-w-lg border ${tc.border} shadow-2xl relative`} 
              onClick={e => e.stopPropagation()}
            >
              <button 
                onClick={() => setShowWrite(false)}
                className="absolute top-4 right-4 p-1.5 rounded-xl hover:bg-white/10 text-zinc-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>

              <h3 className={`text-base font-bold mb-4 ${tc.text}`}>{t('letters.write')}</h3>

              <div className="space-y-3.5">
                <div>
                  <label className={`block text-[11px] font-bold uppercase tracking-wider ${tc.textMuted} mb-1`}>Tiêu đề lá thư</label>
                  <input 
                    type="text" 
                    value={form.title} 
                    onChange={e => setForm(p => ({ ...p, title: e.target.value }))} 
                    placeholder="Gửi người thương..." 
                    className={`w-full px-4 py-2.5 glass rounded-xl text-sm ${tc.text} bg-transparent border ${tc.border} outline-none focus:border-rose-500`} 
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className={`block text-[11px] font-bold uppercase tracking-wider ${tc.textMuted} mb-1`}>Người gửi</label>
                    <select 
                      value={form.from_partner} 
                      onChange={e => setForm(p => ({ ...p, from_partner: e.target.value }))} 
                      className={`w-full px-3 py-2 glass rounded-xl text-xs bg-neutral-900 ${tc.text} border ${tc.border} outline-none`}
                    >
                      <option value="partner1" className="bg-neutral-900 text-white">{p1}</option>
                      <option value="partner2" className="bg-neutral-900 text-white">{p2}</option>
                    </select>
                  </div>
                  <div>
                    <label className={`block text-[11px] font-bold uppercase tracking-wider ${tc.textMuted} mb-1`}>Người nhận</label>
                    <select 
                      value={form.to_partner} 
                      onChange={e => setForm(p => ({ ...p, to_partner: e.target.value }))} 
                      className={`w-full px-3 py-2 glass rounded-xl text-xs bg-neutral-900 ${tc.text} border ${tc.border} outline-none`}
                    >
                      <option value="partner2" className="bg-neutral-900 text-white">{p2}</option>
                      <option value="partner1" className="bg-neutral-900 text-white">{p1}</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className={`block text-[11px] font-bold uppercase tracking-wider ${tc.textMuted} mb-1`}>Nội dung tâm sự *</label>
                  <textarea 
                    value={form.content} 
                    onChange={e => setForm(p => ({ ...p, content: e.target.value }))} 
                    placeholder="Viết những lời từ tận đáy lòng..." 
                    rows={6} 
                    className={`w-full px-4 py-2.5 glass rounded-xl text-sm ${tc.text} bg-transparent border ${tc.border} outline-none resize-none focus:border-rose-500 font-serif italic`} 
                  />
                </div>

                <div className="flex gap-4 pt-1">
                  <label className={`flex items-center gap-2 text-xs font-semibold ${tc.text} cursor-pointer`}>
                    <input 
                      type="checkbox" 
                      checked={form.is_locked} 
                      onChange={e => setForm(p => ({ ...p, is_locked: e.target.checked }))} 
                      className="accent-rose-500 rounded" 
                    />
                    <Lock className="w-3.5 h-3.5 text-amber-400" /> Khóa thư
                  </label>
                  <label className={`flex items-center gap-2 text-xs font-semibold ${tc.text} cursor-pointer`}>
                    <input 
                      type="checkbox" 
                      checked={form.is_future} 
                      onChange={e => setForm(p => ({ ...p, is_future: e.target.checked }))} 
                      className="accent-rose-500 rounded" 
                    />
                    <Clock className="w-3.5 h-3.5 text-blue-400" /> Gửi tương lai
                  </label>
                </div>

                {form.is_future && (
                  <div>
                    <label className={`block text-[11px] font-bold uppercase tracking-wider ${tc.textMuted} mb-1`}>Thời gian mở thư</label>
                    <input 
                      type="datetime-local" 
                      value={form.scheduled_at} 
                      onChange={e => setForm(p => ({ ...p, scheduled_at: e.target.value }))} 
                      className={`w-full px-4 py-2.5 glass rounded-xl text-xs ${tc.text} bg-transparent border ${tc.border} outline-none`} 
                    />
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <button 
                    type="button"
                    onClick={saveDraft} 
                    className={`flex-1 py-2.5 glass rounded-xl text-sm font-semibold ${tc.text} border ${tc.border} hover:bg-white/10 transition`}
                  >
                    {t('letters.drafts')}
                  </button>
                  <button 
                    type="button"
                    onClick={sendLetter} 
                    disabled={!form.content}
                    className="flex-1 py-2.5 gradient-accent rounded-xl text-sm text-white font-semibold hover:opacity-90 transition flex items-center justify-center gap-2 shadow-md disabled:opacity-50"
                  >
                    <Send className="w-4 h-4" /> {t('letters.deliver')}
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
