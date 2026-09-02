import React, { useState, useEffect, useRef, useCallback, useId } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import {
  X,
  Palette,
  Type,
  Image as ImageIcon,
  User,
  Layout,
  Navigation as NavIcon,
  Sliders,
  History,
  Sparkles,
  Download,
  Upload,
  RotateCcw,
  Check,
  Trash2,
  SlidersHorizontal,
  FolderOpen,
  AlertCircle,
  LucideIcon,
} from 'lucide-react';
import { usePersonalization } from '../../contexts/PersonalizationContext';
import {
  type SurfaceStyle,
  type NavigationStyle,
  type BackgroundType,
} from '../../types/personalization';

// ============================================================================
// TAB CONFIGURATION & METADATA
// ============================================================================

export interface StudioTabItem {
  id: string;
  label: string;
  mobileLabel: string;
  icon: LucideIcon;
  description: string;
}

const STUDIO_TABS: readonly StudioTabItem[] = [
  {
    id: 'presets',
    label: 'Mẫu Thiết Kế (Presets)',
    mobileLabel: 'Mẫu',
    icon: Sparkles,
    description: 'Chuyển đổi toàn bộ phối màu, phông chữ, góc bo và hình nền một chạm.',
  },
  {
    id: 'identity',
    label: 'Nhận Diện & Hồ Sơ',
    mobileLabel: 'Hồ Sơ',
    icon: User,
    description: 'Tùy chỉnh thông tin hiển thị, avatar, câu trích dẫn và huy hiệu.',
  },
  {
    id: 'colors',
    label: 'Bảng Màu & Bề Mặt',
    mobileLabel: 'Màu',
    icon: Palette,
    description: 'Tinh chỉnh từng mã màu hệ thống, phong cách bề mặt và hạt điện ảnh.',
  },
  {
    id: 'typography',
    label: 'Kiểu Chữ & Góc Bo',
    mobileLabel: 'Chữ',
    icon: Type,
    description: 'Chọn phông chữ yêu thích, tỷ lệ tiêu đề và độ cong bo viền.',
  },
  {
    id: 'background',
    label: 'Hệ Thống Nền',
    mobileLabel: 'Nền',
    icon: ImageIcon,
    description: 'Tùy biến hình nền, GIF, CSS gradient, độ mờ và độ sáng hậu cảnh.',
  },
  {
    id: 'workspaces',
    label: 'Không Gian Làm Việc',
    mobileLabel: 'Workspace',
    icon: Layout,
    description: 'Tạo và chuyển đổi giữa các không gian riêng biệt.',
  },
  {
    id: 'navigation',
    label: 'Thanh Điều Hướng',
    mobileLabel: 'Nav',
    icon: NavIcon,
    description: 'Lựa chọn phong cách điều hướng: Đảo nổi, Thanh đầu trang, Viên thuốc.',
  },
  {
    id: 'rules',
    label: 'Quy Tắc Tự Động',
    mobileLabel: 'Rules',
    icon: Sliders,
    description: 'Điều kiện thông minh tự kích hoạt chế độ tối hoặc thu gọn giao diện.',
  },
  {
    id: 'history',
    label: 'Lịch Sử & Khôi Phục',
    mobileLabel: 'Lịch Sử',
    icon: History,
    description: 'Hoàn tác, làm lại hoặc khôi phục cài đặt mặc định an toàn.',
  },
] as const;

// Token mapping for Tab 3 (Colors)
const COLOR_TOKENS = [
  { key: 'background' as const, label: 'Nền Chính (Bg)' },
  { key: 'surface' as const, label: 'Bề Mặt Thẻ (Surface)' },
  { key: 'surfaceElevated' as const, label: 'Bề Mặt Nổi' },
  { key: 'accent' as const, label: 'Màu Nhấn (Accent)' },
  { key: 'primary' as const, label: 'Màu Chính (Primary)' },
  { key: 'text' as const, label: 'Chữ Chính (Text)' },
  { key: 'textMuted' as const, label: 'Chữ Phụ (Muted)' },
  { key: 'border' as const, label: 'Đường Viền (Border)' },
  { key: 'success' as const, label: 'Thành Công (Success)' },
] as const;

