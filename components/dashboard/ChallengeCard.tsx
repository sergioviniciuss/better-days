'use client';

import { useTranslations } from 'next-intl';
import { calculateStreaks, detectPendingDays } from '@/lib/streak-utils';
import { getTodayInTimezone } from '@/lib/date-utils';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { confirmDay } from '@/app/actions/daily-log';
import { ChallengeIcon } from '@/lib/challenge-icons';
import { DailyConfirmation } from './DailyConfirmation';
import { PendingDaysModal } from './PendingDaysModal';
import { StopChallengeModal } from './StopChallengeModal';
import { StreakAchievement } from './StreakAchievement';
import { setReminder, checkReminder, clearReminder } from '@/lib/reminder-utils';

interface ChallengeCardProps {
  challenge: {
    id: string;
    name: string;
    objectiveType: string;
    rules: string[];
    startDate: string;
    shortId?: string;
    dueDate?: string | null;
    challengeType?: string;
    userJoinedAt?: string;
    owner?: {
      email: string;
    };
    members?: Array<any>;
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
  const params = useParams();
  const locale = params.locale as string;
  const [todayLog, setTodayLog] = useState(initialTodayLog);
  const [loading, setLoading] = useState(false);
  const [showPendingModal, setShowPendingModal] = useState(false);
  const [showStopModal, setShowStopModal] = useState(false);

  // Sync state with server props on hydration
  useEffect(() => {
    setTodayLog(initialTodayLog);
  }, [initialTodayLog]);

  const { currentStreak, bestStreak } = calculateStreaks(logs, userTimezone);
  const pendingDays = detectPendingDays(
    logs, 
    userTimezone,
    challenge.userJoinedAt || challenge.startDate
  );
  const today = getTodayInTimezone(userTimezone);
  const todayConfirmed = todayLog !== null && todayLog !== undefined && todayLog.confirmedAt !== null;
  const hasPendingDays = pendingDays.length > 0;

  // Milestone detection helper
  const isMilestoneStreak = (streak: number): boolean => {
    const milestones = [10, 25, 50, 100, 200, 365, 500, 1000];
    return milestones.includes(streak);
  };
  const isMilestone = isMilestoneStreak(currentStreak);

  useEffect(() => {
    // Auto-open pending days modal if user has pending days and no active reminder
    if (hasPendingDays && !showPendingModal && !todayConfirmed && !checkReminder(challenge.id)) {
      setShowPendingModal(true);
    }
  }, [hasPendingDays, showPendingModal, todayConfirmed, challenge.id]);

  const handleConfirmToday = async (consumedSugar: boolean) => {
    setLoading(true);
    
    const result = await confirmDay(today, consumedSugar, challenge.id);
    
    if (result.success) {
      setTodayLog(result.log);
      // Clear reminder when user confirms today
      clearReminder(challenge.id);
      // Use router.refresh() instead of window.location.reload() for better UX
      router.refresh();
    } else {
      console.error('Failed to confirm:', result.error);
      alert(`Failed to confirm: ${result.error}`);
      setLoading(false);
    }
  };

  const handleRemindLater = () => {
    // Set reminder for 2 hours
    setReminder(challenge.id, 2);
    setShowPendingModal(false);
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
      {/* Challenge Name and Icon */}
      <div className="mb-4">
        <div className="flex items-center justify-between gap-3 mb-2">
          <div className="flex items-center gap-3">
            <ChallengeIcon type={challenge.objectiveType as any} size="md" />
            <Link href={`/${locale}/challenges/${challenge.id}`}>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer">
                {challenge.name}
              </h2>
            </Link>
          </div>
          {challenge.shortId && (
            <span className="px-2 py-1 text-xs font-mono font-semibold bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded">
              #{challenge.shortId}
            </span>
          )}
        </div>
        
        {/* Challenge metadata */}
        <div className="ml-11 space-y-1">
          {challenge.challengeType === 'GROUP' && challenge.owner && (
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {t('createdBy')} {challenge.owner.email}
            </p>
          )}
          {challenge.members && challenge.challengeType === 'GROUP' && (
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {challenge.members.filter(m => m.status === 'ACTIVE').length} {challenge.members.filter(m => m.status === 'ACTIVE').length === 1 ? t('member') : t('members')}
            </p>
          )}
          {challenge.userJoinedAt && (
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {t('youJoined')}: {new Date(challenge.userJoinedAt).toLocaleDateString()}
            </p>
          )}
        </div>
      </div>

      {/* Streaks - Enhanced Achievement Display */}
      <div className="mb-4">
        <StreakAchievement
          currentStreak={currentStreak}
          bestStreak={bestStreak}
          isMilestone={isMilestone}
        />
      </div>

      {/* Challenge Details */}
      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-4">
        <div className="flex justify-between items-center text-sm flex-wrap gap-2">
          <div>
            <span className="text-gray-600 dark:text-gray-400">{t('challengeStarted')}: </span>
            <span className="text-gray-900 dark:text-white font-medium">
              {new Date(challenge.startDate).toLocaleDateString()}
            </span>
          </div>
          <div>
            <span className="text-gray-600 dark:text-gray-400">{t('activeFor')}: </span>
            <span className="text-gray-900 dark:text-white font-medium">
              {Math.floor((Date.now() - new Date(challenge.startDate).getTime()) / (1000 * 60 * 60 * 24))} {t('days')}
            </span>
          </div>
          {challenge.dueDate && (
            <div className="flex items-center gap-2">
              <span className="text-gray-600 dark:text-gray-400">{t('ends')}: </span>
              <span className="text-gray-900 dark:text-white font-medium">
                {new Date(challenge.dueDate).toLocaleDateString()}
              </span>
              {(() => {
                const daysUntilDue = Math.floor((new Date(challenge.dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                if (daysUntilDue < 3) {
                  return (
                    <span className="px-2 py-1 text-xs font-semibold bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded">
                      {t('endingSoon')}
                    </span>
                  );
                } else if (daysUntilDue < 7) {
                  return (
                    <span className="px-2 py-1 text-xs font-semibold bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 rounded">
                      {t('endsSoon')}
                    </span>
                  );
                }
                return null;
              })()}
            </div>
          )}
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

      {/* Stop Challenge Button */}
      <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setShowStopModal(true)}
          className="w-full px-4 py-3 border-2 border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 rounded-md font-medium hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors min-h-[44px]"
        >
          {t('stopChallenge')}
        </button>
      </div>

      {/* Pending Days Modal */}
      {showPendingModal && (
        <PendingDaysModal
          pendingDays={pendingDays}
          onClose={handleRemindLater}
          onRemindLater={handleRemindLater}
          userTimezone={userTimezone}
          challengeId={challenge.id}
        />
      )}

      {/* Stop Challenge Modal */}
      {showStopModal && (
        <StopChallengeModal
          challengeId={challenge.id}
          challengeName={challenge.name}
          onClose={() => setShowStopModal(false)}
        />
      )}
    </div>
  );
}

