import { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { Smile } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useApp } from '../../contexts/AppContext';
import { type WorkspaceBlock } from '../../types/personalization';

export default function MoodSummaryWidget({ block }: { block: WorkspaceBlock }) {
  const { t } = useApp();
  const [moods, setMoods] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await supabase
          .from('mood_entries')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(6);
        if (data) setMoods(data);
      } catch (e) {
        // Local fallback
      }
    })();
  }, []);

  const moodEmojis: Record<string, string> = {
    happy: '😊',
    excited: '🤩',
    calm: '😌',
    stressed: '😫',
    sad: '🥺',
    loved: '🥰',
  };

  return (
    <div className="glass p-5 shadow-xl flex flex-col justify-between h-full">
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-white/[0.05] border border-white/10 text-zinc-300">
              <Smile className="w-4 h-4" />
            </div>
            <h3 className="text-xs sm:text-sm font-bold text-zinc-200 uppercase font-sans tracking-wide">
              {block.title || t('dash.moodSummary')}
            </h3>
          </div>
          <NavLink
            to="/mood"
            className="text-xs font-medium text-zinc-400 hover:text-white transition-colors"
          >
            {t('common.viewAll')}
          </NavLink>
        </div>

        <div className="flex gap-2 flex-wrap pt-1">
          {moods.length > 0 ? (
            moods.map((m, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-full bg-white/[0.04] border border-white/10 text-zinc-300"
              >
                <span>{moodEmojis[m.mood] || '✨'}</span>
                <span>{t(`mood.${m.mood}`) || m.mood}</span>
              </span>
            ))
          ) : (
            <span className="text-xs text-zinc-500 py-3">Chưa có ghi chép cảm xúc hôm nay.</span>
          )}
        </div>
      </div>

      <NavLink
        to="/mood"
        className="text-[11px] text-zinc-400 hover:text-white text-center mt-3 block font-mono"
      >
        Ghi lại cảm xúc hôm nay →
      </NavLink>
    </div>
  );
}
