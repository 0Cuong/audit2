import { useState, useEffect, useRef } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Menu, 
  X, 
  Search, 
  Globe, 
  ChevronDown, 
  SlidersHorizontal, 
  Layers, 
  Plus,
  Compass,
  RotateCcw,
} from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { usePersonalization } from '../contexts/PersonalizationContext';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  
  const { t, lang, setLang } = useApp();
  const { navigation, setIsStudioOpen, setIsAssetLibraryOpen, createCustomPage } = usePersonalization();
  const location = useLocation();
  const moreMenuRef = useRef<HTMLDivElement>(null);

  // Close menus on navigation
  useEffect(() => { 
    setMobileOpen(false); 
    setMoreOpen(false);
  }, [location.pathname]);

  // Scroll detection
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 15);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Click outside listener for dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(event.target as Node)) {
        setMoreOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const visibleItems = navigation.items.filter((it) => !it.isHidden);
  const pinnedItems = visibleItems.filter((it) => it.isPinned);
  const secondaryItems = visibleItems.filter((it) => !it.isPinned);

  const isMoreActive = secondaryItems.some((item) => location.pathname === item.to);

  const handleCreatePagePrompt = () => {
    const title = prompt('Nhập tên trang tùy chỉnh mới của bạn:');
    if (title && title.trim()) {
      createCustomPage(title.trim());
    }
  };

  return (
    <>
      <motion.nav 
        initial={{ y: -60 }} 
        animate={{ y: 0 }} 
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled 
            ? `bg-[#09090D]/85 backdrop-blur-2xl border-b border-white/[0.08] shadow-[0_15px_40px_rgba(0,0,0,0.7)]` 
            : 'bg-transparent border-b border-transparent'
        }`}
      >
        <div className="section-container">
          <div className="flex items-center justify-between h-16">
            
            {/* Brand Logo & Observatory Coordinate Indicator */}
            <NavLink 
              to="/" 
              className="flex items-center gap-3 group shrink-0 select-none"
            >
              <div className="w-8 h-8 rounded-xl bg-white/[0.04] border border-white/10 flex items-center justify-center group-hover:border-[#E5A93C]/40 group-hover:bg-[#E5A93C]/10 transition-all duration-300">
                <Compass 
                  className="w-4 h-4 text-[#E5A93C] group-hover:rotate-45 transition-transform duration-500" 
                />
              </div>
              <div className="flex flex-col">
                <span className="font-mono text-xs tracking-[0.2em] text-zinc-100 font-bold uppercase group-hover:text-white transition-colors">
                  {t('brand')}
                </span>
              </div>
            </NavLink>

            {/* Desktop Navigation Center Items (Precision Instrument Pill) */}
            <div className="hidden lg:flex items-center gap-1 bg-[#09090D]/90 p-1.5 rounded-full border border-white/[0.08] backdrop-blur-2xl shadow-xl">
              {pinnedItems.map((item) => {
                const labelText = item.isCustom ? item.label : (t(item.label) || item.label);
                return (
                  <NavLink 
                    key={item.id} 
                    to={item.to}
                    className={({ isActive }) => `px-3.5 py-1.5 text-xs font-medium rounded-full transition-all duration-200 ${
                      isActive 
                        ? `bg-white/[0.12] text-white border border-white/15 shadow-sm font-semibold` 
                        : `text-zinc-400 hover:text-zinc-100 hover:bg-white/[0.04]`
                    }`}
                  >
                    {labelText}
                  </NavLink>
                );
              })}

              {/* Dropdown More */}
              <div className="relative" ref={moreMenuRef}>
                <button 
                  type="button"
                  onClick={() => setMoreOpen(!moreOpen)}
                  className={`flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-full transition-all duration-200 ${
                    isMoreActive 
                      ? `bg-white/[0.12] text-white border border-white/15 font-semibold` 
                      : `text-zinc-400 hover:text-zinc-100 hover:bg-white/[0.04]`
                  }`}
                  aria-expanded={moreOpen}
                >
                  <span>Thêm</span>
                  <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${moreOpen ? 'rotate-180' : ''}`} />
                </button>

                <AnimatePresence>
                  {moreOpen && (
                    <motion.div 
                      initial={{ opacity: 0, y: 8, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.98 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 top-full pt-2.5 z-50"
                    >
                      <div className="bg-[#09090D]/95 backdrop-blur-2xl rounded-2xl p-2 min-w-[220px] shadow-2xl border border-white/10 space-y-0.5 max-h-[70vh] overflow-y-auto">
                        {secondaryItems.map((item) => {
                          const labelText = item.isCustom ? item.label : (t(item.label) || item.label);
                          return (
                            <NavLink 
                              key={item.id} 
                              to={item.to}
                              className={({ isActive }) => `block px-3.5 py-2 text-xs font-medium rounded-xl transition-all ${
                                isActive 
                                  ? `bg-white/15 text-white font-semibold` 
                                  : `text-zinc-400 hover:bg-white/5 hover:text-zinc-100`
                              }`}
                            >
                              {labelText}
                            </NavLink>
                          );
                        })}

                        {/* Add custom page quick button */}
                        <button
                          type="button"
                          onClick={handleCreatePagePrompt}
                          className="w-full mt-1.5 flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-xl bg-white/[0.04] text-[#E5A93C] hover:bg-[#E5A93C]/10 transition border border-[#E5A93C]/20"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>+ Tạo Trang Mới</span>
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Right Action Trigger Icons */}
            <div className="flex items-center gap-2">
              
              {/* Replay Cinematic Intro Trigger */}
              <button
                type="button"
                onClick={() => window.dispatchEvent(new CustomEvent('replay-intro'))}
                className="hidden md:flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full bg-white/[0.03] border border-white/10 text-zinc-300 hover:text-[#E5A93C] hover:bg-white/10 hover:border-[#E5A93C]/30 transition-all active:scale-95"
                title="Xem lại intro"
              >
                <RotateCcw className="w-3.5 h-3.5 text-[#E5A93C]" />
                <span className="font-mono text-[10px]">Intro</span>
              </button>

              {/* Asset Library Modal trigger */}
              <button
                type="button"
                onClick={() => setIsAssetLibraryOpen(true)}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full bg-white/[0.03] border border-white/10 text-zinc-300 hover:bg-white/10 hover:border-white/20 transition-all active:scale-95"
                title="Mở Thư Viện Media"
              >
                <Layers className="w-3.5 h-3.5 opacity-80" />
                <span className="font-mono text-[10px]">Assets</span>
              </button>

              {/* Personal OS Studio trigger */}
              <button
                type="button"
                onClick={() => setIsStudioOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-full bg-zinc-100 hover:bg-white text-zinc-950 shadow-md hover:scale-105 active:scale-95 transition-all"
                title="Mở Studio"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span className="font-mono text-[10px]">Studio</span>
              </button>

              {/* Language Switcher */}
              <button 
                type="button"
                onClick={() => setLang(lang === 'en' ? 'vi' : 'en')}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full bg-white/[0.03] border border-white/10 text-zinc-300 hover:bg-white/10 hover:border-white/20 transition-all active:scale-95"
                title="Change Language"
              >
                <Globe className="w-3.5 h-3.5 opacity-70" /> 
                <span className="font-mono text-[10px]">{lang === 'en' ? 'VI' : 'EN'}</span>
              </button>

              {/* Search Command Palette Trigger */}
              <button 
                type="button"
                onClick={() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }))}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs bg-white/[0.03] border border-white/10 text-zinc-400 rounded-full hover:bg-white/10 hover:border-white/20 hover:text-zinc-100 transition-all"
                title="Search commands (Ctrl+K)"
              >
                <Search className="w-3.5 h-3.5 opacity-70" /> 
                <span className="font-mono text-[10px] bg-white/10 px-1.5 py-0.5 rounded text-zinc-300">⌘K</span>
              </button>

              {/* Mobile Menu trigger */}
              <button 
                type="button"
                onClick={() => setMobileOpen(!mobileOpen)} 
                className="lg:hidden p-2 bg-white/[0.04] border border-white/10 text-zinc-300 rounded-full hover:bg-white/10 transition-all active:scale-95"
                aria-label={mobileOpen ? "Close Menu" : "Open Menu"}
              >
                {mobileOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
              </button>
            </div>

          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }} 
              animate={{ opacity: 1, height: 'auto' }} 
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
              className="lg:hidden bg-[#09090D]/95 backdrop-blur-2xl border-t border-white/10 max-h-[82vh] overflow-y-auto shadow-2xl"
            >
              <div className="section-container py-3 space-y-2">
                <div className="grid grid-cols-2 gap-1.5 pb-3 border-b border-white/5">
                  {visibleItems.map((item) => {
                    const labelText = item.isCustom ? item.label : (t(item.label) || item.label);
                    return (
                      <NavLink 
                        key={item.id} 
                        to={item.to}
                        className={({ isActive }) => `flex items-center px-3 py-2.5 text-xs font-medium rounded-xl transition-all ${
                          isActive 
                            ? `bg-white/15 text-white font-semibold border border-white/10` 
                            : `text-zinc-400 hover:bg-white/5 hover:text-zinc-100`
                        }`}
                      >
                        {labelText}
                      </NavLink>
                    );
                  })}
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setMobileOpen(false);
                      window.dispatchEvent(new CustomEvent('replay-intro'));
                    }}
                    className="w-full sm:flex-1 btn-pill"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-[#E5A93C]" /> Replay Intro
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setMobileOpen(false);
                      setIsAssetLibraryOpen(true);
                    }}
                    className="w-full sm:flex-1 btn-pill"
                  >
                    <Layers className="w-3.5 h-3.5" /> Media Assets
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setMobileOpen(false);
                      setIsStudioOpen(true);
                    }}
                    className="w-full sm:flex-1 btn-pill gradient-accent"
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5" /> Studio
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>

      {/* Floating Island Dock (If user chooses floating_dock style in Personalization) */}
      {navigation.style === 'floating_dock' && (
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-5 left-1/2 -translate-x-1/2 z-40 hidden md:flex items-center gap-1 bg-[#09090D]/90 backdrop-blur-2xl px-3 py-2 rounded-full border border-white/15 shadow-2xl select-none"
        >
          {pinnedItems.slice(0, 6).map((item) => {
            const labelText = item.isCustom ? item.label : (t(item.label) || item.label);
            return (
              <NavLink
                key={item.id}
                to={item.to}
                className={({ isActive }) =>
                  `px-3 py-1.5 text-xs font-medium rounded-full transition-all duration-200 flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-white/20 text-white font-bold border border-white/20 shadow-md'
                      : 'text-zinc-400 hover:text-white hover:bg-white/5'
                  }`
                }
              >
                <span>{labelText}</span>
              </NavLink>
            );
          })}

          <div className="w-[1px] h-4 bg-white/10 mx-1" />

          <button
            type="button"
            onClick={() => setIsStudioOpen(true)}
            className="p-2 rounded-full hover:bg-white/10 text-[#E5A93C] hover:text-white transition"
            title="Mở Studio Tùy Biến"
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>
        </motion.div>
      )}
    </>
  );
}