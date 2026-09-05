import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Search,
  X,
  MoreHorizontal,
  Pin,
  Star,
  Trash2,
  Edit3,
  Image as ImageIcon,
  Sparkles,
  MessageCircleQuestion,
  ChevronLeft,
  ChevronRight,
  MapPin,
  RotateCcw,
  BookMarked,
  Heart,
  FileText,
  Bookmark,
  Award,
  Smile
} from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { supabase } from '../lib/supabase';
import { formatDateLocale } from '../lib/dateUtils';

// ==========================================
// 1. DATA TYPES & CONTRACTS
// ==========================================

export type JournalEntryType =
  | 'note'
  | 'memory'
  | 'love'
  | 'event'
  | 'milestone'
  | 'letter'
  | 'gratitude';

export interface JournalAuthor {
  id: string;
  name: string;
  avatarInitial: string;
  role: 'user' | 'partner';
}

export interface JournalEntry {
  id: string;
  author_id: string;
  author_name: string;
  type: JournalEntryType;
  title?: string;
  content: string;
  mood?: string;
  date: string; // YYYY-MM-DD
  time?: string; // HH:mm
  created_at: string;
  updated_at?: string;
  photos?: string[];
  location?: {
    name?: string;
    lat?: number;
    lng?: number;
  };
  tags?: string[];
  is_pinned?: boolean;
  is_favorite?: boolean;
  metadata?: {
    people?: string[];
    occasion?: string;
    ai_summary?: string;
  };
}

interface JournalDraft {
  author_id: string;
  type: JournalEntryType;
  title: string;
  content: string;
  mood: string;
  photos: string[];
  locationName: string;
  tags: string;
  updated_at: string;
}

// Default Authors Configuration
const DEFAULT_AUTHORS: JournalAuthor[] = [
  { id: 'author-1', name: 'Minh', avatarInitial: 'M', role: 'user' },
  { id: 'author-2', name: 'Em', avatarInitial: 'E', role: 'partner' },
];

const ENTRY_TYPES: { id: JournalEntryType; label: string; icon: React.ReactNode }[] = [
  { id: 'memory', label: 'Kỷ niệm', icon: <Sparkles className="w-3.5 h-3.5" /> },
  { id: 'note', label: 'Nhật ký', icon: <FileText className="w-3.5 h-3.5" /> },
  { id: 'love', label: 'Yêu thương', icon: <Heart className="w-3.5 h-3.5" /> },
  { id: 'letter', label: 'Lá thư', icon: <BookMarked className="w-3.5 h-3.5" /> },
  { id: 'milestone', label: 'Cột mốc', icon: <Award className="w-3.5 h-3.5" /> },
  { id: 'gratitude', label: 'Biết ơn', icon: <Smile className="w-3.5 h-3.5" /> },
  { id: 'event', label: 'Sự kiện', icon: <Bookmark className="w-3.5 h-3.5" /> },
];

const MOODS: { id: string; label: string; symbol: string }[] = [
  { id: 'peaceful', label: 'Bình yên', symbol: 'Bình yên' },
  { id: 'happy', label: 'Vui vẻ', symbol: 'Hạnh phúc' },
  { id: 'loved', label: 'Được yêu', symbol: 'Ấm áp' },
  { id: 'touched', label: 'Cảm động', symbol: 'Xúc động' },
  { id: 'excited', label: 'Hào hứng', symbol: 'Háo hức' },
  { id: 'tired', label: 'Mệt nhoài', symbol: 'Cần ôm' },
];

const DEFAULT_JOURNAL_DATA: JournalEntry[] = [
  {
    id: 'jnl-sample-1',
    author_id: 'author-1',
    author_name: 'Minh',
    type: 'memory',
    title: 'Chiều mưa dưới hiên quán cũ',
    content: 'Hôm nay trời mưa lất phất, hai đứa ngồi trú mưa dưới mái hiên quán trà, chia nhau một cốc trà sữa ấm nóng. Cảm giác bình yên đến lạ kỳ giữa phố thị tấp nập.',
    mood: 'peaceful',
    date: '2024-05-22',
    time: '19:42',
    created_at: '2024-05-22T19:42:00Z',
    photos: [
      'https://images.unsplash.com/photo-1517256064527-09c73fc73e38?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1498804103079-a6351b050096?auto=format&fit=crop&w=800&q=80'
    ],
    tags: ['quán trà', 'mưa', 'hẹn hò'],
    location: { name: 'Góc Trà Cũ, Hà Nội' },
    is_favorite: true,
    is_pinned: true,
  },
  {
    id: 'jnl-sample-2',
    author_id: 'author-2',
    author_name: 'Em',
    type: 'letter',
    title: 'Món quà bất ngờ',
    content: 'Em chuẩn bị chiếc hộp nhỏ này từ tuần trước, từng mảnh giấy gấp tay ghi lại những điều em thích ở anh. Lúc anh mở ra nhìn anh bối rối dễ thương vô cùng!',
    mood: 'loved',
    date: '2024-05-22',
    time: '21:18',
    created_at: '2024-05-22T21:18:00Z',
    tags: ['quà tặng', 'bất ngờ'],
    is_favorite: true,
  },
  {
    id: 'jnl-sample-3',
    author_id: 'author-2',
    author_name: 'Em',
    type: 'gratitude',
    title: 'Cảm ơn anh vì bữa tối',
    content: 'Sau một ngày dài làm việc căng thẳng, về đến nhà đã thấy anh nấu sẵn món canh kim chi nóng hổi. Sự chu đáo dịu dàng của anh làm tan biến hết mệt mỏi.',
    mood: 'happy',
    date: '2024-06-05',
    time: '20:05',
    created_at: '2024-06-05T20:05:00Z',
  }
];

const DRAFT_KEY = 'cuongisme_journal_draft_v2';
const LOCAL_STORAGE_KEY = 'cuongisme_journal_v2';

// ==========================================
// 2. MAIN COMPONENT
// ==========================================

