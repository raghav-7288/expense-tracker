import { useProfile } from '@/hooks/useProfile';

/**
 * Returns the user's preferred currency code from their profile.
 * Falls back to 'USD' if profile hasn't loaded yet.
 */
export function useCurrency(): string {
  const { data: profile } = useProfile();
  return profile?.currency ?? 'USD';
}

