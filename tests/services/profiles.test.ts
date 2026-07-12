import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getProfile, updateProfile } from '@/services/profiles';

const mockSingle = vi.fn();
const mockSelect = vi.fn().mockReturnValue({ single: mockSingle });
const mockUpdate = vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ select: mockSelect }) });
const mockEq = vi.fn().mockReturnValue({ single: mockSingle });
const mockSelectRoot = vi.fn().mockReturnValue({ eq: mockEq });

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn().mockImplementation(() => ({
      select: mockSelectRoot,
      update: mockUpdate,
    })),
  },
}));

describe('profiles service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getProfile', () => {
    it('returns profile data on success', async () => {
      const profile = { id: 'user-1', email: 'a@b.com', full_name: 'User', currency: 'USD' };
      mockSingle.mockResolvedValue({ data: profile, error: null });

      const result = await getProfile('user-1');
      expect(result.data).toEqual(profile);
      expect(result.error).toBeNull();
    });

    it('returns error when fetch fails', async () => {
      const error = { message: 'Not found', code: '404' };
      mockSingle.mockResolvedValue({ data: null, error });

      const result = await getProfile('nonexistent');
      expect(result.data).toBeNull();
      expect(result.error).toEqual(error);
    });
  });

  describe('updateProfile', () => {
    it('returns updated profile on success', async () => {
      const updated = { id: 'user-1', full_name: 'New Name', currency: 'EUR' };
      mockSingle.mockResolvedValue({ data: updated, error: null });

      const result = await updateProfile('user-1', { full_name: 'New Name', currency: 'EUR' });
      expect(result.data).toEqual(updated);
      expect(result.error).toBeNull();
    });

    it('returns error on failure', async () => {
      const error = { message: 'Update failed' };
      mockSingle.mockResolvedValue({ data: null, error });

      const result = await updateProfile('user-1', { full_name: 'X' });
      expect(result.data).toBeNull();
      expect(result.error).toEqual(error);
    });
  });
});

