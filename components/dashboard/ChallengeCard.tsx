'use client';

import { useTranslations } from 'next-intl';
import { calculateStreaks, detectPendingDays } from '@/lib/streak-utils';
import { getTodayInTimezone, formatDateString } from '@/lib/date-utils';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { confirmDay } from '@/app/actions/daily-log';
import { ChallengeIcon } from '@/lib/challenge-icons';
import { DailyConfirmation } from './DailyConfirmation';
import { StopChallengeModal } from './StopChallengeModal';
import { StreakAchievement } from './StreakAchievement';
import { clearReminder } from '@/lib/reminder-utils';
import { QuitChallengeModal } from '@/components/challenges/QuitChallengeModal';
import { hasUnacknowledgedRuleChanges } from '@/app/actions/challenge';
import { ProgressRing } from './ProgressRing';
import { calculateActiveDays } from '@/lib/challenge-progress';

interface ChallengeCardProps {
  challenge: {
    id: string;
    name: string;
    objectiveType: string;
    rules: string[];
    rulesUpdatedAt?: string | null;
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
  userId: string;
  userTimezone: string;
  onOpenPendingModal?: (objectiveType: string) => void;
  hasGroupPendingDays?: boolean;
  groupPendingCount?: number;
}

export function ChallengeCard({ 
  challenge, 
  logs, 
  todayLog: initialTodayLog,
  userId,
  userTimezone,
  onOpenPendingModal,
  hasGroupPendingDays = false,
  groupPendingCount = 0
}: ChallengeCardProps) {
  const t = useTranslations('dashboard');
  const tChallenge = useTranslations('challengeConfirmation');
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;
  const [todayLog, setTodayLog] = useState(initialTodayLog);
  const [loading, setLoading] = useState(false);
  const [showStopModal, setShowStopModal] = useState(false);
  const [showQuitModal, setShowQuitModal] = useState(false);

  // Check if current user is admin
  const userMembership = challenge.members?.find(m => m.userId === userId);
  const isAdmin = userMembership?.role === 'OWNER';

  // Check for unacknowledged rule changes
  const hasUnacknowledgedRules = userMembership && challenge.rulesUpdatedAt
    ? hasUnacknowledgedRuleChanges(challenge, userMembership)
    : false;

  // Calculate active member count for badge
  const activeMemberCount = challenge.members?.filter(m => m.status === 'ACTIVE').length || 0;
  const isGroupChallenge = activeMemberCount > 1;

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
  
  // Calculate progress for fitness challenges with deadline
  const shouldShowProgress = challenge.objectiveType === 'DAILY_EXERCISE' && challenge.dueDate;
  const progress = shouldShowProgress
    ? calculateActiveDays(
        logs.map(log => ({
          date: log.date,
          consumedSugar: log.consumedSugar,
          confirmedAt: log.confirmedAt,
        })),
        challenge.userJoinedAt || challenge.startDate,
        challenge.dueDate!,
        userTimezone
      )
    : null;
  
  // Filter out today from pending days for display purposes (today has its own section)
  const pastPendingDays = pendingDays.filter(date => date !== today);
  const hasPendingDays = pendingDays.length > 0;
  const hasPastPendingDays = pastPendingDays.length > 0;

  // Milestone detection helper
  const isMilestoneStreak = (streak: number): boolean => {
    const milestones = [10, 25, 50, 100, 200, 365, 500, 1000];
    return milestones.includes(streak);
  };
  const isMilestone = isMilestoneStreak(currentStreak);

  // Note: Auto-open is now handled at dashboard level for grouped pending days

  const handleConfirmToday = async (consumedSugar: boolean) => {
    setLoading(true);
    
    const result = await confirmDay(today, consumedSugar, challenge.id);
    
    if (result.success) {
      setTodayLog(result.log);
      // Clear reminder when user confirms today
      clearReminder(challenge.id);
      
      // Check if there are pending days after confirming today
      // Recalculate pending days with the new log
      const updatedLogs = [...logs, result.log];
      const updatedPendingDays = detectPendingDays(
        updatedLogs,
        userTimezone,
        challenge.userJoinedAt || challenge.startDate
      );
      const updatedPastPendingDays = updatedPendingDays.filter(date => date !== today);
      
      // If there are past pending days, prompt the user via grouped modal
      if (updatedPastPendingDays.length > 0 && onOpenPendingModal) {
        // Small delay to let the UI update first
        setTimeout(() => {
          onOpenPendingModal(challenge.objectiveType);
        }, 300);
      }
      
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
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 sm:p-6 mb-6">
      {/* Challenge Name and Icon */}
      <div className="mb-4">
        {/* Single row: Icon + Title (left) | Code + Badge (right) */}
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex items-start gap-3 min-w-0 flex-1">
            <div className="flex-shrink-0">
              <ChallengeIcon type={challenge.objectiveType as any} size="md" />
            </div>
            <div className="min-w-0 flex-1">
              <Link 
                href={`/${locale}/challenges/${challenge.id}`}
                prefetch={true}
              >
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer break-words">
                  {challenge.name}
                </h2>
              </Link>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {challenge.shortId && (
              <span className="hidden md:inline-flex px-2 py-1 text-xs font-mono font-semibold bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded whitespace-nowrap">
                #{challenge.shortId}
              </span>
            )}
            <span className={`px-2 py-1 text-xs font-semibold rounded whitespace-nowrap ${
              isGroupChallenge
                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
            }`}>
              {isGroupChallenge ? t('groupBadge', { defaultValue: 'Group' }) : t('individualBadge', { defaultValue: 'Individual' })}
            </span>
          </div>
        </div>
        
        {/* Challenge metadata */}
        <div className="ml-0 sm:ml-11 space-y-1 text-sm">
          {challenge.owner && (
            <p className="text-gray-600 dark:text-gray-400 break-words">
              {t('createdBy')} {challenge.owner.email}
            </p>
          )}
          {challenge.members && (
            <p className="text-gray-600 dark:text-gray-400">
              {activeMemberCount} {activeMemberCount === 1 ? t('member') : t('members')}
            </p>
          )}
          {challenge.userJoinedAt && (
            <p className="text-gray-600 dark:text-gray-400">
              {t('youJoined')}: {formatDateString(challenge.userJoinedAt)}
            </p>
          )}
        </div>
      </div>

      {/* Streaks - Enhanced Achievement Display */}
      <div className="mb-4">
        {shouldShowProgress && progress ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <StreakAchievement
              currentStreak={currentStreak}
              bestStreak={bestStreak}
              isMilestone={isMilestone}
            />
            <ProgressRing
              activeDays={progress.activeDays}
              totalDays={progress.totalDays}
            />
          </div>
        ) : (
          <StreakAchievement
            currentStreak={currentStreak}
            bestStreak={bestStreak}
            isMilestone={isMilestone}
          />
        )}
      </div>

      {/* Challenge Details */}
      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 sm:p-4 mb-4">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center text-sm gap-2">
          <div className="flex flex-col sm:flex-row sm:gap-4 gap-1">
            <div>
              <span className="text-gray-600 dark:text-gray-400">{t('challengeStarted')}: </span>
              <span className="text-gray-900 dark:text-white font-medium">
                {formatDateString(challenge.startDate)}
              </span>
            </div>
            <div>
              <span className="text-gray-600 dark:text-gray-400">{t('activeFor')}: </span>
              <span className="text-gray-900 dark:text-white font-medium">
                {Math.floor((Date.now() - new Date(challenge.startDate).getTime()) / (1000 * 60 * 60 * 24))} {t('days')}
              </span>
            </div>
          </div>
          {challenge.dueDate && (
            <div className="flex items-center flex-wrap gap-2">
              <div>
                <span className="text-gray-600 dark:text-gray-400">{t('ends')}: </span>
                <span className="text-gray-900 dark:text-white font-medium">
                  {formatDateString(challenge.dueDate)}
                </span>
              </div>
              {(() => {
                const daysUntilDue = Math.floor((new Date(challenge.dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                if (daysUntilDue < 3) {
                  return (
                    <span className="px-2 py-1 text-xs font-semibold bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded whitespace-nowrap">
                      {t('endingSoon')}
                    </span>
                  );
                } else if (daysUntilDue < 7) {
                  return (
                    <span className="px-2 py-1 text-xs font-semibold bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 rounded whitespace-nowrap">
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

      {/* Rule Change Warning Banner - BLOCKING */}
      {hasUnacknowledgedRules && (
        <div className="bg-orange-50 dark:bg-orange-900/20 border-2 border-orange-400 dark:border-orange-600 rounded-lg p-4 mb-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 text-2xl">⚠️</div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-orange-900 dark:text-orange-100 mb-2">
                {t('ruleChangeRequired')}
              </p>
              <Link 
                href={`/${locale}/challenges/${challenge.id}`}
                className="inline-block px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-md text-sm font-medium min-h-[44px]"
              >
                {t('viewAndRespond')}
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Pending Days Alert - Always show if there are past pending days */}
      {hasGroupPendingDays && !hasUnacknowledgedRules && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 mb-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
              {t('pendingDays')}: {groupPendingCount}
            </p>
            <button
              onClick={() => onOpenPendingModal?.(challenge.objectiveType)}
              className="px-3 py-1 bg-yellow-600 hover:bg-yellow-700 text-white rounded-md text-sm font-medium min-h-[36px]"
            >
              {t('confirmPendingDays')}
            </button>
          </div>
        </div>
      )}

      {/* Today's Confirmation - Hide if unacknowledged rules */}
      {!hasUnacknowledgedRules && (
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
      )}

      {/* Challenge Actions - Show appropriate button */}
      <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
        {isAdmin ? (
          <button
            onClick={() => setShowStopModal(true)}
            className="w-full px-4 py-3 border-2 border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 rounded-md font-medium hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors min-h-[44px]"
          >
            {t('archiveChallenge', { defaultValue: 'Archive Challenge' })}
          </button>
        ) : (
          <button
            onClick={() => setShowQuitModal(true)}
            className="w-full px-4 py-3 border-2 border-orange-300 dark:border-orange-700 text-orange-600 dark:text-orange-400 rounded-md font-medium hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-colors min-h-[44px]"
          >
            {t('quitChallenge', { defaultValue: 'Quit Challenge' })}
          </button>
        )}
      </div>

      {/* Modals */}
      {showStopModal && isAdmin && (
        <StopChallengeModal
          challengeId={challenge.id}
          challengeName={challenge.name}
          onClose={() => setShowStopModal(false)}
        />
      )}
      
      {showQuitModal && !isAdmin && (
        <QuitChallengeModal
          challengeId={challenge.id}
          challengeName={challenge.name}
          onClose={() => setShowQuitModal(false)}
        />
      )}
    </div>
  );
}

