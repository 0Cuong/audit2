import { useEffect, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { AppProvider } from './contexts/AppContext';
import { PersonalizationProvider, usePersonalization } from './contexts/PersonalizationContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import CommandPalette from './components/ui/CommandPalette';
import ScrollProgress from './components/ui/ScrollProgress';
import IntroExperience from './components/intro/IntroExperience';
import ErrorBoundary from './components/ErrorBoundary';
import AppearanceStudioModal from './components/studio/AppearanceStudioModal';
import AssetLibraryModal from './components/assets/AssetLibraryModal';
import CinematicWorldEngine from './components/cinematic/CinematicWorldEngine';
import CinematicScene from './components/cinematic/CinematicScene';
import { useState } from 'react';

const Dashboard = lazy(() => import('./pages/Dashboard'));
const Timeline = lazy(() => import('./pages/Timeline'));
const Memories = lazy(() => import('./pages/Memories'));
const Letters = lazy(() => import('./pages/Letters'));
const Journal = lazy(() => import('./pages/Journal'));
const MoodTracker = lazy(() => import('./pages/MoodTracker'));
const BucketList = lazy(() => import('./pages/BucketList'));
const Anniversary = lazy(() => import('./pages/Anniversary'));
const Zodiac = lazy(() => import('./pages/Zodiac'));
const LoveMap = lazy(() => import('./pages/LoveMap'));
const MusicPage = lazy(() => import('./pages/Music'));
const Gifts = lazy(() => import('./pages/Gifts'));
const Hub = lazy(() => import('./pages/Hub'));
const Contact = lazy(() => import('./pages/Contact'));
const SettingsPage = lazy(() => import('./pages/Settings'));
const CustomPageView = lazy(() => import('./pages/CustomPageView'));

function ThemedApp() {
  const { appearance, background } = usePersonalization();
  const location = useLocation();
  const [showIntro, setShowIntro] = useState(true);
  const [forceReplay, setForceReplay] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  // Global listener to replay intro from Navbar, Studio, or Settings
  useEffect(() => {
    const handleReplay = () => {
      setForceReplay(true);
      setShowIntro(true);
    };

    window.addEventListener('replay-intro', handleReplay);
    return () => window.removeEventListener('replay-intro', handleReplay);
  }, []);

  // Generate dynamic background style
  const getBgStyle = () => {
    const isImageOrGif = background.type === 'image' || background.type === 'gif';
    return {
      background: isImageOrGif ? `url(${background.value})` : background.value,
      backgroundSize: background.size || 'cover',
      backgroundPosition: background.position || 'center',
      backgroundRepeat: background.repeat || 'no-repeat',
      backgroundAttachment: background.fixed ? 'fixed' : 'scroll',
      opacity: background.opacity ?? 1,
      filter: `blur(${background.blur || 0}px) brightness(${background.brightness || 1}) contrast(${background.contrast || 1}) saturate(${background.saturation || 1})`,
    };
  };

  return (
    <div className="min-h-screen flex flex-col transition-colors duration-300 antialiased relative selection:bg-[#E5A93C]/30 selection:text-white bg-[#030306]">
      {/* 3D/4D Procedural Cosmic Spatial World Engine */}
      <CinematicWorldEngine />

      {/* Dynamic Background Media Layer (if user has custom background media) */}
      {background.type !== 'solid' && (
        <div 
          className="personal-os-bg-layer" 
          style={getBgStyle()} 
        />
      )}

      {/* Dynamic Background Darkening Overlay */}
      {background.overlayOpacity > 0 && (
        <div 
          className="personal-os-overlay" 
          style={{
            backgroundColor: background.overlayColor || '#000000',
            opacity: background.overlayOpacity,
          }}
        />
      )}

      {/* Film Grain Subtle Optical Overlay */}
      {appearance.noiseOverlay && <div className="noise-overlay" />}

      {/* Global Utilities */}
      <ScrollProgress />
      <CommandPalette />
      
      {/* Navigation Bar */}
      <Navbar />
      
      {/* Cinematic Spatial Route Views */}
      <div className="flex-grow relative z-10">
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
      </div>

      <Footer />

      {/* Global Modals */}
      <AppearanceStudioModal />
      <AssetLibraryModal />

      {/* Cinematic Opening Sequence Experience ("The World Is Being Assembled") */}
      {showIntro && (
        <IntroExperience
          forceReplay={forceReplay}
          onComplete={() => {
            setShowIntro(false);
            setForceReplay(false);
          }}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ErrorBoundary>
        <AppProvider>
          <PersonalizationProvider>
            <ThemedApp />
          </PersonalizationProvider>
        </AppProvider>
      </ErrorBoundary>
    </BrowserRouter>
  );
}