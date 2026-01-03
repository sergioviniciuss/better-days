'use server';

import { prisma } from '@/lib/prisma/client';
import { getCurrentUser } from './auth';
import { getTodayInTimezone } from '@/lib/date-utils';
import { revalidatePath } from 'next/cache';

export async function confirmDay(date: string, consumedSugar: boolean) {
  const user = await getCurrentUser();
  if (!user) {
    return { error: 'Not authenticated' };
  }

  try {
    await prisma.dailyLog.upsert({
      where: {
        userId_date: {
          userId: user.id,
          date,
        },
      },
      update: {
        consumedSugar,
        confirmedAt: new Date(),
        updatedAt: new Date(),
      },
      create: {
        userId: user.id,
        date,
        consumedSugar,
        confirmedAt: new Date(),
      },
    });

    revalidatePath('/dashboard');
    return { success: true };
  } catch (error) {
    console.error('Error confirming day:', error);
    return { error: 'Failed to confirm day' };
  }
}

export async function confirmMultipleDays(confirmations: Array<{ date: string; consumedSugar: boolean }>) {
  const user = await getCurrentUser();
  if (!user) {
    return { error: 'Not authenticated' };
  }

  try {
    await Promise.all(
      confirmations.map(({ date, consumedSugar }) =>
        prisma.dailyLog.upsert({
          where: {
            userId_date: {
              userId: user.id,
              date,
            },
          },
          update: {
            consumedSugar,
            confirmedAt: new Date(),
            updatedAt: new Date(),
          },
          create: {
            userId: user.id,
            date,
            consumedSugar,
            confirmedAt: new Date(),
          },
        })
      )
    );

    revalidatePath('/dashboard');
    return { success: true };
  } catch (error) {
    console.error('Error confirming days:', error);
    return { error: 'Failed to confirm days' };
  }
}

export async function getDailyLogs() {
  const user = await getCurrentUser();
  if (!user) {
    return { error: 'Not authenticated', logs: [] };
  }

  try {
    const logs = await prisma.dailyLog.findMany({
      where: { userId: user.id },
      orderBy: { date: 'desc' },
    });

    return { logs };
  } catch (error) {
    console.error('Error fetching daily logs:', error);
    return { error: 'Failed to fetch logs', logs: [] };
  }
}

export async function getTodayLog() {
  const user = await getCurrentUser();
  if (!user) {
    return { error: 'Not authenticated', log: null };
  }

  const today = getTodayInTimezone(user.timezone);

  try {
    const log = await prisma.dailyLog.findUnique({
      where: {
        userId_date: {
          userId: user.id,
          date: today,
        },
      },
    });

    return { log };
  } catch (error) {
    console.error('Error fetching today log:', error);
    return { error: 'Failed to fetch today log', log: null };
  }
}
