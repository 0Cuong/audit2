import { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { Image as ImageIcon, ChevronRight, Plus } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useApp } from '../../contexts/AppContext';
import { type WorkspaceBlock } from '../../types/personalization';

export default function MemoriesWidget({ block }: { block: WorkspaceBlock }) {
  const { t } = useApp();
  const [memories, setMemories] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await supabase
          .from('memories')
          .select('*')
          .order('date', { ascending: false })
          .limit(4);
        if (data && data.length > 0) setMemories(data);
      } catch (e) {
        // Local fallback
      }
    })();
  }, []);

  return (
    <div className="glass p-6 flex flex-col justify-between shadow-2xl h-full">
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-white/[0.05] border border-white/10 text-zinc-300">
              <ImageIcon className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-sm sm:text-base text-zinc-100 tracking-wide uppercase font-sans">
              {block.title || t('dash.recent')}
            </h3>
          </div>
          <NavLink
            to="/memories"
            className="text-xs font-medium text-zinc-400 hover:text-zinc-100 flex items-center gap-1 transition-colors"
          >
            {t('common.viewAll')} <ChevronRight className="w-3 h-3" />
          </NavLink>
        </div>

        {memories.length > 0 ? (
          <div className="grid grid-cols-2 gap-2.5">
            {memories.slice(0, 4).map((m) => (
              <div
                key={m.id}
                className="group relative aspect-square rounded-xl overflow-hidden bg-black/40 border border-white/10 hover:border-white/30 transition-all duration-300"
              >
                {m.url ? (
                  <img
                    src={m.url}
                    alt={m.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-108"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-zinc-900/80">
                    <ImageIcon className="w-6 h-6 text-zinc-600" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-2 flex items-end">
                  <span className="text-[10px] text-zinc-200 font-medium truncate">{m.title}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <ImageIcon className="w-7 h-7 text-zinc-600 mx-auto mb-2" />
            <p className="text-xs text-zinc-400">{t('dash.noMemories')}</p>
          </div>
        )}
      </div>

      <NavLink to="/memories" className="btn-pill mt-5 w-full text-center">
        <Plus className="w-3.5 h-3.5" />
        <span>{t('memories.add')}</span>
      </NavLink>
    </div>
  );
}
