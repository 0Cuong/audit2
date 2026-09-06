import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Search,
  Image as ImageIcon,
  Film,
  Mic,
  FileText,
  Heart,
  Pin,
  Grid3X3,
  Calendar,
  Trash2,
  UploadCloud,
  Loader2,
  X,
  Play,
  Pause,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Volume2,
  VolumeX,
  MapPin,
  Clock,
  User
} from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { supabase } from '../lib/supabase';
import { formatDateLocale } from '../lib/dateUtils';

/* ==========================================================================
   1. TYPES & DATA MODEL
   ========================================================================== */

export type MediaType = 'photo' | 'video' | 'voice' | 'letter';

export type MemoryContextType =
  | 'trip'
  | 'birthday'
  | 'anniversary'
  | 'date-night'
  | 'milestone'
  | 'everyday'
  | 'celebration'
  | 'other';

export interface MemoryAuthor {
  id: string;
  name: string;
  avatar?: string;
}

export interface MemoryCollection {
  id: string;
  name: string;
  description?: string;
  cover_url?: string;
}

export interface MemoryItem {
  id: string;
  author_id?: string;
  author_name?: string;
  author_avatar?: string;
  title: string;
  description?: string;
  media_type: MediaType;
  category?: string; // backward compatibility with legacy schema
  context?: MemoryContextType;
  url: string;
  thumbnail_url?: string;
  date: string;
  created_at?: string;
  updated_at?: string;
  is_favorite: boolean;
  is_pinned?: boolean;
  tags?: string[];
  collection_ids?: string[];
  location?: {
    name?: string;
    lat?: number;
    lng?: number;
  };
  metadata?: {
    duration?: number;
    file_size?: number;
    mime_type?: string;
    people?: string[];
    occasion?: string;
    letter_body?: string;
    signature?: string;
  };
  journal_entry_id?: string;
}

export interface UploadQueueItem {
  id: string;
  file: File;
  previewUrl: string;
  media_type: MediaType;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  progress: number;
  error?: string;
}

export interface MemoryAgentSuggestion {
  title?: string;
  context?: MemoryContextType;
  tags?: string[];
  location?: string;
  people?: string[];
}

/* ==========================================================================
   2. DEFAULT INITIAL DATA & RESILIENCE HELPERS
   ========================================================================== */

const STORAGE_KEY = 'cuongisme_memories_v2';
const COLLECTIONS_STORAGE_KEY = 'cuongisme_memory_collections_v2';

const DEFAULT_AUTHORS: MemoryAuthor[] = [
  { id: 'partner1', name: 'Partner 1', avatar: '' },
  { id: 'partner2', name: 'Partner 2', avatar: '' }
];

const DEFAULT_COLLECTIONS: MemoryCollection[] = [];

const DEFAULT_MEMORIES: MemoryItem[] = [];

/** Safe LocalStorage JSON parser */
function safeParse<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : fallback;
  } catch (err) {
    console.warn(`[SafeParse] Failed to parse localStorage for ${key}`, err);
    return fallback;
  }
}

/** Promise-wrapped async FileReader for robust multi-file uploads */
function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (e) => reject(e);
    reader.readAsDataURL(file);
  });
}

