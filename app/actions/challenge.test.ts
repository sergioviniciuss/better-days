import { joinChallengeByCode } from './challenge';

// Mock dependencies
jest.mock('@/lib/prisma/client', () => ({
  prisma: {
    invite: {
      findUnique: jest.fn(),
    },
    challengeMember: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  },
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
  const { prisma } = require('@/lib/prisma/client');

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should join challenge with valid invite code', async () => {
    prisma.invite.findUnique.mockResolvedValue({
      id: 'invite-1',
      code: 'ABC12345',
      challengeId: 'challenge-1',
      expiresAt: null,
      challenge: { id: 'challenge-1' },
    });

    prisma.challengeMember.findUnique.mockResolvedValue(null);
    prisma.challengeMember.create.mockResolvedValue({
      id: 'member-1',
      challengeId: 'challenge-1',
      userId: 'user-1',
    });

    const result = await joinChallengeByCode('ABC12345');

    expect(result.success).toBe(true);
    expect(result.challengeId).toBe('challenge-1');
    expect(prisma.challengeMember.create).toHaveBeenCalled();
  });

  it('should return error for invalid invite code', async () => {
    prisma.invite.findUnique.mockResolvedValue(null);

    const result = await joinChallengeByCode('INVALID');

    expect(result.error).toBe('Invalid invite code');
    expect(result.success).toBeUndefined();
  });

  it('should return error if already a member', async () => {
    prisma.invite.findUnique.mockResolvedValue({
      id: 'invite-1',
      code: 'ABC12345',
      challengeId: 'challenge-1',
      expiresAt: null,
      challenge: { id: 'challenge-1' },
    });

    prisma.challengeMember.findUnique.mockResolvedValue({
      id: 'member-1',
      challengeId: 'challenge-1',
      userId: 'user-1',
    });

    const result = await joinChallengeByCode('ABC12345');

    expect(result.error).toBe('Already a member of this challenge');
    expect(result.challengeId).toBe('challenge-1');
  });
});

