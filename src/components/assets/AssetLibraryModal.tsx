import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  UploadCloud, 
  Trash2, 
  Heart, 
  Search, 
  Check, 
  Image as ImageIcon, 
  Layers, 
  Loader2 
} from 'lucide-react';
import { usePersonalization } from '../../contexts/PersonalizationContext';
import { type AssetCategory } from '../../types/personalization';
import { supabase } from '../../lib/supabase';

export default function AssetLibraryModal() {
  const {
    isAssetLibraryOpen,
    setIsAssetLibraryOpen,
    assets,
    addAsset,
    removeAsset,
    toggleAssetFavorite,
    updateBackground,
    updateIdentity,
  } = usePersonalization();

  const [category, setCategory] = useState<'all' | AssetCategory>('all');
  const [search, setSearch] = useState('');
  const [uploading, setUploading] = useState(false);
  const [appliedMessage, setAppliedMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const categories: Array<{ key: 'all' | AssetCategory; label: string }> = [
    { key: 'all', label: 'Tất cả' },
    { key: 'avatar', label: 'Ảnh đại diện' },
    { key: 'banner', label: 'Ảnh bìa' },
    { key: 'background', label: 'Hình nền' },
    { key: 'photo', label: 'Ảnh kỷ niệm' },
    { key: 'sticker', label: 'Stickers' },
  ];

  const filteredAssets = assets.filter((a) => {
    const matchCat = category === 'all' || a.category === category;
    const matchSearch =
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()));
    return matchCat && matchSearch;
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      if (!e.target.files || e.target.files.length === 0) return;
      setUploading(true);
      const file = e.target.files[0];

      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Url = reader.result as string;
        let finalUrl = base64Url;

        // Try Supabase Storage upload
        try {
          const fileExt = file.name.split('.').pop();
          const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 7)}.${fileExt}`;
          const filePath = `assets/${fileName}`;

          const { error } = await supabase.storage
            .from('assets')
            .upload(filePath, file, { cacheControl: '3600', upsert: true });

          if (!error) {
            const { data } = supabase.storage.from('assets').getPublicUrl(filePath);
            if (data?.publicUrl) {
              finalUrl = data.publicUrl;
            }
          }
        } catch (err) {
          // Local fallback
        }

        const catDetermined: AssetCategory =
          category !== 'all' ? (category as AssetCategory) : 'photo';

        addAsset({
          name: file.name.replace(/\.[^/.]+$/, ''),
          category: catDetermined,
          url: finalUrl,
          size: file.size,
          mimeType: file.type,
          tags: [catDetermined, 'user-upload'],
          isFavorite: false,
        });

        setUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error('Failed to upload asset:', err);
      setUploading(false);
    }
  };

  const applyAsBackground = (url: string) => {
    updateBackground({
      type: url.endsWith('.gif') ? 'gif' : 'image',
      value: url,
      opacity: 1,
    });
    setAppliedMessage('Đã đặt làm hình nền ứng dụng!');
    setTimeout(() => setAppliedMessage(null), 2500);
  };

  const applyAsP1Avatar = (url: string) => {
    updateIdentity({ partner1Avatar: url });
    setAppliedMessage('Đã đổi avatar cho Bạn (Partner 1)!');
    setTimeout(() => setAppliedMessage(null), 2500);
  };

  const applyAsP2Avatar = (url: string) => {
    updateIdentity({ partner2Avatar: url });
    setAppliedMessage('Đã đổi avatar cho Người ấy (Partner 2)!');
    setTimeout(() => setAppliedMessage(null), 2500);
  };

  if (!isAssetLibraryOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="bg-[#18181b] border border-white/15 rounded-3xl w-full max-w-4xl max-h-[88vh] flex flex-col shadow-2xl overflow-hidden relative"
        >
          {/* Modal Header */}
          <div className="px-6 py-5 border-b border-white/10 flex items-center justify-between bg-zinc-900/80 backdrop-blur-md">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-zinc-100 font-serif">
                  Thư Viện Tài Nguyên Cá Nhân (Asset Library)
                </h2>
                <p className="text-xs text-zinc-400">
                  Lưu trữ, quản lý và tái sử dụng hình ảnh, GIF, sticker trên toàn bộ hệ thống
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="btn-pill gradient-accent"
              >
                {uploading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <UploadCloud className="w-3.5 h-3.5" />
                )}
                <span>Tải Lên Media</span>
              </button>

              <button
                type="button"
                onClick={() => setIsAssetLibraryOpen(false)}
                className="p-2 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept="image/*,.gif,.webp"
            className="hidden"
          />

          {/* Toast Notification */}
          <AnimatePresence>
            {appliedMessage && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-emerald-950/90 border-b border-emerald-500/30 px-6 py-2 text-xs font-semibold text-emerald-200 flex items-center gap-2"
              >
                <Check className="w-4 h-4 text-emerald-400" />
                <span>{appliedMessage}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Search and Category Filters */}
          <div className="p-5 border-b border-white/5 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between bg-zinc-950/40">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm theo tên hoặc thẻ tag..."
                className="w-full pl-10 pr-4 py-2 bg-zinc-900 rounded-xl text-xs text-zinc-100 border border-white/10 outline-none focus:border-rose-500"
              />
            </div>

            <div className="flex gap-1.5 overflow-x-auto pb-1">
              {categories.map((c) => (
                <button
                  key={c.key}
                  type="button"
                  onClick={() => setCategory(c.key)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all shrink-0 ${
                    category === c.key
                      ? 'bg-white/15 text-white border border-white/25 shadow-sm'
                      : 'bg-white/[0.04] text-zinc-400 hover:text-white border border-white/5'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* Assets Grid */}
          <div className="p-6 overflow-y-auto flex-1">
            {filteredAssets.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {filteredAssets.map((asset) => (
                  <div
                    key={asset.id}
                    className="group relative aspect-square rounded-2xl overflow-hidden bg-black/40 border border-white/10 hover:border-white/30 transition-all flex flex-col justify-between"
                  >
                    <img
                      src={asset.url}
                      alt={asset.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                    />

                    {/* Top action badges */}
                    <div className="absolute top-2 right-2 flex gap-1 z-10 opacity-90 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={() => toggleAssetFavorite(asset.id)}
                        className="p-1.5 bg-black/70 hover:bg-black/90 text-white rounded-lg transition"
                        title="Yêu thích"
                      >
                        <Heart
                          className={`w-3.5 h-3.5 ${
                            asset.isFavorite ? 'text-rose-500 fill-rose-500' : 'text-white'
                          }`}
                        />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeAsset(asset.id)}
                        className="p-1.5 bg-black/70 hover:bg-red-500/80 text-white rounded-lg transition"
                        title="Xóa tài nguyên"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Bottom Quick Apply Hover Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-3 flex flex-col justify-end gap-1.5">
                      <p className="text-xs font-bold text-white truncate mb-1">{asset.name}</p>

                      <div className="grid grid-cols-2 gap-1 text-[10px]">
                        <button
                          type="button"
                          onClick={() => applyAsBackground(asset.url)}
                          className="px-2 py-1 rounded bg-white/10 hover:bg-white/20 text-zinc-200 transition font-medium"
                        >
                          Làm hình nền
                        </button>
                        <button
                          type="button"
                          onClick={() => applyAsP1Avatar(asset.url)}
                          className="px-2 py-1 rounded bg-white/10 hover:bg-white/20 text-zinc-200 transition font-medium"
                        >
                          Avatar Chàng
                        </button>
                        <button
                          type="button"
                          onClick={() => applyAsP2Avatar(asset.url)}
                          className="px-2 py-1 rounded bg-white/10 hover:bg-white/20 text-zinc-200 transition font-medium col-span-2"
                        >
                          Avatar Nàng
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-20 text-center text-zinc-500">
                <ImageIcon className="w-10 h-10 mx-auto mb-2 opacity-40" />
                <p className="text-sm">Chưa có tài nguyên nào trong mục này.</p>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="btn-pill mt-4"
                >
                  Tải lên tệp đầu tiên
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
