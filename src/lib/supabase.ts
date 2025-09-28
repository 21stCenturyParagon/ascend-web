import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// KISS/DRY: minimal helper to read required envs with clear errors
function getRequiredEnv(name: string): string {
  const value = import.meta.env[name as keyof ImportMetaEnv] as unknown as string | undefined;
  if (!value) {
    throw new Error(`Missing environment variable: ${name}. Set it in .env.local`);
  }
  return value;
}

let cachedClient: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (cachedClient) return cachedClient;
  try {
    const url = getRequiredEnv('VITE_SUPABASE_URL');
    const anon = getRequiredEnv('VITE_SUPABASE_ANON_KEY');
    cachedClient = createClient(url, anon, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    });
    return cachedClient;
  } catch (error) {
    // Explicit exception handling with actionable message
    const message = error instanceof Error ? error.message : 'Unknown error creating Supabase client';
    throw new Error(`Supabase initialization failed: ${message}`);
  }
}

export async function addToWaitlist(email: string): Promise<{ success: boolean; error?: string }> {
  const client = getSupabase();
  try {
    const normalized = email.toLowerCase().trim();
    const { error } = await client.from('waitlist').insert([{ email: normalized }]);
    if (error) {
      if ((error as any).code === '23505') {
        return { success: false, error: 'This email is already on the waitlist!' };
      }
      throw error;
    }
    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return { success: false, error: `Unable to join waitlist. ${message}` };
  }
}


