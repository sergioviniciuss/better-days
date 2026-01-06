import { joinChallengeByCode, archiveChallenge, getChallenges } from './challenge';

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
    timezone: 'UTC',
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

describe('archiveChallenge', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should successfully archive a challenge', async () => {
    const mockMembershipQuery = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: {
          id: 'member-1',
          challengeId: 'challenge-1',
          userId: 'user-1',
          status: 'ACTIVE',
        },
        error: null,
      }),
    };

    const mockUpdateQuery = {
      update: jest.fn().mockReturnThis(),
      eq: jest.fn().mockResolvedValue({
        data: { id: 'member-1', status: 'LEFT' },
        error: null,
      }),
    };

    mockSupabaseClient.from
      .mockReturnValueOnce(mockMembershipQuery)
      .mockReturnValueOnce(mockUpdateQuery);

    const result = await archiveChallenge('challenge-1');

    expect(result.success).toBe(true);
    expect(mockUpdateQuery.update).toHaveBeenCalledWith({
      status: 'LEFT',
      leftAt: expect.any(String),
    });
  });

  it('should return error if user is not a member', async () => {
    const mockMembershipQuery = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: null,
        error: { code: 'PGRST116' },
      }),
    };

    mockSupabaseClient.from.mockReturnValueOnce(mockMembershipQuery);

    const result = await archiveChallenge('challenge-1');

    expect(result.error).toBe('Not a member of this challenge');
    expect(result.success).toBeUndefined();
  });

  it('should return error if user is not authenticated', async () => {
    const getCurrentUser = require('./auth').getCurrentUser;
    getCurrentUser.mockResolvedValueOnce(null);

    const result = await archiveChallenge('challenge-1');

    expect(result.error).toBe('Not authenticated');
  });
});

describe('getChallenges', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    const getCurrentUser = require('./auth').getCurrentUser;
    getCurrentUser.mockResolvedValue({
      id: 'user-1',
      email: 'test@example.com',
      timezone: 'UTC',
    });
  });

  it('should return only active challenges by default', async () => {
    const mockMembershipQuery = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      in: jest.fn().mockReturnThis(),
    };

    // Should only query ACTIVE status
    mockMembershipQuery.eq.mockImplementation((field, value) => {
      if (field === 'status' && value === 'ACTIVE') {
        return Promise.resolve({
          data: [{ challengeId: 'challenge-1', id: 'member-1', joinedAt: '2024-01-01' }],
          error: null,
        });
      }
      return mockMembershipQuery;
    });

    const mockChallengeQuery = {
      select: jest.fn().mockReturnThis(),
      in: jest.fn().mockReturnThis(),
      order: jest.fn().mockResolvedValue({
        data: [{
          id: 'challenge-1',
          name: 'Test Challenge',
          status: 'ACTIVE',
        }],
        error: null,
      }),
    };

    mockSupabaseClient.from
      .mockReturnValueOnce(mockMembershipQuery)
      .mockReturnValueOnce(mockChallengeQuery);

    const result = await getChallenges();

    expect(result.challenges).toHaveLength(1);
    expect(result.challenges[0].id).toBe('challenge-1');
  });

  it('should include stopped challenges when includeLeft is true', async () => {
    const mockMembershipQuery = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      in: jest.fn().mockResolvedValue({
        data: [
          { challengeId: 'challenge-1', id: 'member-1', joinedAt: '2024-01-01', status: 'ACTIVE' },
          { challengeId: 'challenge-2', id: 'member-2', joinedAt: '2024-01-01', status: 'LEFT', leftAt: '2024-01-15' },
        ],
        error: null,
      }),
    };

    const mockChallengeQuery = {
      select: jest.fn().mockReturnThis(),
      in: jest.fn().mockReturnThis(),
      order: jest.fn().mockResolvedValue({
        data: [
          { id: 'challenge-1', name: 'Active Challenge' },
          { id: 'challenge-2', name: 'Stopped Challenge' },
        ],
        error: null,
      }),
    };

    mockSupabaseClient.from
      .mockReturnValueOnce(mockMembershipQuery)
      .mockReturnValueOnce(mockChallengeQuery);

    const result = await getChallenges(true);

    expect(result.challenges).toHaveLength(2);
    expect(result.challenges[1].userStatus).toBe('LEFT');
  });

  it('should auto-archive expired challenges when includeLeft is false', async () => {
    const mockMembershipQuery = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
    };

    mockMembershipQuery.eq.mockImplementation((field, value) => {
      if (field === 'status' && value === 'ACTIVE') {
        return Promise.resolve({
          data: [{ challengeId: 'challenge-1', id: 'member-1', joinedAt: '2024-01-01' }],
          error: null,
        });
      }
      return mockMembershipQuery;
    });

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const pastDate = yesterday.toISOString().split('T')[0];

    const mockChallengeQuery = {
      select: jest.fn().mockReturnThis(),
      in: jest.fn().mockReturnThis(),
      order: jest.fn().mockResolvedValue({
        data: [{
          id: 'challenge-1',
          name: 'Expired Challenge',
          dueDate: pastDate,
        }],
        error: null,
      }),
    };

    const mockUpdateQuery = {
      update: jest.fn().mockReturnThis(),
      in: jest.fn().mockResolvedValue({
        data: [{ id: 'member-1', status: 'LEFT' }],
        error: null,
      }),
    };

    mockSupabaseClient.from
      .mockReturnValueOnce(mockMembershipQuery)
      .mockReturnValueOnce(mockChallengeQuery)
      .mockReturnValueOnce(mockUpdateQuery);

    const result = await getChallenges();

    expect(result.challenges).toHaveLength(0);
    expect(mockUpdateQuery.update).toHaveBeenCalledWith({
      status: 'LEFT',
      leftAt: expect.any(String),
    });
  });
});
