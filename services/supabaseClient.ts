import { createClient } from '@supabase/supabase-js';

/**
 * Supabase Client with Safe Fallbacks
 * 
 * Environment Variables:
 * - VITE_SUPABASE_URL: Your Supabase project URL
 * - VITE_SUPABASE_ANON_KEY: Your Supabase anonymous key
 * 
 * Get these from Dashboard: Project Settings -> API
 */

// Safe fallback URLs to prevent runtime crashes
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://project-id.supabase.co';
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key-here';

// Validate URL format
const isValidSupabaseUrl = (url: string): boolean => {
  return url.startsWith('https://') && url.includes('supabase.co');
};

if (!isValidSupabaseUrl(SUPABASE_URL)) {
  console.warn(
    '⚠️ Invalid Supabase URL. Please set VITE_SUPABASE_URL in .env.local\n' +
    'Get it from: Supabase Dashboard -> Project Settings -> API\n' +
    'Format: https://project-id.supabase.co'
  );
}

if (SUPABASE_KEY === 'your-anon-key-here') {
  console.warn(
    '⚠️ Supabase Anonymous Key not configured. Please set VITE_SUPABASE_ANON_KEY in .env.local\n' +
    'Get it from: Supabase Dashboard -> Project Settings -> API (anon/public key)'
  );
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

/**
 * Health check for Supabase connection
 */
export const checkSupabaseHealth = async (): Promise<boolean> => {
  try {
    const { error } = await supabase.from('menu').select('id').limit(1);
    if (error) {
      console.error('Supabase health check failed:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Supabase connection error:', err);
    return false;
  }
};

export default supabase;
