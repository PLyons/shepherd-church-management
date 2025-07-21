import { createClient } from '@supabase/supabase-js';

// Check if we're running in Node.js or browser
const isNode = typeof window === 'undefined' && typeof global !== 'undefined';

const supabaseUrl = isNode ? process.env.VITE_SUPABASE_URL : import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = isNode ? process.env.VITE_SUPABASE_ANON_KEY : import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Check your .env.local file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true // Re-enabled to let Supabase handle the session
  }
});