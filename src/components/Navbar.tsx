import { useState, useEffect, useRef } from 'react';
import { NavLink, useLocation, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home,
  Sparkles,
  Clock,
  BookOpen,
  Mail,
  Compass,
  Music,
  MapPin,
  Calendar,
  ListTodo,
  Smile,
  Settings as SettingsIcon,
  SlidersHorizontal,
  Globe,
  Search,
  RotateCcw,
  X,
  ChevronDown,
  Heart,
} from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { usePersonalization } from '../contexts/PersonalizationContext';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const { lang, setLang, profile } = useApp();
  const { setIsStudioOpen } = usePersonalization();
  const location = useLocation();
  const dropdownRef = useRef<HTMLDivElement>(null);

  const p1 = profile?.partner1_name || 'Cường';
  const p2 = profile?.partner2_name || 'Nghi';
  const brandTitle = `${p1} & ${p2}`;

  // Close menus on route change
  useEffect(() => {
    setMobileSheetOpen(false);
    setDropdownOpen(false);
  }, [location.pathname]);

  // Scroll detection
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMobileSheetOpen(false);
        setDropdownOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Primary desktop navigation destinations
  const primaryLinks = [
    { to: '/', label: 'Trang chủ', icon: Home },
    { to: '/memories', label: 'Kỷ niệm', icon: Sparkles },
    { to: '/timeline', label: 'Dòng thời gian', icon: Clock },
    { to: '/journal', label: 'Nhật ký', icon: BookOpen },
    { to: '/letters', label: 'Thư tình', icon: Mail },
  ];

  // Secondary destinations (inside More dropdown & Mobile sheet)
  const secondaryLinks = [
    { to: '/map', label: 'Bản đồ kỷ niệm', desc: 'Quán quen & điểm hẹn', icon: MapPin },
    { to: '/music', label: 'Giai điệu', desc: 'Bài hát của hai đứa', icon: Music },
    { to: '/anniversary', label: 'Ngày kỷ niệm', desc: 'Cột mốc & đếm ngược', icon: Calendar },
    { to: '/bucket-list', label: 'Wishlist', desc: 'Mục tiêu muốn cùng làm', icon: ListTodo },
    { to: '/mood', label: 'Cảm xúc', desc: 'Theo dõi tâm trạng', icon: Smile },
    { to: '/hub', label: 'Ghi chú & lời nhắn', desc: 'Sticky notes & câu hỏi', icon: BookOpen },
    { to: '/contact', label: 'Về tụi mình', desc: 'Liên hệ & mạng xã hội', icon: Heart },
    { to: '/settings', label: 'Cài đặt', desc: 'Bảo mật & cấu hình', icon: SettingsIcon },
  ];

  const isSecondaryActive = secondaryLinks.some((l) => location.pathname === l.to);

  return (
    <>
      {/* ============================================================ */}
      {/* 1. TOP HEADER (DESKTOP & MOBILE IDENTITY)                    */}
      {/* ============================================================ */}
      <header
        className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
          scrolled
            ? 'bg-[var(--surface-elevated)]/90 backdrop-blur-xl border-b border-[var(--surface-border)] shadow-sm'
            : 'bg-transparent border-b border-transparent'
        }`}
      >
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Brand Identity / Home Link */}
          <Link
            to="/"
            className="flex items-center gap-2.5 group select-none text-zinc-100"
          >
            <div className="w-8 h-8 rounded-full bg-white/[0.04] border border-white/10 flex items-center justify-center text-amber-300/80 group-hover:border-amber-400/30 transition">
              <Heart className="w-3.5 h-3.5 fill-amber-300/20" />
            </div>
            <div className="flex flex-col">
              <span className="font-serif text-base sm:text-lg font-normal tracking-tight text-zinc-100 group-hover:text-white transition">
                {brandTitle}
              </span>
            </div>
          </Link>

          {/* Desktop Primary Nav Pill (lg:flex) */}
          <nav
            aria-label="Thanh điều hướng chính"
            className="hidden lg:flex items-center gap-1 bg-zinc-900/80 border border-white/[0.08] p-1.5 rounded-full backdrop-blur-xl shadow-sm"
          >
            {primaryLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-white/[0.12] text-white font-semibold shadow-sm'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]'
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}

            {/* Dropdown More */}
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setDropdownOpen((prev) => !prev)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1 ${
                  isSecondaryActive || dropdownOpen
                    ? 'bg-white/[0.12] text-white font-semibold'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]'
                }`}
                aria-expanded={dropdownOpen}
                aria-haspopup="true"
              >
                <span>Thêm</span>
                <ChevronDown
                  className={`w-3 h-3 transition-transform duration-200 ${
                    dropdownOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              <AnimatePresence>
                {dropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-2 w-64 p-2 rounded-2xl bg-[#121216] border border-white/10 shadow-2xl backdrop-blur-2xl z-50 space-y-1"
                  >
                    {secondaryLinks.map((item) => {
                      const Icon = item.icon;
                      return (
                        <NavLink
                          key={item.to}
                          to={item.to}
                          onClick={() => setDropdownOpen(false)}
                          className={({ isActive }) =>
                            `flex items-center gap-2.5 p-2 rounded-xl text-xs transition ${
                              isActive
                                ? 'bg-white/10 text-white font-medium'
                                : 'text-zinc-300 hover:bg-white/[0.06] hover:text-white'
                            }`
                          }
                        >
                          <div className="w-6 h-6 rounded-lg bg-white/[0.04] border border-white/10 flex items-center justify-center text-zinc-400">
                            <Icon className="w-3.5 h-3.5" />
                          </div>
                          <div className="flex flex-col">
                            <span>{item.label}</span>
                            <span className="text-[10px] text-zinc-500 font-light">
                              {item.desc}
                            </span>
                          </div>
                        </NavLink>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </nav>

          {/* Quick Utility Tools (Right side) */}
          <div className="flex items-center gap-2">
            {/* Search Palette */}
            <button
              type="button"
              onClick={() =>
                window.dispatchEvent(
                  new KeyboardEvent('keydown', { key: 'k', ctrlKey: true })
                )
              }
              className="p-2 rounded-full bg-white/[0.04] hover:bg-white/10 border border-white/10 text-zinc-400 hover:text-white transition active:scale-95"
              title="Tìm kiếm (⌘K)"
              aria-label="Tìm kiếm"
            >
              <Search className="w-3.5 h-3.5" />
            </button>

            {/* Language Switcher */}
            <button
              type="button"
              onClick={() => setLang(lang === 'en' ? 'vi' : 'en')}
              className="px-2.5 py-1 rounded-full bg-white/[0.04] hover:bg-white/10 border border-white/10 text-zinc-300 hover:text-white transition active:scale-95 text-[11px] font-mono flex items-center gap-1"
              title="Đổi ngôn ngữ"
            >
              <Globe className="w-3 h-3 text-zinc-400" />
              <span>{lang === 'en' ? 'VI' : 'EN'}</span>
            </button>

            {/* Personalization Studio */}
            <button
              type="button"
              onClick={() => setIsStudioOpen(true)}
              className="hidden sm:flex items-center gap-1 px-3 py-1 rounded-full bg-white/[0.04] hover:bg-white/10 border border-white/10 text-zinc-300 hover:text-white transition active:scale-95 text-[11px] font-mono"
              title="Tùy biến giao diện"
            >
              <SlidersHorizontal className="w-3 h-3 text-amber-400/80" />
              <span>Studio</span>
            </button>

            {/* Settings on Desktop */}
            <Link
              to="/settings"
              className="hidden sm:flex p-2 rounded-full bg-white/[0.04] hover:bg-white/10 border border-white/10 text-zinc-400 hover:text-white transition active:scale-95"
              title="Cài đặt"
              aria-label="Cài đặt"
            >
              <SettingsIcon className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* ============================================================ */}
      {/* 2. ERGONOMIC MOBILE BOTTOM NAVIGATION BAR (lg:hidden)        */}
      {/* ============================================================ */}
      <nav
        aria-label="Thanh điều hướng dưới màn hình"
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0c0c0f]/95 backdrop-blur-2xl border-t border-white/[0.08] px-2 py-1.5 safe-area-pb"
      >
        <div className="grid grid-cols-5 gap-1 items-center max-w-md mx-auto">
          {primaryLinks.slice(0, 4).map((link) => {
            const Icon = link.icon;
            const isActive = location.pathname === link.to;
            return (
              <NavLink
                key={link.to}
                to={link.to}
                className={`flex flex-col items-center justify-center py-1.5 rounded-xl transition-all min-h-[48px] ${
                  isActive ? 'text-amber-300' : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Icon className={`w-5 h-5 mb-0.5 ${isActive ? 'stroke-[2.2]' : 'stroke-[1.6]'}`} />
                <span className="text-[10px] tracking-tight font-medium">
                  {link.label}
                </span>
              </NavLink>
            );
          })}

          {/* More button (Opens Mobile Drawer) */}
          <button
            type="button"
            onClick={() => setMobileSheetOpen(true)}
            className={`flex flex-col items-center justify-center py-1.5 rounded-xl transition-all min-h-[48px] ${
              isSecondaryActive || mobileSheetOpen
                ? 'text-amber-300'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
            aria-label="Mở menu khám phá thêm"
          >
            <Compass className="w-5 h-5 mb-0.5 stroke-[1.6]" />
            <span className="text-[10px] tracking-tight font-medium">Khám phá</span>
          </button>
        </div>
      </nav>

      {/* ============================================================ */}
      {/* 3. MOBILE SLIDE-UP DRAWER / SHEET                            */}
      {/* ============================================================ */}
      <AnimatePresence>
        {mobileSheetOpen && (
          <div
            className="lg:hidden fixed inset-0 z-50 flex flex-col justify-end bg-black/70 backdrop-blur-sm"
            onClick={() => setMobileSheetOpen(false)}
            role="dialog"
            aria-modal="true"
            aria-label="Tất cả các mục khám phá"
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="bg-[#121216] border-t border-white/15 rounded-t-3xl p-5 max-h-[85vh] overflow-y-auto space-y-4 shadow-2xl safe-area-pb"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Drawer Handle & Header */}
              <div className="flex items-center justify-between pb-2 border-b border-white/[0.08]">
                <div>
                  <h2 className="font-serif text-lg font-normal text-zinc-100">
                    Khám phá không gian
                  </h2>
                  <p className="text-xs text-zinc-400 font-light">
                    Các góc nhỏ và tính năng riêng tư
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setMobileSheetOpen(false)}
                  className="p-2 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white transition"
                  aria-label="Đóng menu"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Grid of Navigation Destinations */}
              <div className="grid grid-cols-2 gap-2.5">
                {/* Letters Link */}
                <NavLink
                  to="/letters"
                  onClick={() => setMobileSheetOpen(false)}
                  className="p-3 rounded-2xl bg-zinc-900/80 border border-white/[0.08] hover:border-white/20 transition flex items-center gap-3"
                >
                  <div className="w-8 h-8 rounded-xl bg-white/[0.05] flex items-center justify-center text-amber-300">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-medium text-zinc-100">Thư tình</h3>
                    <p className="text-[10px] text-zinc-500 font-light">Thư tay gửi nhau</p>
                  </div>
                </NavLink>

                {secondaryLinks.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      onClick={() => setMobileSheetOpen(false)}
                      className="p-3 rounded-2xl bg-zinc-900/80 border border-white/[0.08] hover:border-white/20 transition flex items-center gap-3"
                    >
                      <div className="w-8 h-8 rounded-xl bg-white/[0.05] flex items-center justify-center text-zinc-300">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-xs font-medium text-zinc-100">{item.label}</h3>
                        <p className="text-[10px] text-zinc-500 font-light">{item.desc}</p>
                      </div>
                    </NavLink>
                  );
                })}
              </div>

              {/* Quick Actions Bar */}
              <div className="pt-2 border-t border-white/[0.08] grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setMobileSheetOpen(false);
                    setIsStudioOpen(true);
                  }}
                  className="py-2.5 px-3 rounded-xl bg-white/[0.06] hover:bg-white/10 border border-white/10 text-xs font-mono text-zinc-200 flex items-center justify-center gap-2"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5 text-amber-400" />
                  <span>Studio Giao diện</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setMobileSheetOpen(false);
                    window.dispatchEvent(new CustomEvent('replay-intro'));
                  }}
                  className="py-2.5 px-3 rounded-xl bg-white/[0.06] hover:bg-white/10 border border-white/10 text-xs font-mono text-zinc-200 flex items-center justify-center gap-2"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Xem lại Lời chào</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