export default function AppearanceStudioModal() {
  const {
    isStudioOpen,
    setIsStudioOpen,
    activeStudioTab,
    setActiveStudioTab,
    appearance,
    updateAppearance,
    updateColors,
    updateTypography,
    updateShape,
    background,
    updateBackground,
    identity,
    updateIdentity,
    workspaces,
    activeWorkspaceId,
    switchWorkspace,
    createWorkspace,
    deleteWorkspace,
    navigation,
    updateNavigation,
    presets,
    applyPreset,
    saveCurrentAsPreset,
    exportDesignJson,
    importDesignJson,
    undo,
    redo,
    canUndo,
    canRedo,
    resetAllPersonalization,
    setIsAssetLibraryOpen,
    isEditMode,
    setIsEditMode,
  } = usePersonalization();

  // Local state
  const [presetNameInput, setPresetNameInput] = useState('');
  const [importJsonText, setImportJsonText] = useState('');
  const [copyFeedback, setCopyFeedback] = useState<'idle' | 'success' | 'error'>('idle');
  const [importError, setImportError] = useState<string | null>(null);
  const [newWsName, setNewWsName] = useState('');

  // Refs & A11y
  const mobileTabRailRef = useRef<HTMLDivElement>(null);
  const activeMobileTabRef = useRef<HTMLButtonElement>(null);
  const modalContainerRef = useRef<HTMLDivElement>(null);
  const feedbackTimerRef = useRef<NodeJS.Timeout | null>(null);
  const modalHeadingId = useId();
  const shouldReduceMotion = useReducedMotion();

  // Dọn dẹp timer khi unmount
  useEffect(() => {
    return () => {
      if (feedbackTimerRef.current) {
        clearTimeout(feedbackTimerRef.current);
      }
    };
  }, []);

  // Xử lý phím ESC để đóng Modal an toàn
  useEffect(() => {
    if (!isStudioOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        setIsStudioOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isStudioOpen, setIsStudioOpen]);

  // Tự động cuộn Mobile Tab đang kích hoạt vào trung tâm màn hình mượt mà
  useEffect(() => {
    if (isStudioOpen && activeMobileTabRef.current && mobileTabRailRef.current) {
      activeMobileTabRef.current.scrollIntoView({
        behavior: shouldReduceMotion ? 'auto' : 'smooth',
        block: 'nearest',
        inline: 'center',
      });
    }
  }, [activeStudioTab, isStudioOpen, shouldReduceMotion]);

  // Safe JSON Export với Clipboard API & Fallback
  const handleExportJson = useCallback(async () => {
    try {
      const json = exportDesignJson();
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(json);
      } else {
        // Fallback cho trình duyệt cũ hoặc insecure context
        const textArea = document.createElement('textarea');
        textArea.value = json;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setCopyFeedback('success');
    } catch {
      setCopyFeedback('error');
    }

    if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
    feedbackTimerRef.current = setTimeout(() => {
      setCopyFeedback('idle');
    }, 2800);
  }, [exportDesignJson]);

  // Safe JSON Import với Validation
  const handleImportJson = useCallback(() => {
    setImportError(null);
    const trimmed = importJsonText.trim();
    if (!trimmed) return;

    try {
      // Sơ kiểm tính hợp lệ của JSON trước khi truyền sang context
      JSON.parse(trimmed);
      const success = importDesignJson(trimmed);
      if (success) {
        setImportJsonText('');
      } else {
        setImportError('Cấu trúc JSON không khớp với schema thiết kế.');
      }
    } catch {
      setImportError('Mã JSON không đúng định dạng. Vui lòng kiểm tra lại.');
    }
  }, [importJsonText, importDesignJson]);

  // Xóa Workspace với xác nhận an toàn
  const handleDeleteWorkspace = useCallback(
    (id: string, name: string) => {
      if (window.confirm(`Bạn có chắc muốn xóa không gian làm việc "${name}"?`)) {
        deleteWorkspace(id);
      }
    },
    [deleteWorkspace]
  );

  // Khôi phục cài đặt gốc an toàn
  const handleResetAll = useCallback(() => {
    if (
      window.confirm(
        'Bạn có chắc chắn muốn khôi phục toàn bộ giao diện và bố cục về trạng thái mặc định ban đầu?'
      )
    ) {
      resetAllPersonalization();
    }
  }, [resetAllPersonalization]);

  // Motion Variants
  const modalVariants = {
    hidden: {
      opacity: 0,
      scale: shouldReduceMotion ? 1 : 0.97,
      y: shouldReduceMotion ? 0 : 16,
    },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: { duration: 0.22, ease: [0.16, 1, 0.3, 1] },
    },
    exit: {
      opacity: 0,
      scale: shouldReduceMotion ? 1 : 0.97,
      y: shouldReduceMotion ? 0 : 12,
      transition: { duration: 0.16, ease: 'easeIn' },
    },
  };

  const contentTabVariants = {
    initial: { opacity: 0, y: shouldReduceMotion ? 0 : 6 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.18, ease: 'easeOut' } },
    exit: { opacity: 0, transition: { duration: 0.1 } },
  };

  return (
    <AnimatePresence>
      {isStudioOpen && (
        <div
          className="fixed inset-0 z-[75] flex items-end sm:items-center justify-center p-0 sm:p-4 md:p-6 bg-black/80 backdrop-blur-xl overscroll-none"
          role="dialog"
          aria-modal="true"
          aria-labelledby={modalHeadingId}
        >
          {/* Backdrop Touch Dismiss */}
          <div
            className="absolute inset-0 -z-10 cursor-pointer"
            onClick={() => setIsStudioOpen(false)}
            aria-hidden="true"
          />

          <motion.div
            ref={modalContainerRef}
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="bg-[#141417] border-t sm:border border-white/15 rounded-t-3xl sm:rounded-3xl w-full max-w-5xl h-[100dvh] sm:h-[92vh] max-h-[100dvh] sm:max-h-[920px] flex flex-col shadow-2xl overflow-hidden relative text-zinc-100 pb-[env(safe-area-inset-bottom)] sm:pb-0"
          >
            {/* ============================================================ */}
            {/* 1. TOP HEADER (Responsive & Safe)                            */}
            {/* ============================================================ */}
            <header className="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-white/10 flex items-center justify-between bg-zinc-900/95 backdrop-blur-xl shrink-0 z-10 pt-[max(0.875rem,env(safe-area-inset-top))] sm:pt-4">
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl gradient-accent flex items-center justify-center text-white shadow-lg shrink-0"
                  aria-hidden="true"
                >
                  <SlidersHorizontal className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h1
                      id={modalHeadingId}
                      className="text-base sm:text-lg font-bold font-serif tracking-tight truncate text-zinc-100"
                    >
                      Studio
                    </h1>
                    <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-white/10 text-zinc-300 border border-white/10 shrink-0">
                      v2.0
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 truncate hidden sm:block">
                    Tùy biến giao diện, phối màu và trải nghiệm theo cá tính riêng
                  </p>
                </div>
              </div>

              {/* Action Controls */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsEditMode((prev) => !prev)}
                  aria-pressed={isEditMode}
                  className={`min-h-[38px] sm:min-h-[36px] px-3 sm:px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all flex items-center gap-1.5 select-none active:scale-95 ${
                    isEditMode
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm'
                      : 'bg-white/[0.05] text-zinc-300 border-white/10 hover:bg-white/10'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isEditMode ? 'bg-amber-400 animate-pulse' : 'bg-zinc-500'
                    }`}
                  />
                  {/* Label co giãn theo breakpoint */}
                  <span className="sm:hidden">{isEditMode ? 'Sửa ON' : 'Sửa'}</span>
                  <span className="hidden sm:inline">
                    {isEditMode ? 'Đang Sửa Bố Cục (ON)' : 'Bật Sửa Bố Cục'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsStudioOpen(false)}
                  aria-label="Đóng bảng điều khiển Studio"
                  className="min-h-[38px] min-w-[38px] sm:min-h-[36px] sm:min-w-[36px] flex items-center justify-center rounded-full hover:bg-white/10 text-zinc-400 hover:text-white transition active:scale-95"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </header>

            {/* ============================================================ */}
            {/* 2. STUDIO BODY CONTAINER (Flex-col mobile -> Flex-row desktop)*/}
            {/* ============================================================ */}
            <div className="flex flex-1 min-h-0 flex-col md:flex-row overflow-hidden relative">
              {/* --- DESKTOP SIDEBAR TABS (hidden on mobile) --- */}
              <aside
                className="hidden md:flex flex-col w-64 shrink-0 border-r border-white/10 p-3.5 space-y-1 bg-zinc-950/60 overflow-y-auto overscroll-contain select-none"
                role="tablist"
                aria-orientation="vertical"
                aria-label="Danh mục cấu hình Studio"
              >
                {STUDIO_TABS.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeStudioTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      id={`desktop-tab-${tab.id}`}
                      role="tab"
                      type="button"
                      aria-selected={isActive}
                      aria-controls={`tabpanel-${tab.id}`}
                      onClick={() => setActiveStudioTab(tab.id)}
                      className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition-all text-left outline-none focus-visible:ring-2 focus-visible:ring-rose-500 ${
                        isActive
                          ? 'gradient-accent text-white shadow-md font-bold'
                          : 'text-zinc-400 hover:text-zinc-100 hover:bg-white/[0.04]'
                      }`}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      <span className="truncate">{tab.label}</span>
                    </button>
                  );
                })}
              </aside>

              {/* --- MOBILE HORIZONTAL TABS CAROUSEL (hidden on desktop) --- */}
              <nav
                ref={mobileTabRailRef}
                className="md:hidden flex items-center gap-1.5 p-2 px-3 border-b border-white/10 bg-zinc-950/90 overflow-x-auto overscroll-x-contain shrink-0 scrollbar-none snap-x select-none z-10"
                role="tablist"
                aria-orientation="horizontal"
                aria-label="Thanh điều hướng Studio Mobile"
              >
                {STUDIO_TABS.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeStudioTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      ref={isActive ? activeMobileTabRef : null}
                      id={`mobile-tab-${tab.id}`}
                      role="tab"
                      type="button"
                      aria-selected={isActive}
                      aria-controls={`tabpanel-${tab.id}`}
                      onClick={() => setActiveStudioTab(tab.id)}
                      className={`min-h-[40px] px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap shrink-0 snap-start flex items-center gap-1.5 transition-all outline-none focus-visible:ring-2 focus-visible:ring-rose-500 active:scale-95 ${
                        isActive
                          ? 'gradient-accent text-white shadow-md font-bold'
                          : 'bg-white/[0.04] text-zinc-400 border border-white/5 hover:text-zinc-200'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5 shrink-0" />
                      <span>{tab.mobileLabel}</span>
                    </button>
                  );
                })}
              </nav>

              {/* ============================================================ */}
              {/* 3. INSPECTOR CANVAS (Dedicated Scrollable Viewport)          */}
              {/* ============================================================ */}
              <main
                key={activeStudioTab}
                id={`tabpanel-${activeStudioTab}`}
                role="tabpanel"
                aria-labelledby={`mobile-tab-${activeStudioTab}`}
                className="flex-1 min-w-0 min-h-0 overflow-y-auto overscroll-contain p-4 sm:p-6 md:p-8 space-y-6 sm:space-y-8 bg-[#141417]/80 focus:outline-none"
                tabIndex={0}
              >
                <motion.div
                  variants={contentTabVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  className="space-y-6 max-w-3xl"
                >
                  {/* ======================================================== */}
                  {/* TAB 1: PRESETS & GALLERY                                 */}
                  {/* ======================================================== */}
                  {activeStudioTab === 'presets' && (
                    <>
                      <div>
                        <h2 className="text-base sm:text-lg font-bold font-serif mb-1 text-zinc-100">
                          Mẫu Thiết Kế Toàn Diện (Presets)
                        </h2>
                        <p className="text-xs text-zinc-400 leading-relaxed">
                          Chuyển đổi toàn bộ phối màu, phông chữ, góc bo và hình nền chỉ với một chạm mà không làm mất dữ liệu cá nhân.
                        </p>
                      </div>

                      {/* Presets Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-3.5">
                        {presets.map((preset) => {
                          const isCurrent = appearance.id === preset.id;
                          return (
                            <div
                              key={preset.id}
                              onClick={() => applyPreset(preset)}
                              role="button"
                              tabIndex={0}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                  e.preventDefault();
                                  applyPreset(preset);
                                }
                              }}
                              aria-pressed={isCurrent}
                              className={`p-4 rounded-2xl sm:rounded-3xl border transition-all cursor-pointer group hover-lift relative overflow-hidden flex flex-col justify-between select-none outline-none focus-visible:ring-2 focus-visible:ring-rose-500 ${
                                isCurrent
                                  ? 'ring-2 ring-rose-500 bg-white/[0.08] border-white/30'
                                  : 'bg-zinc-900/60 border-white/10 hover:border-white/20 hover:bg-zinc-900'
                              }`}
                            >
                              <div>
                                <div className="flex items-center justify-between mb-3">
                                  <div className="flex items-center gap-1.5" aria-hidden="true">
                                    <span
                                      className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full border border-white/20 shadow-sm shrink-0"
                                      style={{ backgroundColor: preset.appearance.colors.background }}
                                    />
                                    <span
                                      className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full border border-white/20 shadow-sm shrink-0"
                                      style={{ backgroundColor: preset.appearance.colors.accent }}
                                    />
                                    <span
                                      className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full border border-white/20 shadow-sm shrink-0"
                                      style={{ backgroundColor: preset.appearance.colors.surface }}
                                    />
                                    <span
                                      className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full border border-white/20 shadow-sm shrink-0"
                                      style={{ backgroundColor: preset.appearance.colors.text }}
                                    />
                                  </div>
                                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/10 text-zinc-300">
                                    {preset.category}
                                  </span>
                                </div>

                                <h3 className="text-sm font-bold text-zinc-100 group-hover:text-white">
                                  {preset.name}
                                </h3>
                                <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                                  {preset.description}
                                </p>
                              </div>

                              <div className="mt-4 flex items-center justify-between pt-2.5 border-t border-white/5">
                                <span className="text-[10px] font-mono text-zinc-500 truncate max-w-[65%]">
                                  {preset.tags.join(' • ')}
                                </span>
                                {isCurrent && (
                                  <span className="inline-flex items-center gap-1 text-[11px] text-rose-400 font-semibold font-mono shrink-0">
                                    <Check className="w-3.5 h-3.5" /> ĐANG DÙNG
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Save Current as Preset */}
                      <div className="glass p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-white/10 space-y-3">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-300 font-mono">
                          Lưu Thiết Kế Hiện Tại Thành Preset Mới
                        </h3>
                        <div className="flex flex-col min-[480px]:flex-row gap-2">
                          <input
                            type="text"
                            value={presetNameInput}
                            onChange={(e) => setPresetNameInput(e.target.value)}
                            placeholder="Tên thiết kế (VD: Giao Diện Mùa Thu)..."
                            className="flex-1 min-h-[44px] sm:min-h-[40px] px-4 py-2 bg-zinc-900 rounded-xl text-base sm:text-xs text-zinc-100 border border-white/10 outline-none focus:border-rose-500"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              if (presetNameInput.trim()) {
                                saveCurrentAsPreset(presetNameInput.trim());
                                setPresetNameInput('');
                              }
                            }}
                            disabled={!presetNameInput.trim()}
                            className="btn-pill gradient-accent min-h-[44px] sm:min-h-[40px] px-5 text-xs font-bold disabled:opacity-40 whitespace-nowrap active:scale-95"
                          >
                            Lưu Preset
                          </button>
                        </div>
                      </div>

                      {/* Cinematic Intro Replay Card */}
                      <div className="glass p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-[#E5A93C]/20 bg-[#E5A93C]/[0.02] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#E5A93C] font-mono">
                            <Sparkles className="w-4 h-4 shrink-0" />
                            <span>Trải Nghiệm Điện Ảnh Mở Đầu (Cinematic Intro)</span>
                          </div>
                          <p className="text-xs text-zinc-400 leading-relaxed">
                            Thưởng thức lại đoạn phim mở đầu "The World Is Being Assembled" với hiệu ứng chiều sâu không gian.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setIsStudioOpen(false);
                            window.dispatchEvent(new CustomEvent('replay-intro'));
                          }}
                          className="btn-pill shrink-0 border-[#E5A93C]/30 text-[#E5A93C] hover:bg-[#E5A93C]/10 min-h-[44px] sm:min-h-[38px] px-4 text-xs font-semibold w-full sm:w-auto text-center active:scale-95"
                        >
                          <Sparkles className="w-3.5 h-3.5" /> Xem Lại Intro
                        </button>
                      </div>

                      {/* Export / Import JSON Box */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
                        {/* Export */}
                        <div className="glass p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-white/10 space-y-2.5 flex flex-col justify-between">
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-zinc-300 font-mono">
                              <Download className="w-4 h-4 text-rose-400 shrink-0" />
                              <span>Xuất File Thiết Kế (Export)</span>
                            </div>
                            <p className="text-xs text-zinc-400 leading-relaxed">
                              Chia sẻ mã thiết kế thẩm mỹ của bạn với người khác mà không làm lộ dữ liệu riêng tư.
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={handleExportJson}
                            className={`btn-pill w-full text-center min-h-[44px] sm:min-h-[40px] text-xs font-bold transition-all active:scale-95 ${
                              copyFeedback === 'success'
                                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                                : copyFeedback === 'error'
                                ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                                : ''
                            }`}
                          >
                            {copyFeedback === 'success' && '✓ Đã Copy Vào Clipboard!'}
                            {copyFeedback === 'error' && '✕ Lỗi Copy, vui lòng thử lại!'}
                            {copyFeedback === 'idle' && 'Sao Chép Mã JSON'}
                          </button>
                        </div>

                        {/* Import */}
                        <div className="glass p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-white/10 space-y-2.5 flex flex-col justify-between">
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-zinc-300 font-mono">
                              <Upload className="w-4 h-4 text-rose-400 shrink-0" />
                              <span>Nhập File Thiết Kế (Import)</span>
                            </div>
                            <input
                              type="text"
                              value={importJsonText}
                              onChange={(e) => {
                                setImportJsonText(e.target.value);
                                if (importError) setImportError(null);
                              }}
                              placeholder="Dán mã JSON thiết kế vào đây..."
                              className="w-full min-h-[44px] sm:min-h-[40px] px-3 py-2 bg-zinc-900 rounded-xl text-base sm:text-xs text-zinc-100 border border-white/10 outline-none focus:border-rose-500"
                            />
                            {importError && (
                              <p className="text-[11px] text-rose-400 flex items-center gap-1 font-mono">
                                <AlertCircle className="w-3 h-3 shrink-0" /> {importError}
                              </p>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={handleImportJson}
                            disabled={!importJsonText.trim()}
                            className="btn-pill w-full text-center gradient-accent min-h-[44px] sm:min-h-[40px] text-xs font-bold disabled:opacity-40 active:scale-95"
                          >
                            Áp Dụng Thiết Kế
                          </button>
                        </div>
                      </div>
                    </>
                  )}

                  {/* ======================================================== */}
                  {/* TAB 2: IDENTITY & PROFILE                                */}
                  {/* ======================================================== */}
                  {activeStudioTab === 'identity' && (
                    <>
                      <div>
                        <h2 className="text-base sm:text-lg font-bold font-serif mb-1 text-zinc-100">
                          Nhận Diện Cá Nhân & Đôi Lứa
                        </h2>
                        <p className="text-xs text-zinc-400 leading-relaxed">
                          Tùy chỉnh thông tin hiển thị, avatar, câu trích dẫn trạng thái và huy hiệu đặc biệt.
                        </p>
                      </div>

                      <div className="glass p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-white/10 space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
                          <div>
                            <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                              Tên Bạn (Partner 1)
                            </label>
                            <input
                              type="text"
                              value={identity.partner1Name}
                              onChange={(e) => updateIdentity({ partner1Name: e.target.value })}
                              className="w-full min-h-[44px] sm:min-h-[40px] px-4 py-2 bg-zinc-900 rounded-xl text-base sm:text-xs text-zinc-100 border border-white/10 outline-none focus:border-rose-500"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                              Tên Người Ấy (Partner 2)
                            </label>
                            <input
                              type="text"
                              value={identity.partner2Name}
                              onChange={(e) => updateIdentity({ partner2Name: e.target.value })}
                              className="w-full min-h-[44px] sm:min-h-[40px] px-4 py-2 bg-zinc-900 rounded-xl text-base sm:text-xs text-zinc-100 border border-white/10 outline-none focus:border-rose-500"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
                          <div>
                            <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                              Biệt Danh Thân Mật
                            </label>
                            <input
                              type="text"
                              value={identity.nickname}
                              onChange={(e) => updateIdentity({ nickname: e.target.value })}
                              className="w-full min-h-[44px] sm:min-h-[40px] px-4 py-2 bg-zinc-900 rounded-xl text-base sm:text-xs text-zinc-100 border border-white/10 outline-none focus:border-rose-500"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                              Huy Hiệu Tình Yêu (Badge)
                            </label>
                            <select
                              value={identity.badge}
                              onChange={(e) => updateIdentity({ badge: e.target.value })}
                              className="w-full min-h-[44px] sm:min-h-[40px] px-4 py-2 bg-zinc-900 rounded-xl text-base sm:text-xs text-zinc-100 border border-white/10 outline-none"
                            >
                              <option value="Couple Platinum">💎 Couple Platinum</option>
                              <option value="Soulmate Gold">✨ Soulmate Gold</option>
                              <option value="Sweet Lovers">💖 Sweet Lovers</option>
                              <option value="Adventure Duo">🚀 Adventure Duo</option>
                              <option value="Forever & Always">♾️ Forever & Always</option>
                            </select>
                          </div>
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                            Thông Điệp Trạng Thái (Status Message)
                          </label>
                          <input
                            type="text"
                            value={identity.statusMessage}
                            onChange={(e) => updateIdentity({ statusMessage: e.target.value })}
                            placeholder="Ví dụ: Nắm tay nhau đi qua giông bão..."
                            className="w-full min-h-[44px] sm:min-h-[40px] px-4 py-2 bg-zinc-900 rounded-xl text-base sm:text-xs text-zinc-100 border border-white/10 outline-none focus:border-rose-500"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                            Tiểu Sử / Lời Nguyện Ước
                          </label>
                          <textarea
                            value={identity.bio}
                            onChange={(e) => updateIdentity({ bio: e.target.value })}
                            rows={3}
                            className="w-full p-3.5 bg-zinc-900 rounded-xl text-base sm:text-xs text-zinc-100 border border-white/10 outline-none resize-none focus:border-rose-500 leading-relaxed"
                          />
                        </div>

                        <div className="pt-2 flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                          <span className="text-xs text-zinc-400">Ảnh đại diện & Phương tiện:</span>
                          <button
                            type="button"
                            onClick={() => setIsAssetLibraryOpen(true)}
                            className="btn-pill min-h-[44px] sm:min-h-[38px] px-4 text-xs font-semibold flex items-center justify-center gap-2 active:scale-95"
                          >
                            <FolderOpen className="w-4 h-4 text-rose-400" /> Mở Asset Library
                          </button>
                        </div>
                      </div>
                    </>
                  )}

                  {/* ======================================================== */}
                  {/* TAB 3: COLORS & SURFACES                                 */}
                  {/* ======================================================== */}
                  {activeStudioTab === 'colors' && (
                    <>
                      <div>
                        <h2 className="text-base sm:text-lg font-bold font-serif mb-1 text-zinc-100">
                          Bảng Màu & Cấu Trúc Bề Mặt
                        </h2>
                        <p className="text-xs text-zinc-400 leading-relaxed">
                          Tinh chỉnh từng mã màu độc lập, phong cách kính mờ và lớp phủ hạt điện ảnh.
                        </p>
                      </div>

                      {/* 13 Tokens Color Grid */}
                      <div className="glass p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-white/10 space-y-4">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-300 font-mono">
                          9 Tokens Màu Sắc Hệ Thống
                        </h3>

                        <div className="grid grid-cols-1 min-[420px]:grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3">
                          {COLOR_TOKENS.map((token) => {
                            const val = appearance.colors[token.key] || '#ffffff';
                            return (
                              <div
                                key={token.key}
                                className="p-3 bg-zinc-900/90 rounded-2xl border border-white/5 space-y-1.5 focus-within:border-white/20 transition-all"
                              >
                                <label className="block text-[10px] font-semibold text-zinc-400 truncate">
                                  {token.label}
                                </label>
                                <div className="flex items-center gap-2">
                                  <div className="relative w-8 h-8 rounded-xl overflow-hidden shrink-0 border border-white/20 shadow-sm cursor-pointer">
                                    <input
                                      type="color"
                                      aria-label={`Chọn màu cho ${token.label}`}
                                      value={val.startsWith('#') ? val : '#ffffff'}
                                      onChange={(e) => updateColors({ [token.key]: e.target.value })}
                                      className="absolute -top-2 -left-2 w-12 h-12 cursor-pointer bg-transparent border-0"
                                    />
                                  </div>
                                  <input
                                    type="text"
                                    value={val}
                                    onChange={(e) => updateColors({ [token.key]: e.target.value })}
                                    className="w-full text-base sm:text-xs font-mono bg-transparent text-zinc-200 outline-none truncate"
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Surface & Noise */}
                      <div className="glass p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-white/10 space-y-4">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-300 font-mono">
                          Phong Cách Bề Mặt & Đổ Bóng
                        </h3>

                        <div className="grid grid-cols-3 gap-2 sm:gap-2.5">
                          {(['glass', 'flat', 'bordered'] as SurfaceStyle[]).map((st) => (
                            <button
                              key={st}
                              type="button"
                              onClick={() => updateAppearance({ surface: st })}
                              className={`min-h-[44px] py-2.5 rounded-2xl text-xs font-semibold capitalize border transition-all active:scale-95 ${
                                appearance.surface === st
                                  ? 'gradient-accent text-white shadow-md font-bold'
                                  : 'bg-zinc-900 text-zinc-400 border-white/10 hover:text-white'
                              }`}
                            >
                              {st}
                            </button>
                          ))}
                        </div>

                        <div className="flex items-center justify-between pt-3 border-t border-white/5">
                          <span className="text-xs font-semibold text-zinc-300">
                            Lớp Phủ Hạt Điện Ảnh (Noise Overlay)
                          </span>
                          <button
                            type="button"
                            role="switch"
                            aria-checked={appearance.noiseOverlay}
                            aria-label="Bật hoặc tắt lớp phủ hạt noise"
                            onClick={() =>
                              updateAppearance({ noiseOverlay: !appearance.noiseOverlay })
                            }
                            className={`w-12 h-6 rounded-full transition-colors relative min-h-[24px] shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-rose-500 ${
                              appearance.noiseOverlay ? 'bg-rose-500' : 'bg-zinc-800'
                            }`}
                          >
                            <span
                              className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform pointer-events-none ${
                                appearance.noiseOverlay ? 'translate-x-7' : 'translate-x-1'
                              }`}
                            />
                          </button>
                        </div>
                      </div>
                    </>
                  )}

                  {/* ======================================================== */}
                  {/* TAB 4: TYPOGRAPHY & SHAPES                               */}
                  {/* ======================================================== */}
                  {activeStudioTab === 'typography' && (
                    <>
                      <div>
                        <h2 className="text-base sm:text-lg font-bold font-serif mb-1 text-zinc-100">
                          Kiểu Chữ & Góc Bo (Typography & Shapes)
                        </h2>
                        <p className="text-xs text-zinc-400 leading-relaxed">
                          Chọn phông chữ tiêu đề, tỷ lệ văn bản và đường cong bo viền giao diện.
                        </p>
                      </div>

                      {/* Heading Fonts & Scale */}
                      <div className="glass p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-white/10 space-y-4">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-300 font-mono">
                          Phông Chữ Tiêu Đề & Thân Bài
                        </h3>

                        <div className="space-y-4">
                          <div>
                            <label className="block text-[11px] font-semibold text-zinc-400 mb-1.5">
                              Phông Chữ Tiêu Đề (Heading Font)
                            </label>
                            <select
                              value={appearance.typography.headingFont}
                              onChange={(e) => updateTypography({ headingFont: e.target.value })}
                              className="w-full min-h-[44px] sm:min-h-[40px] px-4 py-2 bg-zinc-900 rounded-xl text-base sm:text-xs text-zinc-100 border border-white/10 outline-none"
                            >
                              <option value='"Newsreader", "Cormorant Garamond", Georgia, serif'>
                                Editorial Serif (Cổ điển sang trọng)
                              </option>
                              <option value='"Plus Jakarta Sans", Inter, sans-serif'>
                                Modern Sans (Hiện đại thanh lịch)
                              </option>
                              <option value='"Caveat", "Alex Brush", cursive'>
                                Romantic Script (Chữ viết tay lãng mạn)
                              </option>
                              <option value='"Silkscreen", monospace'>
                                8-Bit Pixel Voxel (Hoài niệm retro)
                              </option>
                              <option value='"Cinzel", serif'>
                                Cinematic Royal (Điện ảnh hoàng gia)
                              </option>
                            </select>
                          </div>

                          <div>
                            <div className="flex justify-between items-center text-[11px] text-zinc-400 mb-1.5 font-semibold">
                              <span>Tỷ Lệ Phóng To Tiêu Đề</span>
                              <span className="font-mono text-rose-400 font-bold">
                                {appearance.typography.headingScale.toFixed(2)}x
                              </span>
                            </div>
                            <input
                              type="range"
                              min="0.85"
                              max="1.35"
                              step="0.05"
                              aria-label="Tỷ lệ phóng to tiêu đề"
                              value={appearance.typography.headingScale}
                              onChange={(e) =>
                                updateTypography({ headingScale: parseFloat(e.target.value) })
                              }
                              className="w-full accent-rose-500 cursor-pointer min-h-[36px]"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Shape Presets */}
                      <div className="glass p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-white/10 space-y-4">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-300 font-mono">
                          Góc Bo Hình Dáng (Shape Presets)
                        </h3>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-2.5">
                          {[
                            {
                              preset: 'sharp' as const,
                              label: 'Sắc Bén (Sharp)',
                              radius: '0.25rem',
                              btn: '0.25rem',
                            },
                            {
                              preset: 'soft' as const,
                              label: 'Mềm Mại (Soft)',
                              radius: '0.875rem',
                              btn: '0.75rem',
                            },
                            {
                              preset: 'rounded' as const,
                              label: 'Bo Tròn (Rounded)',
                              radius: '1.5rem',
                              btn: '9999px',
                            },
                            {
                              preset: 'pill' as const,
                              label: 'Viên Thuốc (Pill)',
                              radius: '2rem',
                              btn: '9999px',
                            },
                          ].map((sh) => (
                            <button
                              key={sh.preset}
                              type="button"
                              onClick={() =>
                                updateShape({
                                  preset: sh.preset,
                                  cardRadius: sh.radius,
                                  buttonRadius: sh.btn,
                                })
                              }
                              className={`min-h-[44px] p-3 rounded-2xl text-xs font-semibold border transition-all text-center active:scale-95 ${
                                appearance.shape.preset === sh.preset
                                  ? 'gradient-accent text-white shadow-md font-bold'
                                  : 'bg-zinc-900 text-zinc-400 border-white/10 hover:text-white'
                              }`}
                            >
                              {sh.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </>
                  )}

                  {/* ======================================================== */}
                  {/* TAB 5: BACKGROUND ENGINE                                 */}
                  {/* ======================================================== */}
                  {activeStudioTab === 'background' && (
                    <>
                      <div>
                        <h2 className="text-base sm:text-lg font-bold font-serif mb-1 text-zinc-100">
                          Hệ Thống Nền Động & Tùy Biến Media
                        </h2>
                        <p className="text-xs text-zinc-400 leading-relaxed">
                          Tải lên hình ảnh, GIF động, dải gradient chuyển màu hoặc điều chỉnh độ mờ ảo, độ sáng và lớp phủ.
                        </p>
                      </div>

                      {/* Background Types */}
                      <div className="glass p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-white/10 space-y-4">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-300 font-mono">
                          Loại Hình Nền
                        </h3>

                        <div className="grid grid-cols-2 min-[420px]:grid-cols-4 gap-2">
                          {(['gradient', 'solid', 'image', 'gif'] as BackgroundType[]).map((t) => (
                            <button
                              key={t}
                              type="button"
                              onClick={() => updateBackground({ type: t })}
                              className={`min-h-[44px] py-2 rounded-2xl text-xs font-semibold capitalize border transition-all active:scale-95 ${
                                background.type === t
                                  ? 'gradient-accent text-white shadow-md font-bold'
                                  : 'bg-zinc-900 text-zinc-400 border-white/10 hover:text-white'
                              }`}
                            >
                              {t}
                            </button>
                          ))}
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-zinc-400 mb-1.5">
                            Giá Trị Nền (Mã Màu, CSS Gradient hoặc URL Media)
                          </label>
                          <input
                            type="text"
                            value={background.value}
                            onChange={(e) => updateBackground({ value: e.target.value })}
                            placeholder="https://... hoặc radial-gradient(...)"
                            className="w-full min-h-[44px] sm:min-h-[40px] px-4 py-2 bg-zinc-900 rounded-xl text-base sm:text-xs text-zinc-100 font-mono border border-white/10 outline-none focus:border-rose-500"
                          />
                        </div>

                        <button
                          type="button"
                          onClick={() => setIsAssetLibraryOpen(true)}
                          className="btn-pill w-full text-center min-h-[44px] sm:min-h-[40px] text-xs font-bold flex items-center justify-center gap-2 active:scale-95"
                        >
                          <FolderOpen className="w-4 h-4 text-rose-400" /> Chọn Từ Thư Viện Media
                        </button>
                      </div>

                      {/* Filters */}
                      <div className="glass p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-white/10 space-y-4">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-300 font-mono">
                          Bộ Lọc & Độ Trong Suốt Nền
                        </h3>

                        <div className="space-y-4">
                          <div>
                            <div className="flex justify-between text-[11px] text-zinc-400 mb-1 font-semibold">
                              <span>Độ Mờ Hậu Cảnh</span>
                              <span className="font-mono text-rose-400 font-bold">
                                {background.blur}px
                              </span>
                            </div>
                            <input
                              type="range"
                              min="0"
                              max="40"
                              aria-label="Độ mờ hậu cảnh"
                              value={background.blur}
                              onChange={(e) =>
                                updateBackground({ blur: parseInt(e.target.value) || 0 })
                              }
                              className="w-full accent-rose-500 cursor-pointer min-h-[36px]"
                            />
                          </div>

                          <div>
                            <div className="flex justify-between text-[11px] text-zinc-400 mb-1 font-semibold">
                              <span>Độ Sáng (Brightness)</span>
                              <span className="font-mono text-rose-400 font-bold">
                                {Math.round(background.brightness * 100)}%
                              </span>
                            </div>
                            <input
                              type="range"
                              min="0.2"
                              max="1.8"
                              step="0.1"
                              aria-label="Độ sáng nền"
                              value={background.brightness}
                              onChange={(e) =>
                                updateBackground({ brightness: parseFloat(e.target.value) })
                              }
                              className="w-full accent-rose-500 cursor-pointer min-h-[36px]"
                            />
                          </div>

                          <div>
                            <div className="flex justify-between text-[11px] text-zinc-400 mb-1 font-semibold">
                              <span>Lớp Phủ Tối (Overlay Opacity)</span>
                              <span className="font-mono text-rose-400 font-bold">
                                {Math.round(background.overlayOpacity * 100)}%
                              </span>
                            </div>
                            <input
                              type="range"
                              min="0"
                              max="0.9"
                              step="0.05"
                              aria-label="Độ mờ lớp phủ tối"
                              value={background.overlayOpacity}
                              onChange={(e) =>
                                updateBackground({ overlayOpacity: parseFloat(e.target.value) })
                              }
                              className="w-full accent-rose-500 cursor-pointer min-h-[36px]"
                            />
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  {/* ======================================================== */}
                  {/* TAB 6: MULTI-WORKSPACES                                  */}
                  {/* ======================================================== */}
                  {activeStudioTab === 'workspaces' && (
                    <>
                      <div>
                        <h2 className="text-base sm:text-lg font-bold font-serif mb-1 text-zinc-100">
                          Quản Lý Không Gian Làm Việc (Workspaces)
                        </h2>
                        <p className="text-xs text-zinc-400 leading-relaxed">
                          Tạo và chuyển đổi giữa các không gian riêng biệt (VD: Góc Nhỏ, Chuyến Đi, Tối Giản).
                        </p>
                      </div>

                      <div className="glass p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-white/10 space-y-4">
                        <div className="space-y-2.5">
                          {workspaces.map((ws) => {
                            const isCurrent = ws.id === activeWorkspaceId;
                            return (
                              <div
                                key={ws.id}
                                className={`p-3.5 sm:p-4 rounded-2xl border flex items-center justify-between gap-3 transition-all ${
                                  isCurrent
                                    ? 'bg-white/[0.08] border-rose-500/50 shadow-md'
                                    : 'bg-zinc-900 border-white/5'
                                }`}
                              >
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2">
                                    <h4 className="text-sm font-bold text-zinc-100 truncate">
                                      {ws.name}
                                    </h4>
                                    {isCurrent && (
                                      <span className="text-[10px] font-mono font-bold bg-rose-500/20 text-rose-300 px-2 py-0.5 rounded-full shrink-0">
                                        ĐANG DÙNG
                                      </span>
                                    )}
                                  </div>
                                  {ws.description && (
                                    <p className="text-xs text-zinc-400 mt-0.5 truncate">
                                      {ws.description}
                                    </p>
                                  )}
                                </div>

                                <div className="flex items-center gap-2 shrink-0">
                                  {!isCurrent && (
                                    <button
                                      type="button"
                                      onClick={() => switchWorkspace(ws.id)}
                                      className="btn-pill min-h-[36px] px-3.5 text-xs font-semibold active:scale-95"
                                    >
                                      Chuyển Đến
                                    </button>
                                  )}
                                  {workspaces.length > 1 && (
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteWorkspace(ws.id, ws.name)}
                                      aria-label={`Xóa không gian ${ws.name}`}
                                      className="min-h-[36px] min-w-[36px] flex items-center justify-center rounded-xl text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 transition active:scale-95"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* Create Workspace */}
                        <div className="pt-4 border-t border-white/5 space-y-2">
                          <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 font-mono">
                            Tạo Không Gian Mới
                          </span>
                          <div className="flex flex-col min-[480px]:flex-row gap-2">
                            <input
                              type="text"
                              value={newWsName}
                              onChange={(e) => setNewWsName(e.target.value)}
                              placeholder="Tên không gian (VD: Kỷ Niệm)..."
                              className="flex-1 min-h-[44px] sm:min-h-[40px] px-4 py-2 bg-zinc-900 rounded-xl text-base sm:text-xs text-zinc-100 border border-white/10 outline-none focus:border-rose-500"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                if (newWsName.trim()) {
                                  createWorkspace(newWsName.trim());
                                  setNewWsName('');
                                }
                              }}
                              disabled={!newWsName.trim()}
                              className="btn-pill gradient-accent min-h-[44px] sm:min-h-[40px] px-5 text-xs font-bold disabled:opacity-40 whitespace-nowrap active:scale-95"
                            >
                              + Tạo Mới
                            </button>
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  {/* ======================================================== */}
                  {/* TAB 7: NAVIGATION CONFIG                                 */}
                  {/* ======================================================== */}
                  {activeStudioTab === 'navigation' && (
                    <>
                      <div>
                        <h2 className="text-base sm:text-lg font-bold font-serif mb-1 text-zinc-100">
                          Tùy Chỉnh Thanh Điều Hướng (Navigation)
                        </h2>
                        <p className="text-xs text-zinc-400 leading-relaxed">
                          Chọn phong cách thanh điều hướng (Floating Island Dock, Top Bar, Compact Pill).
                        </p>
                      </div>

                      <div className="glass p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-white/10 space-y-4">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-300 font-mono">
                          Phong Cách Hiển Thị
                        </h3>

                        <div className="grid grid-cols-1 min-[480px]:grid-cols-3 gap-2.5">
                          {[
                            {
                              id: 'floating_dock' as NavigationStyle,
                              label: 'Floating Dock (Đảo Nổi)',
                            },
                            {
                              id: 'top_bar' as NavigationStyle,
                              label: 'Top Bar (Đầu Trang)',
                            },
                            {
                              id: 'compact_pill' as NavigationStyle,
                              label: 'Compact Pill (Viên Thuốc)',
                            },
                          ].map((style) => (
                            <button
                              key={style.id}
                              type="button"
                              onClick={() => updateNavigation({ style: style.id })}
                              className={`min-h-[48px] p-3 rounded-2xl text-xs font-semibold border transition-all text-center flex items-center justify-center active:scale-95 ${
                                navigation.style === style.id
                                  ? 'gradient-accent text-white shadow-md font-bold'
                                  : 'bg-zinc-900 text-zinc-400 border-white/10 hover:text-white'
                              }`}
                            >
                              {style.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </>
                  )}

                  {/* ======================================================== */}
                  {/* TAB 8: RULES & AUTOMATION                                */}
                  {/* ======================================================== */}
                  {activeStudioTab === 'rules' && (
                    <>
                      <div>
                        <h2 className="text-base sm:text-lg font-bold font-serif mb-1 text-zinc-100">
                          Quy Tắc Tự Động Hóa (Personal Rules)
                        </h2>
                        <p className="text-xs text-zinc-400 leading-relaxed">
                          Thiết lập các điều kiện thông minh tự động kích hoạt chế độ tối và cấu hình giao diện.
                        </p>
                      </div>

                      <div className="glass p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-white/10 space-y-3">
                        <div className="p-4 rounded-2xl bg-zinc-900 border border-white/10 flex flex-col min-[480px]:flex-row min-[480px]:items-center justify-between gap-3">
                          <div>
                            <h4 className="text-xs font-bold text-zinc-100">
                              Kích Hoạt Chế Độ Tối Sau 19:00
                            </h4>
                            <p className="text-[11px] text-zinc-400 mt-0.5 font-mono">
                              WHEN: Time &gt; 19:00 → THEN: Apply Obsidian Velvet
                            </p>
                          </div>
                          <span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 font-bold self-start min-[480px]:self-auto">
                            ĐANG BẬT
                          </span>
                        </div>

                        <div className="p-4 rounded-2xl bg-zinc-900 border border-white/10 flex flex-col min-[480px]:flex-row min-[480px]:items-center justify-between gap-3">
                          <div>
                            <h4 className="text-xs font-bold text-zinc-100">
                              Tự Động Thu Gọn Trên Màn Hình Nhỏ
                            </h4>
                            <p className="text-[11px] text-zinc-400 mt-0.5 font-mono">
                              WHEN: Screen &lt; 768px → THEN: Compact Navigation
                            </p>
                          </div>
                          <span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 font-bold self-start min-[480px]:self-auto">
                            ĐANG BẬT
                          </span>
                        </div>
                      </div>
                    </>
                  )}

                  {/* ======================================================== */}
                  {/* TAB 9: HISTORY & RECOVERY                                */}
                  {/* ======================================================== */}
                  {activeStudioTab === 'history' && (
                    <>
                      <div>
                        <h2 className="text-base sm:text-lg font-bold font-serif mb-1 text-zinc-100">
                          Lịch Sử Cấu Hình & Khôi Phục (History)
                        </h2>
                        <p className="text-xs text-zinc-400 leading-relaxed">
                          Hoàn tác (Undo), làm lại (Redo) hoặc khôi phục lại toàn bộ cài đặt mặc định một cách an toàn.
                        </p>
                      </div>

                      <div className="glass p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-white/10 space-y-4">
                        <div className="flex flex-col min-[420px]:flex-row gap-3">
                          <button
                            type="button"
                            onClick={undo}
                            disabled={!canUndo}
                            className="btn-pill flex-1 min-h-[44px] text-xs font-bold disabled:opacity-30 active:scale-95 text-center justify-center flex items-center gap-1.5"
                          >
                            ↩ Hoàn Tác (Undo)
                          </button>
                          <button
                            type="button"
                            onClick={redo}
                            disabled={!canRedo}
                            className="btn-pill flex-1 min-h-[44px] text-xs font-bold disabled:opacity-30 active:scale-95 text-center justify-center flex items-center gap-1.5"
                          >
                            ↪ Làm Lại (Redo)
                          </button>
                        </div>

                        <div className="pt-4 border-t border-white/10">
                          <button
                            type="button"
                            onClick={handleResetAll}
                            className="btn-pill w-full text-center text-rose-400 hover:bg-rose-500/20 border-rose-500/30 min-h-[44px] text-xs font-bold flex items-center justify-center gap-2 active:scale-95"
                          >
                            <RotateCcw className="w-4 h-4" /> Khôi Phục Cài Đặt Gốc (Reset All)
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </motion.div>
              </main>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}