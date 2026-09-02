import { useState, useEffect, useRef } from 'react';
import { NavLink } from 'react-router-dom';
import { Music, Play, Pause, SkipForward } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { type WorkspaceBlock } from '../../types/personalization';

interface SongItem {
  id: string;
  title: string;
  artist?: string;
  url: string;
  is_favorite: boolean;
  is_background: boolean;
}

export default function MusicPlayerWidget({ block }: { block: WorkspaceBlock }) {
  const [songs, setSongs] = useState<SongItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const youtubeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await supabase
          .from('songs')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(10);
        if (data && data.length > 0) setSongs(data);
      } catch (e) {
        // Local fallback
      }
    })();
  }, []);

  const currentSong = songs[currentIndex] || {
    id: 'sample',
    title: 'Until I Found You',
    artist: 'Stephen Sanchez',
    url: 'https://www.youtube.com/watch?v=GxldQ9eX2wo',
    is_favorite: true,
    is_background: true,
  };

  const getYoutubeId = (url: string) => {
    if (!url) return null;
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|shorts\/|watch\?.+&v=))([\w-]{11})/);
    return match ? match[1] : null;
  };

  const ytId = getYoutubeId(currentSong.url);

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  const nextTrack = () => {
    if (songs.length > 0) {
      setCurrentIndex((prev) => (prev + 1) % songs.length);
      setIsPlaying(true);
    }
  };

  return (
    <div className="glass p-5 sm:p-6 shadow-xl flex flex-col justify-between h-full">
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-white/[0.05] border border-white/10 text-zinc-300">
              <Music className="w-4 h-4" />
            </div>
            <h3 className="text-xs sm:text-sm font-bold text-zinc-100 uppercase font-sans tracking-wide">
              {block.title || 'Giai Điệu Tình Yêu'}
            </h3>
          </div>
          <NavLink
            to="/music"
            className="text-xs font-medium text-zinc-400 hover:text-white transition-colors"
          >
            Mở Danh Sách
          </NavLink>
        </div>

        {/* Current track player card */}
        <div className="flex items-center gap-4 p-3 rounded-2xl bg-black/25 border border-white/10">
          <div className="w-12 h-12 rounded-xl gradient-accent flex items-center justify-center text-white shrink-0 shadow-lg">
            <Music className={`w-5 h-5 ${isPlaying ? 'animate-bounce' : ''}`} />
          </div>

          <div className="flex-1 min-w-0">
            <h4 className="text-xs sm:text-sm font-bold text-zinc-100 truncate">
              {currentSong.title}
            </h4>
            <p className="text-[11px] text-zinc-400 truncate mt-0.5">
              {currentSong.artist || 'Love Melody'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={togglePlay}
              className="w-9 h-9 rounded-full gradient-accent text-white flex items-center justify-center shadow-md active:scale-95 transition"
            >
              {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
            </button>

            <button
              type="button"
              onClick={nextTrack}
              className="p-2 rounded-xl hover:bg-white/10 text-zinc-400 hover:text-white transition"
              title="Next Track"
            >
              <SkipForward className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Hidden player engine */}
        {ytId && isPlaying && (
          <iframe
            ref={youtubeRef}
            width="1"
            height="1"
            src={`https://www.youtube.com/embed/${ytId}?enablejsapi=1&autoplay=1`}
            allow="autoplay; encrypted-media"
            className="w-0 h-0 absolute pointer-events-none opacity-0"
            title="Widget Audio Player"
          />
        )}
      </div>

      <div className="flex items-center justify-between text-[11px] text-zinc-500 font-mono mt-3">
        <span>Bài {currentIndex + 1} / {Math.max(1, songs.length)}</span>
        <span>Autoplay Support</span>
      </div>
    </div>
  );
}
