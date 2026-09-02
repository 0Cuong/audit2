import { createClient } from '@supabase/supabase-js';

const rawUrl = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim() || '';
const rawKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)?.trim() || '';

export const isSupabaseConfigured = Boolean(
  rawUrl &&
  rawKey &&
  rawUrl.startsWith('http') &&
  !rawUrl.includes('placeholder') &&
  !rawUrl.includes('your-project')
);

// Fallback to dummy endpoint if unconfigured so client methods don't crash on load
export const supabase = createClient(
  isSupabaseConfigured ? rawUrl : 'https://placeholder.supabase.co',
  isSupabaseConfigured ? rawKey : 'placeholder-anon-key',
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    }
  }
);
