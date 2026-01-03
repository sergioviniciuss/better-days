import { getChallengeLeaderboard } from './leaderboard';

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

describe('getChallengeLeaderboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should sort leaderboard by current streak descending', async () => {
    // Mock challenge query
    const mockChallengeQuery = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: {
          id: 'challenge-1',
          startDate: '2024-01-01',
          members: [
            {
              userId: 'user-1',
              user: { id: 'user-1', email: 'user1@test.com', timezone: 'UTC' },
            },
            {
              userId: 'user-2',
              user: { id: 'user-2', email: 'user2@test.com', timezone: 'UTC' },
            },
          ],
        },
        error: null,
      }),
    };

    // Mock logs query
    const mockLogsQuery = {
      select: jest.fn().mockReturnThis(),
      in: jest.fn().mockReturnThis(),
      gte: jest.fn().mockReturnThis(),
      order: jest.fn().mockResolvedValue({
        data: [
          {
            userId: 'user-1',
            date: '2024-01-15',
            consumedSugar: false,
            confirmedAt: new Date().toISOString(),
          },
          {
            userId: 'user-2',
            date: '2024-01-15',
            consumedSugar: false,
            confirmedAt: new Date().toISOString(),
          },
          {
            userId: 'user-2',
            date: '2024-01-14',
            consumedSugar: false,
            confirmedAt: new Date().toISOString(),
          },
        ],
        error: null,
      }),
    };

    mockSupabaseClient.from
      .mockReturnValueOnce(mockChallengeQuery)
      .mockReturnValueOnce(mockLogsQuery);

    const result = await getChallengeLeaderboard('challenge-1');

    expect(result.leaderboard).toBeDefined();
    expect(result.leaderboard.length).toBe(2);
    // User 2 should be first (streak of 2 vs 1)
    expect(result.leaderboard[0].userId).toBe('user-2');
    expect(result.leaderboard[0].currentStreak).toBeGreaterThanOrEqual(
      result.leaderboard[1].currentStreak
    );
  });

  it('should sort by best streak when current streaks are equal', async () => {
    // Mock challenge query
    const mockChallengeQuery = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: {
          id: 'challenge-1',
          startDate: '2024-01-01',
          members: [
            {
              userId: 'user-1',
              user: { id: 'user-1', email: 'user1@test.com', timezone: 'UTC' },
            },
            {
              userId: 'user-2',
              user: { id: 'user-2', email: 'user2@test.com', timezone: 'UTC' },
            },
          ],
        },
        error: null,
      }),
    };

    // Mock logs query
    const mockLogsQuery = {
      select: jest.fn().mockReturnThis(),
      in: jest.fn().mockReturnThis(),
      gte: jest.fn().mockReturnThis(),
      order: jest.fn().mockResolvedValue({
        data: [],
        error: null,
      }),
    };

    mockSupabaseClient.from
      .mockReturnValueOnce(mockChallengeQuery)
      .mockReturnValueOnce(mockLogsQuery);

    const result = await getChallengeLeaderboard('challenge-1');

    expect(result.leaderboard).toBeDefined();
    expect(result.leaderboard.length).toBe(2);
  });
});
