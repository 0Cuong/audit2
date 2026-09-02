import { useState } from 'react';
import { motion } from 'framer-motion';
import { useApp } from '../contexts/AppContext';
import { usePersonalization } from '../contexts/PersonalizationContext';
import GravitationalCanvas from '../components/contact/GravitationalCanvas';
import FounderMonolith, { type FounderProfile } from '../components/contact/FounderMonolith';
import ResonanceBridge from '../components/contact/ResonanceBridge';
import CommLinkCard from '../components/contact/CommLinkCard';
import TransmissionModal from '../components/contact/TransmissionModal';

export default function Contact() {
  const { t, profile } = useApp();
  const { identity } = usePersonalization();
  const [isTransmissionOpen, setIsTransmissionOpen] = useState(false);

  const p1Name = profile?.partner1_name || identity.partner1Name || 'MCuong';
  const p2Name = profile?.partner2_name || identity.partner2Name || 'Xuân Nghi';

  const p1Avatar =
    identity.partner1Avatar ||
    profile?.partner1_avatar ||
    '/590610904_1909263110009109_2160755825373491978_n.jpg';

  const p2Avatar =
    identity.partner2Avatar ||
    profile?.partner2_avatar ||
    '/605572670_122215932062047100_7842864668271503382_n.jpg';

  // Founder 1 Profile (Cuong - Product & Systems Engineering)
  const founder1: FounderProfile = {
    id: 'founder-1',
    index: '01',
    name: p1Name,
    role: 'Sáng lập',
    title: 'Kỹ thuật & sản phẩm',
    disciplines: [],
    avatar: p1Avatar,
    bio: 'Phát triển nền tảng và trải nghiệm số cho cặp đôi.',
    location: 'Saigon',
    timezone: 'UTC+7',
    accent: '#E5A93C', // Gravitational Gold (Primary Anchor)
    accentGlow: 'rgba(229, 169, 60, 0.15)',
    socials: [
      {
        label: 'Facebook',
        url: 'https://www.facebook.com/0Cuongisme?locale=vi_VN',
        type: 'facebook',
        handle: 'fb.com/0Cuongisme',
      },
      {
        label: 'Instagram',
        url: 'https://www.instagram.com/_kodl0/',
        type: 'instagram',
        handle: '@_kodl0',
      },
      {
        label: 'Discord Channel',
        url: 'https://discord.gg/wZUDdwbq',
        type: 'discord',
        handle: '@cuongisme',
      },
    ],
  };

  // Founder 2 Profile (Xuan Nghi - Creative & Visual Direction)
  const founder2: FounderProfile = {
    id: 'founder-2',
    index: '02',
    name: p2Name,
    role: 'Đồng sáng lập',
    title: 'Thiết kế & hình ảnh',
    disciplines: [],
    avatar: p2Avatar,
    bio: 'Định hình ngôn ngữ thị giác và chăm chút từng khoảnh khắc của hành trình đôi lứa.',
    location: 'Saigon',
    timezone: 'UTC+7',
    accent: '#8B5CF6', // Hyper Violet (Supporting Spectral)
    accentGlow: 'rgba(139, 92, 246, 0.15)',
    socials: [
      {
        label: 'Facebook',
        url: 'https://www.facebook.com/nghinghi0301?locale=vi_VN',
        type: 'facebook',
        handle: 'fb.com/nghinghi0301',
      },
      {
        label: 'Instagram',
        url: 'https://www.instagram.com/hx.nghii/',
        type: 'instagram',
        handle: '@hx.nghii',
      },
      {
        label: 'Discord Channel',
        url: 'https://discord.gg/8NxAFzWXN',
        type: 'discord',
        handle: '@xuannghi',
      },
    ],
  };

  return (
    <main className="relative pt-28 sm:pt-36 pb-28 min-h-screen text-zinc-100 overflow-x-hidden selection:bg-[#E5A93C]/30 selection:text-white">
      
      {/* ============================================================ */}
      {/* PROCEDURAL COSMIC BACKGROUND WORLD & GRAVITATIONAL CANVAS     */}
      {/* ============================================================ */}
      <GravitationalCanvas />

      <div className="section-container max-w-6xl mx-auto px-4 sm:px-6 relative z-10">
        
        {/* ============================================================ */}
        {/* EDITORIAL HERO HEADER: THE SPATIAL CONCEPT                   */}
        {/* ============================================================ */}
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="text-center max-w-2xl mx-auto mb-16 sm:mb-20 select-none"
        >
          <h1 className="font-serif text-3xl sm:text-5xl font-normal tracking-tight text-zinc-100 leading-[1.1] mb-4">
            {t('contact.title')}
          </h1>

          <p className="text-xs sm:text-sm text-zinc-400 max-w-md mx-auto leading-relaxed">
            Kết nối với tụi mình qua mạng xã hội hoặc Discord.
          </p>
        </motion.div>

        {/* ============================================================ */}
        {/* FOUNDER STAGE: ARCHITECTURAL MONOLITHS + RESONANCE BRIDGE    */}
        {/* ============================================================ */}
        <div className="relative mb-16 sm:mb-20">
          <div className="flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-0">
            {/* Founder 01: Cuong */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
              className="w-full lg:w-[46%]"
            >
              <FounderMonolith founder={founder1} />
            </motion.div>

            {/* Quantum Resonance Bridge (Central Gravitational Filament) */}
            <ResonanceBridge />

            {/* Founder 02: Xuan Nghi */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="w-full lg:w-[46%]"
            >
              <FounderMonolith founder={founder2} />
            </motion.div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* DISCORD COMM-LINK & DIRECT TRANSMISSION TERMINAL             */}
        {/* ============================================================ */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-4xl mx-auto"
        >
          <CommLinkCard onOpenTransmission={() => setIsTransmissionOpen(true)} />
        </motion.div>

        {/* ============================================================ */}
        {/* EDITORIAL TECHNICAL FOOTPRINT                                */}
        {/* ============================================================ */}
        <div className="mt-16 pt-8 border-t border-white/[0.05] text-center text-xs text-zinc-500 select-none">
          <span>© Cuongisme &amp; Xuan Nghi</span>
        </div>

      </div>

      {/* Direct Transmission Modal */}
      <TransmissionModal
        isOpen={isTransmissionOpen}
        onClose={() => setIsTransmissionOpen(false)}
      />
    </main>
  );
}