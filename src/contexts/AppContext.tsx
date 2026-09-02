import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { translations, type Lang } from '../i18n/translations';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { safeGetStorage, safeSetStorage } from '../lib/storage';

// --- Types ---
export interface CoupleProfile {
  id: string;
  partner1_name: string;
  partner1_avatar: string;
  partner1_gender: string;
  partner1_birthday: string | null;
  partner2_name: string;
  partner2_avatar: string;
  partner2_gender: string;
  partner2_birthday: string | null;
  relationship_status: string;
  relationship_start: string;
}

export interface AppSettings {
  id: string;
  language: Lang;
  theme: string;
  contact_links: { label: string; url: string; icon: string }[];
  privacy_mode: boolean;
  password_hash?: string;
  privacy_password?: string;
  notifications_enabled: boolean;
}

export type ThemeId = 'dark' | 'light' | 'purple' | 'pink' | 'emerald' | 'sunset' | 'midnight';

export const themeConfig: Record<ThemeId, {
  name: string;
  bg: string;
  surface: string;
  card: string;
  border: string;
  text: string;
  textMuted: string;
  accent: string;
  accentHover: string;
  accentText: string;
  accentMuted: string;
}> = {
  dark: {
    name: 'Dark Slate',
    bg: 'bg-[#121214]',
    surface: 'bg-[#18181b]',
    card: 'bg-zinc-900/60',
    border: 'border-white/[0.08]',
    text: 'text-zinc-100',
    textMuted: 'text-zinc-400',
    accent: 'bg-zinc-100',
    accentHover: 'hover:bg-white',
    accentText: 'text-zinc-200',
    accentMuted: 'bg-white/[0.06]',
  },
  light: {
    name: 'Editorial Light',
    bg: 'bg-[#F4F4F5]',
    surface: 'bg-[#E4E4E7]',
    card: 'bg-white/80 shadow-sm',
    border: 'border-black/[0.08]',
    text: 'text-zinc-900',
    textMuted: 'text-zinc-500',
    accent: 'bg-zinc-900',
    accentHover: 'hover:bg-zinc-800',
    accentText: 'text-zinc-900',
    accentMuted: 'bg-black/[0.05]',
  },
  purple: {
    name: 'Obsidian Velvet',
    bg: 'bg-[#0f0e13]',
    surface: 'bg-[#16151c]',
    card: 'bg-zinc-900/60',
    border: 'border-purple-500/[0.15]',
    text: 'text-zinc-100',
    textMuted: 'text-zinc-400',
    accent: 'bg-purple-400',
    accentHover: 'hover:bg-purple-300',
    accentText: 'text-purple-300',
    accentMuted: 'bg-purple-500/10',
  },
  pink: {
    name: 'Rose Charcoal',
    bg: 'bg-[#131012]',
    surface: 'bg-[#1a1518]',
    card: 'bg-zinc-900/60',
    border: 'border-rose-500/[0.15]',
    text: 'text-zinc-100',
    textMuted: 'text-zinc-400',
    accent: 'bg-rose-500',
    accentHover: 'hover:bg-rose-400',
    accentText: 'text-rose-400',
    accentMuted: 'bg-rose-500/10',
  },
  emerald: {
    name: 'Dark Emerald',
    bg: 'bg-[#0e1310]',
    surface: 'bg-[#141b17]',
    card: 'bg-zinc-900/60',
    border: 'border-emerald-500/[0.15]',
    text: 'text-zinc-100',
    textMuted: 'text-zinc-400',
    accent: 'bg-emerald-500',
    accentHover: 'hover:bg-emerald-400',
    accentText: 'text-emerald-400',
    accentMuted: 'bg-emerald-500/10',
  },
  sunset: {
    name: 'Dark Amber',
    bg: 'bg-[#14110e]',
    surface: 'bg-[#1b1713]',
    card: 'bg-zinc-900/60',
    border: 'border-amber-500/[0.15]',
    text: 'text-zinc-100',
    textMuted: 'text-zinc-400',
    accent: 'bg-amber-500',
    accentHover: 'hover:bg-amber-400',
    accentText: 'text-amber-400',
    accentMuted: 'bg-amber-500/10',
  },
  midnight: {
    name: 'Midnight Slate',
    bg: 'bg-[#0d1017]',
    surface: 'bg-[#131720]',
    card: 'bg-zinc-900/60',
    border: 'border-blue-500/[0.15]',
    text: 'text-zinc-100',
    textMuted: 'text-zinc-400',
    accent: 'bg-blue-400',
    accentHover: 'hover:bg-blue-300',
    accentText: 'text-blue-300',
    accentMuted: 'bg-blue-500/10',
  },
};

