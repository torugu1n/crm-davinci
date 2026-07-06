import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const createSupabaseClient = (token?: string) => {
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Supabase credentials are not set in environment variables.');
  }

  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: token ? {
        Authorization: `Bearer ${token}`,
      } : {},
    },
    auth: {
      persistSession: false,
    },
  });
};

export const supabase = createSupabaseClient();
