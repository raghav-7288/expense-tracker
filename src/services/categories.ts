import { supabase } from '@/lib/supabase';
import type { Category, CreateCategoryInput, UpdateCategoryInput, TransactionType } from '@/types';

export async function getCategories(userId: string, type?: TransactionType) {
  let query = supabase
    .from('categories')
    .select('*')
    .eq('user_id', userId)
    .order('name');

  if (type) {
    query = query.eq('type', type);
  }

  const { data, error } = await query;
  return { data: data as Category[] | null, error };
}

export async function createCategory(input: CreateCategoryInput) {
  const { data, error } = await supabase
    .from('categories')
    .insert(input)
    .select()
    .single();

  return { data: data as Category | null, error };
}

export async function updateCategory(id: string, input: UpdateCategoryInput) {
  const { data, error } = await supabase
    .from('categories')
    .update(input)
    .eq('id', id)
    .select()
    .single();

  return { data: data as Category | null, error };
}

export async function deleteCategory(id: string) {
  const { error } = await supabase
    .from('categories')
    .delete()
    .eq('id', id);

  return { error };
}