export const DEFAULT_PROFILE: CoupleProfile = {
  id: 'default-profile',
  partner1_name: 'Mcuong',
  partner1_avatar: '/590610904_1909263110009109_2160755825373491978_n.jpg',
  partner1_gender: 'male',
  partner1_birthday: '2004-09-12',
  partner2_name: 'Xnghi',
  partner2_avatar: '/605572670_122215932062047100_7842864668271503382_n.jpg',
  partner2_gender: 'female',
  partner2_birthday: '2005-01-03',
  relationship_status: 'dating',
  relationship_start: '2024-05-18T00:00:00.000Z',
};

export const DEFAULT_SETTINGS: AppSettings = {
  id: 'default-settings',
  language: 'vi',
  theme: 'dark',
  contact_links: [
    { label: 'Facebook Cuong', url: 'https://www.facebook.com/0Cuongisme', icon: 'facebook' },
    { label: 'Instagram Cuong', url: 'https://www.instagram.com/_kodl0/', icon: 'instagram' },
    { label: 'Facebook Nghi', url: 'https://www.facebook.com/nghinghi0301', icon: 'facebook' },
    { label: 'Instagram Nghi', url: 'https://www.instagram.com/hx.nghii/', icon: 'instagram' },
  ],
  privacy_mode: false,
  privacy_password: '',
  notifications_enabled: true,
};

