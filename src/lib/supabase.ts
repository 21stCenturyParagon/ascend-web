import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// KISS/DRY: minimal helper to read required envs with clear errors
function getRequiredEnv(name: string): string {
  const value = import.meta.env[name as keyof ImportMetaEnv] as unknown as string | undefined;
  if (!value) {
    throw new Error(`Missing environment variable: ${name}. Set it in .env.local`);
  }
  return value;
}

function getSiteOrigin(): string {
  try {
    const site = (import.meta.env.VITE_SITE_ORIGIN as unknown as string | undefined) || window.location.origin;
    return site.replace(/\/$/, '');
  } catch {
    return 'http://localhost:5173';
  }
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
        // Enable PKCE flow and auto-detect session from callback URL
        detectSessionInUrl: true,
        flowType: 'pkce',
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
      if ((error as { code?: string }).code === '23505') {
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

// OAuth: start Discord sign-in using PKCE. Redirect back to /auth/callback
export async function signInWithDiscord(redirectPath: string = '/auth/callback'): Promise<void> {
  const client = getSupabase();
  try {
    const siteOrigin = getSiteOrigin();
    const isAbsolute = /^https?:\/\//i.test(redirectPath);
    const normalizedPath = redirectPath.startsWith('/') ? redirectPath : `/${redirectPath}`;
    const redirectTo = isAbsolute ? redirectPath : `${siteOrigin}${normalizedPath}`;
    const { data, error } = await client.auth.signInWithOAuth({
      provider: 'discord',
      options: {
        redirectTo,
        scopes: 'identify email guilds',
      },
    });
    if (error) throw error;
    // supabase-js handles the redirect. data.url may be present in some envs
    if (data?.url) window.location.assign(data.url);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error starting Discord OAuth';
    throw new Error(message);
  }
}

// Check if user is a member of the Ascend Discord server
export async function checkDiscordServerMembership(): Promise<{ isMember: boolean; error?: string }> {
  const client = getSupabase();
  try {
    const { data: { session }, error: sessionError } = await client.auth.getSession();
    if (sessionError) throw sessionError;
    if (!session) throw new Error('No active session');

    const providerToken = session.provider_token;
    if (!providerToken) {
      throw new Error('Discord access token not found. Please re-authenticate.');
    }

    const guildId = getRequiredEnv('VITE_DISCORD_GUILD_ID');
    
    // Check if user is in the specific guild
    const response = await fetch(`https://discord.com/api/v10/users/@me/guilds`, {
      headers: {
        Authorization: `Bearer ${providerToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Discord API error: ${response.status}`);
    }

    const guilds = await response.json() as Array<{ id: string }>;
    const isMember = guilds.some(guild => guild.id === guildId);

    return { isMember };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error checking Discord membership';
    return { isMember: false, error: message };
  }
}

// Save player registration to database
export async function savePlayerRegistration(data: {
  riotId: string;
  twitter?: string;
  youtube?: string;
  ownsAccount: boolean;
}): Promise<{ success: boolean; id?: string; error?: string }> {
  const client = getSupabase();
  try {
    const { data: { user }, error: userError } = await client.auth.getUser();
    if (userError) throw userError;
    if (!user) throw new Error('User not authenticated');

    const { data: inserted, error: insertError } = await client
      .from('player_registrations')
      .insert([{
      user_id: user.id,
      riot_id: data.riotId.trim(),
      twitter: data.twitter?.trim() || null,
      youtube: data.youtube?.trim() || null,
      owns_account: data.ownsAccount,
      created_at: new Date().toISOString(),
    }])
      .select('id')
      .single();

    if (insertError) {
      if ((insertError as { code?: string }).code === '23505') {
        return { success: false, error: 'You have already submitted a registration.' };
      }
      throw insertError;
    }
    return { success: true, id: inserted.id };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error saving registration';
    return { success: false, error: message };
  }
}

// Fire Discord moderation webhook through Edge Function
export async function queueRegistrationForModeration(payload: {
  registrationId: string;
  riotId: string;
  twitter?: string | null;
  youtube?: string | null;
  userId: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const url = getRequiredEnv('VITE_SUPABASE_URL');
    const anon = getRequiredEnv('VITE_SUPABASE_ANON_KEY');
    const res = await fetch(`${url}/functions/v1/moderation-request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${anon}` },
      body: JSON.stringify({
        registration_id: payload.registrationId,
        riot_id: payload.riotId,
        twitter: payload.twitter ?? null,
        youtube: payload.youtube ?? null,
        user_id: payload.userId,
      }),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Moderation webhook failed: ${res.status} ${text}`);
    }
    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error queueing moderation';
    return { success: false, error: message };
  }
}


