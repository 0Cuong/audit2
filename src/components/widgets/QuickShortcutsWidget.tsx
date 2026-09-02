import { useNavigate } from 'react-router-dom';
import { 
  MapPin, 
  Music, 
  Camera, 
  BookHeart, 
  CheckSquare, 
  Palette,
} from 'lucide-react';
import { usePersonalization } from '../../contexts/PersonalizationContext';
import { type WorkspaceBlock } from '../../types/personalization';

export default function QuickShortcutsWidget({ block }: { block: WorkspaceBlock }) {
  const navigate = useNavigate();
  const { setIsStudioOpen, setActiveStudioTab } = usePersonalization();

  const shortcuts = [
    {
      id: 'sc-memories',
      title: 'Kỷ Niệm',
      icon: Camera,
      action: () => navigate('/memories'),
      accent: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    },
    {
      id: 'sc-map',
      title: 'Bản Đồ Hẹn Hò',
      icon: MapPin,
      action: () => navigate('/map'),
      accent: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    },
    {
      id: 'sc-music',
      title: 'Nhạc Đôi',
      icon: Music,
      action: () => navigate('/music'),
      accent: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    },
    {
      id: 'sc-journal',
      title: 'Nhật Ký',
      icon: BookHeart,
      action: () => navigate('/journal'),
      accent: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    },
    {
      id: 'sc-bucket',
      title: 'Wishlist',
      icon: CheckSquare,
      action: () => navigate('/bucket-list'),
      accent: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    },
    {
      id: 'sc-studio',
      title: 'Studio',
      icon: Palette,
      action: () => {
        setActiveStudioTab('presets');
        setIsStudioOpen(true);
      },
      accent: 'bg-pink-500/10 text-pink-400 border-pink-500/20',
    },
  ];

  return (
    <div className="glass p-5 shadow-xl flex flex-col justify-between h-full">
      <div>
        <h3 className="text-xs sm:text-sm font-semibold text-zinc-200 mb-3.5">
          {block.title || 'Lối tắt'}
        </h3>

        {/* Shortcuts 3x2 Grid */}
        <div className="grid grid-cols-3 gap-2">
          {shortcuts.map((sc) => {
            const Icon = sc.icon;
            return (
              <button
                key={sc.id}
                type="button"
                onClick={sc.action}
                className="flex flex-col items-center justify-center p-3 rounded-2xl bg-white/[0.02] border border-white/[0.06] hover:border-white/20 hover:bg-white/[0.06] transition-all group active:scale-95 text-center"
              >
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center mb-1.5 border ${sc.accent} group-hover:scale-110 transition-transform`}>
                  <Icon className="w-4 h-4" />
                </div>
                <span className="text-[11px] font-semibold text-zinc-300 group-hover:text-white truncate max-w-full">
                  {sc.title}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
