import { lazy, Suspense } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Routes, Route, useLocation } from 'react-router-dom';
import CinematicScene from '../components/cinematic/CinematicScene';

const Dashboard = lazy(() => import('../pages/Dashboard'));
const Timeline = lazy(() => import('../pages/Timeline'));
const Memories = lazy(() => import('../pages/Memories'));
const Letters = lazy(() => import('../pages/Letters'));
const Journal = lazy(() => import('../pages/Journal'));
const MoodTracker = lazy(() => import('../pages/MoodTracker'));
const BucketList = lazy(() => import('../pages/BucketList'));
const Anniversary = lazy(() => import('../pages/Anniversary'));
const Zodiac = lazy(() => import('../pages/Zodiac'));
const LoveMap = lazy(() => import('../pages/LoveMap'));
const MusicPage = lazy(() => import('../pages/Music'));
const Gifts = lazy(() => import('../pages/Gifts'));
const Hub = lazy(() => import('../pages/Hub'));
const Contact = lazy(() => import('../pages/Contact'));
const SettingsPage = lazy(() => import('../pages/Settings'));
const CustomPageView = lazy(() => import('../pages/CustomPageView'));

export default function AppRoutes() {
  const location = useLocation();

  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 rounded-full border-2 border-[#E5A93C]/20 border-t-[#E5A93C] animate-spin" />
      </div>
    }>
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<CinematicScene sceneId="dash"><Dashboard /></CinematicScene>} />
          <Route path="/dashboard" element={<CinematicScene sceneId="dash"><Dashboard /></CinematicScene>} />
          <Route path="/timeline" element={<CinematicScene sceneId="timeline"><Timeline /></CinematicScene>} />
          <Route path="/memories" element={<CinematicScene sceneId="memories"><Memories /></CinematicScene>} />
          <Route path="/letters" element={<CinematicScene sceneId="letters"><Letters /></CinematicScene>} />
          <Route path="/journal" element={<CinematicScene sceneId="journal"><Journal /></CinematicScene>} />
          <Route path="/mood" element={<CinematicScene sceneId="mood"><MoodTracker /></CinematicScene>} />
          <Route path="/bucket-list" element={<CinematicScene sceneId="bucket"><BucketList /></CinematicScene>} />
          <Route path="/anniversary" element={<CinematicScene sceneId="anniv"><Anniversary /></CinematicScene>} />
          <Route path="/zodiac" element={<CinematicScene sceneId="zodiac"><Zodiac /></CinematicScene>} />
          <Route path="/map" element={<CinematicScene sceneId="map"><LoveMap /></CinematicScene>} />
          <Route path="/music" element={<CinematicScene sceneId="music"><MusicPage /></CinematicScene>} />
          <Route path="/gifts" element={<CinematicScene sceneId="gifts"><Gifts /></CinematicScene>} />
          <Route path="/hub" element={<CinematicScene sceneId="hub"><Hub /></CinematicScene>} />
          <Route path="/contact" element={<CinematicScene sceneId="contact"><Contact /></CinematicScene>} />
          <Route path="/settings" element={<CinematicScene sceneId="settings"><SettingsPage /></CinematicScene>} />
          <Route path="/page/:pageId" element={<CinematicScene sceneId="custom-page"><CustomPageView /></CinematicScene>} />
        </Routes>
      </AnimatePresence>
    </Suspense>
  );
}
