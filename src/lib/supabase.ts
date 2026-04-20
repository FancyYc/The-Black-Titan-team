import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const isSupabaseConfigured = Boolean(url && anonKey);

// When not configured, create a dummy client that won't make real network calls.
// Auth features (Google login) require VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY in .env
export const supabaseClient = isSupabaseConfigured
  ? createClient(url!, anonKey!)
  : createClient('https://uzewapygqfdcbvyjocww.supabase.co', 'anon-key-not-configured');
