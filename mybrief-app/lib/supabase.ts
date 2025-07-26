import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// User preference helpers
export async function getUserPreferences(userId: string) {
  const { data, error } = await supabase
    .from('users')
    .select('feeds, display_mode, digest_time, timezone')
    .eq('id', userId)
    .single();
  if (error) throw error;
  return data;
}

export async function setUserPreferences(userId: string, prefs: {
  feeds?: any,
  display_mode?: string,
  digest_time?: string,
  timezone?: string
}) {
  const { error } = await supabase
    .from('users')
    .update(prefs)
    .eq('id', userId);
  if (error) throw error;
} 