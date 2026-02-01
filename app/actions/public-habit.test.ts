import { joinPublicHabit, leavePublicHabit } from './public-habit';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from './auth';

// Mock crypto.randomUUID for tests
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: jest.fn(() => 'test-uuid-123'),
  },
  writable: true,
});

// Mock dependencies
jest.mock('@/lib/supabase/server');
jest.mock('./auth');
jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
}));

describe('public-habit actions', () => {
  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
  };

  const mockSupabase = {
    from: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (createClient as jest.Mock).mockResolvedValue(mockSupabase);
  });

  describe('joinPublicHabit', () => {
    it('should return error when not authenticated', async () => {
      (getCurrentUser as jest.Mock).mockResolvedValue(null);

      const result = await joinPublicHabit('habit-1');

      expect(result).toEqual({ error: 'Not authenticated' });
    });

    it('should successfully join a public habit', async () => {
      (getCurrentUser as jest.Mock).mockResolvedValue(mockUser);

      // Mock habit query
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { id: 'habit-1', isPublic: true, slug: 'zero-sugar' },
          error: null,
        }),
      });

      // Mock membership check (no existing membership)
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      });

      // Mock insert
      mockSupabase.from.mockReturnValueOnce({
        insert: jest.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      });

      const result = await joinPublicHabit('habit-1');

      expect(result).toEqual({
        success: true,
        habitId: 'habit-1',
        slug: 'zero-sugar',
      });
    });

    it('should return success when already a member', async () => {
      (getCurrentUser as jest.Mock).mockResolvedValue(mockUser);

      // Mock habit query
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { id: 'habit-1', isPublic: true, slug: 'zero-sugar' },
          error: null,
        }),
      });

      // Mock membership check (already active member)
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({
          data: { id: 'membership-1', status: 'ACTIVE' },
          error: null,
        }),
      });

      const result = await joinPublicHabit('habit-1');

      expect(result).toEqual({
        success: true,
        habitId: 'habit-1',
        slug: 'zero-sugar',
      });
    });

    it('should return error when habit is not public', async () => {
      (getCurrentUser as jest.Mock).mockResolvedValue(mockUser);

      // Mock habit query
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { id: 'habit-1', isPublic: false, slug: 'zero-sugar' },
          error: null,
        }),
      });

      const result = await joinPublicHabit('habit-1');

      expect(result).toEqual({ error: 'Habit is not public' });
    });
  });

  describe('leavePublicHabit', () => {
    it('should return error when not authenticated', async () => {
      (getCurrentUser as jest.Mock).mockResolvedValue(null);

      const result = await leavePublicHabit('habit-1');

      expect(result).toEqual({ error: 'Not authenticated' });
    });

    it('should successfully leave a habit', async () => {
      (getCurrentUser as jest.Mock).mockResolvedValue(mockUser);

      // Mock habit query for slug
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { slug: 'zero-sugar' },
          error: null,
        }),
      });

      // Mock update
      mockSupabase.from.mockReturnValueOnce({
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        mockResolvedValue: jest.fn().mockResolvedValue({
          error: null,
        }),
      });

      const result = await leavePublicHabit('habit-1');

      expect(result).toEqual({ success: true });
    });
  });
});
