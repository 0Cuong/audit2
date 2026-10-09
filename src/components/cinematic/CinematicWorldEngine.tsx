import { memo } from 'react';
import { usePersonalization } from '../../contexts/PersonalizationContext';

/**
 * Atmospheric Background Layer
 * Calmed down from a heavy canvas RAF particle loop into a clean, zero-CPU atmospheric backdrop.
 * Preserves readability, battery life, and calm editorial aesthetics.
 */
function CinematicWorldEngine() {
  const { background } = usePersonalization();

  // If custom user background is active, let that take precedence
  if (background.type !== 'solid') {
    return null;
  }

  return (
    <div 
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden" 
      aria-hidden="true"
    >
      {/* Quiet, warm-neutral ambient gradient */}
      <div 
        className="absolute inset-0 bg-gradient-to-b from-[#141417]/80 via-[#0e0e11] to-[#0a0a0d] opacity-95" 
      />

      {/* Subtle top ambient warmth */}
      <div 
        className="absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[500px] rounded-full bg-amber-500/[0.03] blur-[120px]" 
      />

      {/* Subtle bottom vignette */}
      <div 
        className="absolute -bottom-40 right-1/4 w-[500px] h-[400px] rounded-full bg-rose-500/[0.02] blur-[100px]" 
      />
    </div>
  );
}

export default memo(CinematicWorldEngine);
