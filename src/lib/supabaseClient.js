import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();

const validSupabaseUrl = (() => {
  if (!supabaseUrl) return false;
  try {
    const url = new URL(supabaseUrl);
    return (
      (url.protocol === 'https:' || (url.protocol === 'http:' && url.hostname === 'localhost')) &&
      Boolean(url.host)
    );
  } catch {
    return false;
  }
})();

export const isLiveSupabaseConfigured = Boolean(
  validSupabaseUrl &&
  supabaseAnonKey &&
  !supabaseAnonKey.startsWith('sb_secret_')
);
export const supabase = isLiveSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;
