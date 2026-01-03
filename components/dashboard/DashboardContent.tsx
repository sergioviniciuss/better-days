'use client';

import { useTranslations } from 'next-intl';
import { calculateStreaks, detectPendingDays, type DailyLog as StreakDailyLog } from '@/lib/streak-utils';
import { getTodayInTimezone } from '@/lib/date-utils';
import { useState, useEffect } from 'react';
import { confirmDay, getTodayLog } from '@/app/actions/daily-log';
import { PendingDaysModal } from './PendingDaysModal';
import { DailyConfirmation } from './DailyConfirmation';
import Link from 'next/link';

interface User {
  id: string;
  email: string;
  timezone: string;
  preferredLanguage: string;
}

interface DailyLog {
  id: string;
  date: string;
  consumedSugar: boolean;
  confirmedAt: Date | null;
}

interface DashboardContentProps {
  user: User;
  logs: DailyLog[];
}

export function DashboardContent({ user, logs }: DashboardContentProps) {
  const t = useTranslations('dashboard');
  const [todayLog, setTodayLog] = useState<DailyLog | null>(null);
  const [showPendingModal, setShowPendingModal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTodayLog() {
      const result = await getTodayLog();
      if (result.log) {
        setTodayLog(result.log);
      }
      setLoading(false);
    }
    fetchTodayLog();
  }, []);

  // Convert logs to streak format
  const streakLogs: StreakDailyLog[] = logs.map((log) => ({
    date: log.date,
    consumedSugar: log.consumedSugar,
    confirmedAt: log.confirmedAt,
  }));

  const { currentStreak, bestStreak, lastConfirmedDate } = calculateStreaks(streakLogs, user.timezone);
  const pendingDays = detectPendingDays(streakLogs, user.timezone);

  const today = getTodayInTimezone(user.timezone);
  const todayConfirmed = todayLog !== null && todayLog.confirmedAt !== null;
  const hasPendingDays = pendingDays.length > 0;

  const handleConfirmToday = async (consumedSugar: boolean) => {
    const result = await confirmDay(today, consumedSugar);
    if (result.success) {
      const newLog: DailyLog = {
        id: todayLog?.id || '',
        date: today,
        consumedSugar,
        confirmedAt: new Date(),
      };
      setTodayLog(newLog);
      window.location.reload(); // Refresh to update streaks
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t('title')}</h1>
      </div>

      {/* Streak Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
            {t('currentStreak')}
          </h2>
          <p className="text-4xl font-bold text-blue-600 dark:text-blue-400">
            {currentStreak} {currentStreak === 1 ? t('day') : t('days')}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
            {t('bestStreak')}
          </h2>
          <p className="text-4xl font-bold text-green-600 dark:text-green-400">
            {bestStreak} {bestStreak === 1 ? t('day') : t('days')}
          </p>
        </div>
      </div>

      {/* Pending Days Alert */}
      {hasPendingDays && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                {t('pendingDays')}: {pendingDays.length}
              </p>
            </div>
            <button
              onClick={() => setShowPendingModal(true)}
              className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-md text-sm font-medium min-h-[44px] min-w-[44px]"
            >
              {t('confirmPendingDays')}
            </button>
          </div>
        </div>
      )}

      {/* Today's Confirmation */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          {todayConfirmed ? t('todayConfirmed') : t('todayPending')}
        </h2>
        {!todayConfirmed && (
          <DailyConfirmation onConfirm={handleConfirmToday} loading={loading} />
        )}
        {todayConfirmed && todayLog && (
          <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-md">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              {todayLog.consumedSugar ? t('consumedSugar') : t('noSugar')}
            </p>
          </div>
        )}
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link
          href={`/${user.preferredLanguage}/history`}
          className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 hover:shadow-md transition-shadow min-h-[44px] flex items-center justify-center"
        >
          <span className="text-gray-900 dark:text-white font-medium">View History</span>
        </Link>
        <Link
          href={`/${user.preferredLanguage}/challenges`}
          className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 hover:shadow-md transition-shadow min-h-[44px] flex items-center justify-center"
        >
          <span className="text-gray-900 dark:text-white font-medium">Challenges</span>
        </Link>
      </div>

      {showPendingModal && (
        <PendingDaysModal
          pendingDays={pendingDays}
          onClose={() => setShowPendingModal(false)}
          userTimezone={user.timezone}
        />
      )}
    </div>
  );
}

