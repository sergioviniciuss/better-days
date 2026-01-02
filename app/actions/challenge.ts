'use server';

import { prisma } from '@/lib/prisma/client';
import { getCurrentUser } from './auth';
import { revalidatePath } from 'next/cache';

function generateInviteCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export async function createChallenge(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) {
    return { error: 'Not authenticated' };
  }

  const name = formData.get('name') as string;
  const startDate = formData.get('startDate') as string;
  const rules: string[] = [];

  // Collect rules from form data
  if (formData.get('addedSugarCounts') === 'on') {
    rules.push('addedSugarCounts');
  }
  if (formData.get('fruitDoesNotCount') === 'on') {
    rules.push('fruitDoesNotCount');
  }
  if (formData.get('missingDaysPending') === 'on') {
    rules.push('missingDaysPending');
  }

  try {
    // Generate unique invite code
    let inviteCode: string;
    let isUnique = false;
    let attempts = 0;
    
    while (!isUnique && attempts < 10) {
      inviteCode = generateInviteCode();
      const existing = await prisma.invite.findUnique({
        where: { code: inviteCode },
      });
      if (!existing) {
        isUnique = true;
      } else {
        inviteCode = generateInviteCode();
      }
      attempts++;
    }

    if (!isUnique) {
      return { error: 'Failed to generate unique invite code' };
    }

    const code = inviteCode!;

    // Create challenge
    const challenge = await prisma.challenge.create({
      data: {
        ownerUserId: user.id,
        name,
        startDate,
        rules,
        invites: {
          create: {
            code,
          },
        },
        members: {
          create: {
            userId: user.id,
            role: 'OWNER',
          },
        },
      },
    });

    revalidatePath('/challenges');
    return { success: true, challengeId: challenge.id, inviteCode: code };
  } catch (error) {
    console.error('Error creating challenge:', error);
    return { error: 'Failed to create challenge' };
  }
}

export async function getChallenges() {
  const user = await getCurrentUser();
  if (!user) {
    return { error: 'Not authenticated', challenges: [] };
  }

  try {
    const challenges = await prisma.challenge.findMany({
      where: {
        members: {
          some: {
            userId: user.id,
          },
        },
      },
      include: {
        owner: {
          select: {
            id: true,
            email: true,
          },
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return { challenges };
  } catch (error) {
    console.error('Error fetching challenges:', error);
    return { error: 'Failed to fetch challenges', challenges: [] };
  }
}

export async function getChallenge(challengeId: string) {
  const user = await getCurrentUser();
  if (!user) {
    return { error: 'Not authenticated', challenge: null };
  }

  try {
    const challenge = await prisma.challenge.findUnique({
      where: { id: challengeId },
      include: {
        owner: {
          select: {
            id: true,
            email: true,
          },
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
              },
            },
          },
        },
        invites: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 1,
        },
      },
    });

    if (!challenge) {
      return { error: 'Challenge not found', challenge: null };
    }

    // Check if user is a member
    const isMember = challenge.members.some((m) => m.userId === user.id);
    if (!isMember) {
      return { error: 'Not a member of this challenge', challenge: null };
    }

    return { challenge };
  } catch (error) {
    console.error('Error fetching challenge:', error);
    return { error: 'Failed to fetch challenge', challenge: null };
  }
}

export async function joinChallengeByCode(inviteCode: string) {
  const user = await getCurrentUser();
  if (!user) {
    return { error: 'Not authenticated' };
  }

  try {
    // Find invite by code
    const invite = await prisma.invite.findUnique({
      where: { code: inviteCode },
      include: {
        challenge: true,
      },
    });

    if (!invite) {
      return { error: 'Invalid invite code' };
    }

    // Check if invite is expired
    if (invite.expiresAt && invite.expiresAt < new Date()) {
      return { error: 'Invite code has expired' };
    }

    // Check if user is already a member
    const existingMember = await prisma.challengeMember.findUnique({
      where: {
        challengeId_userId: {
          challengeId: invite.challengeId,
          userId: user.id,
        },
      },
    });

    if (existingMember) {
      return { error: 'Already a member of this challenge', challengeId: invite.challengeId };
    }

    // Add user as member
    await prisma.challengeMember.create({
      data: {
        challengeId: invite.challengeId,
        userId: user.id,
        role: 'MEMBER',
      },
    });

    revalidatePath('/challenges');
    return { success: true, challengeId: invite.challengeId };
  } catch (error) {
    console.error('Error joining challenge:', error);
    return { error: 'Failed to join challenge' };
  }
}

