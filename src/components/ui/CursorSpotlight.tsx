import { useEffect, useState } from 'react';

export default function CursorSpotlight() {
  const [pos, setPos] = useState({ x: -200, y: -200 });

  useEffect(() => {
    const h = (e: MouseEvent) => setPos({ x: e.clientX, y: e.clientY });
    window.addEventListener('mousemove', h);
    return () => window.removeEventListener('mousemove', h);
  }, []);

  return (
    <div className="pointer-events-none fixed z-[55] hidden md:block" style={{ left: pos.x, top: pos.y, transform: 'translate(-50%, -50%)' }}>
      <div className="w-[300px] h-[300px] rounded-full bg-rose-500/[0.04] blur-[60px] transition-all duration-300 ease-out" />
    </div>
  );
}