export default function Journal() {
  const { t, lang } = useApp();

  // Primary State
  const [entries, setEntries] = useState<JournalEntry[]>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse cached journal:', e);
      }
    }
    return DEFAULT_JOURNAL_DATA;
  });

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTypeFilter, setActiveTypeFilter] = useState<string>('all');
  const [activeAuthorFilter, setActiveAuthorFilter] = useState<string>('all');
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [onlyPhotos, setOnlyPhotos] = useState(false);

  // Composer State
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);
  const [hasDraft, setHasDraft] = useState(false);

  // Lightbox State
  const [activePhotoGallery, setActivePhotoGallery] = useState<{ photos: string[]; index: number } | null>(null);

  // AI Answer Assistant State
  const [isAnswerDrawerOpen, setIsAnswerDrawerOpen] = useState(false);

  // Sync with Supabase on mount
  useEffect(() => {
    let isMounted = true;
    const fetchRemoteEntries = async () => {
      try {
        const { data, error } = await supabase
          .from('journal_entries')
          .select('*')
          .order('date', { ascending: false });

        if (error) throw error;

        if (data && data.length > 0 && isMounted) {
          // Normalize Supabase entries to support rich client model safely
          const normalized = data.map((item: any) => ({
            id: item.id || `remote-${Date.now()}`,
            author_id: item.author_id || (item.author === 'Em' ? 'author-2' : 'author-1'),
            author_name: item.author_name || item.author || (item.author_id === 'author-2' ? 'Em' : 'Minh'),
            type: (item.type as JournalEntryType) || 'note',
            title: item.title || '',
            content: item.content || '',
            mood: item.mood || 'peaceful',
            date: item.date || new Date().toISOString().split('T')[0],
            time: item.time || (item.created_at ? new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '12:00'),
            created_at: item.created_at || new Date().toISOString(),
            updated_at: item.updated_at,
            photos: Array.isArray(item.photos) ? item.photos : [],
            tags: Array.isArray(item.tags) ? item.tags : [],
            location: item.location || (item.location_name ? { name: item.location_name } : undefined),
            is_pinned: Boolean(item.is_pinned),
            is_favorite: Boolean(item.is_favorite),
            metadata: item.metadata || {},
          }));

          setEntries(normalized);
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(normalized));
        }
      } catch (err: any) {
        console.warn('Supabase fetch notice (using robust local fallback):', err.message);
      }
    };

    fetchRemoteEntries();

    // Check draft existence
    const savedDraft = localStorage.getItem(DRAFT_KEY);
    if (savedDraft) {
      try {
        const parsed = JSON.parse(savedDraft);
        if (parsed.content && parsed.content.trim().length > 0) {
          setHasDraft(true);
        }
      } catch (e) {
        // ignore draft parse error
      }
    }

    return () => {
      isMounted = false;
    };
  }, []);

  // Save changes to localStorage whenever entries update
  const persistEntries = (newEntries: JournalEntry[]) => {
    setEntries(newEntries);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newEntries));
  };

  // CRUD Operations
  const handleSaveEntry = async (entryData: Omit<JournalEntry, 'id' | 'created_at'>, existingId?: string) => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    if (existingId) {
      // Update
      const updated = entries.map((e) =>
        e.id === existingId
          ? {
              ...e,
              ...entryData,
              updated_at: now.toISOString(),
            }
          : e
      );
      persistEntries(updated);

      // Background Supabase Sync
      try {
        await supabase
          .from('journal_entries')
          .update({
            author_id: entryData.author_id,
            author_name: entryData.author_name,
            type: entryData.type,
            title: entryData.title,
            content: entryData.content,
            mood: entryData.mood,
            date: entryData.date,
            photos: entryData.photos,
            tags: entryData.tags,
            location: entryData.location,
            is_pinned: entryData.is_pinned,
            is_favorite: entryData.is_favorite,
            updated_at: now.toISOString(),
          })
          .eq('id', existingId);
      } catch (err) {
        console.warn('Saved update locally (offline compatible)');
      }
    } else {
      // Create
      const localId = `jnl-${Date.now()}`;
      const newEntry: JournalEntry = {
        ...entryData,
        id: localId,
        time: timeStr,
        created_at: now.toISOString(),
      };

      const updated = [newEntry, ...entries];
      persistEntries(updated);

      // Background Supabase Sync
      try {
        const { data } = await supabase
          .from('journal_entries')
          .insert({
            author_id: entryData.author_id,
            author_name: entryData.author_name,
            type: entryData.type,
            title: entryData.title,
            content: entryData.content,
            mood: entryData.mood,
            date: entryData.date,
            photos: entryData.photos,
            tags: entryData.tags,
            location: entryData.location,
            is_pinned: entryData.is_pinned,
            is_favorite: entryData.is_favorite,
            created_at: now.toISOString(),
          })
          .select()
          .maybeSingle();

        if (data && data.id) {
          // Re-map local ID to Supabase ID
          setEntries((prev) => prev.map((e) => (e.id === localId ? { ...e, id: data.id } : e)));
        }
      } catch (err) {
        console.warn('Saved new entry locally (offline compatible)');
      }
    }

    // Clear draft on successful save
    localStorage.removeItem(DRAFT_KEY);
    setHasDraft(false);
    setIsComposerOpen(false);
    setEditingEntry(null);
  };

  const handleDeleteEntry = async (id: string) => {
    if (!window.confirm('Bạn có chắc muốn xóa trang nhật ký này không?')) return;
    const updated = entries.filter((e) => e.id !== id);
    persistEntries(updated);

    try {
      await supabase.from('journal_entries').delete().eq('id', id);
    } catch (e) {
      // offline safe
    }
  };

  const handleTogglePin = async (id: string) => {
    const target = entries.find((e) => e.id === id);
    if (!target) return;
    const newStatus = !target.is_pinned;
    const updated = entries.map((e) => (e.id === id ? { ...e, is_pinned: newStatus } : e));
    persistEntries(updated);

    try {
      await supabase.from('journal_entries').update({ is_pinned: newStatus }).eq('id', id);
    } catch (e) {}
  };

  const handleToggleFavorite = async (id: string) => {
    const target = entries.find((e) => e.id === id);
    if (!target) return;
    const newStatus = !target.is_favorite;
    const updated = entries.map((e) => (e.id === id ? { ...e, is_favorite: newStatus } : e));
    persistEntries(updated);

    try {
      await supabase.from('journal_entries').update({ is_favorite: newStatus }).eq('id', id);
    } catch (e) {}
  };

  // Filtered & Grouped Data Computations
  const filteredEntries = useMemo(() => {
    return entries.filter((entry) => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesContent = entry.content.toLowerCase().includes(q);
        const matchesTitle = entry.title?.toLowerCase().includes(q);
        const matchesAuthor = entry.author_name?.toLowerCase().includes(q);
        const matchesLocation = entry.location?.name?.toLowerCase().includes(q);
        const matchesTags = entry.tags?.some((t) => t.toLowerCase().includes(q));
        if (!matchesContent && !matchesTitle && !matchesAuthor && !matchesLocation && !matchesTags) {
          return false;
        }
      }

      // Type Filter
      if (activeTypeFilter !== 'all' && entry.type !== activeTypeFilter) {
        return false;
      }

      // Author Filter
      if (activeAuthorFilter !== 'all' && entry.author_id !== activeAuthorFilter) {
        return false;
      }

      // Favorites
      if (onlyFavorites && !entry.is_favorite) {
        return false;
      }

      // Photos
      if (onlyPhotos && (!entry.photos || entry.photos.length === 0)) {
        return false;
      }

      return true;
    });
  }, [entries, searchQuery, activeTypeFilter, activeAuthorFilter, onlyFavorites, onlyPhotos]);

  // Group filtered entries by date
  const groupedTimeline = useMemo(() => {
    const groups: { [dateStr: string]: JournalEntry[] } = {};
    
    // Sort pinned on top when viewing all without specific search, or natural chronological date grouping
    const sorted = [...filteredEntries].sort((a, b) => {
      if (a.date === b.date) {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
      return b.date.localeCompare(a.date);
    });

    sorted.forEach((entry) => {
      if (!groups[entry.date]) {
        groups[entry.date] = [];
      }
      groups[entry.date].push(entry);
    });

    return Object.entries(groups).map(([date, items]) => ({
      date,
      items,
    }));
  }, [filteredEntries]);

  // Stats calculation
  const stats = useMemo(() => {
    const totalEntries = entries.length;
    const uniqueDays = new Set(entries.map((e) => e.date)).size;
    const totalPhotos = entries.reduce((acc, curr) => acc + (curr.photos?.length || 0), 0);
    return { totalEntries, uniqueDays, totalPhotos };
  }, [entries]);

  // "On this day" flash memory detector (same MM-DD in previous years)
  const onThisDayMemory = useMemo(() => {
    const today = new Date();
    const todayMonthDay = `${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const currentYear = today.getFullYear();

    return entries.find((e) => {
      const [year, month, day] = e.date.split('-');
      return `${month}-${day}` === todayMonthDay && parseInt(year, 10) < currentYear;
    });
  }, [entries]);

  return (
    <main className="min-h-screen pt-20 pb-24 selection:bg-rose-500/20">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        
        {/* Top Header & Stat Strip */}
        <header className="mb-8 pt-4">
          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4 pb-4 border-b border-zinc-200 dark:border-zinc-800/80">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 font-serif">
                {t('journal.title') || 'Nhật ký'}
              </h1>
              <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                {stats.totalEntries} trang kỷ niệm · {stats.uniqueDays} ngày đã viết · {stats.totalPhotos} ảnh
              </p>
            </div>

            {/* Top Action Buttons */}
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setIsAnswerDrawerOpen(true)}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-xl border transition-all ${
                  isAnswerDrawerOpen
                    ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 border-transparent'
                    : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-700 dark:bg-zinc-800/70 dark:text-zinc-300 dark:border-zinc-700/50 hover:dark:bg-zinc-800'
                }`}
                title="Hỏi trợ lý về nhật ký của bạn"
              >
                <MessageCircleQuestion className="w-4 h-4 text-rose-500" />
                <span>Hỏi nhật ký</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setEditingEntry(null);
                  setIsComposerOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded-xl bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-rose-600 dark:hover:bg-rose-500 dark:text-white shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-rose-500/50"
              >
                <Plus className="w-4 h-4" />
                <span>{t('journal.newEntry') || 'Viết trang mới'}</span>
              </button>
            </div>
          </div>

          {/* Unfinished Draft Banner */}
          {hasDraft && !isComposerOpen && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/40 flex items-center justify-between gap-3 text-xs"
            >
              <div className="flex items-center gap-2 text-amber-800 dark:text-amber-200">
                <RotateCcw className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
                <span>Bạn có một trang nhật ký viết dở được lưu tự động.</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsComposerOpen(true)}
                  className="font-semibold text-amber-900 dark:text-amber-100 underline underline-offset-2 hover:opacity-80"
                >
                  Tiếp tục viết
                </button>
                <button
                  type="button"
                  onClick={() => {
                    localStorage.removeItem(DRAFT_KEY);
                    setHasDraft(false);
                  }}
                  className="text-amber-600 dark:text-amber-400 hover:text-amber-800 p-1"
                  title="Hủy bản nháp"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </motion.div>
          )}

          {/* "On This Day" Editorial Banner */}
          {onThisDayMemory && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 p-4 rounded-2xl bg-rose-500/[0.04] dark:bg-rose-500/[0.07] border border-rose-500/20 text-xs"
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-semibold text-rose-600 dark:text-rose-400 uppercase tracking-wider text-[10px]">
                  Cùng ngày này năm xưa · {formatDateLocale(onThisDayMemory.date, lang)}
                </span>
                <span className="text-zinc-500 dark:text-zinc-400 text-[11px]">{onThisDayMemory.author_name}</span>
              </div>
              <p className="text-zinc-800 dark:text-zinc-200 font-serif italic line-clamp-2 leading-relaxed">
                "{onThisDayMemory.content}"
              </p>
            </motion.div>
          )}

          {/* Search & Filter Bar */}
          <div className="mt-6 space-y-3">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm kiếm nội dung, tác giả, địa điểm, thẻ..."
                className="w-full pl-9 pr-8 py-2.5 bg-zinc-100/80 dark:bg-zinc-800/50 border border-transparent focus:border-zinc-300 dark:focus:border-zinc-700 rounded-xl text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 outline-none transition-all"
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

            {/* Horizontal Filter Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
              {/* Type selector */}
              <button
                type="button"
                onClick={() => setActiveTypeFilter('all')}
                className={`px-3 py-1.5 rounded-lg shrink-0 transition-colors ${
                  activeTypeFilter === 'all'
                    ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 font-medium'
                    : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800/60 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800'
                }`}
              >
                Tất cả
              </button>

              {ENTRY_TYPES.map((tItem) => (
                <button
                  key={tItem.id}
                  type="button"
                  onClick={() => setActiveTypeFilter(activeTypeFilter === tItem.id ? 'all' : tItem.id)}
                  className={`px-3 py-1.5 rounded-lg shrink-0 flex items-center gap-1.5 transition-colors ${
                    activeTypeFilter === tItem.id
                      ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 font-medium'
                      : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800/60 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800'
                  }`}
                >
                  {tItem.label}
                </button>
              ))}

              <div className="w-[1px] h-4 bg-zinc-200 dark:bg-zinc-800 shrink-0 mx-1" />

              {/* Author toggles */}
              {DEFAULT_AUTHORS.map((author) => (
                <button
                  key={author.id}
                  type="button"
                  onClick={() => setActiveAuthorFilter(activeAuthorFilter === author.id ? 'all' : author.id)}
                  className={`px-2.5 py-1.5 rounded-lg shrink-0 transition-colors ${
                    activeAuthorFilter === author.id
                      ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 font-medium'
                      : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800/60 dark:text-zinc-400 hover:bg-zinc-200'
                  }`}
                >
                  {author.name}
                </button>
              ))}

              {/* Quick attribute toggles */}
              <button
                type="button"
                onClick={() => setOnlyFavorites((prev) => !prev)}
                className={`px-2.5 py-1.5 rounded-lg shrink-0 flex items-center gap-1 transition-colors ${
                  onlyFavorites
                    ? 'bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-300 font-medium'
                    : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800/60 dark:text-zinc-400'
                }`}
              >
                <Star className="w-3.5 h-3.5 fill-current" />
                <span>Yêu thích</span>
              </button>

              <button
                type="button"
                onClick={() => setOnlyPhotos((prev) => !prev)}
                className={`px-2.5 py-1.5 rounded-lg shrink-0 flex items-center gap-1 transition-colors ${
                  onlyPhotos
                    ? 'bg-rose-100 text-rose-900 dark:bg-rose-950/60 dark:text-rose-300 font-medium'
                    : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800/60 dark:text-zinc-400'
                }`}
              >
                <ImageIcon className="w-3.5 h-3.5" />
                <span>Có ảnh</span>
              </button>
            </div>
          </div>
        </header>

        {/* Timeline Content */}
        <section aria-label="Journal Timeline" className="space-y-10">
          {groupedTimeline.length > 0 ? (
            groupedTimeline.map((dayGroup) => (
              <div key={dayGroup.date} className="relative">
                {/* Date Group Heading */}
                <div className="sticky top-16 z-10 py-2.5 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md mb-4 border-b border-zinc-100 dark:border-zinc-800/50 flex items-center justify-between">
                  <div className="text-[11px] font-mono uppercase tracking-widest font-semibold text-zinc-400 dark:text-zinc-500">
                    {formatDateLocale(dayGroup.date, lang)}
                  </div>
                  <span className="text-[11px] text-zinc-400 dark:text-zinc-600 font-mono">
                    {dayGroup.items.length} {dayGroup.items.length === 1 ? 'mục' : 'mục'}
                  </span>
                </div>

                {/* Day Entries List */}
                <div className="space-y-4 pl-0 sm:pl-2">
                  {dayGroup.items.map((entry) => (
                    <JournalEntryCard
                      key={entry.id}
                      entry={entry}
                      onEdit={() => {
                        setEditingEntry(entry);
                        setIsComposerOpen(true);
                      }}
                      onDelete={() => handleDeleteEntry(entry.id)}
                      onTogglePin={() => handleTogglePin(entry.id)}
                      onToggleFavorite={() => handleToggleFavorite(entry.id)}
                      onOpenGallery={(photos, index) => setActivePhotoGallery({ photos, index })}
                    />
                  ))}
                </div>
              </div>
            ))
          ) : (
            <JournalEmptyState
              hasFilter={Boolean(searchQuery || activeTypeFilter !== 'all' || activeAuthorFilter !== 'all' || onlyFavorites || onlyPhotos)}
              onResetFilters={() => {
                setSearchQuery('');
                setActiveTypeFilter('all');
                setActiveAuthorFilter('all');
                setOnlyFavorites(false);
                setOnlyPhotos(false);
              }}
              onNewEntry={() => {
                setEditingEntry(null);
                setIsComposerOpen(true);
              }}
            />
          )}
        </section>
      </div>

      {/* COMPOSER MODAL */}
      <AnimatePresence>
        {isComposerOpen && (
          <JournalComposerModal
            initialData={editingEntry}
            authors={DEFAULT_AUTHORS}
            onClose={() => {
              setIsComposerOpen(false);
              setEditingEntry(null);
            }}
            onSave={handleSaveEntry}
          />
        )}
      </AnimatePresence>

      {/* PHOTO LIGHTBOX */}
      <AnimatePresence>
        {activePhotoGallery && (
          <JournalPhotoLightbox
            gallery={activePhotoGallery}
            onClose={() => setActivePhotoGallery(null)}
          />
        )}
      </AnimatePresence>

      {/* JOURNAL ANSWER & RETRIEVAL DRAWER */}
      <AnimatePresence>
        {isAnswerDrawerOpen && (
          <JournalAnswerDrawer
            entries={entries}
            onClose={() => setIsAnswerDrawerOpen(false)}
            onSelectEntry={(entry) => {
              setIsAnswerDrawerOpen(false);
              setSearchQuery(entry.title || entry.content.slice(0, 20));
            }}
          />
        )}
      </AnimatePresence>
    </main>
  );
}

