import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Music, 
  Heart, 
  Volume2, 
  VolumeX, 
  Play, 
  Pause, 
  Trash2, 
  X, 
  ExternalLink, 
  Radio, 
  Sparkles, 
  Disc3, 
  ListMusic, 
  SkipBack, 
  SkipForward,
  Youtube,
  RadioTower,
  AlertCircle
} from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { supabase } from '../lib/supabase';

// ============================================================================
// 1. DATA TYPES & DEFAULT DATA (Strictly Preserved Schema)
// ============================================================================
export interface SongItem {
  id: string;
  title: string;
  artist?: string;
  url: string;
  is_favorite: boolean;
  is_background: boolean;
  created_at?: string;
  artwork_url?: string; // Optional field for future-proofing without breaking schema
}

const DEFAULT_SONGS: SongItem[] = [
  {
    id: 'song-1',
    title: 'Until I Found You',
    artist: 'Stephen Sanchez',
    url: 'https://www.youtube.com/watch?v=GxldQ9eX2wo',
    is_favorite: true,
    is_background: true,
  },
  {
    id: 'song-2',
    title: 'Double Take',
    artist: 'dhruv',
    url: 'https://www.youtube.com/watch?v=uQ763VvqiPE',
    is_favorite: true,
    is_background: false,
  },
  {
    id: 'song-3',
    title: 'Die With A Smile',
    artist: 'Lady Gaga & Bruno Mars',
    url: 'https://www.youtube.com/watch?v=kPa7bsKwL-8',
    is_favorite: false,
    is_background: false,
  }
];

// ============================================================================
// 2. ARTWORK & PALETTE RESOLVER ENGINE
// ============================================================================
const PALETTES = [
  { from: 'from-rose-500 via-pink-600 to-indigo-950', glow: 'rgba(244, 63, 94, 0.35)', accent: '#f43f5e', border: 'rgba(244, 63, 94, 0.4)' },
  { from: 'from-violet-600 via-purple-700 to-blue-950', glow: 'rgba(139, 92, 246, 0.35)', accent: '#8b5cf6', border: 'rgba(139, 92, 246, 0.4)' },
  { from: 'from-amber-500 via-rose-600 to-purple-950', glow: 'rgba(245, 158, 11, 0.35)', accent: '#f59e0b', border: 'rgba(245, 158, 11, 0.4)' },
  { from: 'from-cyan-500 via-blue-600 to-slate-950', glow: 'rgba(6, 182, 212, 0.35)', accent: '#06b6d4', border: 'rgba(6, 182, 212, 0.4)' },
  { from: 'from-emerald-500 via-teal-700 to-indigo-950', glow: 'rgba(16, 185, 129, 0.35)', accent: '#10b981', border: 'rgba(16, 185, 129, 0.4)' },
  { from: 'from-fuchsia-500 via-pink-700 to-rose-950', glow: 'rgba(217, 70, 239, 0.35)', accent: '#d946ef', border: 'rgba(217, 70, 239, 0.4)' },
  { from: 'from-sky-500 via-indigo-600 to-purple-950', glow: 'rgba(14, 165, 233, 0.35)', accent: '#0ea5e9', border: 'rgba(14, 165, 233, 0.4)' },
  { from: 'from-rose-600 via-orange-600 to-amber-950', glow: 'rgba(225, 29, 72, 0.35)', accent: '#e11d48', border: 'rgba(225, 29, 72, 0.4)' }
];

export const getYoutubeId = (url: string): string | null => {
  if (!url) return null;
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|shorts\/|watch\?.+&v=|live\/))([\w-]{11})/);
  return match ? match[1] : null;
};

export const getSpotifyId = (url: string): string | null => {
  if (!url) return null;
  const match = url.match(/spotify\.com\/(?:intl-[a-z]+\/)?track\/([a-zA-Z0-9]+)/);
  return match ? match[1] : null;
};

export const detectUrlType = (url: string): 'youtube' | 'spotify' | 'audio' | 'unknown' => {
  if (!url) return 'unknown';
  if (getYoutubeId(url)) return 'youtube';
  if (getSpotifyId(url)) return 'spotify';
  if (url.match(/\.(mp3|wav|ogg|m4a|aac)(\?.*)?$/i) || url.startsWith('http')) return 'audio';
  return 'unknown';
};

export interface SongArtworkData {
  type: 'image' | 'generated';
  url?: string;
  palette: typeof PALETTES[0];
}

export const getSongArtwork = (song: SongItem | null): SongArtworkData => {
  if (!song) {
    return {
      type: 'generated',
      palette: PALETTES[0],
    };
  }

  const seed = (song.title + (song.artist || '')).split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const palette = PALETTES[seed % PALETTES.length];

  // Level 1: Optional direct artwork_url
  if (song.artwork_url && song.artwork_url.trim()) {
    return {
      type: 'image',
      url: song.artwork_url.trim(),
      palette,
    };
  }

  // Level 2: YouTube HQ Thumbnail
  const ytId = getYoutubeId(song.url);
  if (ytId) {
    return {
      type: 'image',
      url: `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`,
      palette,
    };
  }

  // Level 3 & 4: Generated Artwork
  return {
    type: 'generated',
    palette,
  };
};

// ============================================================================
// 3. REUSABLE ARTWORK COMPONENT WITH ROBUST ERROR FALLBACK
// ============================================================================
interface ArtworkImageProps {
  artwork: SongArtworkData;
  title: string;
  className?: string;
  altText?: string;
  showIconFallback?: boolean;
}

