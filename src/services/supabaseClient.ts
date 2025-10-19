import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database.types';

let client: SupabaseClient<Database> | null = null;

function assertEnv(name: string, value: string | undefined): asserts value is string {
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
}

export function getSupabaseClient(): SupabaseClient<Database> {
  if (client) {
    return client;
  }

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  assertEnv('VITE_SUPABASE_URL', supabaseUrl);
  assertEnv('VITE_SUPABASE_ANON_KEY', supabaseAnonKey);

  client = createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      storageKey: 'manga-reader-auth'
    }
  });

  return client;
}

export async function getCurrentUserId(): Promise<string | null> {
  try {
    const { data } = await getSupabaseClient().auth.getSession();
    return data.session?.user.id ?? null;
  } catch (error) {
    console.warn('Supabase session lookup failed, falling back to anonymous access.', error);
    return null;
  }
}
