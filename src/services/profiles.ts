import { supabase } from '@/lib/supabase';
import type { Profile, UpdateProfileInput } from '@/types';

export async function getProfile(userId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  return { data: data as Profile | null, error };
}

export async function updateProfile(userId: string, input: UpdateProfileInput) {
  // Whitelist allowed fields to prevent injection of unexpected columns
  const safeInput: Record<string, unknown> = {};
  if (input.full_name !== undefined) safeInput.full_name = input.full_name;
  if (input.avatar_url !== undefined) safeInput.avatar_url = input.avatar_url;
  if (input.currency !== undefined) safeInput.currency = input.currency;

  const { data, error } = await supabase
    .from('profiles')
    .update(safeInput)
    .eq('id', userId)
    .select()
    .single();

  return { data: data as Profile | null, error };
}

