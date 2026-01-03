'use server';

import { prisma } from '@/lib/prisma/client';
import { getCurrentUser } from './auth';
import { calculateStreaks, detectPendingDays, type DailyLog as StreakDailyLog } from '@/lib/streak-utils';

export async function getChallengeLeaderboard(challengeId: string) {
  const user = await getCurrentUser();
  if (!user) {
    return { error: 'Not authenticated', leaderboard: [] };
  }

  try {
    // Get challenge and members
    const challenge = await prisma.challenge.findUnique({
      where: { id: challengeId },
      include: {
        members: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!challenge) {
      return { error: 'Challenge not found', leaderboard: [] };
    }

    // Get all daily logs for all members since challenge start date
    const memberIds = challenge.members.map((m) => m.userId);
    const allLogs = await prisma.dailyLog.findMany({
      where: {
        userId: { in: memberIds },
        date: { gte: challenge.startDate },
      },
      orderBy: { date: 'desc' },
    });

    // Calculate streaks for each member
    const leaderboard = challenge.members.map((member) => {
      const userLogs = allLogs
        .filter((log) => log.userId === member.userId)
        .map((log) => ({
          date: log.date,
          consumedSugar: log.consumedSugar,
          confirmedAt: log.confirmedAt,
        }));

      const { currentStreak, bestStreak } = calculateStreaks(userLogs, member.user.timezone);
      const pendingDays = detectPendingDays(userLogs, member.user.timezone);
      const today = new Date().toISOString().split('T')[0];
      const todayLog = userLogs.find((log) => log.date === today && log.confirmedAt !== null);

      return {
        userId: member.userId,
        email: member.user.email,
        currentStreak,
        bestStreak,
        pendingDays: pendingDays.length,
        confirmedToday: todayLog !== undefined,
      };
    });

    // Sort by current streak (desc), then best streak (desc)
    leaderboard.sort((a, b) => {
      if (a.currentStreak !== b.currentStreak) {
        return b.currentStreak - a.currentStreak;
      }
      return b.bestStreak - a.bestStreak;
    });

    return { leaderboard };
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return { error: 'Failed to fetch leaderboard', leaderboard: [] };
  }
}