const ArtworkImage: React.FC<ArtworkImageProps> = ({ 
  artwork, 
  title, 
  className = '', 
  altText,
  showIconFallback = true 
}) => {
  const [hasError, setHasError] = useState(false);

  // Reset error state if the URL changes
  useEffect(() => {
    setHasError(false);
  }, [artwork.url]);

  if (artwork.type === 'image' && artwork.url && !hasError) {
    return (
      <img
        src={artwork.url}
        alt={altText || title}
        loading="lazy"
        onError={() => setHasError(true)}
        className={`w-full h-full object-cover select-none ${className}`}
      />
    );
  }

  return (
    <div 
      className={`w-full h-full bg-gradient-to-tr ${artwork.palette.from} flex items-center justify-center relative overflow-hidden select-none ${className}`}
    >
      <div className="absolute inset-0 bg-black/10 backdrop-blur-[1px]" />
      {showIconFallback && (
        <Music className="w-1/3 h-1/3 text-white/80 relative z-10 drop-shadow-md" />
      )}
    </div>
  );
};

// ============================================================================
// 4. VINYL TURNTABLE COMPONENT (Hi-Fi Grooves, Reflection, Tonearm)
// ============================================================================
interface VinylTurntableProps {
  activeSong: SongItem | null;
  isPlaying: boolean;
  artwork: SongArtworkData;
}

const VinylTurntable: React.FC<VinylTurntableProps> = ({ activeSong, isPlaying, artwork }) => {
  return (
    <div className="relative w-52 h-52 sm:w-60 sm:h-60 md:w-72 md:h-72 flex items-center justify-center mx-auto select-none">
      
      {/* Outer Halo Ambient Glow */}
      <div 
        className="absolute inset-0 rounded-full blur-3xl opacity-35 transition-all duration-1000 pointer-events-none"
        style={{ backgroundColor: artwork.palette.accent }}
      />

      {/* Turntable Platter Base Shadow */}
      <div className="absolute inset-2 rounded-full bg-black/60 blur-xl pointer-events-none" />

      {/* Vinyl Record Disc */}
      <div 
        className={`relative w-full h-full rounded-full shadow-2xl bg-zinc-950 flex items-center justify-center border-4 border-zinc-900/90 overflow-hidden ${
          isPlaying ? 'motion-safe:animate-[spin_20s_linear_infinite]' : 'transition-transform duration-1000 ease-out'
        }`}
        style={{
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8), inset 0 0 0 2px rgba(255, 255, 255, 0.05)',
          backgroundImage: 'repeating-radial-gradient(circle at center, #18181b 0, #18181b 2.5px, #09090b 3.5px, #09090b 5px)'
        }}
      >
        {/* Specular Light Sweep Reflection (Luxury Turntable Look) */}
        <div 
          className="absolute inset-0 rounded-full pointer-events-none opacity-40 mix-blend-screen"
          style={{
            background: 'conic-gradient(from 45deg, rgba(255,255,255,0.15) 0deg, transparent 50deg, rgba(255,255,255,0.08) 180deg, transparent 230deg, rgba(255,255,255,0.15) 360deg)'
          }}
        />

        {/* Center Label (Artwork Canvas) */}
        <div className="w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 rounded-full p-1.5 shadow-2xl relative flex items-center justify-center overflow-hidden border-2 border-zinc-800/80 bg-zinc-900">
          <div className="w-full h-full rounded-full overflow-hidden relative shadow-inner">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeSong ? activeSong.id : 'idle-art'}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.4 }}
                className="w-full h-full"
              >
                <ArtworkImage 
                  artwork={artwork} 
                  title={activeSong ? activeSong.title : 'Love Lounge'} 
                  showIconFallback={false}
                />
              </motion.div>
            </AnimatePresence>

            {/* Subtle gloss overlay over center artwork */}
            <div className="absolute inset-0 bg-gradient-to-tr from-black/30 via-transparent to-white/20 pointer-events-none" />
          </div>

          {/* Center Spindle & Aluminum Spindle Hole */}
          <div className="absolute w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-gradient-to-b from-zinc-200 to-zinc-500 p-0.5 shadow-lg z-20 flex items-center justify-center">
            <div className="w-2.5 h-2.5 rounded-full bg-zinc-950 border border-zinc-700 shadow-inner" />
          </div>
        </div>
      </div>

      {/* Mechanical Tonearm / Stylus */}
      <div 
        className={`absolute -top-3 right-0 sm:right-2 w-16 h-32 pointer-events-none origin-top-right transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] z-30 ${
          isPlaying ? 'rotate-[20deg]' : 'rotate-[-6deg] opacity-70'
        }`}
      >
        {/* Tonearm Base Pivot */}
        <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-zinc-700 to-zinc-400 shadow-md mx-auto border border-zinc-500/50 flex items-center justify-center">
          <div className="w-3 h-3 rounded-full bg-zinc-900" />
        </div>
        {/* Metallic Arm Rod */}
        <div className="w-1.5 h-20 bg-gradient-to-r from-zinc-400 via-zinc-200 to-zinc-400 rounded-full mx-auto shadow-md" />
        {/* Headshell / Cartridge */}
        <div className="w-3.5 h-6 bg-gradient-to-b from-zinc-800 to-rose-600 rounded-sm mx-auto shadow-lg -mt-1" />
      </div>
    </div>
  );
};