// ==========================================
// 3. JOURNAL ENTRY CARD
// ==========================================

interface JournalEntryCardProps {
  entry: JournalEntry;
  onEdit: () => void;
  onDelete: () => void;
  onTogglePin: () => void;
  onToggleFavorite: () => void;
  onOpenGallery: (photos: string[], index: number) => void;
}

function JournalEntryCard({
  entry,
  onEdit,
  onDelete,
  onTogglePin,
  onToggleFavorite,
  onOpenGallery,
}: JournalEntryCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [menuOpen]);

  const typeConfig = ENTRY_TYPES.find((t) => t.id === entry.type) || ENTRY_TYPES[0];
  const moodConfig = MOODS.find((m) => m.id === entry.mood);

  const isLetter = entry.type === 'letter';

  return (
    <article
      className={`relative p-5 sm:p-6 rounded-2xl border transition-all duration-200 ${
        entry.is_pinned
          ? 'bg-gradient-to-b from-zinc-50 to-white dark:from-zinc-900/90 dark:to-zinc-900/40 border-zinc-300/80 dark:border-zinc-700 shadow-sm'
          : 'bg-white dark:bg-zinc-900/50 border-zinc-200/70 dark:border-zinc-800/80 hover:border-zinc-300 dark:hover:border-zinc-700 shadow-[0_1px_3px_rgba(0,0,0,0.02)]'
      }`}
    >
      {/* Card Header: Author, Time, Type & Action Button */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Author Badge */}
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-900 dark:text-zinc-100">
            <span className="w-5 h-5 rounded-full bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 flex items-center justify-center text-[10px] font-bold uppercase">
              {entry.author_name ? entry.author_name.charAt(0) : 'M'}
            </span>
            <span>{entry.author_name}</span>
          </span>

          <span className="text-zinc-300 dark:text-zinc-700 text-xs">·</span>

          {/* Time */}
          <span className="text-xs text-zinc-400 dark:text-zinc-500 font-mono">
            {entry.time || '12:00'}
          </span>

          <span className="text-zinc-300 dark:text-zinc-700 text-xs">·</span>

          {/* Type Pill */}
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800/70 text-[11px] font-medium text-zinc-600 dark:text-zinc-400">
            {typeConfig.label}
          </span>

          {/* Mood Pill if exists */}
          {moodConfig && (
            <span className="text-[11px] text-zinc-400 dark:text-zinc-500">
              · {moodConfig.symbol}
            </span>
          )}

          {/* Indicators */}
          {entry.is_pinned && (
            <Pin className="w-3.5 h-3.5 text-rose-500 fill-rose-500 shrink-0" aria-label="Đã ghim" />
          )}
          {entry.is_favorite && (
            <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500 shrink-0" aria-label="Yêu thích" />
          )}
        </div>

        {/* Action Menu (···) */}
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            aria-label="Tùy chọn nhật ký"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>

          <AnimatePresence>
            {menuOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -4 }}
                transition={{ duration: 0.12 }}
                className="absolute right-0 mt-1 w-44 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-lg py-1 z-30 text-xs"
              >
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onEdit();
                  }}
                  className="w-full px-3 py-2 text-left text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center gap-2"
                >
                  <Edit3 className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Chỉnh sửa</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onTogglePin();
                  }}
                  className="w-full px-3 py-2 text-left text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center gap-2"
                >
                  <Pin className="w-3.5 h-3.5 text-zinc-400" />
                  <span>{entry.is_pinned ? 'Bỏ ghim' : 'Ghim bài viết'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onToggleFavorite();
                  }}
                  className="w-full px-3 py-2 text-left text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center gap-2"
                >
                  <Star className="w-3.5 h-3.5 text-zinc-400" />
                  <span>{entry.is_favorite ? 'Bỏ thích' : 'Thêm vào yêu thích'}</span>
                </button>

                <div className="h-[1px] bg-zinc-100 dark:bg-zinc-800 my-1" />

                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onDelete();
                  }}
                  className="w-full px-3 py-2 text-left text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 flex items-center gap-2"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Xóa trang này</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Entry Title if present */}
      {entry.title && (
        <h3 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-2 tracking-tight">
          {entry.title}
        </h3>
      )}

      {/* Entry Content Body */}
      <div
        className={`leading-relaxed text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap ${
          isLetter
            ? 'font-serif text-sm sm:text-base pl-3 border-l-2 border-rose-300 dark:border-rose-700/60 italic text-zinc-800 dark:text-zinc-200 my-3'
            : 'text-xs sm:text-sm'
        }`}
      >
        {entry.content}
      </div>

      {/* Photos Grid */}
      {entry.photos && entry.photos.length > 0 && (
        <div className="mt-4">
          <JournalPhotoGrid
            photos={entry.photos}
            onPhotoClick={(index) => onOpenGallery(entry.photos!, index)}
          />
        </div>
      )}

      {/* Entry Footer: Location & Tags */}
      {(entry.location?.name || (entry.tags && entry.tags.length > 0)) && (
        <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800/40 flex items-center gap-3 flex-wrap text-[11px] text-zinc-400 dark:text-zinc-500">
          {entry.location?.name && (
            <span className="flex items-center gap-1 text-zinc-600 dark:text-zinc-400">
              <MapPin className="w-3.5 h-3.5 text-zinc-400" />
              <span>{entry.location.name}</span>
            </span>
          )}

          {entry.tags && entry.tags.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap">
              {entry.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800/50 text-zinc-500 dark:text-zinc-400"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </article>
  );
}

// ==========================================
// 4. PHOTO GRID COMPONENT
// ==========================================

interface JournalPhotoGridProps {
  photos: string[];
  onPhotoClick: (index: number) => void;
}

function JournalPhotoGrid({ photos, onPhotoClick }: JournalPhotoGridProps) {
  const count = photos.length;

  if (count === 1) {
    return (
      <div
        onClick={() => onPhotoClick(0)}
        className="relative overflow-hidden rounded-xl bg-zinc-100 dark:bg-zinc-800 max-h-80 cursor-pointer group"
      >
        <img
          src={photos[0]}
          alt="Journal memory"
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-102"
        />
      </div>
    );
  }

  if (count === 2) {
    return (
      <div className="grid grid-cols-2 gap-2 max-h-64">
        {photos.map((src, i) => (
          <div
            key={i}
            onClick={() => onPhotoClick(i)}
            className="relative overflow-hidden rounded-xl bg-zinc-100 dark:bg-zinc-800 aspect-video sm:aspect-square cursor-pointer group"
          >
            <img
              src={src}
              alt={`Photo ${i + 1}`}
              loading="lazy"
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-102"
            />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-2 max-h-56">
      {photos.slice(0, 3).map((src, i) => {
        const isLast = i === 2 && count > 3;
        const remaining = count - 3;

        return (
          <div
            key={i}
            onClick={() => onPhotoClick(i)}
            className="relative overflow-hidden rounded-xl bg-zinc-100 dark:bg-zinc-800 aspect-square cursor-pointer group"
          >
            <img
              src={src}
              alt={`Photo ${i + 1}`}
              loading="lazy"
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-102"
            />
            {isLast && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white font-bold text-sm">
                +{remaining}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ==========================================
// 5. PHOTO LIGHTBOX MODAL
// ==========================================

interface JournalPhotoLightboxProps {
  gallery: { photos: string[]; index: number };
  onClose: () => void;
}

function JournalPhotoLightbox({ gallery, onClose }: JournalPhotoLightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(gallery.index);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') nextPhoto();
      if (e.key === 'ArrowLeft') prevPhoto();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, gallery.photos.length]);

  const nextPhoto = () => {
    if (currentIndex < gallery.photos.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const prevPhoto = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 select-none"
      onClick={onClose}
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute top-4 right-4 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors z-20"
      >
        <X className="w-5 h-5" />
      </button>

      {/* Image Display */}
      <div
        className="relative max-w-4xl max-h-[85vh] flex items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={gallery.photos[currentIndex]}
          alt={`Gallery item ${currentIndex + 1}`}
          className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
        />

        {/* Navigation Arrows */}
        {gallery.photos.length > 1 && (
          <>
            {currentIndex > 0 && (
              <button
                type="button"
                onClick={prevPhoto}
                className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/40 text-white hover:bg-black/60 transition"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
            )}

            {currentIndex < gallery.photos.length - 1 && (
              <button
                type="button"
                onClick={nextPhoto}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/40 text-white hover:bg-black/60 transition"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            )}

            <div className="absolute bottom-[-32px] text-zinc-400 text-xs font-mono">
              {currentIndex + 1} / {gallery.photos.length}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ==========================================
// 6. JOURNAL COMPOSER MODAL (WITH AI AGENT)
// ==========================================

interface JournalComposerModalProps {
  initialData: JournalEntry | null;
  authors: JournalAuthor[];
  onClose: () => void;
  onSave: (entryData: Omit<JournalEntry, 'id' | 'created_at'>, existingId?: string) => void;
}

function JournalComposerModal({ initialData, authors, onClose, onSave }: JournalComposerModalProps) {
  // Form State
  const [authorId, setAuthorId] = useState(initialData?.author_id || authors[0]?.id || 'author-1');
  const [type, setType] = useState<JournalEntryType>(initialData?.type || 'memory');
  const [mood, setMood] = useState(initialData?.mood || 'peaceful');
  const [title, setTitle] = useState(initialData?.title || '');
  const [content, setContent] = useState(initialData?.content || '');
  const [date, setDate] = useState(initialData?.date || new Date().toISOString().split('T')[0]);
  const [photos, setPhotos] = useState<string[]>(initialData?.photos || []);
  const [locationName, setLocationName] = useState(initialData?.location?.name || '');
  const [tagsInput, setTagsInput] = useState(initialData?.tags?.join(', ') || '');
  const [isPinned, setIsPinned] = useState(initialData?.is_pinned || false);
  const [isFavorite, setIsFavorite] = useState(initialData?.is_favorite || false);

  const [newPhotoUrl, setNewPhotoUrl] = useState('');
  const [showPhotoInput, setShowPhotoInput] = useState(false);

  // Journal Agent Suggestion State
  const [agentSuggestion, setAgentSuggestion] = useState<{
    suggestedType?: JournalEntryType;
    suggestedMood?: string;
    suggestedTitle?: string;
    suggestedTags?: string[];
    suggestedLocation?: string;
  } | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Restore draft if composing fresh entry
  useEffect(() => {
    if (!initialData) {
      const draft = localStorage.getItem(DRAFT_KEY);
      if (draft) {
        try {
          const p: JournalDraft = JSON.parse(draft);
          if (p.content) {
            setAuthorId(p.author_id || authors[0].id);
            setType(p.type || 'memory');
            setTitle(p.title || '');
            setContent(p.content || '');
            setMood(p.mood || 'peaceful');
            setPhotos(p.photos || []);
            setLocationName(p.locationName || '');
            setTagsInput(p.tags || '');
          }
        } catch (e) {}
      }
    }
  }, [initialData, authors]);

  // Autosave draft on change (debounced)
  useEffect(() => {
    if (initialData) return; // Do not overwrite drafts when editing published entries

    const timer = setTimeout(() => {
      if (content.trim().length > 0 || title.trim().length > 0) {
        const draft: JournalDraft = {
          author_id: authorId,
          type,
          title,
          content,
          mood,
          photos,
          locationName,
          tags: tagsInput,
          updated_at: new Date().toISOString(),
        };
        localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
      }
    }, 800);

    return () => clearTimeout(timer);
  }, [authorId, type, title, content, mood, photos, locationName, tagsInput, initialData]);

  // Keyboard Escape Handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Journal Agent Classification & Suggestion Engine
  const runAgentAnalysis = () => {
    if (!content.trim()) return;
    setIsAnalyzing(true);

    setTimeout(() => {
      const lower = content.toLowerCase();
      let sType: JournalEntryType = type;
      let sMood = mood;
      let sTitle = title;
      const sTags: string[] = [];
      let sLocation = locationName;

      // Type heuristic
      if (lower.includes('thư') || lower.includes('gửi em') || lower.includes('gửi anh') || lower.includes('yêu em nhiều')) {
        sType = 'letter';
      } else if (lower.includes('cảm ơn') || lower.includes('biết ơn') || lower.includes('chu đáo')) {
        sType = 'gratitude';
      } else if (lower.includes('kỷ niệm') || lower.includes('lần đầu') || lower.includes('nhớ lại')) {
        sType = 'memory';
      } else if (lower.includes('cột mốc') || lower.includes('chính thức') || lower.includes('cầu hôn') || lower.includes('chuyển về')) {
        sType = 'milestone';
      }

      // Mood heuristic
      if (lower.includes('mưa') || lower.includes('bình yên') || lower.includes('ấm áp') || lower.includes('nhẹ nhàng')) {
        sMood = 'peaceful';
      } else if (lower.includes('vui') || lower.includes('cười') || lower.includes('hạnh phúc')) {
        sMood = 'happy';
      } else if (lower.includes('yêu') || lower.includes('ôm') || lower.includes('thương')) {
        sMood = 'loved';
      }

      // Tag extraction
      if (lower.includes('trà') || lower.includes('cafe') || lower.includes('cà phê')) sTags.push('quán quen');
      if (lower.includes('mưa')) sTags.push('ngày mưa');
      if (lower.includes('du lịch') || lower.includes('đà lạt') || lower.includes('biển')) sTags.push('chuyến đi');

      // Title suggestion if empty
      if (!sTitle) {
        const firstSentence = content.split(/[.\n!?]/)[0]?.trim();
        if (firstSentence && firstSentence.length <= 40) {
          sTitle = firstSentence;
        } else if (firstSentence) {
          sTitle = firstSentence.slice(0, 35) + '...';
        }
      }

      // Location extraction
      if (!sLocation) {
        if (lower.includes('đà lạt')) sLocation = 'Đà Lạt';
        if (lower.includes('hà nội')) sLocation = 'Hà Nội';
        if (lower.includes('quán cũ') || lower.includes('quán trà')) sLocation = 'Quán quen';
      }

      setAgentSuggestion({
        suggestedType: sType,
        suggestedMood: sMood,
        suggestedTitle: sTitle,
        suggestedTags: sTags,
        suggestedLocation: sLocation,
      });

      setIsAnalyzing(false);
    }, 450);
  };

  const applyAgentSuggestions = () => {
    if (!agentSuggestion) return;
    if (agentSuggestion.suggestedType) setType(agentSuggestion.suggestedType);
    if (agentSuggestion.suggestedMood) setMood(agentSuggestion.suggestedMood);
    if (agentSuggestion.suggestedTitle && !title) setTitle(agentSuggestion.suggestedTitle);
    if (agentSuggestion.suggestedLocation && !locationName) setLocationName(agentSuggestion.suggestedLocation);
    if (agentSuggestion.suggestedTags && agentSuggestion.suggestedTags.length > 0) {
      const existing = tagsInput.split(',').map((s) => s.trim()).filter(Boolean);
      const combined = Array.from(new Set([...existing, ...agentSuggestion.suggestedTags]));
      setTagsInput(combined.join(', '));
    }
    setAgentSuggestion(null);
  };

  const handleAddPhoto = () => {
    if (!newPhotoUrl.trim()) return;
    setPhotos([...photos, newPhotoUrl.trim()]);
    setNewPhotoUrl('');
    setShowPhotoInput(false);
  };

  const handleRemovePhoto = (index: number) => {
    setPhotos(photos.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    const selectedAuthor = authors.find((a) => a.id === authorId) || authors[0];
    const tagsArray = tagsInput
      .split(',')
      .map((t) => t.trim().replace(/^#/, ''))
      .filter(Boolean);

    onSave(
      {
        author_id: authorId,
        author_name: selectedAuthor.name,
        type,
        mood,
        title: title.trim() || undefined,
        content: content.trim(),
        date,
        photos: photos.length > 0 ? photos : undefined,
        location: locationName.trim() ? { name: locationName.trim() } : undefined,
        tags: tagsArray.length > 0 ? tagsArray : undefined,
        is_pinned: isPinned,
        is_favorite: isFavorite,
      },
      initialData?.id
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 12 }}
        transition={{ duration: 0.18 }}
        className="w-full max-w-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100 font-serif">
              {initialData ? 'Chỉnh sửa trang nhật ký' : 'Viết trang mới'}
            </h2>
            <p className="text-[11px] text-zinc-400">Ghi lại cảm xúc và khoảnh khắc đáng nhớ</p>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={runAgentAnalysis}
              disabled={isAnalyzing || !content.trim()}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/40 disabled:opacity-40 transition-colors"
              title="Gợi ý thông minh tự động phân loại & gắn thẻ"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isAnalyzing ? 'Đang đọc...' : 'Gợi ý AI'}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Body (Scrollable) */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 flex-1 text-xs sm:text-sm">
          {/* Agent Suggestion Banner */}
          {agentSuggestion && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="p-3.5 rounded-2xl bg-rose-500/[0.06] border border-rose-500/20 space-y-2 text-xs"
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" /> Gợi ý cấu trúc cho bài viết
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={applyAgentSuggestions}
                    className="font-semibold text-rose-600 dark:text-rose-300 underline"
                  >
                    Áp dụng
                  </button>
                  <button
                    type="button"
                    onClick={() => setAgentSuggestion(null)}
                    className="text-zinc-400 hover:text-zinc-600"
                  >
                    Bỏ qua
                  </button>
                </div>
              </div>
              <div className="text-[11px] text-zinc-600 dark:text-zinc-400 grid grid-cols-2 gap-2">
                <div>Loại: <span className="font-medium text-zinc-900 dark:text-zinc-100">{ENTRY_TYPES.find(t => t.id === agentSuggestion.suggestedType)?.label}</span></div>
                <div>Tâm trạng: <span className="font-medium text-zinc-900 dark:text-zinc-100">{MOODS.find(m => m.id === agentSuggestion.suggestedMood)?.symbol}</span></div>
                {agentSuggestion.suggestedTitle && <div className="col-span-2">Tiêu đề: <span className="font-medium text-zinc-900 dark:text-zinc-100">{agentSuggestion.suggestedTitle}</span></div>}
              </div>
            </motion.div>
          )}

          {/* Author Selector & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 mb-1.5 uppercase tracking-wider">
                Người viết
              </label>
              <div className="flex gap-2">
                {authors.map((a) => (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => setAuthorId(a.id)}
                    className={`flex-1 py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                      authorId === a.id
                        ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 border-transparent'
                        : 'bg-zinc-50 dark:bg-zinc-800/40 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800'
                    }`}
                  >
                    <span className="w-4 h-4 rounded-full bg-zinc-300 dark:bg-zinc-700 text-zinc-800 dark:text-zinc-200 flex items-center justify-center text-[9px]">
                      {a.name.charAt(0)}
                    </span>
                    <span>{a.name}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 mb-1.5 uppercase tracking-wider">
                Ngày viết
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full py-2 px-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-800 text-xs font-mono text-zinc-900 dark:text-zinc-100 outline-none focus:border-zinc-400"
              />
            </div>
          </div>

          {/* Entry Type & Mood Strip */}
          <div className="space-y-3">
            <div>
              <label className="block text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 mb-1.5 uppercase tracking-wider">
                Loại nhật ký
              </label>
              <div className="flex gap-1.5 flex-wrap">
                {ENTRY_TYPES.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setType(item.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${
                      type === item.id
                        ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                        : 'bg-zinc-100 dark:bg-zinc-800/60 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800'
                    }`}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 mb-1.5 uppercase tracking-wider">
                Cảm xúc / Tâm trạng
              </label>
              <div className="flex gap-1.5 flex-wrap">
                {MOODS.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setMood(m.id)}
                    className={`px-2.5 py-1 rounded-lg text-xs transition-all ${
                      mood === m.id
                        ? 'bg-rose-100 text-rose-900 dark:bg-rose-950/60 dark:text-rose-300 font-semibold'
                        : 'bg-zinc-100 dark:bg-zinc-800/40 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200'
                    }`}
                  >
                    {m.symbol}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Title (Optional) */}
          <div>
            <label className="block text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 mb-1 uppercase tracking-wider">
              Tiêu đề (Tùy chọn)
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="VD: Chiều mưa dưới hiên quán cũ..."
              className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-800 rounded-xl text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 outline-none focus:border-zinc-400"
            />
          </div>

          {/* Main Content */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                Nội dung *
              </label>
              <span className="text-[10px] text-zinc-400 font-mono">{content.length} ký tự</span>
            </div>
            <textarea
              required
              rows={6}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Kể lại khoảnh khắc hoặc những điều bạn muốn giữ lại..."
              className="w-full p-4 bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 outline-none focus:border-zinc-400 leading-relaxed resize-none"
            />
          </div>

          {/* Photos Management */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                Hình ảnh ({photos.length})
              </label>
              <button
                type="button"
                onClick={() => setShowPhotoInput(!showPhotoInput)}
                className="text-xs text-rose-600 dark:text-rose-400 font-semibold hover:underline"
              >
                + Thêm URL ảnh
              </button>
            </div>

            {showPhotoInput && (
              <div className="flex gap-2 mb-3">
                <input
                  type="url"
                  value={newPhotoUrl}
                  onChange={(e) => setNewPhotoUrl(e.target.value)}
                  placeholder="Dán link ảnh (https://...)"
                  className="flex-1 px-3 py-2 bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs outline-none"
                />
                <button
                  type="button"
                  onClick={handleAddPhoto}
                  className="px-3 py-2 bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 rounded-xl text-xs font-semibold"
                >
                  Thêm
                </button>
              </div>
            )}

            {photos.length > 0 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {photos.map((url, idx) => (
                  <div key={idx} className="relative w-16 h-16 rounded-xl overflow-hidden bg-zinc-100 shrink-0 group">
                    <img src={url} alt="" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => handleRemovePhoto(idx)}
                      className="absolute inset-0 bg-black/50 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Location & Tags */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 mb-1 uppercase tracking-wider">
                Địa điểm
              </label>
              <input
                type="text"
                value={locationName}
                onChange={(e) => setLocationName(e.target.value)}
                placeholder="VD: Quán Cũ, Hồ Tây..."
                className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 mb-1 uppercase tracking-wider">
                Thẻ (phân cách bằng dấu phẩy)
              </label>
              <input
                type="text"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="henho, kyniem, dulich"
                className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs outline-none"
              />
            </div>
          </div>

          {/* Pin & Favorite Toggles */}
          <div className="flex items-center gap-4 pt-2">
            <label className="flex items-center gap-2 cursor-pointer text-xs text-zinc-600 dark:text-zinc-300">
              <input
                type="checkbox"
                checked={isPinned}
                onChange={(e) => setIsPinned(e.target.checked)}
                className="rounded text-rose-500 focus:ring-0"
              />
              <span>Ghim trang này lên đầu</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer text-xs text-zinc-600 dark:text-zinc-300">
              <input
                type="checkbox"
                checked={isFavorite}
                onChange={(e) => setIsFavorite(e.target.checked)}
                className="rounded text-amber-500 focus:ring-0"
              />
              <span>Đánh dấu yêu thích</span>
            </label>
          </div>

          {/* Modal Footer */}
          <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={!content.trim()}
              className="px-5 py-2 rounded-xl bg-zinc-900 text-white dark:bg-rose-600 dark:hover:bg-rose-500 text-xs font-semibold disabled:opacity-50 transition shadow-sm"
            >
              {initialData ? 'Lưu thay đổi' : 'Lưu nhật ký'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

// ==========================================
// 7. JOURNAL ANSWER / MEMORY RETRIEVAL DRAWER
// ==========================================

interface JournalAnswerDrawerProps {
  entries: JournalEntry[];
  onClose: () => void;
  onSelectEntry: (entry: JournalEntry) => void;
}

function JournalAnswerDrawer({ entries, onClose, onSelectEntry }: JournalAnswerDrawerProps) {
  const [query, setQuery] = useState('');
  const [answer, setAnswer] = useState<{
    text: string;
    citedEntries: JournalEntry[];
  } | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  const sampleQuestions = [
    'Lần đầu tụi mình đi uống trà ở đâu?',
    'Những kỷ niệm liên quan đến trời mưa?',
    'Lần gần nhất em viết thư cho anh?',
    'Những điều em từng biết ơn?',
  ];

  const handleAsk = (q: string) => {
    const questionToAsk = q || query;
    if (!questionToAsk.trim()) return;

    setIsSearching(true);
    setAnswer(null);

    setTimeout(() => {
      const lower = questionToAsk.toLowerCase();

      // Retrieve candidate matching entries
      const matched = entries.filter((e) => {
        const text = `${e.title || ''} ${e.content} ${e.tags?.join(' ') || ''} ${e.location?.name || ''}`.toLowerCase();
        
        if (lower.includes('trà') && text.includes('trà')) return true;
        if (lower.includes('mưa') && text.includes('mưa')) return true;
        if (lower.includes('thư') && (e.type === 'letter' || text.includes('thư'))) return true;
        if (lower.includes('biết ơn') && (e.type === 'gratitude' || text.includes('biết ơn') || text.includes('cảm ơn'))) return true;
        if (lower.includes('đà lạt') && text.includes('đà lạt')) return true;

        // generic word match
        const words = lower.split(' ').filter((w) => w.length > 2);
        return words.some((w) => text.includes(w));
      });

      if (matched.length > 0) {
        const first = matched[0];
        let synthesis = `Dựa trên ${matched.length} trang nhật ký tìm thấy:\n\n`;

        if (lower.includes('mưa')) {
          synthesis += `Hai bạn có những kỷ niệm rất đẹp về ngày mưa, tiêu biểu là vào ngày ${first.date} khi "${first.content.slice(0, 80)}..."`;
        } else if (lower.includes('thư')) {
          synthesis += `Lá thư gần nhất được viết vào ngày ${first.date} bởi ${first.author_name}: "${first.content.slice(0, 90)}..."`;
        } else if (lower.includes('trà')) {
          synthesis += `Kỷ niệm uống trà được ghi lại vào ngày ${first.date} tại ${first.location?.name || 'quán quen'}.`;
        } else {
          synthesis += `Tìm thấy kỷ niệm liên quan vào ngày ${first.date}: "${first.content.slice(0, 90)}..."`;
        }

        setAnswer({
          text: synthesis,
          citedEntries: matched.slice(0, 3),
        });
      } else {
        setAnswer({
          text: `Không tìm thấy trang nhật ký nào khớp chính xác với câu hỏi "${questionToAsk}". Bạn thử tìm với từ khóa khác như "quán trà", "mưa", "chuyến đi"... xem sao nhé!`,
          citedEntries: [],
        });
      }

      setIsSearching(false);
    }, 400);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex justify-end"
      onClick={onClose}
    >
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 26, stiffness: 260 }}
        className="w-full max-w-md bg-white dark:bg-zinc-900 h-full shadow-2xl border-l border-zinc-200 dark:border-zinc-800 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageCircleQuestion className="w-5 h-5 text-rose-500" />
            <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 font-serif">Hỏi kỷ niệm nhật ký</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 flex-1 overflow-y-auto space-y-5 text-xs">
          <div>
            <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-2">
              Đặt câu hỏi về quá trình bên nhau
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAsk(query)}
                placeholder="VD: Lần đầu đi trà chiều ở đâu?..."
                className="flex-1 px-3 py-2 bg-zinc-100 dark:bg-zinc-800 rounded-xl outline-none text-zinc-900 dark:text-zinc-100"
              />
              <button
                type="button"
                onClick={() => handleAsk(query)}
                disabled={isSearching || !query.trim()}
                className="px-3 py-2 bg-zinc-900 text-white dark:bg-rose-600 rounded-xl font-semibold disabled:opacity-40"
              >
                Hỏi
              </button>
            </div>
          </div>

          {/* Sample Prompts */}
          <div>
            <span className="text-[11px] text-zinc-400 block mb-1.5">Gợi ý câu hỏi nhanh:</span>
            <div className="flex flex-col gap-1.5">
              {sampleQuestions.map((q, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setQuery(q);
                    handleAsk(q);
                  }}
                  className="text-left px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 transition"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          {/* Answer Card */}
          {isSearching && (
            <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 text-center text-zinc-400">
              Đang tra cứu các trang ký ức...
            </div>
          )}

          {answer && !isSearching && (
            <div className="p-4 rounded-2xl bg-rose-500/[0.05] border border-rose-500/20 space-y-3">
              <div className="font-semibold text-zinc-900 dark:text-zinc-100 leading-relaxed whitespace-pre-wrap">
                {answer.text}
              </div>

              {answer.citedEntries.length > 0 && (
                <div className="pt-2 border-t border-rose-500/10 space-y-2">
                  <span className="text-[10px] uppercase tracking-wider font-semibold text-rose-500">
                    Trang nhật ký liên quan:
                  </span>
                  {answer.citedEntries.map((e) => (
                    <div
                      key={e.id}
                      onClick={() => onSelectEntry(e)}
                      className="p-2.5 rounded-xl bg-white dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 cursor-pointer hover:border-rose-400 transition flex items-center justify-between"
                    >
                      <div className="truncate mr-2">
                        <div className="font-semibold text-zinc-900 dark:text-zinc-100">{e.title || e.date}</div>
                        <div className="text-zinc-400 truncate text-[11px]">{e.content}</div>
                      </div>
                      <span className="text-[10px] font-mono text-zinc-400 shrink-0">{e.author_name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

// ==========================================
// 8. ELEGANT EMPTY STATE
// ==========================================

interface JournalEmptyStateProps {
  hasFilter: boolean;
  onResetFilters: () => void;
  onNewEntry: () => void;
}

function JournalEmptyState({ hasFilter, onResetFilters, onNewEntry }: JournalEmptyStateProps) {
  if (hasFilter) {
    return (
      <div className="py-16 text-center space-y-3">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Không tìm thấy trang nhật ký nào phù hợp với bộ lọc hiện tại.
        </p>
        <button
          type="button"
          onClick={onResetFilters}
          className="text-xs font-semibold text-rose-600 dark:text-rose-400 underline underline-offset-2"
        >
          Xóa toàn bộ bộ lọc
        </button>
      </div>
    );
  }

  return (
    <div className="py-20 text-center max-w-sm mx-auto space-y-4">
      <div className="w-12 h-12 mx-auto rounded-2xl bg-zinc-100 dark:bg-zinc-800/60 flex items-center justify-center text-zinc-400">
        <BookMarked className="w-5 h-5 opacity-70" />
      </div>
      <div>
        <h3 className="text-base font-serif font-bold text-zinc-800 dark:text-zinc-200">
          Chưa có trang nhật ký nào
        </h3>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed">
          Hãy lưu lại một điều bình dị nhưng đáng nhớ của hai đứa ngày hôm nay.
        </p>
      </div>
      <button
        type="button"
        onClick={onNewEntry}
        className="inline-flex items-center gap-1.5 px-4 py-2 bg-zinc-900 text-white dark:bg-rose-600 rounded-xl text-xs font-semibold shadow-sm hover:opacity-90 transition"
      >
        <Plus className="w-3.5 h-3.5" />
        <span>Viết trang đầu tiên</span>
      </button>
    </div>
  );
}