/** Format seconds to mm:ss */
function formatTime(seconds?: number): string {
  if (!seconds || isNaN(seconds)) return '00:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/** Context badge visual labels */
const CONTEXT_CONFIG: Record<MemoryContextType, { label: string; dotColor: string }> = {
  trip: { label: 'Chuyến đi', dotColor: 'bg-emerald-400' },
  birthday: { label: 'Sinh nhật', dotColor: 'bg-amber-400' },
  anniversary: { label: 'Kỷ niệm', dotColor: 'bg-rose-400' },
  'date-night': { label: 'Hẹn hò', dotColor: 'bg-violet-400' },
  milestone: { label: 'Cột mốc', dotColor: 'bg-blue-400' },
  everyday: { label: 'Thường ngày', dotColor: 'bg-zinc-400' },
  celebration: { label: 'Lễ hội', dotColor: 'bg-orange-400' },
  other: { label: 'Khác', dotColor: 'bg-neutral-400' }
};

/* ==========================================================================
   3. MEMORY AGENT & GROUNDED ANSWER ENGINE
   ========================================================================== */

function generateAgentSuggestions(
  title: string,
  desc: string,
  mediaType: MediaType
): MemoryAgentSuggestion {
  const combined = `${title} ${desc}`.toLowerCase();
  const suggestion: MemoryAgentSuggestion = {};

  if (combined.includes('đà lạt') || combined.includes('biển') || combined.includes('du lịch') || combined.includes('trip')) {
    suggestion.context = 'trip';
    suggestion.tags = ['Chuyến đi', 'Khám phá'];
    if (combined.includes('đà lạt')) suggestion.location = 'Đà Lạt, Lâm Đồng';
  } else if (combined.includes('sinh nhật') || combined.includes('tuổi mới') || combined.includes('birthday')) {
    suggestion.context = 'birthday';
    suggestion.tags = ['Sinh nhật', 'Tuổi mới'];
  } else if (combined.includes('kỷ niệm') || combined.includes('anniversary') || combined.includes('năm')) {
    suggestion.context = 'anniversary';
    suggestion.tags = ['Kỷ niệm', 'Yêu thương'];
  } else if (combined.includes('cafe') || combined.includes('hẹn hò') || combined.includes('tối')) {
    suggestion.context = 'date-night';
    suggestion.tags = ['Hẹn hò', 'Cafe'];
  } else {
    suggestion.context = 'everyday';
    suggestion.tags = [mediaType === 'photo' ? 'Khoảnh khắc' : mediaType === 'voice' ? 'Ghi âm' : 'Kỷ niệm'];
  }

  if (combined.includes('em') || combined.includes('hai đứa') || combined.includes('tụi mình')) {
    suggestion.people = ['Minh', 'Em'];
  }

  if (!title.trim()) {
    if (suggestion.context === 'trip') suggestion.title = 'Khoảnh khắc chuyến đi đáng nhớ';
    else if (suggestion.context === 'birthday') suggestion.title = 'Kỷ niệm ngày sinh nhật ấm áp';
    else if (mediaType === 'voice') suggestion.title = 'Tin nhắn thoại ấm áp';
    else if (mediaType === 'letter') suggestion.title = 'Gửi người anh thương';
    else suggestion.title = 'Khoảnh khắc ngọt ngào';
  }

  return suggestion;
}

/** Grounded answer engine querying actual memory dataset */
function queryMemoryArchive(
  question: string,
  memories: MemoryItem[]
): { answer: string; matched: MemoryItem[] } {
  const q = question.toLowerCase().trim();
  if (!q) return { answer: 'Hãy nhập câu hỏi để tìm kiếm trong kho kỷ niệm.', matched: [] };

  let matched: MemoryItem[] = [];

  if (q.includes('đầu tiên') || q.includes('ảnh đầu')) {
    const sorted = [...memories].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    if (sorted.length > 0) {
      matched = [sorted[0]];
      return {
        answer: `Kỷ niệm sớm nhất được lưu trữ là "${sorted[0].title}" vào ngày ${sorted[0].date}.`,
        matched
      };
    }
  }

  if (q.includes('favorite') || q.includes('yêu thích') || q.includes('thích nhất')) {
    matched = memories.filter((m) => m.is_favorite);
    return {
      answer: `Có ${matched.length} kỷ niệm được đánh dấu yêu thích trong kho lưu trữ.`,
      matched
    };
  }

  if (q.includes('voice') || q.includes('thoại') || q.includes('ghi âm')) {
    matched = memories.filter((m) => m.media_type === 'voice');
    return {
      answer: `Tìm thấy ${matched.length} bản ghi âm giọng nói đã lưu.`,
      matched
    };
  }

  if (q.includes('thư') || q.includes('letter')) {
    matched = memories.filter((m) => m.media_type === 'letter');
    return {
      answer: `Tìm thấy ${matched.length} lá thư trong bộ sưu tập.`,
      matched
    };
  }

  // Keyword match
  matched = memories.filter((m) => {
    const inTitle = m.title.toLowerCase().includes(q);
    const inDesc = (m.description || '').toLowerCase().includes(q);
    const inTags = (m.tags || []).some((t) => t.toLowerCase().includes(q));
    const inLoc = (m.location?.name || '').toLowerCase().includes(q);
    return inTitle || inDesc || inTags || inLoc;
  });

  if (matched.length > 0) {
    return {
      answer: `Tìm thấy ${matched.length} kỷ niệm khớp với từ khóa "${question}".`,
      matched
    };
  }

  return {
    answer: `Không tìm thấy kỷ niệm nào khớp với câu hỏi "${question}". Bạn có thể thử tìm bằng từ khóa địa điểm hoặc thời gian.`,
    matched: []
  };
}

/* ==========================================================================
   4. SUBCOMPONENTS
   ========================================================================== */

/** Audio Player with restrained waveform aesthetics */
const AudioMemoryPlayer: React.FC<{ url: string; title?: string }> = ({ url, title }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onLoadedMetadata = () => setDuration(audio.duration || 0);
    const onTimeUpdate = () => setCurrentTime(audio.currentTime || 0);
    const onEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('ended', onEnded);

    return () => {
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('ended', onEnded);
    };
  }, []);

  const togglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().catch(() => {});
      setIsPlaying(true);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    setCurrentTime(val);
    if (audioRef.current) {
      audioRef.current.currentTime = val;
    }
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!audioRef.current) return;
    audioRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  return (
    <div className="w-full bg-zinc-900/90 dark:bg-zinc-950/80 border border-white/10 rounded-2xl p-4 flex flex-col gap-3">
      <audio ref={audioRef} src={url} preload="metadata" />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={togglePlay}
            className="w-10 h-10 rounded-full bg-white text-zinc-900 flex items-center justify-center shadow-md hover:scale-105 active:scale-95 transition-transform"
            aria-label={isPlaying ? 'Pause audio' : 'Play audio'}
          >
            {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
          </button>
          <div>
            <p className="text-xs font-semibold text-zinc-100 line-clamp-1">{title || 'Tin nhắn thoại'}</p>
            <p className="text-[11px] font-mono text-zinc-400">
              {formatTime(currentTime)} / {formatTime(duration)}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={toggleMute}
          className="p-2 rounded-lg text-zinc-400 hover:text-white transition-colors"
          aria-label="Toggle mute"
        >
          {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </button>
      </div>

      {/* Scrubber */}
      <div className="relative flex items-center w-full group">
        <input
          type="range"
          min={0}
          max={duration || 100}
          value={currentTime}
          onChange={handleSeek}
          className="w-full h-1.5 bg-white/15 rounded-lg appearance-none cursor-pointer accent-white"
        />
      </div>
    </div>
  );
};

/** Editorial Letter Preview & Full Reader */
const LetterCardContent: React.FC<{
  title: string;
  body?: string;
  signature?: string;
  authorName?: string;
  date: string;
  isExpanded?: boolean;
}> = ({ title, body, signature, authorName, date, isExpanded = false }) => {
  return (
    <div className="relative w-full h-full bg-[#fcfbf9] dark:bg-[#18181b] border border-amber-950/10 dark:border-white/10 rounded-2xl p-5 flex flex-col justify-between text-zinc-800 dark:text-zinc-200 shadow-sm transition-all">
      {/* Subtle paper line texture */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-600/30 via-rose-500/20 to-transparent rounded-t-2xl" />

      <div>
        <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400 dark:text-zinc-500 mb-2">
          <span>{date}</span>
          <span className="font-serif italic">(Thư tay)</span>
        </div>

        <h4 className="font-serif text-base font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight mb-2">
          {title}
        </h4>

        <p
          className={`font-serif text-xs leading-relaxed text-zinc-600 dark:text-zinc-400 whitespace-pre-wrap ${
            !isExpanded ? 'line-clamp-4' : ''
          }`}
        >
          {body || 'Không có nội dung thư.'}
        </p>
      </div>

      <div className="mt-4 pt-3 border-t border-amber-950/5 dark:border-white/5 flex items-center justify-between text-[11px] font-serif italic text-zinc-500">
        <span>Ký tên</span>
        <span className="font-medium text-zinc-800 dark:text-zinc-200">
          - {signature || authorName || 'Ẩn danh'}
        </span>
      </div>
    </div>
  );
};

/* ==========================================================================
   5. MEMORY CARD COMPONENT
   ========================================================================== */

interface MemoryCardProps {
  memory: MemoryItem;
  tc: any;
  lang: 'en' | 'vi';
  onOpen: (m: MemoryItem) => void;
  onToggleFavorite: (id: string, e: React.MouseEvent) => void;
  onTogglePin: (id: string, e: React.MouseEvent) => void;
  onDelete: (id: string, e: React.MouseEvent) => void;
}

const MemoryCard: React.FC<MemoryCardProps> = ({
  memory,
  tc,
  lang,
  onOpen,
  onToggleFavorite,
  onTogglePin,
  onDelete
}) => {
  const [imageError, setImageError] = useState(false);

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
      onClick={() => onOpen(memory)}
      className={`group relative rounded-2xl border ${tc.border} bg-white dark:bg-zinc-900/60 overflow-hidden shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col justify-between`}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onOpen(memory);
        }
      }}
      aria-label={`Open memory: ${memory.title}`}
    >
      {/* Media Viewport */}
      <div className="relative aspect-[4/3] w-full bg-zinc-100 dark:bg-zinc-900 overflow-hidden">
        {memory.media_type === 'photo' && (
          <>
            {!imageError && memory.url ? (
              <img
                src={memory.thumbnail_url || memory.url}
                alt={memory.title}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                loading="lazy"
                onError={() => setImageError(true)}
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-zinc-400 gap-1.5 p-4">
                <ImageIcon className="w-6 h-6 stroke-[1.5] opacity-50" />
                <span className="text-[11px] text-zinc-500">Ảnh không hiển thị</span>
              </div>
            )}
          </>
        )}

        {memory.media_type === 'video' && (
          <div className="relative w-full h-full bg-black flex items-center justify-center">
            {memory.thumbnail_url ? (
              <img src={memory.thumbnail_url} alt={memory.title} className="w-full h-full object-cover opacity-80" />
            ) : (
              <div className="w-full h-full bg-zinc-950 flex items-center justify-center">
                <Film className="w-8 h-8 text-zinc-600" />
              </div>
            )}
            <div className="absolute inset-0 bg-black/30 flex items-center justify-center group-hover:bg-black/20 transition-colors">
              <div className="w-10 h-10 rounded-full bg-white/90 text-zinc-900 flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform">
                <Play className="w-4 h-4 fill-current ml-0.5" />
              </div>
            </div>
            {memory.metadata?.duration && (
              <span className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded-md bg-black/75 text-[10px] font-mono text-white backdrop-blur-sm">
                {formatTime(memory.metadata.duration)}
              </span>
            )}
          </div>
        )}

        {memory.media_type === 'voice' && (
          <div className="w-full h-full p-3 bg-zinc-950 flex flex-col justify-center items-center">
            <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-zinc-200 mb-2">
              <Mic className="w-5 h-5" />
            </div>
            <p className="text-xs font-mono text-zinc-400">{formatTime(memory.metadata?.duration || 30)}</p>
          </div>
        )}

        {memory.media_type === 'letter' && (
          <div className="w-full h-full p-3">
            <LetterCardContent
              title={memory.title}
              body={memory.metadata?.letter_body || memory.description}
              signature={memory.metadata?.signature}
              authorName={memory.author_name}
              date={formatDateLocale(memory.date, lang)}
            />
          </div>
        )}

        {/* Floating Top Actions */}
        <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5 opacity-90 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity z-10">
          <button
            type="button"
            onClick={(e) => onTogglePin(memory.id, e)}
            className={`p-1.5 rounded-lg backdrop-blur-md transition-transform active:scale-90 ${
              memory.is_pinned
                ? 'bg-amber-500/90 text-white'
                : 'bg-black/50 text-zinc-300 hover:text-white hover:bg-black/70'
            }`}
            title={memory.is_pinned ? 'Bỏ ghim' : 'Ghim kỷ niệm'}
            aria-label="Pin memory"
          >
            <Pin className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={(e) => onToggleFavorite(memory.id, e)}
            className={`p-1.5 rounded-lg backdrop-blur-md transition-transform active:scale-90 ${
              memory.is_favorite
                ? 'bg-rose-500/90 text-white'
                : 'bg-black/50 text-zinc-300 hover:text-white hover:bg-black/70'
            }`}
            title={memory.is_favorite ? 'Bỏ thích' : 'Yêu thích'}
            aria-label="Favorite memory"
          >
            <Heart className={`w-3.5 h-3.5 ${memory.is_favorite ? 'fill-current' : ''}`} />
          </button>
          <button
            type="button"
            onClick={(e) => onDelete(memory.id, e)}
            className="p-1.5 rounded-lg bg-black/50 text-zinc-300 hover:text-red-400 hover:bg-black/70 backdrop-blur-md transition-colors"
            title="Xóa kỷ niệm"
            aria-label="Delete memory"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Pin indicator badge when not hovered */}
        {memory.is_pinned && (
          <div className="absolute top-2.5 left-2.5 p-1 rounded-md bg-amber-500 text-white shadow-sm sm:group-hover:hidden">
            <Pin className="w-3 h-3" />
          </div>
        )}
      </div>

      {/* Meta Footer */}
      <div className="p-3.5 flex flex-col justify-between flex-1 gap-2">
        <div>
          <div className="flex items-center gap-1.5 text-[11px] text-zinc-500 dark:text-zinc-400 mb-1">
            <span className="font-semibold text-zinc-800 dark:text-zinc-200">
              {memory.author_name || 'Minh'}
            </span>
            <span>·</span>
            <span>{formatDateLocale(memory.date, lang)}</span>
          </div>

          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 line-clamp-1 group-hover:text-rose-500 dark:group-hover:text-rose-400 transition-colors">
            {memory.title}
          </h3>

          {memory.description && memory.media_type !== 'letter' && (
            <p className="text-xs text-zinc-600 dark:text-zinc-400 line-clamp-2 mt-0.5 leading-relaxed">
              {memory.description}
            </p>
          )}
        </div>

        {/* Tags and context row */}
        <div className="flex items-center gap-1.5 flex-wrap pt-1">
          {memory.context && CONTEXT_CONFIG[memory.context] && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-white/5 text-[10px] font-medium text-zinc-600 dark:text-zinc-300">
              <span className={`w-1.5 h-1.5 rounded-full ${CONTEXT_CONFIG[memory.context].dotColor}`} />
              {CONTEXT_CONFIG[memory.context].label}
            </span>
          )}

          {memory.tags && memory.tags.slice(0, 2).map((tag) => (
            <span
              key={tag}
              className="text-[10px] text-zinc-400 dark:text-zinc-500 font-medium hover:text-zinc-600 transition-colors"
            >
              #{tag}
            </span>
          ))}
        </div>
      </div>
    </motion.article>
  );
};

