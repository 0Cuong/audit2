import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Check, Plane, Sparkles, Target, Star, Trash2, Loader2, X, Camera } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { useBucket } from '../data/domain/useBucket';
import { supabase } from '../lib/supabase';
import type { LucideIcon } from 'lucide-react';

const bucketCategories = ['all', 'travel', 'experiences', 'life', 'dreams'] as const;
type CategoryType = typeof bucketCategories[number];

const catIcons: Record<Exclude<CategoryType, 'all'>, LucideIcon> = { 
  travel: Plane, 
  experiences: Sparkles, 
  life: Target, 
  dreams: Star 
};

export default function BucketList() {
  const { t, tc, profile } = useApp();
  const { items, isLoading, addItem, updateItem, deleteItem } = useBucket();
  
  const [cat, setCat] = useState<CategoryType>('all');
  const [showAdd, setShowAdd] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({ 
    title: '', 
    category: 'travel' as Exclude<CategoryType, 'all'>, 
    description: '',
    image_url: '' 
  });

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      if (!e.target.files || e.target.files.length === 0) return;
      const file = e.target.files[0];

      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        setForm(prev => ({ ...prev, image_url: base64 }));

        try {
          const fileExt = file.name.split('.').pop();
          const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 7)}.${fileExt}`;
          const filePath = `bucket-list/${fileName}`;

          const { error: uploadError } = await supabase.storage
            .from('memories')
            .upload(filePath, file, { cacheControl: '3600', upsert: true });

          if (!uploadError) {
            const { data } = supabase.storage.from('memories').getPublicUrl(filePath);
            if (data?.publicUrl) {
              setForm(prev => ({ ...prev, image_url: data.publicUrl }));
            }
          }
        } catch (e) {
          // Keep base64
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error uploading image:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleAddItem = async () => {
    if (!form.title || isSubmitting) return;
    setIsSubmitting(true);

    try {
      await addItem({
        title: form.title,
        category: form.category,
        description: form.description || undefined,
        image_url: form.image_url || undefined,
        is_completed: false,
      });
      setShowAdd(false);
      setForm({ title: '', category: 'travel', description: '', image_url: '' });
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleComplete = async (id: string, completed: boolean) => {
    if (togglingId === id) return;
    setTogglingId(id);

    try {
      await updateItem(id, { 
        is_completed: !completed,
        completed_at: !completed ? new Date().toISOString() : null
      });
    } catch (err) {
      console.error(err);
    } finally {
      setTogglingId(null);
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa mục tiêu này khỏi danh sách?')) return;
    try {
      await deleteItem(id);
    } catch (err) {
      console.error(err);
    }
  };

  const filtered = cat === 'all' ? items : items.filter(i => i.category === cat);
  const completedCount = items.filter(i => i.is_completed).length;

  return (
    <main className="pt-24 pb-12 min-h-screen">
      <div className="section-container max-w-5xl mx-auto px-4">
        
        {/* Header with completion bar */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="page-title">{t('bucket.title')}</h1>
              
              <div className="flex items-center gap-3 mt-2">
                <p className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-400">
                  {completedCount} / {items.length} {t('bucket.completed')}
                </p>
                <div className="w-28 h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                  <div 
                    className="h-full bg-zinc-200 rounded-full transition-all duration-700" 
                    style={{ width: items.length > 0 ? `${(completedCount / items.length) * 100}%` : '0%' }}
                  />
                </div>
              </div>
            </div>
            
            <button 
              onClick={() => setShowAdd(true)} 
              className="btn-pill self-start sm:self-auto"
            >
              <Plus className="w-3.5 h-3.5" /> {t('bucket.add')}
            </button>
          </div>
        </motion.div>

        {/* Filter Pills */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {bucketCategories.map(c => (
            <button 
              key={c} 
              onClick={() => setCat(c)}
              className={`px-4 py-1.5 text-xs font-medium rounded-full transition-all duration-200 ${
                cat === c 
                  ? 'bg-white/15 text-white border border-white/20 shadow-sm' 
                  : 'bg-white/[0.04] text-zinc-400 hover:text-zinc-100 hover:bg-white/10 border border-white/10'
              }`}
            >
              {c === 'all' ? t('memories.all') : t(`bucket.${c}`)}
            </button>
          ))}
        </div>

        {/* Goals List */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-zinc-400">
            <Loader2 className="w-7 h-7 animate-spin text-rose-500" />
            <span className="text-xs font-medium">Đang tải danh sách mục tiêu...</span>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            <AnimatePresence mode="popLayout">
              {filtered.map((item, i) => {
                const Icon = catIcons[item.category] || Star;
                return (
                  <motion.div 
                    key={item.id} 
                    layout
                    initial={{ opacity: 0, y: 15 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: i * 0.02 }}
                    className={`glass rounded-3xl p-5 border ${tc.border} flex gap-4 hover-lift shadow-sm relative group ${
                      item.is_completed ? 'opacity-75' : ''
                    }`}
                  >
                    {/* Goal image thumbnail */}
                    {item.image_url && (
                      <div className="w-16 h-16 rounded-2xl overflow-hidden shrink-0 border border-white/10 bg-black/20">
                        <img src={item.image_url} alt="" className="w-full h-full object-cover" />
                      </div>
                    )}

                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <Icon className={`w-4 h-4 shrink-0 ${tc.accentText}`} />
                          <h3 className={`text-sm font-bold ${tc.text} truncate ${item.is_completed ? 'line-through opacity-60' : ''}`}>
                            {item.title}
                          </h3>
                        </div>
                        {item.description && (
                          <p className={`text-xs ${tc.textMuted} mt-1 line-clamp-2`}>{item.description}</p>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2 mt-3">
                        <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-semibold ${tc.accentMuted} ${tc.accentText}`}>
                          {t(`bucket.${item.category}`)}
                        </span>
                        {item.is_completed && (
                          <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                            ✓ Hoàn thành
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex flex-col items-center justify-between gap-3 shrink-0">
                      <button 
                        onClick={() => handleToggleComplete(item.id, item.is_completed)}
                        disabled={togglingId === item.id}
                        className={`w-7 h-7 rounded-xl border flex items-center justify-center transition-all ${
                          item.is_completed 
                            ? 'bg-rose-500 border-rose-500 text-white shadow-md' 
                            : `border-zinc-500/40 hover:border-rose-500 text-transparent hover:text-rose-500`
                        }`}
                        title={item.is_completed ? "Đánh dấu chưa hoàn thành" : "Đánh dấu đã hoàn thành"}
                      >
                        <Check className="w-4 h-4" />
                      </button>

                      <button 
                        onClick={() => handleDeleteItem(item.id)}
                        className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-rose-500/10 text-zinc-400 hover:text-rose-400 transition"
                        title="Xóa mục tiêu"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {filtered.length === 0 && (
              <div className="col-span-full py-20 text-center">
                <Target className={`w-8 h-8 ${tc.textMuted} opacity-40 mx-auto mb-2`} />
                <p className={`text-sm ${tc.textMuted}`}>{t('common.noResults')}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add Goal Modal */}
      <AnimatePresence>
        {showAdd && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md" 
            onClick={() => setShowAdd(false)}
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
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

              <h3 className={`text-base font-bold mb-4 ${tc.text}`}>{t('bucket.add')}</h3>
              
              <div className="space-y-3.5">
                <div>
                  <label className={`block text-[11px] font-bold uppercase tracking-wider ${tc.textMuted} mb-1`}>Tên mục tiêu *</label>
                  <input 
                    type="text" 
                    value={form.title} 
                    onChange={e => setForm(p => ({ ...p, title: e.target.value }))} 
                    placeholder="Ví dụ: Cùng ngắm bình minh trên biển..." 
                    className={`w-full px-4 py-2.5 glass rounded-xl text-sm ${tc.text} bg-transparent border ${tc.border} outline-none focus:border-rose-500`} 
                  />
                </div>

                <div>
                  <label className={`block text-[11px] font-bold uppercase tracking-wider ${tc.textMuted} mb-1`}>Danh mục</label>
                  <select 
                    value={form.category} 
                    onChange={e => setForm(p => ({ ...p, category: e.target.value as any }))} 
                    className={`w-full px-4 py-2.5 glass rounded-xl text-sm bg-neutral-900 ${tc.text} border ${tc.border} outline-none`}
                  >
                    <option value="travel" className="bg-neutral-900 text-white">{t('bucket.travel')}</option>
                    <option value="experiences" className="bg-neutral-900 text-white">{t('bucket.experiences')}</option>
                    <option value="life" className="bg-neutral-900 text-white">{t('bucket.life')}</option>
                    <option value="dreams" className="bg-neutral-900 text-white">{t('bucket.dreams')}</option>
                  </select>
                </div>

                <div>
                  <label className={`block text-[11px] font-bold uppercase tracking-wider ${tc.textMuted} mb-1`}>Hình ảnh minh họa</label>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleImageUpload} 
                    accept="image/*" 
                    className="hidden" 
                  />

                  {form.image_url ? (
                    <div className="relative aspect-video rounded-2xl overflow-hidden border border-white/15 bg-black/50">
                      <img src={form.image_url} alt="Preview" className="w-full h-full object-cover" />
                      <button 
                        type="button" 
                        onClick={() => setForm(p => ({ ...p, image_url: '' }))}
                        className="absolute top-2 right-2 p-1.5 bg-black/60 rounded-full text-white hover:bg-black/80"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <button 
                      type="button" 
                      disabled={uploading}
                      onClick={() => fileInputRef.current?.click()}
                      className={`w-full py-6 border border-dashed ${tc.border} rounded-2xl bg-black/5 dark:bg-white/[0.01] hover:bg-white/[0.03] transition-all flex flex-col items-center justify-center gap-2 ${tc.textMuted} hover:${tc.text}`}
                    >
                      {uploading ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin text-rose-500" />
                          <span className="text-xs font-semibold">Đang xử lý hình ảnh...</span>
                        </>
                      ) : (
                        <>
                          <Camera className="w-5 h-5 opacity-60 text-rose-500" />
                          <span className="text-xs font-semibold">Chọn hình ảnh làm mục tiêu</span>
                        </>
                      )}
                    </button>
                  )}
                </div>

                <div>
                  <label className={`block text-[11px] font-bold uppercase tracking-wider ${tc.textMuted} mb-1`}>Mô tả chi tiết</label>
                  <textarea 
                    value={form.description} 
                    onChange={e => setForm(p => ({ ...p, description: e.target.value }))} 
                    placeholder="Viết một vài điều ước, kế hoạch chi tiết..." 
                    rows={2} 
                    className={`w-full px-4 py-2.5 glass rounded-xl text-sm ${tc.text} bg-transparent border ${tc.border} outline-none resize-none focus:border-rose-500`} 
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button 
                    type="button" 
                    onClick={() => setShowAdd(false)} 
                    disabled={uploading}
                    className={`flex-1 py-2.5 glass border ${tc.border} rounded-xl text-sm font-semibold ${tc.text} hover:bg-white/10 transition`}
                  >
                    {t('common.cancel')}
                  </button>
                  <button 
                    type="button" 
                    onClick={handleAddItem} 
                    disabled={isSubmitting || !form.title || uploading}
                    className="flex-1 py-2.5 gradient-accent rounded-xl text-sm text-white font-semibold hover:opacity-95 transition disabled:opacity-50 flex items-center justify-center gap-2 shadow-md"
                  >
                    {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
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