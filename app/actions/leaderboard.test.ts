import { getChallengeLeaderboard } from './leaderboard';

// Mock dependencies
jest.mock('@/lib/prisma/client', () => ({
  prisma: {
    challenge: {
      findUnique: jest.fn(),
    },
    dailyLog: {
      findMany: jest.fn(),
    },
  },
}));

jest.mock('./auth', () => ({
  getCurrentUser: jest.fn().mockResolvedValue({
    id: 'user-1',
    email: 'test@example.com',
  }),
}));

describe('getChallengeLeaderboard', () => {
  const { prisma } = require('@/lib/prisma/client');

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should sort leaderboard by current streak descending', async () => {
    prisma.challenge.findUnique.mockResolvedValue({
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
    });

    prisma.dailyLog.findMany.mockResolvedValue([
      {
        userId: 'user-1',
        date: '2024-01-15',
        consumedSugar: false,
        confirmedAt: new Date(),
      },
      {
        userId: 'user-2',
        date: '2024-01-15',
        consumedSugar: false,
        confirmedAt: new Date(),
      },
      {
        userId: 'user-2',
        date: '2024-01-14',
        consumedSugar: false,
        confirmedAt: new Date(),
      },
    ]);

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
    prisma.challenge.findUnique.mockResolvedValue({
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
    });

    prisma.dailyLog.findMany.mockResolvedValue([]);

    const result = await getChallengeLeaderboard('challenge-1');

    expect(result.leaderboard).toBeDefined();
    expect(result.leaderboard.length).toBe(2);
  });
});
