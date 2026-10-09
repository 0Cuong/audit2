import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Search, ArrowRight, CornerDownLeft } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';

const actions = [
  { id: 'dashboard', labelKey: 'nav.dashboard', section: 'Nav', href: '/' },
  { id: 'timeline', labelKey: 'nav.timeline', section: 'Nav', href: '/timeline' },
  { id: 'memories', labelKey: 'nav.memories', section: 'Nav', href: '/memories' },
  { id: 'letters', labelKey: 'nav.letters', section: 'Nav', href: '/letters' },
  { id: 'journal', labelKey: 'nav.journal', section: 'Nav', href: '/journal' },
  { id: 'mood', labelKey: 'nav.mood', section: 'Nav', href: '/mood' },
  { id: 'bucket', labelKey: 'nav.bucket', section: 'Nav', href: '/bucket-list' },
  { id: 'anniversary', labelKey: 'nav.anniversary', section: 'Nav', href: '/anniversary' },
  { id: 'zodiac', labelKey: 'nav.zodiac', section: 'Nav', href: '/zodiac' },
  { id: 'map', labelKey: 'nav.map', section: 'Nav', href: '/map' },
  { id: 'music', labelKey: 'nav.music', section: 'Nav', href: '/music' },
  { id: 'gifts', labelKey: 'nav.gifts', section: 'Nav', href: '/gifts' },
  { id: 'hub', labelKey: 'nav.hub', section: 'Nav', href: '/hub' },
  { id: 'contact', labelKey: 'nav.contact', section: 'Nav', href: '/contact' },
  { id: 'settings', labelKey: 'nav.settings', section: 'Nav', href: '/settings' },
];

export default function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const navigate = useNavigate();
  const { t, tc } = useApp();
  const listRef = useRef<HTMLDivElement>(null);

  const open = useCallback(() => {
    setIsOpen(true);
    setSelectedIndex(0);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    setQuery('');
    setSelectedIndex(0);
  }, []);

  const filtered = actions.filter(a => {
    const label = t(a.labelKey).toLowerCase();
    const q = query.toLowerCase().trim();
    return label.includes(q) || a.id.includes(q);
  });

  const selectAction = useCallback((href: string) => {
    navigate(href);
    close();
  }, [navigate, close]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) close();
        else open();
      }
      if (e.key === 'Escape' && isOpen) {
        close();
      }
      if (isOpen) {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          setSelectedIndex(prev => (prev + 1) % Math.max(1, filtered.length));
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          setSelectedIndex(prev => (prev - 1 + filtered.length) % Math.max(1, filtered.length));
        } else if (e.key === 'Enter' && filtered[selectedIndex]) {
          e.preventDefault();
          selectAction(filtered[selectedIndex].href);
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, close, isOpen, filtered, selectedIndex, selectAction]);

  // Keep selected item in view
  useEffect(() => {
    if (listRef.current) {
      const selectedEl = listRef.current.children[selectedIndex] as HTMLElement;
      if (selectedEl) {
        selectedEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-md" 
            onClick={close} 
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: -20 }} 
            animate={{ opacity: 1, scale: 1, y: 0 }} 
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed top-[15%] sm:top-[20%] left-1/2 -translate-x-1/2 z-[71] w-[92vw] max-w-lg"
          >
            <div className={`glass-strong rounded-2xl overflow-hidden shadow-2xl ${tc.border} border`}>
              <div className={`flex items-center gap-3 px-4 sm:px-5 border-b ${tc.border}`}>
                <Search className={`w-4 h-4 ${tc.accentText} shrink-0`} />
                <input 
                  type="text" 
                  value={query} 
                  onChange={(e) => { setQuery(e.target.value); setSelectedIndex(0); }}
                  placeholder={t('common.search') + "..."} 
                  autoFocus
                  className={`flex-1 bg-transparent py-4 text-sm ${tc.text} placeholder:opacity-40 outline-none`} 
                />
                <kbd className={`px-2 py-1 text-[10px] ${tc.textMuted} bg-white/5 rounded-md border ${tc.border} font-mono select-none`}>
                  ESC
                </kbd>
              </div>

              <div ref={listRef} className="max-h-64 overflow-y-auto py-2">
                {filtered.map((action, i) => {
                  const isSelected = i === selectedIndex;
                  return (
                    <button 
                      key={action.id} 
                      onClick={() => selectAction(action.href)}
                      onMouseEnter={() => setSelectedIndex(i)}
                      className={`w-full flex items-center gap-3 px-4 sm:px-5 py-2.5 text-sm transition-all duration-150 text-left ${
                        isSelected 
                          ? `${tc.accentMuted} ${tc.accentText} font-semibold` 
                          : `${tc.textMuted} hover:${tc.text}`
                      }`}
                    >
                      <ArrowRight className={`w-4 h-4 shrink-0 transition-transform ${isSelected ? 'translate-x-1' : ''}`} />
                      <span className="flex-1 truncate">{t(action.labelKey)}</span>
                      {isSelected && (
                        <span className="flex items-center gap-1 text-[10px] opacity-70 font-mono">
                          <CornerDownLeft className="w-3 h-3" /> Select
                        </span>
                      )}
                    </button>
                  );
                })}
                {filtered.length === 0 && (
                  <div className={`px-5 py-8 text-center text-sm ${tc.textMuted}`}>
                    {t('common.noResults')}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
