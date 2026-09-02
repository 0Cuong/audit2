// ============================================================================
// PORTAL MASK OVERLAY: CONTINUOUS HERO HANDOVER
// Lateral optical aperture reveal and lighting continuity into Homepage Hero
// ============================================================================

import { memo } from 'react';
import { motion } from 'framer-motion';

interface PortalMaskOverlayProps {
  handoverProgress: number; // 0 to 1
}

export const PortalMaskOverlay = memo(function PortalMaskOverlay({
  handoverProgress,
}: PortalMaskOverlayProps) {
  if (handoverProgress <= 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{
        opacity: [0, 0.8, 0],
      }}
      transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
      className="fixed inset-0 pointer-events-none z-30 select-none overflow-hidden"
    >
      {/* Lateral Golden Light Handover */}
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(ellipse 90% 70% at 55% 45%, rgba(229, 169, 60, 0.3) 0%, rgba(139, 92, 246, 0.12) 50%, rgba(3, 3, 6, 0) 80%)`,
          transform: `translateX(${handoverProgress * 60}px) scale(${1 + handoverProgress * 1.5})`,
          opacity: Math.max(0, 1 - handoverProgress * 0.9),
          transition: 'transform 0.1s ease-out',
        }}
      />

      {/* Subtle Ethereal Dispersion Flash */}
      <div
        className="absolute inset-0 bg-white/5 mix-blend-screen"
        style={{
          opacity: Math.sin(handoverProgress * Math.PI) * 0.35,
        }}
      />
    </motion.div>
  );
});
