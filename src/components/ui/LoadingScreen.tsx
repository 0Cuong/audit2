import { motion } from 'framer-motion';
import { Compass } from 'lucide-react';

export default function LoadingScreen() {
  return (
    <motion.div 
      initial={{ opacity: 1 }} 
      exit={{ opacity: 0 }} 
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="fixed inset-0 z-[80] bg-[#030306] flex items-center justify-center overflow-hidden select-none"
    >
      {/* Subtle deep spatial void glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(229,169,60,0.05)_0%,rgba(3,3,6,0.95)_70%)] pointer-events-none" />

      <div className="relative flex flex-col items-center gap-6 z-10">
        <div className="relative flex items-center justify-center w-20 h-20">
          
          {/* Outer Pulsing Resonance Ring */}
          <motion.div
            animate={{ 
              scale: [1, 1.25, 1], 
              opacity: [0.2, 0.6, 0.2] 
            }}
            transition={{ 
              duration: 3, 
              repeat: Infinity, 
              ease: "easeInOut" 
            }}
            className="absolute inset-0 border border-[#E5A93C]/40 rounded-full scale-125 pointer-events-none"
          />

          {/* Center Rotating Optical Compass */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
            className="w-14 h-14 rounded-2xl bg-[#09090D] border border-white/15 flex items-center justify-center text-[#E5A93C] shadow-2xl"
          >
            <Compass className="w-6 h-6" />
          </motion.div>
        </div>

        {/* Cinematic Branding text */}
        <div className="flex flex-col items-center gap-1.5 text-center">
          <motion.div 
            initial={{ opacity: 0, letterSpacing: '0.15em' }} 
            animate={{ opacity: 1, letterSpacing: '0.3em' }} 
            transition={{ delay: 0.1, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="text-xs text-zinc-200 font-mono tracking-widest uppercase font-bold"
          >
            CUONGISME
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 4 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: 0.25, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="text-xs font-mono text-zinc-500 tracking-wider"
          >
            Đang tải...
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}