import { useState } from 'react';
import { Camera, ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { usePersonalization } from '../../contexts/PersonalizationContext';
import { type WorkspaceBlock } from '../../types/personalization';

export default function PhotoGalleryWidget({ block }: { block: WorkspaceBlock }) {
  const { assets, setIsAssetLibraryOpen } = usePersonalization();
  const [photoIndex, setPhotoIndex] = useState(0);

  const galleryPhotos = assets.filter((a) => a.category === 'photo' || a.category === 'avatar');

  const photos =
    galleryPhotos.length > 0
      ? galleryPhotos
      : [
          {
            id: 'sample-1',
            url: '/xuannghi.jpg',
            name: 'Nụ cười tỏa nắng',
          },
          {
            id: 'sample-2',
            url: '/mcuong.jpg',
            name: 'Kỷ niệm chung',
          },
        ];

  const current = photos[photoIndex] || photos[0];

  const nextPhoto = () => setPhotoIndex((p) => (p + 1) % photos.length);
  const prevPhoto = () => setPhotoIndex((p) => (p - 1 + photos.length) % photos.length);

  return (
    <div className="glass p-5 sm:p-6 shadow-xl flex flex-col justify-between h-full">
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-white/[0.05] border border-white/10 text-zinc-300">
              <Camera className="w-4 h-4 text-rose-500" />
            </div>
            <h3 className="text-xs sm:text-sm font-bold text-zinc-100 uppercase font-sans tracking-wide">
              {block.title || 'Kho Ảnh & Thư Viện'}
            </h3>
          </div>

          <button
            type="button"
            onClick={() => setIsAssetLibraryOpen(true)}
            className="text-xs font-medium text-zinc-400 hover:text-white flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" /> Thêm Ảnh
          </button>
        </div>

        {/* Carousel Viewport */}
        <div className="relative aspect-video rounded-2xl overflow-hidden border border-white/10 bg-black/40 group">
          <img
            src={current.url}
            alt={current.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />

          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end justify-between p-3">
            <span className="text-xs font-semibold text-white truncate max-w-[70%]">
              {current.name}
            </span>
            <span className="text-[10px] font-mono text-zinc-400">
              {photoIndex + 1}/{photos.length}
            </span>
          </div>

          {/* Nav arrows */}
          {photos.length > 1 && (
            <>
              <button
                type="button"
                onClick={prevPhoto}
                className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 bg-black/60 hover:bg-black/85 text-white rounded-full transition"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={nextPhoto}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-black/60 hover:bg-black/85 text-white rounded-full transition"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>

      <div className="text-[10px] text-zinc-500 font-mono mt-3 text-center">
        Đồng bộ trực tiếp với Asset Library
      </div>
    </div>
  );
}
