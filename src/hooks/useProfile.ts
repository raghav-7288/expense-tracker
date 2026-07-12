import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { queryKeys } from '@/lib/queryKeys';
import { getProfile, updateProfile } from '@/services/profiles';
import type { UpdateProfileInput } from '@/types';
import toast from 'react-hot-toast';

export function useProfile() {
  const { user } = useAuth();

  return useQuery({
    queryKey: queryKeys.profile.detail(user?.id),
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await getProfile(user.id);
      if (error) throw new Error(error.message);
      return data;
    },
    enabled: !!user,
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (input: UpdateProfileInput) => {
      if (!user) throw new Error('Not authenticated');
      const { data, error } = await updateProfile(user.id, input);
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.profile.detail(user?.id) });
      toast.success('Profile updated');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update profile');
    },
  });
}
