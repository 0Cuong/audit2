import { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { Calendar, ChevronRight, Clock, Plus } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { getDaysUntilAnniversary, formatDateLocale } from '../../lib/dateUtils';
import { useApp } from '../../contexts/AppContext';
import { type WorkspaceBlock } from '../../types/personalization';

export default function AnniversaryWidget({ block }: { block: WorkspaceBlock }) {
  const { t, lang } = useApp();
  const [events, setEvents] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await supabase
          .from('anniversaries')
          .select('*')
          .order('date')
          .limit(4);
        if (data && data.length > 0) setEvents(data);
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
              <Calendar className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-sm sm:text-base text-zinc-100 tracking-wide uppercase font-sans">
              {block.title || t('dash.upcoming')}
            </h3>
          </div>
          <NavLink
            to="/anniversary"
            className="text-xs font-medium text-zinc-400 hover:text-zinc-100 flex items-center gap-1 transition-colors"
          >
            {t('common.viewAll')} <ChevronRight className="w-3 h-3" />
          </NavLink>
        </div>

        {events.length > 0 ? (
          <div className="space-y-2.5">
            {events.slice(0, 3).map((e) => {
              const { daysLeft, isToday } = getDaysUntilAnniversary(e.date, e.recurrence || 'yearly');
              return (
                <div
                  key={e.id}
                  className="flex items-center gap-3 p-3 rounded-2xl bg-black/25 border border-white/[0.06] hover:border-white/15 transition-all group"
                >
                  <div className="w-11 h-11 rounded-xl bg-zinc-800/80 border border-white/10 flex flex-col items-center justify-center shrink-0 group-hover:border-white/20 transition-all">
                    <span className="font-pixel text-xs font-bold text-zinc-100">
                      {isToday ? '🔥' : daysLeft}
                    </span>
                    <span className="text-[7px] font-mono font-bold uppercase tracking-wider text-zinc-400">
                      {isToday ? 'HÔM NAY' : 'NGÀY'}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs sm:text-sm font-semibold text-zinc-200 truncate group-hover:text-white transition-colors">
                      {e.title}
                    </div>
                    <div className="text-[11px] font-mono text-zinc-400 mt-0.5">
                      {formatDateLocale(e.date, lang)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8">
            <Clock className="w-7 h-7 text-zinc-600 mx-auto mb-2" />
            <p className="text-xs text-zinc-400">{t('dash.noUpcoming')}</p>
          </div>
        )}
      </div>

      <NavLink to="/anniversary" className="btn-pill mt-5 w-full text-center">
        <Plus className="w-3.5 h-3.5" />
        <span>{t('anniversary.add')}</span>
      </NavLink>
    </div>
  );
}
