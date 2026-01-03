import { joinChallengeByCode } from './challenge';

// Mock Supabase client
const mockSupabaseClient = {
  from: jest.fn(),
};

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => Promise.resolve(mockSupabaseClient)),
}));

jest.mock('./auth', () => ({
  getCurrentUser: jest.fn().mockResolvedValue({
    id: 'user-1',
    email: 'test@example.com',
  }),
}));

jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
}));

describe('joinChallengeByCode', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should join challenge with valid invite code', async () => {
    // Mock invite query
    const mockInviteQuery = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: {
          id: 'invite-1',
          code: 'ABC12345',
          challengeId: 'challenge-1',
          expiresAt: null,
          challenge: { id: 'challenge-1' },
        },
        error: null,
      }),
    };

    // Mock existing member check
    const mockMemberCheckQuery = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: null,
        error: { code: 'PGRST116' }, // No rows returned
      }),
    };

    // Mock member insert
    const mockMemberInsertQuery = {
      insert: jest.fn().mockResolvedValue({
        data: {
          id: 'member-1',
          challengeId: 'challenge-1',
          userId: 'user-1',
        },
        error: null,
      }),
    };

    mockSupabaseClient.from
      .mockReturnValueOnce(mockInviteQuery)
      .mockReturnValueOnce(mockMemberCheckQuery)
      .mockReturnValueOnce(mockMemberInsertQuery);

    const result = await joinChallengeByCode('ABC12345');

    expect(result.success).toBe(true);
    expect(result.challengeId).toBe('challenge-1');
  });

  it('should return error for invalid invite code', async () => {
    const mockInviteQuery = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: null,
        error: { code: 'PGRST116' },
      }),
    };

    mockSupabaseClient.from.mockReturnValueOnce(mockInviteQuery);

    const result = await joinChallengeByCode('INVALID');

    expect(result.error).toBe('Invalid invite code');
    expect(result.success).toBeUndefined();
  });

  it('should return error if already a member', async () => {
    // Mock invite query
    const mockInviteQuery = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: {
          id: 'invite-1',
          code: 'ABC12345',
          challengeId: 'challenge-1',
          expiresAt: null,
          challenge: { id: 'challenge-1' },
        },
        error: null,
      }),
    };

    // Mock existing member check (member exists)
    const mockMemberCheckQuery = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: {
          id: 'member-1',
          challengeId: 'challenge-1',
          userId: 'user-1',
        },
        error: null,
      }),
    };

    mockSupabaseClient.from
      .mockReturnValueOnce(mockInviteQuery)
      .mockReturnValueOnce(mockMemberCheckQuery);

    const result = await joinChallengeByCode('ABC12345');

    expect(result.error).toBe('Already a member of this challenge');
    expect(result.challengeId).toBe('challenge-1');
  });
});
