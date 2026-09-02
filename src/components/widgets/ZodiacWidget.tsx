import { NavLink } from 'react-router-dom';
import { Heart } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { getZodiacFromDate, getCompatibility } from '../../data/zodiac';
import { type WorkspaceBlock } from '../../types/personalization';

export default function ZodiacWidget({ block }: { block: WorkspaceBlock }) {
  const { t, profile } = useApp();

  const p1Sign = profile?.partner1_birthday ? getZodiacFromDate(profile.partner1_birthday) : null;
  const p2Sign = profile?.partner2_birthday ? getZodiacFromDate(profile.partner2_birthday) : null;
  const compat = p1Sign && p2Sign ? getCompatibility(p1Sign.name, p2Sign.name) : null;

  return (
    <div className="glass p-5 shadow-xl flex flex-col justify-between h-full">
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs sm:text-sm font-semibold text-zinc-200">
            {block.title || t('dash.compatibility')}
          </h3>
          <NavLink
            to="/zodiac"
            className="text-xs font-medium text-zinc-400 hover:text-white transition-colors"
          >
            {t('common.viewAll')}
          </NavLink>
        </div>

        {compat ? (
          <div className="pt-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{p1Sign?.symbol}</span>
                <span className="text-xs font-semibold text-zinc-200">{p1Sign?.name}</span>
                <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
                <span className="text-2xl">{p2Sign?.symbol}</span>
                <span className="text-xs font-semibold text-zinc-200">{p2Sign?.name}</span>
              </div>
              <span className="font-serif text-3xl font-bold text-zinc-100">{compat.score}%</span>
            </div>
            <p className="text-[11px] text-zinc-400 mt-2 line-clamp-2 leading-relaxed">
              {compat.communication || 'Hai bạn sinh ra là để dành cho nhau, bổ khuyết và nâng đỡ nhau.'}
            </p>
          </div>
        ) : (
          <p className="text-xs text-zinc-500 py-4 text-center">
            Cập nhật ngày sinh trong Cài đặt để xem độ hợp nhau.
          </p>
        )}
      </div>

      <NavLink
        to="/zodiac"
        className="text-[11px] text-zinc-400 hover:text-white text-center mt-3 block"
      >
        Xem chi tiết →
      </NavLink>
    </div>
  );
}
