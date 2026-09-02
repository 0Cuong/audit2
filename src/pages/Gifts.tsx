import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Gift, Heart, ExternalLink, Trash2, X, Check } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { supabase } from '../lib/supabase';

interface GiftItem {
  id: string;
  title: string;
  description?: string;
  url?: string;
  image_url?: string;
  category?: string;
  occasion?: string;
  price_range?: string;
  is_received: boolean;
  for_partner?: string;
  created_at?: string;
}

const DEFAULT_GIFTS: GiftItem[] = [
  {
    id: 'gift-1',
    title: 'Máy ảnh chụp lấy liền Fujifilm Instax Mini',
    description: 'Để cùng nhau lưu giữ những tấm ảnh film xinh xắn dán vào sổ nhật ký.',
    image_url: 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=600&q=80',
    occasion: 'Kỷ niệm 1 năm',
    is_received: true,
    for_partner: 'partner2',
  },
  {
    id: 'gift-2',
    title: 'Đồng hồ đôi dây da tối giản',
    description: 'Món quà nhắc nhở về từng phút giây quý giá hai đứa bên nhau.',
    image_url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80',
    occasion: 'Sinh nhật',
    is_received: false,
    for_partner: 'partner1',
  }
];

export default function Gifts() {
  const { t, tc } = useApp();
  const [gifts, setGifts] = useState<GiftItem[]>(() => {
    const saved = localStorage.getItem('cuongisme_gifts');
    return saved ? JSON.parse(saved) : DEFAULT_GIFTS;
  });
  const [filter, setFilter] = useState<'all' | 'wishlist' | 'received'>('all');
  const [showAdd, setShowAdd] = useState(false);
  
  const [form, setForm] = useState({
    title: '',
    description: '',
    url: '',
    image_url: '',
    category: 'wishlist',
    occasion: '',
    for_partner: 'partner2',
  });

  useEffect(() => {
    supabase
      .from('gifts')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (!error && data && data.length > 0) {
          setGifts(data);
          localStorage.setItem('cuongisme_gifts', JSON.stringify(data));
        }
      });
  }, []);

  const addGift = async () => {
    if (!form.title) return;
    
    const newGift: GiftItem = {
      id: 'local-' + Date.now(),
      ...form,
      is_received: false,
      created_at: new Date().toISOString(),
    };

    const updated = [newGift, ...gifts];
    setGifts(updated);
    localStorage.setItem('cuongisme_gifts', JSON.stringify(updated));
    setShowAdd(false);
    setForm({ title: '', description: '', url: '', image_url: '', category: 'wishlist', occasion: '', for_partner: 'partner2' });

    try {
      const { data } = await supabase.from('gifts').insert(newGift).select().maybeSingle();
      if (data) {
        setGifts(prev => prev.map(g => g.id === newGift.id ? data : g));
      }
    } catch (e) {
      // Local
    }
  };

  const toggleReceived = async (id: string, currentVal: boolean) => {
    const updated = gifts.map(g => g.id === id ? { ...g, is_received: !currentVal } : g);
    setGifts(updated);
    localStorage.setItem('cuongisme_gifts', JSON.stringify(updated));

    try {
      await supabase.from('gifts').update({ is_received: !currentVal }).eq('id', id);
    } catch (e) {
      // Local
    }
  };

  const deleteGift = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa món quà này?')) return;
    const updated = gifts.filter(g => g.id !== id);
    setGifts(updated);
    localStorage.setItem('cuongisme_gifts', JSON.stringify(updated));

    try {
      await supabase.from('gifts').delete().eq('id', id);
    } catch (e) {
      // Local
    }
  };

  const filtered = gifts.filter(g => {
    if (filter === 'wishlist') return !g.is_received;
    if (filter === 'received') return g.is_received;
    return true;
  });

  return (
    <main className="pt-24 pb-12 min-h-screen">
      <div className="section-container max-w-5xl mx-auto px-4">
        
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="page-title">{t('gifts.title')}</h1>
              <p className="text-xs sm:text-sm mt-1 text-zinc-400">Những ý tưởng quà tặng và kỷ vật đong đầy yêu thương</p>
            </div>
            <button 
              onClick={() => setShowAdd(true)} 
              className="btn-pill self-start sm:self-auto"
            >
              <Plus className="w-3.5 h-3.5" /> {t('gifts.add')}
            </button>
          </div>
        </motion.div>

        {/* Filter Pills */}
        <div className="flex gap-2 mb-6">
          {(['all', 'wishlist', 'received'] as const).map(f => (
            <button 
              key={f} 
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 text-xs font-medium rounded-full transition-all duration-200 ${
                filter === f ? 'bg-white/15 text-white border border-white/20 shadow-sm' : 'bg-white/[0.04] text-zinc-400 hover:text-zinc-100 hover:bg-white/10 border border-white/10'
              }`}
            >
              {f === 'all' ? t('memories.all') : t(`gifts.${f}`)}
            </button>
          ))}
        </div>

        {/* Gifts Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((gift, i) => (
            <motion.div 
              key={gift.id} 
              initial={{ opacity: 0, y: 15 }} 
              animate={{ opacity: 1, y: 0 }} 
              transition={{ delay: i * 0.04 }}
              className={`glass rounded-3xl overflow-hidden border ${tc.border} hover-lift shadow-sm group flex flex-col justify-between`}
            >
              <div>
                {gift.image_url ? (
                  <div className="h-44 overflow-hidden relative bg-black/10">
                    <img 
                      src={gift.image_url} 
                      alt={gift.title} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                      loading="lazy" 
                    />
                    <button 
                      onClick={() => deleteGift(gift.id)}
                      className="absolute top-2.5 right-2.5 p-1.5 rounded-xl bg-black/60 text-white hover:text-red-400 transition opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className={`h-36 ${tc.card} flex items-center justify-center relative`}>
                    <Gift className="w-10 h-10 opacity-30 text-rose-500" />
                    <button 
                      onClick={() => deleteGift(gift.id)}
                      className="absolute top-2.5 right-2.5 p-1.5 rounded-xl hover:bg-black/10 text-zinc-400 hover:text-red-400 transition opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                <div className="p-5">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h3 className={`text-sm sm:text-base font-bold ${tc.text} line-clamp-1`}>{gift.title}</h3>
                  </div>

                  {gift.description && (
                    <p className={`text-xs ${tc.textMuted} line-clamp-2 leading-relaxed mt-1`}>
                      {gift.description}
                    </p>
                  )}

                  {gift.occasion && (
                    <span className={`inline-block mt-2.5 text-[10px] font-semibold px-2.5 py-0.5 rounded-full ${tc.accentMuted} ${tc.accentText}`}>
                      {gift.occasion}
                    </span>
                  )}
                </div>
              </div>

              <div className={`p-5 pt-0 mt-auto flex items-center justify-between border-t ${tc.border} pt-3 text-xs`}>
                {gift.url ? (
                  <a 
                    href={gift.url} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className={`font-semibold ${tc.accentText} flex items-center gap-1 hover:underline`}
                  >
                    <ExternalLink className="w-3.5 h-3.5" /> Xem liên kết
                  </a>
                ) : (
                  <span />
                )}

                <button 
                  onClick={() => toggleReceived(gift.id, gift.is_received)}
                  className={`px-3 py-1.5 rounded-xl font-semibold transition-all flex items-center gap-1.5 ${
                    gift.is_received 
                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20' 
                      : `glass ${tc.textMuted} hover:${tc.text} border ${tc.border}`
                  }`}
                >
                  {gift.is_received ? (
                    <>
                      <Check className="w-3.5 h-3.5" /> Đã nhận
                    </>
                  ) : (
                    <>
                      <Heart className="w-3.5 h-3.5 text-rose-500" /> Wishlist
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className={`glass rounded-3xl p-16 text-center border ${tc.border}`}>
            <Gift className={`w-8 h-8 ${tc.textMuted} opacity-40 mx-auto mb-2`} />
            <p className={`text-sm ${tc.textMuted}`}>{t('common.noResults')}</p>
          </div>
        )}
      </div>

      {/* Add Gift Modal */}
      <AnimatePresence>
        {showAdd && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md" 
            onClick={() => setShowAdd(false)}
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className={`glass-strong rounded-3xl p-6 sm:p-7 w-full max-w-md border ${tc.border} shadow-2xl relative`} 
              onClick={e => e.stopPropagation()}
            >
              <button 
                onClick={() => setShowAdd(false)}
                className="absolute top-4 right-4 p-1 rounded-lg hover:bg-white/10 text-zinc-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>

              <h3 className={`text-base font-bold mb-4 ${tc.text}`}>{t('gifts.add')}</h3>

              <div className="space-y-3.5">
                <div>
                  <label className={`block text-[11px] font-bold uppercase tracking-wider ${tc.textMuted} mb-1`}>Tên món quà *</label>
                  <input 
                    type="text" 
                    value={form.title} 
                    onChange={e => setForm(p => ({ ...p, title: e.target.value }))} 
                    placeholder="Ví dụ: Vòng tay bạc đính đá..." 
                    className={`w-full px-4 py-2.5 glass rounded-xl text-sm ${tc.text} bg-transparent border ${tc.border} outline-none focus:border-rose-500`} 
                  />
                </div>

                <div>
                  <label className={`block text-[11px] font-bold uppercase tracking-wider ${tc.textMuted} mb-1`}>Mô tả ý nghĩa</label>
                  <textarea 
                    value={form.description} 
                    onChange={e => setForm(p => ({ ...p, description: e.target.value }))} 
                    placeholder="Lý do muốn tặng hoặc kỷ niệm món quà..." 
                    rows={2} 
                    className={`w-full px-4 py-2.5 glass rounded-xl text-sm ${tc.text} bg-transparent border ${tc.border} outline-none resize-none focus:border-rose-500`} 
                  />
                </div>

                <div>
                  <label className={`block text-[11px] font-bold uppercase tracking-wider ${tc.textMuted} mb-1`}>Dịp tặng quà</label>
                  <input 
                    type="text" 
                    value={form.occasion} 
                    onChange={e => setForm(p => ({ ...p, occasion: e.target.value }))} 
                    placeholder="Ví dụ: Sinh nhật, Valentine, Giáng sinh..." 
                    className={`w-full px-4 py-2.5 glass rounded-xl text-sm ${tc.text} bg-transparent border ${tc.border} outline-none focus:border-rose-500`} 
                  />
                </div>

                <div>
                  <label className={`block text-[11px] font-bold uppercase tracking-wider ${tc.textMuted} mb-1`}>Link sản phẩm</label>
                  <input 
                    type="text" 
                    value={form.url} 
                    onChange={e => setForm(p => ({ ...p, url: e.target.value }))} 
                    placeholder="https://..." 
                    className={`w-full px-4 py-2.5 glass rounded-xl text-sm ${tc.text} bg-transparent border ${tc.border} outline-none focus:border-rose-500`} 
                  />
                </div>

                <div>
                  <label className={`block text-[11px] font-bold uppercase tracking-wider ${tc.textMuted} mb-1`}>Ảnh minh họa (URL)</label>
                  <input 
                    type="text" 
                    value={form.image_url} 
                    onChange={e => setForm(p => ({ ...p, image_url: e.target.value }))} 
                    placeholder="https://...jpg" 
                    className={`w-full px-4 py-2.5 glass rounded-xl text-sm ${tc.text} bg-transparent border ${tc.border} outline-none focus:border-rose-500`} 
                  />
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
                    onClick={addGift} 
                    disabled={!form.title}
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
