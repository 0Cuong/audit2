import { Compass } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { Link } from 'react-router-dom';

export default function Footer() {
  const { t, profile } = useApp();
  const year = new Date().getFullYear();

  const p1Name = profile?.partner1_name || 'Cường';
  const p2Name = profile?.partner2_name || 'Nghi';
  const brandTitle = `${p1Name} & ${p2Name}`;

  return (
    <footer className="border-t border-white/[0.06] mt-auto py-8 bg-[#09090D]/80 backdrop-blur-2xl transition-colors duration-300 relative z-20">
      <div className="section-container">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">

          {/* Brand logo & couple identity — live profile names */}
          <Link
            to="/"
            className="flex items-center gap-2.5 group select-none"
          >
            <Compass className="w-4 h-4 text-[#E5A93C] transition-transform duration-300 group-hover:rotate-90" />
            <span className="font-serif text-sm tracking-tight text-zinc-300 group-hover:text-white transition-colors">
              {brandTitle}
            </span>
          </Link>

          {/* Copyright notice */}
          <p className="text-xs text-zinc-500 font-mono">
            &copy; {year} {t('footer.copy')}
          </p>

          {/* Quick links */}
          <div className="flex items-center gap-3">
            <Link
              to="/contact"
              className="text-xs font-mono text-zinc-400 hover:text-zinc-100 transition-colors duration-200 px-3.5 py-1 rounded-full bg-white/[0.02] border border-white/5 hover:border-white/20"
            >
              {t('nav.contact')}
            </Link>
            <Link
              to="/settings"
              className="text-xs font-mono text-zinc-400 hover:text-zinc-100 transition-colors duration-200 px-3.5 py-1 rounded-full bg-white/[0.02] border border-white/5 hover:border-white/20"
            >
              {t('nav.settings')}
            </Link>
          </div>

        </div>
      </div>
    </footer>
  );
}