/* ==========================================================================
   6. MEMORY VIEWER (FULL LIGHTBOX & MULTI-MEDIA VIEWER)
   ========================================================================== */

interface MemoryViewerProps {
  memory: MemoryItem | null;
  memories: MemoryItem[];
  lang: 'en' | 'vi';
  onClose: () => void;
  onSelect: (m: MemoryItem) => void;
  onToggleFavorite: (id: string) => void;
  onTogglePin: (id: string) => void;
  onDelete: (id: string) => void;
}

const MemoryViewer: React.FC<MemoryViewerProps> = ({
  memory,
  memories,
  lang,
  onClose,
  onSelect,
  onToggleFavorite,
  onTogglePin,
  onDelete
}) => {
  const currentIndex = memory ? memories.findIndex((m) => m.id === memory.id) : -1;
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex >= 0 && currentIndex < memories.length - 1;

  const handlePrev = useCallback(() => {
    if (hasPrev) onSelect(memories[currentIndex - 1]);
  }, [hasPrev, currentIndex, memories, onSelect]);

  const handleNext = useCallback(() => {
    if (hasNext) onSelect(memories[currentIndex + 1]);
  }, [hasNext, currentIndex, memories, onSelect]);

  // Keyboard navigation
  useEffect(() => {
    if (!memory) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowLeft') handlePrev();
      else if (e.key === 'ArrowRight') handleNext();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [memory, onClose, handlePrev, handleNext]);

  if (!memory) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-xl p-2 sm:p-6 select-none"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={memory.title}
    >
      {/* Navigation Chevrons */}
      {hasPrev && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handlePrev();
          }}
          className="hidden md:flex absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-zinc-900/80 text-white hover:bg-zinc-800 border border-white/10 shadow-xl transition z-20"
          aria-label="Previous memory"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
      )}

      {hasNext && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleNext();
          }}
          className="hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-zinc-900/80 text-white hover:bg-zinc-800 border border-white/10 shadow-xl transition z-20"
          aria-label="Next memory"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      )}

      {/* Main Container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        transition={{ duration: 0.2 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-5xl max-h-[92vh] bg-zinc-900 border border-white/10 rounded-3xl overflow-hidden shadow-2xl flex flex-col lg:flex-row relative"
      >
        {/* Top Floating Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 z-30 p-2 rounded-full bg-black/60 text-white hover:bg-black/90 transition-colors"
          aria-label="Close viewer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Media Preview Column */}
        <div className="flex-1 bg-black flex items-center justify-center min-h-[300px] lg:min-h-[520px] max-h-[55vh] lg:max-h-[92vh] overflow-hidden relative">
          {memory.media_type === 'photo' && (
            <img
              src={memory.url}
              alt={memory.title}
              className="w-full h-full object-contain max-h-[55vh] lg:max-h-[92vh]"
            />
          )}

          {memory.media_type === 'video' && (
            <video
              src={memory.url}
              controls
              autoPlay
              playsInline
              className="w-full h-full max-h-[55vh] lg:max-h-[92vh] object-contain"
            />
          )}

          {memory.media_type === 'voice' && (
            <div className="w-full max-w-md p-6">
              <AudioMemoryPlayer url={memory.url} title={memory.title} />
            </div>
          )}

          {memory.media_type === 'letter' && (
            <div className="w-full h-full overflow-y-auto p-6 sm:p-10 flex items-center justify-center">
              <div className="w-full max-w-lg">
                <LetterCardContent
                  title={memory.title}
                  body={memory.metadata?.letter_body || memory.description}
                  signature={memory.metadata?.signature}
                  authorName={memory.author_name}
                  date={formatDateLocale(memory.date, lang)}
                  isExpanded
                />
              </div>
            </div>
          )}
        </div>

        {/* Metadata Sidebar */}
        <div className="w-full lg:w-96 bg-zinc-900 p-6 flex flex-col justify-between overflow-y-auto border-t lg:border-t-0 lg:border-l border-white/10">
          <div className="space-y-4">
            {/* Header info */}
            <div>
              <div className="flex items-center justify-between text-xs text-zinc-400 font-mono mb-1.5">
                <span className="font-semibold text-zinc-200">
                  {memory.author_name || 'Minh'} · {formatDateLocale(memory.date, lang)}
                </span>
                {memory.context && CONTEXT_CONFIG[memory.context] && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-sans">
                    <span className={`w-1.5 h-1.5 rounded-full ${CONTEXT_CONFIG[memory.context].dotColor}`} />
                    {CONTEXT_CONFIG[memory.context].label}
                  </span>
                )}
              </div>

              <h2 className="text-xl font-bold text-white tracking-tight">{memory.title}</h2>
            </div>

            {/* Description */}
            {memory.description && (
              <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap">
                {memory.description}
              </p>
            )}

            {/* Location & People metadata */}
            <div className="space-y-2 pt-2 text-xs text-zinc-400">
              {memory.location?.name && (
                <div className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                  <span className="truncate">{memory.location.name}</span>
                </div>
              )}

              {memory.metadata?.people && memory.metadata.people.length > 0 && (
                <div className="flex items-center gap-2">
                  <User className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                  <span>{memory.metadata.people.join(', ')}</span>
                </div>
              )}

              {memory.metadata?.occasion && (
                <div className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                  <span>{memory.metadata.occasion}</span>
                </div>
              )}
            </div>

            {/* Tags */}
            {memory.tags && memory.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-2">
                {memory.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-zinc-300"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Actions Bottom Bar */}
          <div className="pt-6 mt-6 border-t border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onToggleFavorite(memory.id)}
                className={`p-2.5 rounded-xl border transition-colors ${
                  memory.is_favorite
                    ? 'bg-rose-500/20 border-rose-500/40 text-rose-400'
                    : 'bg-white/5 border-white/10 text-zinc-400 hover:text-white'
                }`}
                title="Toggle favorite"
              >
                <Heart className={`w-4 h-4 ${memory.is_favorite ? 'fill-current' : ''}`} />
              </button>

              <button
                type="button"
                onClick={() => onTogglePin(memory.id)}
                className={`p-2.5 rounded-xl border transition-colors ${
                  memory.is_pinned
                    ? 'bg-amber-500/20 border-amber-500/40 text-amber-400'
                    : 'bg-white/5 border-white/10 text-zinc-400 hover:text-white'
                }`}
                title="Toggle pin"
              >
                <Pin className="w-4 h-4" />
              </button>
            </div>

            <button
              type="button"
              onClick={() => {
                onDelete(memory.id);
                onClose();
              }}
              className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-colors"
              title="Delete memory"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

/* ==========================================================================
   7. TIMELINE VIEW COMPONENT
   ========================================================================== */

interface TimelineViewProps {
  memories: MemoryItem[];
  tc: any;
  lang: string;
  onOpen: (m: MemoryItem) => void;
  onToggleFavorite: (id: string, e: React.MouseEvent) => void;
  onTogglePin: (id: string, e: React.MouseEvent) => void;
  onDelete: (id: string, e: React.MouseEvent) => void;
}

const TimelineView: React.FC<TimelineViewProps> = ({
  memories,
  tc,
  lang,
  onOpen,
  onToggleFavorite,
  onTogglePin,
  onDelete
}) => {
  // Group memories by Month Year, then by Date
  const grouped = useMemo(() => {
    const map = new Map<string, Map<string, MemoryItem[]>>();

    memories.forEach((item) => {
      const dateObj = new Date(item.date);
      const monthYear = dateObj.toLocaleDateString(lang === 'vi' ? 'vi-VN' : 'en-US', {
        month: 'long',
        year: 'numeric'
      });
      const dayKey = item.date;

      if (!map.has(monthYear)) {
        map.set(monthYear, new Map());
      }
      const dayMap = map.get(monthYear)!;
      if (!dayMap.has(dayKey)) {
        dayMap.set(dayKey, []);
      }
      dayMap.get(dayKey)!.push(item);
    });

    return map;
  }, [memories, lang]);

  return (
    <div className="space-y-12 max-w-4xl mx-auto py-4">
      {Array.from(grouped.entries()).map(([monthYear, dayMap]) => (
        <section key={monthYear} className="relative">
          {/* Month Heading */}
          <div className="sticky top-20 z-10 py-2.5 mb-6 backdrop-blur-md bg-white/70 dark:bg-zinc-950/70 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
            <h2 className="text-xs uppercase tracking-widest font-mono font-bold text-zinc-500 dark:text-zinc-400">
              {monthYear}
            </h2>
            <span className="text-[11px] font-mono text-zinc-400">
              {Array.from(dayMap.values()).reduce((acc, items) => acc + items.length, 0)} kỷ niệm
            </span>
          </div>

          <div className="space-y-8 pl-2 sm:pl-4">
            {Array.from(dayMap.entries()).map(([dayKey, dayItems]) => (
              <div key={dayKey} className="grid grid-cols-1 sm:grid-cols-12 gap-4">
                {/* Day stamp */}
                <div className="sm:col-span-3">
                  <div className="sticky top-32">
                    <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-tight">
                      {new Date(dayKey).toLocaleDateString(lang === 'vi' ? 'vi-VN' : 'en-US', {
                        day: '2-digit',
                        month: 'short'
                      })}
                    </p>
                    <p className="text-[11px] font-mono text-zinc-400">
                      {new Date(dayKey).toLocaleDateString(lang === 'vi' ? 'vi-VN' : 'en-US', {
                        weekday: 'short'
                      })}
                    </p>
                  </div>
                </div>

                {/* Day memories list */}
                <div className="sm:col-span-9 space-y-3">
                  {dayItems.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => onOpen(item)}
                      className={`p-3.5 sm:p-4 rounded-2xl border ${tc.border} bg-white dark:bg-zinc-900/60 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-all flex items-center justify-between gap-4 cursor-pointer group shadow-sm`}
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0 bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center">
                          {item.media_type === 'photo' && item.url ? (
                            <img src={item.url} alt="" className="w-full h-full object-cover" />
                          ) : item.media_type === 'video' ? (
                            <Film className="w-5 h-5 text-zinc-400" />
                          ) : item.media_type === 'voice' ? (
                            <Mic className="w-5 h-5 text-zinc-400" />
                          ) : (
                            <FileText className="w-5 h-5 text-zinc-400" />
                          )}
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                              {item.author_name || 'Minh'}
                            </span>
                            {item.context && CONTEXT_CONFIG[item.context] && (
                              <span className="text-[10px] text-zinc-400">
                                · {CONTEXT_CONFIG[item.context].label}
                              </span>
                            )}
                          </div>
                          <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate group-hover:text-rose-500 transition-colors">
                            {item.title}
                          </h4>
                          {item.description && (
                            <p className="text-xs text-zinc-500 truncate mt-0.5">{item.description}</p>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={(e) => onTogglePin(item.id, e)}
                          className={`p-2 rounded-xl transition-colors ${
                            item.is_pinned ? 'text-amber-500' : 'text-zinc-400 hover:text-zinc-600'
                          }`}
                        >
                          <Pin className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => onToggleFavorite(item.id, e)}
                          className={`p-2 rounded-xl transition-colors ${
                            item.is_favorite ? 'text-rose-500 fill-rose-500' : 'text-zinc-400 hover:text-zinc-600'
                          }`}
                        >
                          <Heart className={`w-4 h-4 ${item.is_favorite ? 'fill-current' : ''}`} />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => onDelete(item.id, e)}
                          className="p-2 rounded-xl text-zinc-400 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
};

/* ==========================================================================
   8. COMPOSER MODAL (ADD / UPLOAD / WRITE MEMORY)
   ========================================================================== */

interface MemoryComposerProps {
  isOpen: boolean;
  tc?: any;
  collections: MemoryCollection[];
  onClose: () => void;
  onSave: (newMem: Omit<MemoryItem, 'id'>) => Promise<void>;
}

const MemoryComposer: React.FC<MemoryComposerProps> = ({
  isOpen,
  collections,
  onClose,
  onSave
}) => {
  const [mediaType, setMediaType] = useState<MediaType>('photo');
  const [authorName, setAuthorName] = useState('Minh');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [context, setContext] = useState<MemoryContextType>('everyday');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [selectedCollectionId, setSelectedCollectionId] = useState<string>('');
  const [locationName, setLocationName] = useState('');

  // Letter specific
  const [letterBody, setLetterBody] = useState('');
  const [signature, setSignature] = useState('Minh');

  // Media files & queue
  const [uploadQueue, setUploadQueue] = useState<UploadQueueItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [agentSuggestion, setAgentSuggestion] = useState<MemoryAgentSuggestion | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Trigger Agent suggestion when title or description changes
  const handleAgentAnalyze = () => {
    const s = generateAgentSuggestions(title, description || letterBody, mediaType);
    setAgentSuggestion(s);
  };

  const applyAgentSuggestion = () => {
    if (!agentSuggestion) return;
    if (agentSuggestion.title && !title) setTitle(agentSuggestion.title);
    if (agentSuggestion.context) setContext(agentSuggestion.context);
    if (agentSuggestion.tags) {
      setTags((prev) => Array.from(new Set([...prev, ...(agentSuggestion.tags || [])])));
    }
    if (agentSuggestion.location && !locationName) setLocationName(agentSuggestion.location);
    setAgentSuggestion(null);
  };

  const handleFilesSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const fileList = Array.from(files);
    const newItems: UploadQueueItem[] = [];

    for (const file of fileList) {
      const isVid = file.type.startsWith('video');
      const isAud = file.type.startsWith('audio');
      const inferredType: MediaType = isVid ? 'video' : isAud ? 'voice' : 'photo';

      try {
        const previewUrl = await readFileAsDataURL(file);
        newItems.push({
          id: `${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          file,
          previewUrl,
          media_type: inferredType,
          status: 'pending',
          progress: 100
        });
      } catch (err) {
        console.error('File read error:', err);
      }
    }

    setUploadQueue((prev) => [...prev, ...newItems]);
    if (newItems.length > 0 && !title) {
      const rawName = fileList[0].name.replace(/\.[^/.]+$/, '');
      setTitle(rawName);
    }
  };

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const trimmed = tagInput.trim().replace(/^#/, '');
      if (trimmed && !tags.includes(trimmed)) {
        setTags((prev) => [...prev, trimmed]);
      }
      setTagInput('');
    }
  };

  const removeTag = (tToRemove: string) => {
    setTags((prev) => prev.filter((t) => t !== tToRemove));
  };

  const handleSubmit = async () => {
    if (!title.trim() && mediaType !== 'letter') return;
    if (mediaType === 'letter' && !letterBody.trim()) return;

    setIsProcessing(true);
    try {
      let finalUrl = '';

      // If we have uploaded files in the queue
      if (uploadQueue.length > 0) {
        const first = uploadQueue[0];
        finalUrl = first.previewUrl;

        // Try Supabase Storage upload if available
        try {
          const fileExt = first.file.name.split('.').pop();
          const filePath = `memories/${Date.now()}-${Math.random().toString(36).substring(2, 7)}.${fileExt}`;
          const { error: uploadError } = await supabase.storage
            .from('memories')
            .upload(filePath, first.file, { cacheControl: '3600', upsert: true });

          if (!uploadError) {
            const { data } = supabase.storage.from('memories').getPublicUrl(filePath);
            if (data?.publicUrl) finalUrl = data.publicUrl;
          }
        } catch (e) {
          // Keep base64 fallback
        }
      }

      await onSave({
        title: title || (mediaType === 'letter' ? 'Thư gửi em' : 'Kỷ niệm mới'),
        description,
        media_type: mediaType,
        category: mediaType,
        context,
        url: finalUrl,
        date,
        is_favorite: false,
        is_pinned: false,
        author_id: authorName.toLowerCase(),
        author_name: authorName,
        tags,
        collection_ids: selectedCollectionId ? [selectedCollectionId] : [],
        location: locationName ? { name: locationName } : undefined,
        metadata: {
          letter_body: mediaType === 'letter' ? letterBody : undefined,
          signature: mediaType === 'letter' ? signature : undefined
        }
      });

      onClose();
    } catch (err) {
      console.error('Save failed', err);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-md overflow-y-auto"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xl bg-zinc-900 border border-white/10 rounded-3xl p-6 shadow-2xl text-zinc-100 my-auto"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-white/10">
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">Lưu giữ kỷ niệm mới</h2>
            <p className="text-xs text-zinc-400">Thêm hình ảnh, video, ghi âm hoặc thư tay</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Media Type Tabs */}
        <div className="grid grid-cols-4 gap-2 mb-5">
          {(
            [
              { type: 'photo', label: 'Ảnh', icon: ImageIcon },
              { type: 'video', label: 'Video', icon: Film },
              { type: 'voice', label: 'Voice', icon: Mic },
              { type: 'letter', label: 'Thư', icon: FileText }
            ] as const
          ).map((item) => {
            const Icon = item.icon;
            const active = mediaType === item.type;
            return (
              <button
                key={item.type}
                type="button"
                onClick={() => setMediaType(item.type)}
                className={`py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                  active
                    ? 'bg-white text-zinc-900 shadow-md'
                    : 'bg-white/5 text-zinc-400 hover:text-zinc-200 hover:bg-white/10'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Form Body */}
        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
          {/* Multi-file Upload Dropzone for Photo / Video / Voice */}
          {mediaType !== 'letter' && (
            <div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFilesSelected}
                multiple
                accept={
                  mediaType === 'photo'
                    ? 'image/*'
                    : mediaType === 'video'
                    ? 'video/*'
                    : 'audio/*'
                }
                className="hidden"
              />

              {uploadQueue.length === 0 ? (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-8 border border-dashed border-white/20 rounded-2xl bg-white/[0.02] hover:bg-white/[0.05] transition-all flex flex-col items-center justify-center gap-2 group"
                >
                  <UploadCloud className="w-7 h-7 text-zinc-400 group-hover:text-white transition-colors" />
                  <div className="text-center">
                    <p className="text-xs font-semibold text-zinc-200">
                      Tải lên tệp {mediaType === 'photo' ? 'hình ảnh' : mediaType === 'video' ? 'video' : 'ghi âm'}
                    </p>
                    <p className="text-[11px] text-zinc-500 mt-0.5">Hỗ trợ chọn nhiều tệp cùng lúc</p>
                  </div>
                </button>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-zinc-400">
                    <span>Đã chọn {uploadQueue.length} tệp</span>
                    <button
                      type="button"
                      onClick={() => setUploadQueue([])}
                      className="text-red-400 hover:underline text-[11px]"
                    >
                      Xóa tất cả
                    </button>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {uploadQueue.map((item, idx) => (
                      <div
                        key={item.id}
                        className="relative aspect-video rounded-xl bg-black overflow-hidden border border-white/10"
                      >
                        {item.media_type === 'photo' ? (
                          <img src={item.previewUrl} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-zinc-400 text-xs font-mono">
                            Tệp #{idx + 1}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Letter Editor Mode */}
          {mediaType === 'letter' && (
            <div className="space-y-3 bg-zinc-950 p-4 rounded-2xl border border-white/10">
              <div>
                <label className="block text-[11px] font-mono text-zinc-400 uppercase mb-1">
                  Nội dung thư tay *
                </label>
                <textarea
                  value={letterBody}
                  onChange={(e) => setLetterBody(e.target.value)}
                  placeholder="Gửi em, những ngày vừa qua..."
                  rows={5}
                  className="w-full bg-transparent border-0 text-sm text-zinc-100 placeholder:text-zinc-600 outline-none resize-none font-serif leading-relaxed"
                />
              </div>
              <div>
                <label className="block text-[11px] font-mono text-zinc-400 uppercase mb-1">
                  Chữ ký kết thư
                </label>
                <input
                  type="text"
                  value={signature}
                  onChange={(e) => setSignature(e.target.value)}
                  placeholder="Minh"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none"
                />
              </div>
            </div>
          )}

          {/* Title & Author Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-[11px] font-mono text-zinc-400 uppercase mb-1">
                Tiêu đề kỷ niệm *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Khoảnh khắc đáng nhớ..."
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white placeholder:text-zinc-500 outline-none focus:border-white/30"
              />
            </div>

            <div>
              <label className="block text-[11px] font-mono text-zinc-400 uppercase mb-1">
                Người lưu giữ
              </label>
              <select
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3 py-2 text-sm text-white outline-none"
              >
                {DEFAULT_AUTHORS.map((a) => (
                  <option key={a.id} value={a.name}>
                    {a.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Date & Context */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-mono text-zinc-400 uppercase mb-1">
                Ngày diễn ra
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-mono text-zinc-400 uppercase mb-1">
                Bối cảnh (Context)
              </label>
              <select
                value={context}
                onChange={(e) => setContext(e.target.value as MemoryContextType)}
                className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3 py-2 text-sm text-white outline-none"
              >
                {Object.entries(CONTEXT_CONFIG).map(([key, val]) => (
                  <option key={key} value={key}>
                    {val.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Description */}
          {mediaType !== 'letter' && (
            <div>
              <label className="block text-[11px] font-mono text-zinc-400 uppercase mb-1">
                Ghi chú chi tiết
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Kể thêm về khoảnh khắc này..."
                rows={2}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white placeholder:text-zinc-500 outline-none resize-none focus:border-white/30"
              />
            </div>
          )}

          {/* Location & Collection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-mono text-zinc-400 uppercase mb-1">
                Địa điểm
              </label>
              <input
                type="text"
                value={locationName}
                onChange={(e) => setLocationName(e.target.value)}
                placeholder="Đà Lạt, Hà Nội, Cafe..."
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder:text-zinc-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-mono text-zinc-400 uppercase mb-1">
                Bộ sưu tập
              </label>
              <select
                value={selectedCollectionId}
                onChange={(e) => setSelectedCollectionId(e.target.value)}
                className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none"
              >
                <option value="">Không phân vào bộ sưu tập</option>
                {collections.map((col) => (
                  <option key={col.id} value={col.id}>
                    {col.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-[11px] font-mono text-zinc-400 uppercase mb-1">
              Thẻ (Tags) - Nhấn Enter để thêm
            </label>
            <div className="flex flex-wrap items-center gap-1.5 p-2 rounded-xl bg-white/5 border border-white/10">
              {tags.map((t) => (
                <span
                  key={t}
                  className="px-2 py-0.5 rounded-md bg-white/10 text-xs text-zinc-200 flex items-center gap-1"
                >
                  #{t}
                  <button type="button" onClick={() => removeTag(t)} className="text-zinc-400 hover:text-white">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleAddTag}
                placeholder={tags.length === 0 ? 'Thêm thẻ (vd: Dalat, FirstDate)...' : ''}
                className="flex-1 min-w-[120px] bg-transparent text-xs text-white outline-none px-1"
              />
            </div>
          </div>

          {/* AI Memory Agent Assistant Hint Bar */}
          <div className="pt-2">
            {!agentSuggestion ? (
              <button
                type="button"
                onClick={handleAgentAnalyze}
                className="w-full py-2 px-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-medium flex items-center justify-center gap-2 hover:bg-rose-500/15 transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5 text-rose-400" />
                Gợi ý thông minh (Memory Agent)
              </button>
            ) : (
              <div className="p-3 rounded-xl bg-zinc-950 border border-rose-500/30 space-y-2">
                <div className="flex items-center justify-between text-xs text-rose-300 font-semibold">
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" /> Gợi ý từ Agent
                  </span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={applyAgentSuggestion}
                      className="px-2.5 py-1 rounded-lg bg-rose-500 text-white text-[11px] font-semibold hover:bg-rose-600 transition"
                    >
                      Áp dụng
                    </button>
                    <button
                      type="button"
                      onClick={() => setAgentSuggestion(null)}
                      className="px-2 py-1 text-zinc-400 hover:text-white text-[11px]"
                    >
                      Bỏ qua
                    </button>
                  </div>
                </div>
                <div className="text-[11px] text-zinc-400 space-y-1">
                  {agentSuggestion.title && <p>• Tiêu đề: {agentSuggestion.title}</p>}
                  {agentSuggestion.context && (
                    <p>• Bối cảnh: {CONTEXT_CONFIG[agentSuggestion.context]?.label}</p>
                  )}
                  {agentSuggestion.tags && <p>• Thẻ: #{agentSuggestion.tags.join(' #')}</p>}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 mt-5 border-t border-white/10">
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white hover:bg-white/5 transition"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isProcessing}
            className="px-5 py-2 rounded-xl bg-white text-zinc-900 font-semibold text-xs hover:bg-zinc-200 transition shadow-md flex items-center gap-2 disabled:opacity-50"
          >
            {isProcessing && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            <span>Lưu kỷ niệm</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
};

/* ==========================================================================
   9. NATURAL LANGUAGE MEMORY ANSWER MODAL (GROUNDED Q&A)
   ========================================================================== */

interface MemoryAnswerModalProps {
  isOpen: boolean;
  memories: MemoryItem[];
  onClose: () => void;
  onSelectMemory: (m: MemoryItem) => void;
}

const MemoryAnswerModal: React.FC<MemoryAnswerModalProps> = ({
  isOpen,
  memories,
  onClose,
  onSelectMemory
}) => {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<{ answer: string; matched: MemoryItem[] } | null>(null);

  const sampleQueries = [
    'Ảnh đầu tiên của hai đứa?',
    'Những kỷ niệm yêu thích?',
    'Voice của em?',
    'Thư tay đã gửi'
  ];

  const handleSearch = (text: string) => {
    setQuery(text);
    const res = queryMemoryArchive(text, memories);
    setResult(res);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg bg-zinc-900 border border-white/10 rounded-3xl p-6 shadow-2xl text-zinc-100"
      >
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-rose-400" />
            <h3 className="text-base font-bold text-white">Tra cứu kho kỷ niệm (Grounded Q&A)</h3>
          </div>
          <button type="button" onClick={onClose} className="p-1 rounded-full text-zinc-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Input */}
        <div className="relative mb-3">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Hỏi về những chuyến đi, ảnh đầu tiên, voice..."
            className="w-full pl-10 pr-4 py-2.5 bg-zinc-950 border border-white/10 rounded-xl text-sm text-white placeholder:text-zinc-500 outline-none focus:border-rose-500"
          />
        </div>

        {/* Sample queries */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {sampleQueries.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => handleSearch(s)}
              className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-zinc-400 hover:text-zinc-200 transition"
            >
              {s}
            </button>
          ))}
        </div>

        {/* Result Area */}
        {result && (
          <div className="space-y-3 pt-2 border-t border-white/10">
            <div className="p-3.5 rounded-xl bg-zinc-950 border border-white/5">
              <p className="text-xs font-semibold text-rose-400 mb-1">Câu trả lời:</p>
              <p className="text-xs text-zinc-200 leading-relaxed">{result.answer}</p>
            </div>

            {result.matched.length > 0 && (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                <p className="text-[11px] font-mono text-zinc-500 uppercase">Kỷ niệm liên quan:</p>
                {result.matched.map((m) => (
                  <div
                    key={m.id}
                    onClick={() => {
                      onSelectMemory(m);
                      onClose();
                    }}
                    className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 flex items-center justify-between cursor-pointer transition"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-white truncate">{m.title}</p>
                      <p className="text-[10px] text-zinc-400">{m.date}</p>
                    </div>
                    <span className="text-[10px] text-rose-400">Xem ngay →</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
};

/* ==========================================================================
   10. MAIN MEMORIES COMPONENT
   ========================================================================== */

export default function Memories() {
  const { t, tc, lang } = useApp();

  // Primary state with resilient fallback
  const [memories, setMemories] = useState<MemoryItem[]>(() =>
    safeParse<MemoryItem[]>(STORAGE_KEY, DEFAULT_MEMORIES)
  );

  const [collections] = useState<MemoryCollection[]>(() =>
    safeParse<MemoryCollection[]>(COLLECTIONS_STORAGE_KEY, DEFAULT_COLLECTIONS)
  );

  // Filters & Views
  const [activeTab, setActiveTab] = useState<string>('all'); // all | photo | video | voice | letter | favorites | pinned
  const [selectedCollection, setSelectedCollection] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'timeline'>('grid');

  // Modals & Viewers
  const [viewerMemory, setViewerMemory] = useState<MemoryItem | null>(null);
  const [showComposer, setShowComposer] = useState(false);
  const [showAnswerModal, setShowAnswerModal] = useState(false);

  // Sync with Supabase on mount
  const fetchSupabaseMemories = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('memories')
        .select('*')
        .order('date', { ascending: false });

      if (!error && data && data.length > 0) {
        const normalized: MemoryItem[] = data.map((d: any) => ({
          ...d,
          media_type: d.media_type || d.category || 'photo',
          tags: Array.isArray(d.tags) ? d.tags : []
        }));
        setMemories(normalized);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
      }
    } catch (e) {
      console.warn('[Supabase] Falling back to offline memory storage');
    }
  }, []);

  useEffect(() => {
    fetchSupabaseMemories();
  }, [fetchSupabaseMemories]);

  // Save changes to state, localStorage, and Supabase
  const persistMemories = (newItems: MemoryItem[]) => {
    setMemories(newItems);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newItems));
  };

  const handleToggleFavorite = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const target = memories.find((m) => m.id === id);
    if (!target) return;
    const newVal = !target.is_favorite;

    const updated = memories.map((m) => (m.id === id ? { ...m, is_favorite: newVal } : m));
    persistMemories(updated);

    try {
      await supabase.from('memories').update({ is_favorite: newVal }).eq('id', id);
    } catch (err) {
      // Local fallback handled
    }
  };

  const handleTogglePin = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const target = memories.find((m) => m.id === id);
    if (!target) return;
    const newVal = !target.is_pinned;

    const updated = memories.map((m) => (m.id === id ? { ...m, is_pinned: newVal } : m));
    persistMemories(updated);

    try {
      await supabase.from('memories').update({ is_pinned: newVal }).eq('id', id);
    } catch (err) {
      // Local fallback
    }
  };

  const handleDelete = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!window.confirm('Bạn có chắc chắn muốn xóa kỷ niệm này không?')) return;

    const updated = memories.filter((m) => m.id !== id);
    persistMemories(updated);

    if (viewerMemory?.id === id) setViewerMemory(null);

    try {
      await supabase.from('memories').delete().eq('id', id);
    } catch (err) {
      // Local fallback
    }
  };

  const handleAddMemory = async (newMem: Omit<MemoryItem, 'id'>) => {
    const localId = `mem-local-${Date.now()}`;
    const fullItem: MemoryItem = {
      ...newMem,
      id: localId,
      created_at: new Date().toISOString()
    };

    const updated = [fullItem, ...memories];
    persistMemories(updated);

    try {
      const { data, error } = await supabase
        .from('memories')
        .insert({
          title: fullItem.title,
          description: fullItem.description,
          media_type: fullItem.media_type,
          category: fullItem.category || fullItem.media_type,
          context: fullItem.context,
          url: fullItem.url,
          date: fullItem.date,
          is_favorite: fullItem.is_favorite,
          is_pinned: fullItem.is_pinned,
          tags: fullItem.tags
        })
        .select()
        .maybeSingle();

      if (!error && data) {
        setMemories((prev) => prev.map((m) => (m.id === localId ? { ...m, id: data.id } : m)));
      }
    } catch (err) {
      console.warn('Persisted memory locally');
    }
  };

  // "On this day" calculations
  const onThisDayMemories = useMemo(() => {
    const today = new Date();
    const currentMonth = today.getMonth() + 1;
    const currentDay = today.getDate();
    const currentYear = today.getFullYear();

    return memories.filter((m) => {
      const d = new Date(m.date);
      return (
        d.getMonth() + 1 === currentMonth &&
        d.getDate() === currentDay &&
        d.getFullYear() < currentYear
      );
    });
  }, [memories]);

  // Filtered & Sorted memories
  const filteredMemories = useMemo(() => {
    return memories.filter((m) => {
      // Tab filter
      if (activeTab === 'favorites' && !m.is_favorite) return false;
      if (activeTab === 'pinned' && !m.is_pinned) return false;
      if (
        ['photo', 'video', 'voice', 'letter'].includes(activeTab) &&
        m.media_type !== activeTab
      ) {
        return false;
      }

      // Collection filter
      if (selectedCollection !== 'all') {
        if (!m.collection_ids || !m.collection_ids.includes(selectedCollection)) {
          return false;
        }
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = m.title.toLowerCase().includes(q);
        const matchDesc = (m.description || '').toLowerCase().includes(q);
        const matchAuthor = (m.author_name || '').toLowerCase().includes(q);
        const matchLocation = (m.location?.name || '').toLowerCase().includes(q);
        const matchTags = (m.tags || []).some((t) => t.toLowerCase().includes(q));
        const matchPeople = (m.metadata?.people || []).some((p) => p.toLowerCase().includes(q));
        if (
          !matchTitle &&
          !matchDesc &&
          !matchAuthor &&
          !matchLocation &&
          !matchTags &&
          !matchPeople
        ) {
          return false;
        }
      }

      return true;
    });
  }, [memories, activeTab, selectedCollection, searchQuery]);

  // Memory stats
  const stats = useMemo(() => {
    const photos = memories.filter((m) => m.media_type === 'photo').length;
    const videos = memories.filter((m) => m.media_type === 'video').length;
    const voices = memories.filter((m) => m.media_type === 'voice').length;
    const letters = memories.filter((m) => m.media_type === 'letter').length;
    return { total: memories.length, photos, videos, voices, letters };
  }, [memories]);

  return (
    <main className="pt-24 pb-16 min-h-screen">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* ==================== 1. EDITORIAL HEADER ==================== */}
        <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
              {t('memories.title') || 'Kho kỷ niệm'}
            </h1>
            <p className="text-xs font-mono text-zinc-500 dark:text-zinc-400 mt-1">
              {stats.total} kỷ niệm · {stats.photos} ảnh · {stats.videos} video · {stats.voices} voice · {stats.letters} thư
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setShowAnswerModal(true)}
              className="px-3.5 py-2 rounded-full border border-zinc-200 dark:border-white/10 bg-white/50 dark:bg-zinc-900/50 hover:bg-white dark:hover:bg-zinc-800 text-xs font-semibold text-zinc-700 dark:text-zinc-200 flex items-center gap-1.5 shadow-sm transition"
            >
              <Sparkles className="w-3.5 h-3.5 text-rose-500" />
              <span>Hỏi kho kỷ niệm</span>
            </button>

            <button
              type="button"
              onClick={() => setShowComposer(true)}
              className="px-4 py-2 rounded-full bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-xs font-semibold hover:opacity-90 transition shadow-sm flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>{t('memories.add') || 'Thêm kỷ niệm'}</span>
            </button>
          </div>
        </header>

        {/* ==================== 2. ON THIS DAY FLASHBACK ==================== */}
        {onThisDayMemories.length > 0 && (
          <div className="mb-8 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <Calendar className="w-5 h-5 text-amber-500 shrink-0" />
              <div className="min-w-0">
                <p className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                  Ngày này năm xưa
                </p>
                <p className="text-xs text-zinc-800 dark:text-zinc-200 font-semibold truncate">
                  {onThisDayMemories[0].title}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setViewerMemory(onThisDayMemories[0])}
              className="px-3 py-1 rounded-lg bg-amber-500 text-white text-xs font-semibold hover:bg-amber-600 transition shrink-0"
            >
              Xem lại
            </button>
          </div>
        )}

        {/* ==================== 3. SEARCH, FILTERS & COLLECTIONS ==================== */}
        <div className="space-y-4 mb-8">
          {/* Search bar & View mode toggles */}
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm theo tiêu đề, người chụp, thẻ, địa điểm..."
                className="w-full pl-10 pr-4 py-2 bg-zinc-100 dark:bg-zinc-900/80 rounded-full text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 border border-transparent dark:border-white/10 outline-none focus:border-zinc-300 dark:focus:border-white/25 transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center gap-1.5 self-end sm:self-auto">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg border transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 border-transparent shadow-sm'
                    : 'border-zinc-200 dark:border-white/10 text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
                }`}
                title="Grid view"
                aria-label="Grid view"
              >
                <Grid3X3 className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('timeline')}
                className={`p-2 rounded-lg border transition-colors ${
                  viewMode === 'timeline'
                    ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 border-transparent shadow-sm'
                    : 'border-zinc-200 dark:border-white/10 text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
                }`}
                title="Timeline view"
                aria-label="Timeline view"
              >
                <Calendar className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Primary Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            {[
              { id: 'all', label: 'Tất cả' },
              { id: 'photo', label: 'Ảnh' },
              { id: 'video', label: 'Video' },
              { id: 'voice', label: 'Voice' },
              { id: 'letter', label: 'Thư' },
              { id: 'favorites', label: 'Yêu thích' },
              { id: 'pinned', label: 'Đã ghim' }
            ].map((tab) => {
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                    active
                      ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-sm'
                      : 'bg-zinc-100 dark:bg-white/5 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200 dark:hover:bg-white/10'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Collections Filter Strip */}
          {collections.length > 0 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs text-zinc-500">
              <span className="text-[11px] font-mono shrink-0">Bộ sưu tập:</span>
              <button
                type="button"
                onClick={() => setSelectedCollection('all')}
                className={`px-2.5 py-1 rounded-lg transition-colors whitespace-nowrap ${
                  selectedCollection === 'all'
                    ? 'font-bold text-zinc-900 dark:text-white bg-zinc-200/60 dark:bg-white/10'
                    : 'hover:text-zinc-800 dark:hover:text-zinc-200'
                }`}
              >
                Tất cả
              </button>
              {collections.map((col) => (
                <button
                  key={col.id}
                  type="button"
                  onClick={() => setSelectedCollection(col.id)}
                  className={`px-2.5 py-1 rounded-lg transition-colors whitespace-nowrap ${
                    selectedCollection === col.id
                      ? 'font-bold text-zinc-900 dark:text-white bg-zinc-200/60 dark:bg-white/10'
                      : 'hover:text-zinc-800 dark:hover:text-zinc-200'
                  }`}
                >
                  {col.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ==================== 4. MAIN CONTENT (GRID OR TIMELINE) ==================== */}
        {filteredMemories.length === 0 ? (
          <div className="py-24 text-center max-w-sm mx-auto">
            <div className="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center mx-auto mb-3 text-zinc-400">
              <ImageIcon className="w-6 h-6 stroke-[1.5]" />
            </div>
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
              {searchQuery ? 'Không tìm thấy kỷ niệm phù hợp' : 'Chưa có kỷ niệm nào'}
            </h3>
            <p className="text-xs text-zinc-500 mt-1">
              {searchQuery
                ? 'Hãy thử tìm bằng từ khóa hoặc bộ lọc khác.'
                : 'Lưu lại những khoảnh khắc đáng nhớ cùng nhau.'}
            </p>
            {!searchQuery && (
              <button
                type="button"
                onClick={() => setShowComposer(true)}
                className="mt-4 px-4 py-2 rounded-full bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-xs font-semibold"
              >
                Thêm kỷ niệm đầu tiên
              </button>
            )}
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
            {filteredMemories.map((m) => (
              <MemoryCard
                key={m.id}
                memory={m}
                tc={tc}
                lang={lang}
                onOpen={(item) => setViewerMemory(item)}
                onToggleFavorite={(id, e) => handleToggleFavorite(id, e)}
                onTogglePin={(id, e) => handleTogglePin(id, e)}
                onDelete={(id, e) => handleDelete(id, e)}
              />
            ))}
          </div>
        ) : (
          <TimelineView
            memories={filteredMemories}
            tc={tc}
            lang={lang}
            onOpen={(item) => setViewerMemory(item)}
            onToggleFavorite={(id, e) => handleToggleFavorite(id, e)}
            onTogglePin={(id, e) => handleTogglePin(id, e)}
            onDelete={(id, e) => handleDelete(id, e)}
          />
        )}
      </div>

      {/* ==================== 5. MODALS & LIGHTBOXES ==================== */}
      <AnimatePresence>
        {viewerMemory && (
          <MemoryViewer
            memory={viewerMemory}
            memories={filteredMemories}
            lang={lang}
            onClose={() => setViewerMemory(null)}
            onSelect={(m) => setViewerMemory(m)}
            onToggleFavorite={(id) => handleToggleFavorite(id)}
            onTogglePin={(id) => handleTogglePin(id)}
            onDelete={(id) => handleDelete(id)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showComposer && (
          <MemoryComposer
            isOpen={showComposer}
            tc={tc}
            collections={collections}
            onClose={() => setShowComposer(false)}
            onSave={handleAddMemory}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showAnswerModal && (
          <MemoryAnswerModal
            isOpen={showAnswerModal}
            memories={memories}
            onClose={() => setShowAnswerModal(false)}
            onSelectMemory={(m) => setViewerMemory(m)}
          />
        )}
      </AnimatePresence>
    </main>
  );
}