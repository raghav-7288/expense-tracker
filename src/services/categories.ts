import { supabase } from '@/lib/supabase';
import type {
  SystemCategory,
  UserCategory,
  MergedCategory,
  CreateCategoryInput,
  UpdateCategoryInput,
  TransactionType,
  HiddenCategory,
} from '@/types';

/**
 * Fetch system categories (global, immutable).
 */
export async function getSystemCategories(type?: TransactionType) {
  let query = supabase
    .from('system_categories')
    .select('*')
    .order('name');

  if (type) {
    query = query.eq('type', type);
  }

  const { data, error } = await query;
  return { data: data as SystemCategory[] | null, error };
}

/**
 * Fetch user-created categories (custom, editable).
 */
export async function getUserCategories(userId: string, type?: TransactionType) {
  let query = supabase
    .from('user_categories')
    .select('*')
    .eq('user_id', userId)
    .is('deleted_at', null)
    .order('name');

  if (type) {
    query = query.eq('type', type);
  }

  const { data, error } = await query;
  return { data: data as UserCategory[] | null, error };
}

/**
 * Fetch hidden system category IDs for a user.
 */
export async function getHiddenCategories(userId: string) {
  const { data, error } = await supabase
    .from('user_hidden_categories')
    .select('*')
    .eq('user_id', userId);

  return { data: data as HiddenCategory[] | null, error };
}

/**
 * Get merged categories for a user: system (minus hidden) + user custom.
 */
export async function getMergedCategories(
  userId: string,
  type?: TransactionType,
): Promise<{ data: MergedCategory[] | null; error: unknown }> {
  const [systemResult, userResult, hiddenResult] = await Promise.all([
    getSystemCategories(type),
    getUserCategories(userId, type),
    getHiddenCategories(userId),
  ]);

  if (systemResult.error) return { data: null, error: systemResult.error };
  if (userResult.error) return { data: null, error: userResult.error };
  if (hiddenResult.error) return { data: null, error: hiddenResult.error };

  const hiddenIds = new Set(
    (hiddenResult.data ?? []).map((h) => h.category_id),
  );

  const systemCategories: MergedCategory[] = (systemResult.data ?? [])
    .filter((sc) => !hiddenIds.has(sc.id))
    .map((sc) => ({
      id: sc.id,
      name: sc.name,
      type: sc.type,
      color: sc.color,
      icon: sc.icon,
      source: 'system' as const,
      isDefault: true,
      isCustom: false,
      editable: false,
      deletable: false,
      source_category_id: null,
    }));

  const userCategories: MergedCategory[] = (userResult.data ?? []).map((uc) => ({
    id: uc.id,
    name: uc.name,
    type: uc.type,
    color: uc.color,
    icon: uc.icon,
    source: 'user' as const,
    isDefault: false,
    isCustom: true,
    editable: true,
    deletable: true,
    source_category_id: uc.source_category_id,
  }));

  const merged = [...systemCategories, ...userCategories].sort((a, b) =>
    a.name.localeCompare(b.name),
  );

  return { data: merged, error: null };
}

/**
 * Create a new user category.
 */
export async function createUserCategory(input: CreateCategoryInput) {
  const { data, error } = await supabase
    .from('user_categories')
    .insert({
      user_id: input.user_id,
      name: input.name.trim(),
      type: input.type,
      color: input.color,
      icon: input.icon,
      source_category_id: input.source_category_id ?? null,
    })
    .select()
    .single();

  return { data: data as UserCategory | null, error };
}

/**
 * Update a user category. Only user-created categories can be updated.
 */
export async function updateUserCategory(id: string, userId: string, input: UpdateCategoryInput) {
  const { data, error } = await supabase
    .from('user_categories')
    .update({
      ...(input.name !== undefined && { name: input.name.trim() }),
      ...(input.color !== undefined && { color: input.color }),
      ...(input.icon !== undefined && { icon: input.icon }),
    })
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .single();

  return { data: data as UserCategory | null, error };
}

/**
 * Soft-delete a user category.
 */
export async function deleteUserCategory(id: string, userId: string) {
  const { error } = await supabase
    .from('user_categories')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', userId);

  return { error };
}

/**
 * Hide a system category for a user (does not delete the system category).
 */
export async function hideSystemCategory(userId: string, categoryId: string) {
  const { error } = await supabase
    .from('user_hidden_categories')
    .insert({ user_id: userId, category_id: categoryId });

  return { error };
}

/**
 * Restore (unhide) a system category for a user.
 */
export async function restoreSystemCategory(userId: string, categoryId: string) {
  const { error } = await supabase
    .from('user_hidden_categories')
    .delete()
    .eq('user_id', userId)
    .eq('category_id', categoryId);

  return { error };
}

/**
 * Copy a system category as a user category (makes it editable).
 */
export async function copySystemCategory(userId: string, categoryId: string) {
  const { data: systemCat, error: fetchError } = await supabase
    .from('system_categories')
    .select('*')
    .eq('id', categoryId)
    .single();

  if (fetchError || !systemCat) {
    return { data: null, error: fetchError ?? new Error('System category not found') };
  }

  const sc = systemCat as SystemCategory;

  const { data, error } = await supabase
    .from('user_categories')
    .insert({
      user_id: userId,
      name: `${sc.name} (Copy)`,
      type: sc.type,
      color: sc.color,
      icon: sc.icon,
      source_category_id: sc.id,
    })
    .select()
    .single();

  return { data: data as UserCategory | null, error };
}

/**
 * Get hidden system categories for displaying in "Hidden" filter.
 */
export async function getHiddenSystemCategories(userId: string) {
  const { data: hidden, error: hiddenError } = await supabase
    .from('user_hidden_categories')
    .select('category_id')
    .eq('user_id', userId);

  if (hiddenError || !hidden || hidden.length === 0) {
    return { data: [] as MergedCategory[], error: hiddenError };
  }

  const hiddenIds = hidden.map((h) => h.category_id);

  const { data: categories, error } = await supabase
    .from('system_categories')
    .select('*')
    .in('id', hiddenIds)
    .order('name');

  if (error) return { data: null, error };

  const result: MergedCategory[] = (categories as SystemCategory[]).map((sc) => ({
    id: sc.id,
    name: sc.name,
    type: sc.type,
    color: sc.color,
    icon: sc.icon,
    source: 'system' as const,
    isDefault: true,
    isCustom: false,
    editable: false,
    deletable: false,
    source_category_id: null,
  }));

  return { data: result, error: null };
}

