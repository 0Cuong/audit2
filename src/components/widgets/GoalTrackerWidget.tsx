import { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { Target, CheckCircle2, Circle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useApp } from '../../contexts/AppContext';
import { type WorkspaceBlock } from '../../types/personalization';

export default function GoalTrackerWidget({ block }: { block: WorkspaceBlock }) {
  const { t } = useApp();
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await supabase
          .from('bucket_list_items')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(6);
        if (data) setItems(data);
      } catch (e) {
        // Local fallback
      }
    })();
  }, []);

  const completed = items.filter((i) => i.is_completed).length;
  const total = items.length;
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div className="glass p-5 shadow-xl flex flex-col justify-between h-full">
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-white/[0.05] border border-white/10 text-zinc-300">
              <Target className="w-4 h-4" />
            </div>
            <h3 className="text-xs sm:text-sm font-bold text-zinc-200 uppercase font-sans tracking-wide">
              {block.title || t('dash.goals')}
            </h3>
          </div>
          <NavLink
            to="/bucket-list"
            className="text-xs font-mono font-bold text-zinc-300 hover:text-white transition-colors"
          >
            {completed}/{total} ({percentage}%)
          </NavLink>
        </div>

        {/* Progress bar */}
        <div className="h-2 rounded-full bg-black/40 border border-white/5 overflow-hidden mb-4">
          <div
            className="h-full rounded-full bg-gradient-to-r from-rose-500 to-amber-400 transition-all duration-700"
            style={{ width: `${percentage}%` }}
          />
        </div>

        {/* Goal items mini checklist */}
        <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
          {items.slice(0, 4).map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-2 text-xs py-1 px-2 rounded-lg bg-white/[0.02] border border-white/[0.04]"
            >
              {item.is_completed ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              ) : (
                <Circle className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
              )}
              <span
                className={`truncate ${item.is_completed ? 'line-through text-zinc-500' : 'text-zinc-300'}`}
              >
                {item.title}
              </span>
            </div>
          ))}
          {items.length === 0 && (
            <p className="text-xs text-zinc-500 text-center py-2">Chưa có mục tiêu nào.</p>
          )}
        </div>
      </div>

      <NavLink
        to="/bucket-list"
        className="text-[11px] text-zinc-400 hover:text-white text-center mt-3 block font-mono"
      >
        Mở danh sách mục tiêu →
      </NavLink>
    </div>
  );
}