// --- Context ---
interface AppContextValue {
  lang: Lang;
  setLang: (l: Lang) => Promise<void>;
  t: (key: string) => string;
  theme: ThemeId;
  setTheme: (t: ThemeId) => Promise<void>;
  tc: typeof themeConfig[ThemeId];
  profile: CoupleProfile | null;
  setProfile: (p: CoupleProfile) => void;
  updateProfile: (updates: Partial<CoupleProfile>) => Promise<boolean>;
  settings: AppSettings | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
  refreshSettings: () => Promise<void>;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    return safeGetStorage<Lang>('cuongisme_lang', 'vi');
  });

  const [theme, setThemeState] = useState<ThemeId>(() => {
    return safeGetStorage<ThemeId>('cuongisme_theme', 'dark');
  });

  const [profile, setProfileState] = useState<CoupleProfile>(() => {
    return safeGetStorage<CoupleProfile>('cuongisme_profile', DEFAULT_PROFILE);
  });

  const [settings, setSettingsState] = useState<AppSettings>(() => {
    return safeGetStorage<AppSettings>('cuongisme_settings', DEFAULT_SETTINGS);
  });

  const [loading, setLoading] = useState(true);

  const t = useCallback((key: string) => {
    return translations[lang]?.[key] || key;
  }, [lang]);

  const tc = themeConfig[theme] || themeConfig.dark;

  const setProfile = useCallback((p: CoupleProfile) => {
    setProfileState(p);
    safeSetStorage('cuongisme_profile', p);
  }, []);


  const refreshProfile = useCallback(async () => {
    if (!isSupabaseConfigured) return;
    try {
      const { data, error } = await supabase.from('couple_profile').select('*').limit(1).maybeSingle();
      if (!error && data) {
        setProfileState(data);
        safeSetStorage('cuongisme_profile', data);
      }
    } catch (error) {
      console.warn('[AppContext] Remote profile fetch failed, staying on local profile.');
    }
  }, []);

  const refreshSettings = useCallback(async () => {
    if (!isSupabaseConfigured) return;
    try {
      const { data, error } = await supabase.from('settings').select('*').limit(1).maybeSingle();
      if (!error && data) {
        setSettingsState(data as AppSettings);
        safeSetStorage('cuongisme_settings', data);
        if (data.language) {
          setLangState(data.language as Lang);
          safeSetStorage('cuongisme_lang', data.language);
        }
        if (data.theme && themeConfig[data.theme as ThemeId]) {
          setThemeState(data.theme as ThemeId);
          safeSetStorage('cuongisme_theme', data.theme);
        }
      }
    } catch (error) {
      console.warn('[AppContext] Remote settings fetch failed, staying on local settings.');
    }
  }, []);

  const updateProfile = useCallback(async (updates: Partial<CoupleProfile>): Promise<boolean> => {
    const updated = { ...profile, ...updates };
    setProfileState(updated);
    safeSetStorage('cuongisme_profile', updated);

    if (!isSupabaseConfigured || !profile?.id || profile.id === DEFAULT_PROFILE.id) {
      return true;
    }

    try {
      const { data, error } = await supabase
        .from('couple_profile')
        .update(updates)
        .eq('id', profile.id)
        .select()
        .single();

      if (!error && data) {
        setProfileState(data);
        safeSetStorage('cuongisme_profile', data);
      }
      return true;
    } catch (error) {
      console.warn('[AppContext] Saved profile locally (remote sync unavailable)');
      return true;
    }
  }, [profile]);

  // Master Initialization Lifecycle - Guaranteed to exit loading state
  useEffect(() => {
    let active = true;

    const initialize = async () => {
      try {
        if (isSupabaseConfigured) {
          // Wrap remote queries with a strict timeout so network stalls can never hang initialization
          const timeoutPromise = new Promise((resolve) => setTimeout(resolve, 2000));
          const fetchPromise = Promise.allSettled([
            supabase.from('couple_profile').select('*').limit(1).maybeSingle(),
            supabase.from('settings').select('*').limit(1).maybeSingle()
          ]);

          const result = await Promise.race([fetchPromise, timeoutPromise]) as PromiseSettledResult<any>[] | undefined;

          if (active && Array.isArray(result)) {
            const [profileRes, settingsRes] = result;

            if (profileRes.status === 'fulfilled' && profileRes.value?.data) {
              const remoteProfile = profileRes.value.data as CoupleProfile;
              setProfileState(remoteProfile);
              safeSetStorage('cuongisme_profile', remoteProfile);
            }

            if (settingsRes.status === 'fulfilled' && settingsRes.value?.data) {
              const remoteSettings = settingsRes.value.data as AppSettings;
              setSettingsState(remoteSettings);
              safeSetStorage('cuongisme_settings', remoteSettings);
              if (remoteSettings.language) {
                setLangState(remoteSettings.language as Lang);
                safeSetStorage('cuongisme_lang', remoteSettings.language);
              }
              if (remoteSettings.theme && themeConfig[remoteSettings.theme as ThemeId]) {
                setThemeState(remoteSettings.theme as ThemeId);
                safeSetStorage('cuongisme_theme', remoteSettings.theme);
              }
            }
          }
        }
      } catch (err) {
        console.warn('[AppContext] Initialization error, proceeding with cached/default data:', err);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    initialize();

    return () => {
      active = false;
    };
  }, []);

  // Sync background colors with theme
  useEffect(() => {
    const body = document.body;
    const allBgClasses = Object.values(themeConfig).flatMap(c => c.bg.split(' '));
    body.classList.remove(...allBgClasses);
    const currentBgClasses = tc.bg.split(' ');
    body.classList.add(...currentBgClasses);
  }, [tc]);

  const setLang = useCallback(async (l: Lang) => {
    setLangState(l);
    safeSetStorage('cuongisme_lang', l);
    if (isSupabaseConfigured && settings?.id && settings.id !== DEFAULT_SETTINGS.id) {
      try {
        await supabase.from('settings').update({ language: l }).eq('id', settings.id);
      } catch (e) {
        // Silent catch for local mode
      }
    }
  }, [settings?.id]);

  const setTheme = useCallback(async (th: ThemeId) => {
    setThemeState(th);
    safeSetStorage('cuongisme_theme', th);
    if (isSupabaseConfigured && settings?.id && settings.id !== DEFAULT_SETTINGS.id) {
      try {
        await supabase.from('settings').update({ theme: th }).eq('id', settings.id);
      } catch (e) {
        // Silent catch for local mode
      }
    }
  }, [settings?.id]);

  return (
    <AppContext.Provider value={{
      lang,
      setLang,
      t,
      theme,
      setTheme,
      tc,
      profile,
      setProfile,
      updateProfile,
      settings,
      loading,
      refreshProfile,
      refreshSettings,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be inside AppProvider');
  return ctx;
}