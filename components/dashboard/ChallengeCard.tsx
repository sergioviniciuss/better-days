'use client';

import { useTranslations } from 'next-intl';
import { calculateStreaks, detectPendingDays } from '@/lib/streak-utils';
import { getTodayInTimezone } from '@/lib/date-utils';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { confirmDay } from '@/app/actions/daily-log';
import { ChallengeIcon } from '@/lib/challenge-icons';
import { DailyConfirmation } from './DailyConfirmation';
import { PendingDaysModal } from './PendingDaysModal';

interface ChallengeCardProps {
  challenge: {
    id: string;
    name: string;
    objectiveType: string;
    rules: string[];
  };
  logs: Array<{
    date: string;
    consumedSugar: boolean;
    confirmedAt: Date | null;
  }>;
  todayLog?: {
    date: string;
    consumedSugar: boolean;
    confirmedAt: Date | null;
  } | null;
  userTimezone: string;
}

export function ChallengeCard({ challenge, logs, todayLog: initialTodayLog, userTimezone }: ChallengeCardProps) {
  const t = useTranslations('dashboard');
  const tChallenge = useTranslations('challengeConfirmation');
  const router = useRouter();
  const [todayLog, setTodayLog] = useState(initialTodayLog);
  const [loading, setLoading] = useState(false);
  const [showPendingModal, setShowPendingModal] = useState(false);

  // Sync state with server props on hydration
  useEffect(() => {
    setTodayLog(initialTodayLog);
  }, [initialTodayLog]);

  const { currentStreak, bestStreak } = calculateStreaks(logs, userTimezone);
  const pendingDays = detectPendingDays(logs, userTimezone);
  const today = getTodayInTimezone(userTimezone);
  const todayConfirmed = todayLog !== null && todayLog !== undefined && todayLog.confirmedAt !== null;
  const hasPendingDays = pendingDays.length > 0;

  const handleConfirmToday = async (consumedSugar: boolean) => {
    setLoading(true);
    
    const result = await confirmDay(today, consumedSugar, challenge.id);
    
    if (result.success) {
      setTodayLog(result.log);
      // Use router.refresh() instead of window.location.reload() for better UX
      router.refresh();
    } else {
      console.error('Failed to confirm:', result.error);
      alert(`Failed to confirm: ${result.error}`);
      setLoading(false);
    }
  };

  // Get confirmation button labels based on challenge type
  const getConfirmationLabels = () => {
    switch (challenge.objectiveType) {
      case 'NO_SUGAR':
      case 'NO_SUGAR_STREAK':
        return { success: t('noSugar'), failure: t('consumedSugar') };
      case 'ZERO_ALCOHOL':
        return { success: tChallenge('noAlcohol'), failure: tChallenge('consumedAlcohol') };
      case 'DAILY_EXERCISE':
        return { success: tChallenge('exercised'), failure: tChallenge('skippedExercise') };
      default:
        return { success: tChallenge('success'), failure: tChallenge('failed') };
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
      {/* Challenge Header */}
      <div className="flex items-center gap-3 mb-4">
        <ChallengeIcon type={challenge.objectiveType as any} size="md" />
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          {challenge.name}
        </h2>
      </div>

      {/* Streaks */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
            {t('currentStreak')}
          </p>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {currentStreak} {currentStreak === 1 ? t('day') : t('days')}
          </p>
        </div>
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
            {t('bestStreak')}
          </p>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">
            {bestStreak} {bestStreak === 1 ? t('day') : t('days')}
          </p>
        </div>
      </div>

      {/* Pending Days Alert */}
      {hasPendingDays && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 mb-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
              {t('pendingDays')}: {pendingDays.length}
            </p>
            <button
              onClick={() => setShowPendingModal(true)}
              className="px-3 py-1 bg-yellow-600 hover:bg-yellow-700 text-white rounded-md text-sm font-medium min-h-[36px]"
            >
              {t('confirmPendingDays')}
            </button>
          </div>
        </div>
      )}

      {/* Today's Confirmation */}
      <div className="mt-4">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
          {todayConfirmed ? t('todayConfirmed') : t('todayPending')}
        </h3>
        {!todayConfirmed && (
          <DailyConfirmation 
            onConfirm={handleConfirmToday} 
            loading={loading}
            labels={getConfirmationLabels()}
          />
        )}
        {todayConfirmed && todayLog && (
          <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              {todayLog.consumedSugar ? getConfirmationLabels().failure : getConfirmationLabels().success}
            </p>
          </div>
        )}
      </div>

      {/* Pending Days Modal */}
      {showPendingModal && (
        <PendingDaysModal
          pendingDays={pendingDays}
          onClose={() => setShowPendingModal(false)}
          userTimezone={userTimezone}
          challengeId={challenge.id}
        />
      )}
    </div>
  );
}