// ============================================================================
// 5. MAIN MUSIC PAGE COMPONENT
// ============================================================================
export default function MusicPage() {
  const { t, tc } = useApp();

  // Safe localStorage Initial State
  const [songs, setSongs] = useState<SongItem[]>(() => {
    try {
      const saved = localStorage.getItem('cuongisme_songs');
      return saved ? JSON.parse(saved) : DEFAULT_SONGS;
    } catch {
      return DEFAULT_SONGS;
    }
  });

  const [filter, setFilter] = useState<'all' | 'favorites' | 'background'>('all');
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ title: '', artist: '', url: '' });

  const [activeSong, setActiveSong] = useState<SongItem | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [audioError, setAudioError] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement>(null);
  const youtubeRef = useRef<HTMLIFrameElement>(null);

  // Load latest data from Supabase
  useEffect(() => {
    supabase
      .from('songs')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data, error }) => { 
        if (!error && data && Array.isArray(data) && data.length > 0) {
          setSongs(data); 
          try {
            localStorage.setItem('cuongisme_songs', JSON.stringify(data));
          } catch {
            // Storage quota handled safely
          }
        }
      });
  }, []);

  // HTML5 Audio Playback Control
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
      if (isPlaying) {
        audioRef.current.play().catch(() => {
          setIsPlaying(false);
          setAudioError('Không thể tự động phát file âm thanh này.');
        });
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying, activeSong]);

  // YouTube Player Control via postMessage API
  useEffect(() => {
    if (youtubeRef.current && youtubeRef.current.contentWindow) {
      const command = isPlaying ? 'playVideo' : 'pauseVideo';
      const ytVolume = Math.round(volume * 100);

      youtubeRef.current.contentWindow.postMessage(
        JSON.stringify({ event: 'command', func: command, args: '' }),
        '*'
      );
      youtubeRef.current.contentWindow.postMessage(
        JSON.stringify({ event: 'command', func: 'setVolume', args: [ytVolume] }),
        '*'
      );
    }
  }, [isPlaying, volume, activeSong]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  // Filtered list
  const filteredSongs = useMemo(() => {
    return songs.filter(s => {
      if (filter === 'favorites') return s.is_favorite;
      if (filter === 'background') return s.is_background;
      return true;
    });
  }, [songs, filter]);

  // Active Artwork & Palette Resolver
  const activeArtwork = useMemo(() => getSongArtwork(activeSong), [activeSong]);
  const activeYtId = activeSong ? getYoutubeId(activeSong.url) : null;
  const activeSpotifyId = activeSong ? getSpotifyId(activeSong.url) : null;
  const activeIsDirect = activeSong && !activeYtId && !activeSpotifyId;

  // Actions
  const addSong = async () => {
    if (!form.title.trim() || !form.url.trim()) return;
    
    const newSong: SongItem = {
      id: 'local-' + Date.now(),
      title: form.title.trim(),
      artist: form.artist.trim() || 'Love Melody',
      url: form.url.trim(),
      is_favorite: false,
      is_background: false,
      created_at: new Date().toISOString(),
    };

    const updated = [newSong, ...songs];
    setSongs(updated);
    try {
      localStorage.setItem('cuongisme_songs', JSON.stringify(updated));
    } catch {
      // Local fallback
    }

    setShowAdd(false);
    setForm({ title: '', artist: '', url: '' });

    try {
      const { data } = await supabase.from('songs').insert(newSong).select().maybeSingle();
      if (data) {
        setSongs(prev => prev.map(s => s.id === newSong.id ? data : s));
      }
    } catch {
      // Optimistic state preserved
    }
  };

  const deleteSong = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa bài hát này khỏi danh sách tình yêu?')) return;
    const updated = songs.filter(s => s.id !== id);
    setSongs(updated);
    try {
      localStorage.setItem('cuongisme_songs', JSON.stringify(updated));
    } catch {
      // Local fallback
    }

    if (activeSong?.id === id) {
      setActiveSong(null);
      setIsPlaying(false);
    }

    try {
      await supabase.from('songs').delete().eq('id', id);
    } catch {
      // Local fallback
    }
  };

  const toggleFav = async (id: string, val: boolean) => {
    const updated = songs.map(s => s.id === id ? { ...s, is_favorite: !val } : s);
    setSongs(updated);
    try {
      localStorage.setItem('cuongisme_songs', JSON.stringify(updated));
    } catch {
      // Local fallback
    }

    try {
      await supabase.from('songs').update({ is_favorite: !val }).eq('id', id);
    } catch {
      // Local fallback
    }
  };

  const toggleBg = async (id: string, val: boolean) => {
    const updated = songs.map(s => s.id === id ? { ...s, is_background: !val } : s);
    setSongs(updated);
    try {
      localStorage.setItem('cuongisme_songs', JSON.stringify(updated));
    } catch {
      // Local fallback
    }

    try {
      await supabase.from('songs').update({ is_background: !val }).eq('id', id);
    } catch {
      // Local fallback
    }
  };

  const handlePlaySong = (song: SongItem) => {
    setAudioError(null);
    if (activeSong?.id === song.id) {
      setIsPlaying(!isPlaying);
    } else {
      setActiveSong(song);
      setIsPlaying(true);
      setCurrentTime(0);
    }
  };

  const handleSkip = useCallback((direction: 'next' | 'prev') => {
    if (filteredSongs.length === 0) return;
    if (!activeSong) {
      handlePlaySong(filteredSongs[0]);
      return;
    }
    const currentIndex = filteredSongs.findIndex(s => s.id === activeSong.id);
    if (currentIndex === -1) {
      handlePlaySong(filteredSongs[0]);
      return;
    }
    let targetIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;
    if (targetIndex >= filteredSongs.length) targetIndex = 0;
    if (targetIndex < 0) targetIndex = filteredSongs.length - 1;
    handlePlaySong(filteredSongs[targetIndex]);
  }, [filteredSongs, activeSong]);

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVol = parseFloat(e.target.value);
    setVolume(newVol);
    if (audioRef.current) {
      audioRef.current.volume = newVol;
    }
  };

  const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const formatTime = (time: number) => {
    if (!time || isNaN(time) || time === Infinity) return '0:00';
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <main className="pt-24 pb-20 min-h-screen relative overflow-x-hidden selection:bg-rose-500/30">
      
      {/* ===================================================================== */}
      {/* 1. DYNAMIC CINEMATIC BACKDROP (Full Bleed Artwork Blur + Ambient Glow)*/}
      {/* ===================================================================== */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        {/* Full Bleed Blurred Artwork */}
        <AnimatePresence mode="wait">
          {activeArtwork.type === 'image' && activeArtwork.url ? (
            <motion.div
              key={activeArtwork.url}
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.18 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.2 }}
              className="absolute inset-0 scale-125 filter blur-[90px] saturate-150"
            >
              <img 
                src={activeArtwork.url} 
                alt="Atmosphere" 
                className="w-full h-full object-cover"
              />
            </motion.div>
          ) : (
            <motion.div
              key="default-gradient"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1 }}
              className="absolute inset-0 transition-colors duration-1000"
              style={{
                background: `radial-gradient(circle 800px at 50% 15%, ${activeArtwork.palette.glow}, transparent 75%)`
              }}
            />
          )}
        </AnimatePresence>

        {/* Global Dark Vignette Overlay for Crisp Contrast */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/10 to-black/40 pointer-events-none" />
      </div>

      <div className="section-container max-w-5xl mx-auto px-4 sm:px-6">
        
        {/* ===================================================================== */}
        {/* 2. HERO NOW PLAYING EXPERIENCE                                        */}
        {/* ===================================================================== */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="relative mb-10"
          aria-label="Now Playing Stage"
        >
          <div className={`relative rounded-3xl p-6 sm:p-8 md:p-10 border ${tc.border} glass-strong shadow-2xl backdrop-blur-2xl overflow-hidden transition-all duration-700`}>
            
            {/* Top Bar inside Hero */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 relative z-10">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold tracking-wider uppercase bg-rose-500/10 text-rose-500 border border-rose-500/20 backdrop-blur-md">
                    <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                    Cinematic Music Lounge
                  </span>
                </div>
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight gradient-text">
                  {t('music.title')}
                </h1>
                <p className={`text-xs sm:text-sm font-medium ${tc.textMuted}`}>
                  Tuyển tập những giai điệu tình yêu bất hủ của đôi mình
                </p>
              </div>

              <motion.button 
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setShowAdd(true)} 
                className="flex items-center gap-2 px-5 py-3 rounded-2xl text-sm font-bold gradient-accent text-white shadow-lg shadow-rose-500/25 hover:shadow-rose-500/40 transition-all self-start sm:self-auto cursor-pointer focus-visible:ring-2 focus-visible:ring-rose-500"
                aria-label={t('music.add')}
              >
                <Plus className="w-4 h-4 stroke-[2.5]" /> 
                <span>{t('music.add')}</span>
              </motion.button>
            </div>

            {/* Error Toast Notification if Audio playback fails */}
            {audioError && (
              <div className="mb-6 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 text-xs flex items-center gap-2 relative z-10">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{audioError}</span>
                <button onClick={() => setAudioError(null)} className="ml-auto text-amber-500 hover:text-amber-400">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Hero Main Deck: Vinyl Record (Left) & Controls/Info (Right) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
              
              {/* Left Stage: Vinyl Player */}
              <div className="lg:col-span-5 flex justify-center">
                <VinylTurntable 
                  activeSong={activeSong} 
                  isPlaying={isPlaying} 
                  artwork={activeArtwork} 
                />
              </div>

              {/* Right Stage: Now Playing Identity, Visualizer & Controls */}
              <div className="lg:col-span-7 flex flex-col justify-center space-y-5">
                
                {/* Track Identity Header */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    {activeSong ? (
                      <>
                        <span className="flex h-2.5 w-2.5 relative">
                          {isPlaying && (
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                          )}
                          <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${isPlaying ? 'bg-rose-500' : 'bg-zinc-400'}`} />
                        </span>
                        <span className="text-[11px] font-bold uppercase tracking-wider text-rose-500">
                          {isPlaying ? 'Đang phát' : 'Đang tạm dừng'}
                        </span>
                      </>
                    ) : (
                      <span className={`text-[11px] font-semibold uppercase tracking-wider ${tc.textMuted}`}>
                        Sẵn sàng phát nhạc
                      </span>
                    )}

                    {/* Platform Badge */}
                    {activeYtId && (
                      <span className="ml-auto inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-red-500/10 text-red-500 border border-red-500/20">
                        <Youtube className="w-3 h-3" /> YouTube Audio
                      </span>
                    )}
                    {activeSpotifyId && (
                      <span className="ml-auto inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                        Spotify Track
                      </span>
                    )}
                    {activeIsDirect && (
                      <span className="ml-auto inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-500 border border-blue-500/20">
                        <RadioTower className="w-3 h-3" /> Direct HQ Audio
                      </span>
                    )}
                  </div>

                  <AnimatePresence mode="wait">
                    <motion.div
                      key={activeSong ? activeSong.id : 'no-song'}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.25 }}
                    >
                      <h2 className={`text-xl sm:text-2xl md:text-3xl font-extrabold ${tc.text} tracking-tight line-clamp-1`}>
                        {activeSong ? activeSong.title : 'Chọn một giai điệu tình yêu'}
                      </h2>
                      <p className={`text-sm sm:text-base font-medium ${tc.textMuted} mt-0.5 line-clamp-1`}>
                        {activeSong ? (activeSong.artist || 'Love Melody') : 'Thưởng thức khoảnh khắc lắng đọng cùng playlist của hai bạn'}
                      </p>
                    </motion.div>
                  </AnimatePresence>
                </div>

                {/* Animated Equalizer Waveform */}
                <div className="flex items-end gap-1 h-8 py-1 px-1" aria-hidden="true">
                  {[45, 80, 35, 95, 55, 90, 40, 100, 65, 50, 85, 60, 95, 70, 45, 75, 50, 85].map((barHeight, idx) => (
                    <motion.div
                      key={idx}
                      className="w-1.5 rounded-full bg-gradient-to-t from-rose-500 to-indigo-500"
                      animate={{
                        height: isPlaying ? [`${Math.max(15, barHeight * 0.25)}%`, `${barHeight}%`, `${Math.max(20, barHeight * 0.45)}%`] : '18%',
                        opacity: isPlaying ? 0.95 : 0.25
                      }}
                      transition={{
                        duration: 0.55 + (idx % 5) * 0.12,
                        repeat: isPlaying ? Infinity : 0,
                        repeatType: 'reverse',
                        ease: 'easeInOut',
                        delay: (idx * 0.03) % 0.35
                      }}
                    />
                  ))}
                </div>

                {/* Direct Audio Seek Bar (Scrubber) */}
                {activeIsDirect && (
                  <div className="space-y-1.5">
                    <div className="relative group">
                      <input 
                        type="range" 
                        min={0} 
                        max={duration || 100} 
                        value={currentTime} 
                        onChange={handleProgressChange}
                        className="w-full h-2 bg-black/15 dark:bg-white/15 rounded-lg appearance-none cursor-pointer accent-rose-500 transition-all hover:h-2.5 focus:outline-none" 
                        aria-label="Seek track position"
                      />
                    </div>
                    <div className="flex justify-between text-[11px] font-mono font-medium text-zinc-400">
                      <span>{formatTime(currentTime)}</span>
                      <span>{formatTime(duration)}</span>
                    </div>
                  </div>
                )}

                {/* Spotify Embed Widget */}
                {activeSpotifyId && (
                  <div className="overflow-hidden rounded-2xl border border-white/10 shadow-lg bg-black/30">
                    <iframe 
                      src={`https://open.spotify.com/embed/track/${activeSpotifyId}?utm_source=generator&theme=0`} 
                      width="100%" 
                      height="80" 
                      allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" 
                      loading="lazy" 
                      className="border-none"
                      title="Spotify audio player"
                    />
                  </div>
                )}

                {/* Master Playback Controls Bar */}
                <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
                  
                  {/* Playback Buttons Group */}
                  <div className="flex items-center gap-3">
                    
                    {/* Previous Button */}
                    <button
                      onClick={() => handleSkip('prev')}
                      disabled={filteredSongs.length === 0}
                      className={`p-3 rounded-full glass hover:bg-black/5 dark:hover:bg-white/10 ${tc.textMuted} hover:${tc.text} transition disabled:opacity-30 cursor-pointer`}
                      title="Bài trước đó"
                      aria-label="Previous song"
                    >
                      <SkipBack className="w-4 h-4 fill-current" />
                    </button>

                    {/* Main Play/Pause Button */}
                    {!activeSpotifyId && (
                      <motion.button 
                        whileHover={{ scale: 1.08 }}
                        whileTap={{ scale: 0.93 }}
                        onClick={() => {
                          if (!activeSong && filteredSongs.length > 0) {
                            handlePlaySong(filteredSongs[0]);
                          } else if (activeSong) {
                            setIsPlaying(!isPlaying);
                          }
                        }}
                        className={`w-14 h-14 rounded-full gradient-accent text-white flex items-center justify-center shadow-xl shadow-rose-500/30 transition cursor-pointer relative ${
                          isPlaying ? 'ring-4 ring-rose-500/20' : ''
                        }`}
                        title={isPlaying ? "Tạm dừng" : "Phát"}
                        aria-label={isPlaying ? "Pause music" : "Play music"}
                      >
                        {isPlaying ? (
                          <Pause className="w-6 h-6 fill-current" />
                        ) : (
                          <Play className="w-6 h-6 fill-current ml-1" />
                        )}
                      </motion.button>
                    )}

                    {/* Next Button */}
                    <button
                      onClick={() => handleSkip('next')}
                      disabled={filteredSongs.length === 0}
                      className={`p-3 rounded-full glass hover:bg-black/5 dark:hover:bg-white/10 ${tc.textMuted} hover:${tc.text} transition disabled:opacity-30 cursor-pointer`}
                      title="Bài tiếp theo"
                      aria-label="Next song"
                    >
                      <SkipForward className="w-4 h-4 fill-current" />
                    </button>
                  </div>

                  {/* Volume Slider Module */}
                  {!activeSpotifyId && (
                    <div className="flex items-center gap-2 glass px-3.5 py-2.5 rounded-2xl border border-white/10">
                      <button 
                        onClick={() => {
                          const nextVol = volume === 0 ? 0.8 : 0;
                          setVolume(nextVol);
                          if (audioRef.current) audioRef.current.volume = nextVol;
                        }}
                        className={`${tc.textMuted} hover:${tc.text} transition cursor-pointer`}
                        aria-label={volume === 0 ? "Unmute" : "Mute"}
                      >
                        {volume === 0 ? <VolumeX className="w-4 h-4 text-rose-500" /> : <Volume2 className="w-4 h-4" />}
                      </button>
                      <input 
                        type="range" 
                        min="0" 
                        max="1" 
                        step="0.05"
                        value={volume} 
                        onChange={handleVolumeChange}
                        className="w-16 sm:w-24 h-1.5 bg-black/10 dark:bg-white/20 rounded-lg appearance-none cursor-pointer accent-rose-500" 
                        title={`Âm lượng: ${Math.round(volume * 100)}%`}
                        aria-label="Volume slider"
                      />
                      <span className="text-[10px] font-mono text-zinc-400 min-w-[28px] text-right">
                        {Math.round(volume * 100)}%
                      </span>
                    </div>
                  )}

                  {/* Close Active Player */}
                  {activeSong && (
                    <button 
                      onClick={() => { setActiveSong(null); setIsPlaying(false); }} 
                      className="p-2.5 rounded-full hover:bg-rose-500/10 text-zinc-400 hover:text-rose-500 transition ml-auto sm:ml-0 cursor-pointer"
                      title="Thu gọn trình phát"
                      aria-label="Close player"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}

                </div>
              </div>
            </div>
          </div>
        </motion.section>

        {/* ===================================================================== */}
        {/* 3. AUDIO PLAYBACK ENGINES (HTML5 Audio & YouTube Iframe)              */}
        {/* ===================================================================== */}
        {activeIsDirect && (
          <audio 
            ref={audioRef} 
            src={activeSong.url} 
            onDurationChange={(e) => setDuration(e.currentTarget.duration)}
            onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
            onEnded={() => handleSkip('next')}
            onError={() => {
              setIsPlaying(false);
              setAudioError('Không thể phát file âm thanh này.');
            }}
          />
        )}

        {activeYtId && (
          <iframe 
            ref={youtubeRef}
            width="1" 
            height="1" 
            src={`https://www.youtube.com/embed/${activeYtId}?enablejsapi=1&autoplay=1&origin=${typeof window !== 'undefined' ? window.location.origin : ''}`} 
            allow="autoplay; encrypted-media" 
            className="w-0 h-0 absolute pointer-events-none opacity-0"
            title="YouTube Audio Engine"
          />
        )}

        {/* ===================================================================== */}
        {/* 4. FILTER SEGMENTED CONTROLS & STATS                                 */}
        {/* ===================================================================== */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          
          {/* Segmented Floating Pill */}
          <div className="inline-flex p-1.5 rounded-2xl glass-strong border border-white/10 backdrop-blur-xl shadow-sm self-start">
            {(['all', 'favorites', 'background'] as const).map(f => {
              const isActive = filter === f;
              const count = songs.filter(s => {
                if (f === 'favorites') return s.is_favorite;
                if (f === 'background') return s.is_background;
                return true;
              }).length;

              return (
                <button 
                  key={f} 
                  onClick={() => setFilter(f)}
                  className={`relative px-4 py-2 text-xs font-bold rounded-xl transition-all duration-300 flex items-center gap-2 z-10 cursor-pointer ${
                    isActive ? 'text-white' : `${tc.textMuted} hover:${tc.text}`
                  }`}
                >
                  {isActive && (
                    <motion.div 
                      layoutId="activeFilterPill"
                      className="absolute inset-0 rounded-xl gradient-accent shadow-md -z-10"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                  {f === 'all' && <ListMusic className="w-3.5 h-3.5" />}
                  {f === 'favorites' && <Heart className="w-3.5 h-3.5" />}
                  {f === 'background' && <Radio className="w-3.5 h-3.5" />}
                  <span>
                    {f === 'all' ? t('memories.all') : f === 'favorites' ? t('music.favorites') : t('music.background')}
                  </span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isActive ? 'bg-white/20 text-white' : 'bg-black/10 dark:bg-white/10'}`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          <div className={`text-xs font-medium ${tc.textMuted} hidden sm:block`}>
            Thư viện: <strong className={tc.text}>{filteredSongs.length}</strong> bài hát
          </div>
        </div>

        {/* ===================================================================== */}
        {/* 5. SONG LIBRARY (Real Thumbnail, Mini Equalizer, Micro-Interactions) */}
        {/* ===================================================================== */}
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {filteredSongs.map((song, i) => {
              const isCurrent = activeSong?.id === song.id;
              const songArtwork = getSongArtwork(song);
              const ytId = getYoutubeId(song.url);
              const spId = getSpotifyId(song.url);

              return (
                <motion.div 
                  key={song.id} 
                  layout
                  initial={{ opacity: 0, y: 15 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.3, delay: i * 0.02 }}
                  className={`group relative rounded-2xl p-3 sm:p-4 border transition-all duration-300 flex items-center gap-3.5 sm:gap-4 shadow-sm backdrop-blur-xl ${
                    isCurrent 
                      ? 'bg-rose-500/10 border-rose-500/40 ring-1 ring-rose-500/30 shadow-rose-500/10' 
                      : `glass border ${tc.border} hover:border-rose-500/25 hover:bg-black/5 dark:hover:bg-white/5`
                  }`}
                >
                  {/* Real Thumbnail with Quick Play Overlay */}
                  <button 
                    onClick={() => handlePlaySong(song)}
                    className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center shrink-0 overflow-hidden group/art cursor-pointer shadow-md"
                    title={isCurrent && isPlaying ? "Tạm dừng" : "Phát bài này"}
                    aria-label={`Play ${song.title}`}
                  >
                    <ArtworkImage 
                      artwork={songArtwork} 
                      title={song.title} 
                      className="group-hover/art:scale-110 transition-transform duration-500"
                    />

                    {/* Dark overlay with Play / Pause Icon */}
                    <div className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity ${
                      isCurrent && isPlaying ? 'opacity-100' : 'opacity-0 group-hover/art:opacity-100'
                    }`}>
                      {isCurrent && isPlaying ? (
                        <Pause className="w-5 h-5 text-white fill-white" />
                      ) : (
                        <Play className="w-5 h-5 text-white fill-white ml-0.5" />
                      )}
                    </div>

                    {/* Mini Equalizer Indicator */}
                    {isCurrent && isPlaying && (
                      <div className="absolute bottom-1.5 flex items-end gap-0.5 h-3 z-10">
                        <div className="w-1 bg-white rounded-full animate-[bounce_0.6s_infinite]" />
                        <div className="w-1 bg-white rounded-full animate-[bounce_0.8s_infinite]" />
                        <div className="w-1 bg-white rounded-full animate-[bounce_0.5s_infinite]" />
                      </div>
                    )}
                  </button>

                  {/* Song Title, Artist & Badges */}
                  <div className="flex-1 min-w-0 pr-1">
                    <div className="flex items-center gap-2">
                      <span className={`text-sm sm:text-base font-bold truncate ${isCurrent ? 'text-rose-500' : tc.text}`}>
                        {song.title}
                      </span>

                      {ytId && <span className="hidden md:inline-block text-[9px] font-bold px-1.5 py-0.2 rounded bg-red-500/10 text-red-500">YouTube</span>}
                      {spId && <span className="hidden md:inline-block text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-500">Spotify</span>}
                    </div>

                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`text-xs ${tc.textMuted} truncate`}>
                        {song.artist || 'Giai điệu tình yêu'}
                      </span>

                      {song.is_background && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-medium text-rose-500 bg-rose-500/10 px-2 py-0.2 rounded-full">
                          <Radio className="w-2.5 h-2.5" /> Nhạc nền
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Interactive Action Buttons */}
                  <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
                    
                    {/* Favorite Button */}
                    <motion.button 
                      whileHover={{ scale: 1.15 }}
                      whileTap={{ scale: 0.85 }}
                      onClick={() => toggleFav(song.id, song.is_favorite)} 
                      className="p-2 sm:p-2.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 transition cursor-pointer"
                      title={song.is_favorite ? "Bỏ yêu thích" : "Yêu thích"}
                      aria-label="Toggle favorite"
                    >
                      <Heart className={`w-4 h-4 transition-colors ${song.is_favorite ? 'text-rose-500 fill-rose-500' : tc.textMuted}`} />
                    </motion.button>

                    {/* Background Music Toggle */}
                    <motion.button 
                      whileHover={{ scale: 1.15 }}
                      whileTap={{ scale: 0.85 }}
                      onClick={() => toggleBg(song.id, song.is_background)} 
                      className="p-2 sm:p-2.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 transition cursor-pointer"
                      title="Đặt làm nhạc nền website"
                      aria-label="Toggle background music"
                    >
                      <Radio className={`w-4 h-4 transition-colors ${song.is_background ? 'text-rose-500' : tc.textMuted}`} />
                    </motion.button>

                    {/* External Link */}
                    <a 
                      href={song.url} 
                      target="_blank" 
                      rel="noreferrer" 
                      className={`p-2 sm:p-2.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 ${tc.textMuted} hover:${tc.text} transition`}
                      title="Mở liên kết gốc"
                      aria-label="Open original link"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>

                    {/* Delete Song */}
                    <motion.button 
                      whileHover={{ scale: 1.15 }}
                      whileTap={{ scale: 0.85 }}
                      onClick={() => deleteSong(song.id)} 
                      className="p-2 sm:p-2.5 rounded-xl hover:bg-red-500/10 text-zinc-400 hover:text-red-500 transition cursor-pointer"
                      title="Xóa bài hát"
                      aria-label="Delete song"
                    >
                      <Trash2 className="w-4 h-4" />
                    </motion.button>
                  </div>

                </motion.div>
              );
            })}
          </AnimatePresence>

          {/* Empty State */}
          {filteredSongs.length === 0 && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`rounded-3xl p-12 text-center border ${tc.border} glass-strong shadow-xl my-6`}
            >
              <div className="w-16 h-16 rounded-full gradient-accent flex items-center justify-center mx-auto mb-4 shadow-lg shadow-rose-500/30 text-white animate-pulse">
                <Music className="w-8 h-8" />
              </div>
              <h3 className={`text-base font-bold ${tc.text} mb-1`}>Chưa có bài hát nào trong mục này</h3>
              <p className={`text-xs sm:text-sm ${tc.textMuted} max-w-sm mx-auto mb-5`}>
                Hãy thêm những giai điệu đặc biệt để lưu giữ trọn vẹn kỷ niệm ngọt ngào của hai bạn.
              </p>
              <button
                onClick={() => setShowAdd(true)}
                className="px-5 py-2.5 rounded-2xl text-xs font-bold gradient-accent text-white shadow-md hover:opacity-95 transition active:scale-95 cursor-pointer"
              >
                + Thêm bài hát ngay
              </button>
            </motion.div>
          )}
        </div>

      </div>

      {/* ===================================================================== */}
      {/* 6. SMART ADD SONG MODAL WITH REAL-TIME PREVIEW & PARSING              */}
      {/* ===================================================================== */}
      <AnimatePresence>
        {showAdd && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md" 
            onClick={() => setShowAdd(false)}
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.93, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.93, y: 15 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className={`glass-strong rounded-3xl p-6 sm:p-8 w-full max-w-lg border ${tc.border} shadow-2xl relative overflow-hidden`} 
              onClick={e => e.stopPropagation()}
            >
              {/* Corner Ambient Glow */}
              <div className="absolute top-0 right-0 w-48 h-48 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

              {/* Close Button */}
              <button 
                onClick={() => setShowAdd(false)}
                className="absolute top-5 right-5 p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-zinc-400 hover:text-white transition cursor-pointer"
                aria-label="Close dialog"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-2xl gradient-accent flex items-center justify-center text-white shadow-md">
                  <Music className="w-5 h-5" />
                </div>
                <div>
                  <h3 className={`text-lg font-bold ${tc.text}`}>{t('music.add')}</h3>
                  <p className={`text-xs ${tc.textMuted}`}>Thêm giai điệu mới vào danh sách tình yêu</p>
                </div>
              </div>

              <div className="space-y-4">
                
                {/* Title Field */}
                <div>
                  <label className={`block text-[11px] font-bold uppercase tracking-wider ${tc.textMuted} mb-1.5`}>
                    Tên bài hát <span className="text-rose-500">*</span>
                  </label>
                  <input 
                    type="text" 
                    value={form.title} 
                    onChange={e => setForm(p => ({ ...p, title: e.target.value }))} 
                    placeholder="Ví dụ: Perfect, Lover, Until I Found You..." 
                    className={`w-full px-4 py-3 glass rounded-2xl text-sm ${tc.text} bg-transparent border ${tc.border} outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 transition-all`} 
                  />
                </div>

                {/* Artist Field */}
                <div>
                  <label className={`block text-[11px] font-bold uppercase tracking-wider ${tc.textMuted} mb-1.5`}>
                    Ca sĩ / Nghệ sĩ
                  </label>
                  <input 
                    type="text" 
                    value={form.artist} 
                    onChange={e => setForm(p => ({ ...p, artist: e.target.value }))} 
                    placeholder="Ví dụ: Ed Sheeran, Stephen Sanchez..." 
                    className={`w-full px-4 py-3 glass rounded-2xl text-sm ${tc.text} bg-transparent border ${tc.border} outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 transition-all`} 
                  />
                </div>

                {/* URL Field with Real-time Badge */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className={`block text-[11px] font-bold uppercase tracking-wider ${tc.textMuted}`}>
                      Đường dẫn nhạc <span className="text-rose-500">*</span>
                    </label>

                    {form.url && (
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-500 border border-rose-500/20">
                        {detectUrlType(form.url) === 'youtube' && '✓ Nhận diện YouTube'}
                        {detectUrlType(form.url) === 'spotify' && '✓ Nhận diện Spotify'}
                        {detectUrlType(form.url) === 'audio' && '✓ Nhận diện Trực tiếp MP3/Audio'}
                        {detectUrlType(form.url) === 'unknown' && 'Đường dẫn Web'}
                      </span>
                    )}
                  </div>

                  <input 
                    type="text" 
                    value={form.url} 
                    onChange={e => setForm(p => ({ ...p, url: e.target.value }))} 
                    placeholder="Dán link YouTube, Spotify hoặc direct MP3..." 
                    className={`w-full px-4 py-3 glass rounded-2xl text-sm ${tc.text} bg-transparent border ${tc.border} outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 transition-all`} 
                  />
                </div>

                {/* Live Preview Card with Real Derived Artwork */}
                {form.url.trim() && (
                  <div className="p-3 rounded-2xl border border-white/10 bg-black/10 dark:bg-white/5 flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl overflow-hidden shadow-md shrink-0">
                      <ArtworkImage 
                        artwork={getSongArtwork({ 
                          id: 'preview', 
                          title: form.title || 'Preview', 
                          artist: form.artist, 
                          url: form.url, 
                          is_favorite: false, 
                          is_background: false 
                        })} 
                        title={form.title || 'Preview'} 
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className={`text-xs font-bold ${tc.text} truncate`}>
                        {form.title || 'Tên bài hát'}
                      </div>
                      <div className={`text-[11px] ${tc.textMuted} truncate`}>
                        {form.artist || 'Love Melody'} • {form.url}
                      </div>
                    </div>
                  </div>
                )}

                {/* Modal Buttons */}
                <div className="flex gap-3 pt-3">
                  <button 
                    type="button"
                    onClick={() => setShowAdd(false)} 
                    className={`flex-1 py-3 glass rounded-2xl text-sm font-bold ${tc.text} border ${tc.border} hover:bg-black/5 dark:hover:bg-white/10 transition cursor-pointer`}
                  >
                    {t('common.cancel')}
                  </button>
                  <button 
                    type="button"
                    onClick={addSong} 
                    disabled={!form.title.trim() || !form.url.trim()}
                    className="flex-1 py-3 gradient-accent rounded-2xl text-sm text-white font-bold hover:opacity-95 shadow-lg shadow-rose-500/30 transition disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
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