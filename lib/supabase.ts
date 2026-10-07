import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim();
const supabaseServiceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();

let supabaseClient: SupabaseClient | null = null;

/**
 * Production wajib menggunakan Supabase Service Role Key.
 * Local JSON hanya boleh menjadi fallback saat development lokal.
 */
export function getSupabase(): SupabaseClient | null {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!supabaseUrl || !supabaseUrl.startsWith('https://')) {
    if (isProduction) {
      throw new Error('NEXT_PUBLIC_SUPABASE_URL belum dikonfigurasi di Vercel.');
    }
    return null;
  }

  if (!supabaseServiceKey) {
    if (isProduction) {
      throw new Error('SUPABASE_SERVICE_ROLE_KEY belum dikonfigurasi di Vercel.');
    }
    return null;
  }

  if (!supabaseClient) {
    supabaseClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
      global: {
        headers: {
          'x-application-name': 'absen-skanexa',
        },
      },
    });
  }

  return supabaseClient;
}

export function isSupabaseConfigured(): boolean {
  return Boolean(
    supabaseUrl &&
    supabaseUrl.startsWith('https://') &&
    supabaseServiceKey
  );
}
