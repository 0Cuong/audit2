import { lazy, Suspense, useEffect, useState } from 'react';
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
import CinematicWorldEngine from './components/cinematic/CinematicWorldEngine';
import CinematicScene from './components/cinematic/CinematicScene';

const AppearanceStudioModal = lazy(() => import('./components/studio/AppearanceStudioModal'));
const AssetLibraryModal = lazy(() => import('./components/assets/AssetLibraryModal'));

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

function BackgroundLayer() {
  const { appearance, background } = usePersonalization();

  const getBackgroundStyle = () => {
    const media = background.type === 'image' || background.type === 'gif';
    return {
      background: media ? `url(${background.value})` : background.value,
      backgroundSize: background.size || 'cover',
      backgroundPosition: background.position || 'center',
      backgroundRepeat: background.repeat || 'no-repeat',
      backgroundAttachment: background.fixed ? 'fixed' : 'scroll',
      opacity: background.opacity ?? 1,
      filter: `blur(${background.blur || 0}px) brightness(${background.brightness || 1}) contrast(${background.contrast || 1}) saturate(${background.saturation || 1})`,
    };
  };

  return (
    <>
      <CinematicWorldEngine />
      {background.type !== 'solid' && <div className="personal-os-bg-layer" style={getBackgroundStyle()} aria-hidden="true" />}
      {background.overlayOpacity > 0 && (
        <div
          className="personal-os-overlay"
          style={{ backgroundColor: background.overlayColor || '#000000', opacity: background.overlayOpacity }}
          aria-hidden="true"
        />
      )}
      {appearance.noiseOverlay && <div className="noise-overlay" aria-hidden="true" />}
    </>
  );
}

const routes = [
  ['/', 'dash', Dashboard], ['dashboard', 'dash', Dashboard], ['timeline', 'timeline', Timeline],
  ['memories', 'memories', Memories], ['letters', 'letters', Letters], ['journal', 'journal', Journal],
  ['mood', 'mood', MoodTracker], ['bucket-list', 'bucket', BucketList], ['anniversary', 'anniv', Anniversary],
  ['zodiac', 'zodiac', Zodiac], ['map', 'map', LoveMap], ['music', 'music', MusicPage],
  ['gifts', 'gifts', Gifts], ['hub', 'hub', Hub], ['contact', 'contact', Contact],
  ['settings', 'settings', SettingsPage], ['page/:pageId', 'custom-page', CustomPageView],
] as const;

function ThemedApp() {
  const location = useLocation();
  const [showIntro, setShowIntro] = useState(true);
  const [forceReplay, setForceReplay] = useState(false);

  useEffect(() => window.scrollTo(0, 0), [location.pathname]);

  useEffect(() => {
    const handleReplay = () => {
      setForceReplay(true);
      setShowIntro(true);
    };
    window.addEventListener('replay-intro', handleReplay);
    return () => window.removeEventListener('replay-intro', handleReplay);
  }, []);

  return (
    <div className="min-h-screen flex flex-col antialiased relative selection:bg-[#E5A93C]/30 selection:text-white bg-[var(--p-bg,#09090c)]">
      <BackgroundLayer />
      <ScrollProgress />
      <CommandPalette />
      <Navbar />

      <main className="flex-grow relative z-10">
        <Suspense fallback={<div className="flex items-center justify-center min-h-[60vh]" aria-live="polite"><div className="w-7 h-7 rounded-full border-2 border-[var(--p-border)] border-t-[var(--p-accent)] animate-spin" /></div>}>
          <AnimatePresence mode="wait">
            <Routes location={location} key={location.pathname}>
              {routes.map(([path, sceneId, Page]) => (
                <Route key={path} path={path} element={<CinematicScene sceneId={sceneId}><Page /></CinematicScene>} />
              ))}
            </Routes>
          </AnimatePresence>
        </Suspense>
      </main>

      <Footer />

      <Suspense fallback={null}>
        <AppearanceStudioModal />
        <AssetLibraryModal />
      </Suspense>

      {showIntro && <IntroExperience forceReplay={forceReplay} onComplete={() => { setShowIntro(false); setForceReplay(false); }} />}
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
