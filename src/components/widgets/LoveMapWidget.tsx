import { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { MapPin, Navigation, ExternalLink } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { type WorkspaceBlock } from '../../types/personalization';

export default function LoveMapWidget({ block }: { block: WorkspaceBlock }) {
  const [locations, setLocations] = useState<any[]>([]);
  const [activeLoc, setActiveLoc] = useState<any | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await supabase
          .from('map_locations')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(5);
        if (data && data.length > 0) {
          setLocations(data);
          setActiveLoc(data[0]);
        }
      } catch (e) {
        // Local fallback
      }
    })();
  }, []);

  const embedUrl =
    activeLoc && !isNaN(activeLoc.latitude) && !isNaN(activeLoc.longitude)
      ? `https://maps.google.com/maps?q=${activeLoc.latitude},${activeLoc.longitude}&t=&z=14&ie=UTF8&iwloc=&output=embed`
      : null;

  return (
    <div className="glass p-5 sm:p-6 shadow-xl flex flex-col justify-between h-full">
      <div>
        <div className="flex items-center justify-between mb-3.5">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-white/[0.05] border border-white/10 text-zinc-300">
              <MapPin className="w-4 h-4 text-rose-500" />
            </div>
            <h3 className="text-xs sm:text-sm font-bold text-zinc-100 uppercase font-sans tracking-wide">
              {block.title || 'Bản Đồ Kỷ Niệm'}
            </h3>
          </div>
          <NavLink
            to="/map"
            className="text-xs font-medium text-zinc-400 hover:text-white transition-colors flex items-center gap-1"
          >
            <span>Xem Toàn Màn Hình</span>
            <ExternalLink className="w-3 h-3" />
          </NavLink>
        </div>

        {/* Mini iframe map preview or fallback */}
        {embedUrl ? (
          <div className="rounded-2xl overflow-hidden border border-white/10 aspect-video mb-3 relative bg-black">
            <iframe
              title="Mini Map Preview"
              src={embedUrl}
              className="w-full h-full border-0"
              loading="lazy"
            />
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-white/10 p-6 text-center text-xs text-zinc-500 mb-3">
            <Navigation className="w-6 h-6 mx-auto mb-1 text-zinc-600" />
            Chưa có tọa độ địa điểm nào.
          </div>
        )}

        {/* Location selector pills */}
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {locations.map((loc) => (
            <button
              key={loc.id}
              type="button"
              onClick={() => setActiveLoc(loc)}
              className={`px-3 py-1 text-[11px] font-medium rounded-full shrink-0 transition-all ${
                activeLoc?.id === loc.id
                  ? 'bg-rose-500 text-white font-semibold shadow-sm'
                  : 'bg-white/[0.04] text-zinc-400 hover:text-white border border-white/5'
              }`}
            >
              {loc.title}
            </button>
          ))}
        </div>
      </div>

      <NavLink
        to="/map"
        className="text-[11px] text-zinc-400 hover:text-white text-center mt-3 block font-mono"
      >
        Khám phá bản đồ chi tiết →
      </NavLink>
    </div>
  );
}
