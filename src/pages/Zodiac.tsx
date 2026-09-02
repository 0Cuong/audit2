import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Heart, MessageCircle, BookOpen, Star, Zap, Shield, X } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { getZodiacFromDate, getCompatibility, zodiacSigns, ZodiacSign } from '../data/zodiac';

export default function Zodiac() {
  const { t, profile, tc } = useApp();
  
  const defaultP1Sign = profile?.partner1_birthday ? getZodiacFromDate(profile.partner1_birthday) : zodiacSigns[5];
  const defaultP2Sign = profile?.partner2_birthday ? getZodiacFromDate(profile.partner2_birthday) : zodiacSigns[9];

  const [selectedP1, setSelectedP1] = useState<ZodiacSign>(defaultP1Sign || zodiacSigns[5]);
  const [selectedP2, setSelectedP2] = useState<ZodiacSign>(defaultP2Sign || zodiacSigns[9]);
  const [inspectSign, setInspectSign] = useState<ZodiacSign | null>(null);

  const compat = getCompatibility(selectedP1.name, selectedP2.name);
  const p1Name = profile?.partner1_name || 'Mcuong';
  const p2Name = profile?.partner2_name || 'Xnghi';

  return (
    <main className="pt-24 pb-12 min-h-screen">
      <div className="section-container max-w-4xl mx-auto px-4">
        
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="mb-8 text-center sm:text-left">
          <h1 className="page-title gradient-text mb-1">{t('zodiac.title')}</h1>
          <p className={`text-xs sm:text-sm ${tc.textMuted}`}>Khám phá mức độ thấu hiểu và hòa hợp giữa hai cung hoàng đạo</p>
        </motion.div>

        {/* Interactive Compatibility Card */}
        <div className={`glass rounded-3xl p-6 sm:p-8 border ${tc.border} text-center shadow-lg mb-8 relative overflow-hidden`}>
          <div className="relative z-10">
            
            {/* Couple Zodiac Symbols */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-12 mb-6">
              
              {/* Partner 1 Sign Selector */}
              <div className="flex flex-col items-center">
                <div className="text-6xl mb-2 select-none filter drop-shadow-md">
                  {selectedP1.symbol}
                </div>
                <div className={`text-base font-bold ${tc.text}`}>{selectedP1.name}</div>
                <div className={`text-xs ${tc.textMuted}`}>{p1Name}</div>
                
                <select 
                  value={selectedP1.name}
                  onChange={(e) => {
                    const found = zodiacSigns.find(s => s.name === e.target.value);
                    if (found) setSelectedP1(found);
                  }}
                  className={`mt-2 px-2.5 py-1 text-xs glass rounded-xl bg-neutral-900 ${tc.text} border ${tc.border} outline-none cursor-pointer`}
                >
                  {zodiacSigns.map(s => (
                    <option key={s.name} value={s.name} className="bg-neutral-900 text-white">
                      {s.symbol} {s.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Heart Pulse */}
              <motion.div 
                animate={{ scale: [1, 1.25, 1.1, 1.25, 1] }} 
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                className="text-rose-500"
              >
                <Heart className="w-8 h-8" fill="currentColor" />
              </motion.div>

              {/* Partner 2 Sign Selector */}
              <div className="flex flex-col items-center">
                <div className="text-6xl mb-2 select-none filter drop-shadow-md">
                  {selectedP2.symbol}
                </div>
                <div className={`text-base font-bold ${tc.text}`}>{selectedP2.name}</div>
                <div className={`text-xs ${tc.textMuted}`}>{p2Name}</div>

                <select 
                  value={selectedP2.name}
                  onChange={(e) => {
                    const found = zodiacSigns.find(s => s.name === e.target.value);
                    if (found) setSelectedP2(found);
                  }}
                  className={`mt-2 px-2.5 py-1 text-xs glass rounded-xl bg-neutral-900 ${tc.text} border ${tc.border} outline-none cursor-pointer`}
                >
                  {zodiacSigns.map(s => (
                    <option key={s.name} value={s.name} className="bg-neutral-900 text-white">
                      {s.symbol} {s.name}
                    </option>
                  ))}
                </select>
              </div>

            </div>

            {/* Score pill */}
            <div className={`inline-flex items-center gap-3 px-6 py-3 rounded-2xl ${tc.accentMuted} border ${tc.border} shadow-sm`}>
              <Sparkles className={`w-5 h-5 ${tc.accentText}`} />
              <span className="text-3xl font-extrabold gradient-text">{compat.score}%</span>
              <span className={`text-xs font-semibold uppercase tracking-wider ${tc.textMuted}`}>
                {t('zodiac.score')}
              </span>
            </div>

          </div>
        </div>

        {/* Detailed Insights Grid */}
        <div className="grid md:grid-cols-2 gap-4 mb-10">
          
          {/* Strengths */}
          <div className={`glass rounded-3xl p-6 border ${tc.border} shadow-sm`}>
            <h3 className={`font-bold text-sm sm:text-base ${tc.text} flex items-center gap-2 mb-4`}>
              <Zap className="w-4 h-4 text-emerald-400" /> {t('zodiac.strengths')}
            </h3>
            <ul className="space-y-2.5">
              {compat.strengths.map((s, i) => (
                <li key={i} className={`flex items-center gap-2.5 text-xs sm:text-sm ${tc.text}`}>
                  <div className="w-2 h-2 rounded-full bg-emerald-400 shrink-0 shadow-sm" />
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Challenges */}
          <div className={`glass rounded-3xl p-6 border ${tc.border} shadow-sm`}>
            <h3 className={`font-bold text-sm sm:text-base ${tc.text} flex items-center gap-2 mb-4`}>
              <Shield className="w-4 h-4 text-amber-400" /> {t('zodiac.challenges')}
            </h3>
            <ul className="space-y-2.5">
              {compat.challenges.map((c, i) => (
                <li key={i} className={`flex items-center gap-2.5 text-xs sm:text-sm ${tc.text}`}>
                  <div className="w-2 h-2 rounded-full bg-amber-400 shrink-0 shadow-sm" />
                  <span>{c}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Communication */}
          <div className={`glass rounded-3xl p-6 border ${tc.border} shadow-sm`}>
            <h3 className={`font-bold text-sm sm:text-base ${tc.text} flex items-center gap-2 mb-3`}>
              <MessageCircle className={`w-4 h-4 ${tc.accentText}`} /> {t('zodiac.communication')}
            </h3>
            <p className={`text-xs sm:text-sm ${tc.textMuted} leading-relaxed`}>{compat.communication}</p>
          </div>

          {/* Love Language */}
          <div className={`glass rounded-3xl p-6 border ${tc.border} shadow-sm`}>
            <h3 className={`font-bold text-sm sm:text-base ${tc.text} flex items-center gap-2 mb-3`}>
              <BookOpen className={`w-4 h-4 ${tc.accentText}`} /> {t('zodiac.loveLanguage')}
            </h3>
            <p className={`text-xs sm:text-sm ${tc.textMuted} leading-relaxed`}>{compat.loveLanguage}</p>
          </div>

        </div>

        {/* All 12 Signs Explorer */}
        <div>
          <h2 className={`text-base font-bold ${tc.text} mb-4 flex items-center gap-2`}>
            <Star className="w-4 h-4 text-yellow-400" /> 12 Cung Hoàng Đạo
          </h2>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
            {zodiacSigns.map(s => {
              const isSelected = selectedP1.name === s.name || selectedP2.name === s.name;
              return (
                <button 
                  key={s.name} 
                  onClick={() => setInspectSign(s)}
                  className={`glass rounded-2xl p-3.5 text-center hover-lift border ${tc.border} transition-all ${
                    isSelected ? 'ring-2 ring-rose-500 bg-rose-500/10' : ''
                  }`}
                >
                  <div className="text-3xl mb-1 select-none">{s.symbol}</div>
                  <div className={`text-xs font-bold ${tc.text}`}>{s.name}</div>
                  <div className={`text-[10px] ${tc.textMuted}`}>{s.dates}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Inspect Sign Modal */}
        <AnimatePresence>
          {inspectSign && (
            <div 
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-md"
              onClick={() => setInspectSign(null)}
            >
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className={`glass-strong rounded-3xl p-6 sm:p-7 w-full max-w-sm border ${tc.border} shadow-2xl relative text-center`}
                onClick={e => e.stopPropagation()}
              >
                <button 
                  onClick={() => setInspectSign(null)}
                  className="absolute top-4 right-4 p-1.5 rounded-xl hover:bg-white/10 text-zinc-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>

                <div className="text-5xl mb-2 select-none">{inspectSign.symbol}</div>
                <h3 className={`text-xl font-bold ${tc.text}`}>{inspectSign.name}</h3>
                <p className={`text-xs font-mono ${tc.textMuted} mb-3`}>{inspectSign.dates}</p>

                <div className={`inline-block px-3 py-1 rounded-full text-xs font-bold mb-4 ${tc.accentMuted} ${tc.accentText}`}>
                  Nguyên tố: {inspectSign.element}
                </div>

                <div className="space-y-1.5 text-left border-t border-white/5 pt-3">
                  <span className={`text-[11px] font-bold uppercase tracking-wider ${tc.textMuted}`}>Đặc tính nổi bật:</span>
                  <div className="flex gap-2 flex-wrap pt-1">
                    {inspectSign.traits.map((t, idx) => (
                      <span key={idx} className="text-xs px-2.5 py-1 rounded-xl bg-black/5 dark:bg-white/5 border border-white/5 font-medium">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </div>
    </main>
  );
}
