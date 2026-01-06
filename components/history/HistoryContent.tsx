'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { formatDateString } from '@/lib/date-utils';
import { ChallengeIcon } from '@/lib/challenge-icons';
import { EditConfirmationsModal } from '@/components/dashboard/EditConfirmationsModal';

interface DailyLog {
  id: string;
  date: string;
  consumedSugar: boolean;
  confirmedAt: Date | null;
  challengeId: string;
}

interface Challenge {
  id: string;
  name: string;
  objectiveType: string;
  shortId?: string;
  userStatus?: string;
  userLeftAt?: string;
}

interface HistoryContentProps {
  logs: DailyLog[];
  challenges: Challenge[];
  userTimezone: string;
}

export function HistoryContent({ logs, challenges, userTimezone }: HistoryContentProps) {
  const t = useTranslations('history');
  const tChallenge = useTranslations('challengeConfirmation');
  const tDashboard = useTranslations('dashboard');
  const [showEditModal, setShowEditModal] = useState(false);

  // Create a map of challenge IDs to challenge info
  const challengeMap = new Map(challenges.map(c => [c.id, c]));

  // Separate confirmed and unconfirmed logs
  const confirmedLogs = logs.filter((log) => log.confirmedAt !== null);
  const unconfirmedLogs = logs.filter((log) => log.confirmedAt === null);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
        {t('title')}
      </h1>

      {logs.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center">
          <p className="text-gray-600 dark:text-gray-400">{t('noLogs')}</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Confirmed Logs */}
          {confirmedLogs.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {t('confirmed')}
                </h2>
                <button
                  onClick={() => setShowEditModal(true)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium min-h-[44px]"
                >
                  {t('editConfirmations')}
                </button>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {confirmedLogs.map((log) => {
                    const challenge = challengeMap.get(log.challengeId);
                    if (!challenge) return null;
                    
                    // Get appropriate labels based on challenge type
                    const getLabels = () => {
                      switch (challenge.objectiveType) {
                        case 'NO_SUGAR':
                        case 'NO_SUGAR_STREAK':
                          return { success: tDashboard('noSugar'), failure: tDashboard('consumedSugar') };
                        case 'ZERO_ALCOHOL':
                          return { success: tChallenge('noAlcohol'), failure: tChallenge('consumedAlcohol') };
                        case 'DAILY_EXERCISE':
                          return { success: tChallenge('exercised'), failure: tChallenge('skippedExercise') };
                        default:
                          return { success: tChallenge('success'), failure: tChallenge('failed') };
                      }
                    };
                    
                    const labels = getLabels();
                    const isStopped = challenge.userStatus === 'LEFT';
                    
                    return (
                      <div
                        key={log.id}
                        className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center justify-between ${isStopped ? 'opacity-75' : ''}`}
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <ChallengeIcon type={challenge.objectiveType as any} size="sm" />
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {formatDateString(log.date)}
                            </p>
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {challenge.name}
                                {challenge.shortId && <span className="font-mono"> #{challenge.shortId}</span>}
                              </p>
                              {isStopped && (
                                <span className="px-1.5 py-0.5 text-xs font-semibold bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300 rounded">
                                  {t('stoppedChallenge')}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <span
                            className={`px-3 py-1 rounded-full text-sm font-medium ${
                              log.consumedSugar
                                ? 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-300'
                                : 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300'
                            }`}
                          >
                            {log.consumedSugar ? labels.failure : labels.success}
                          </span>
                          {log.confirmedAt && (
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {new Date(log.confirmedAt).toLocaleString()}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Unconfirmed Logs */}
          {unconfirmedLogs.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                {t('pending')}
              </h2>
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {unconfirmedLogs.map((log) => {
                    const challenge = challengeMap.get(log.challengeId);
                    if (!challenge) return null;
                    const isStopped = challenge.userStatus === 'LEFT';
                    
                    return (
                      <div
                        key={log.id}
                        className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center justify-between ${isStopped ? 'opacity-75' : ''}`}
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <ChallengeIcon type={challenge.objectiveType as any} size="sm" />
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {formatDateString(log.date)}
                            </p>
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {challenge.name}
                                {challenge.shortId && <span className="font-mono"> #{challenge.shortId}</span>}
                              </p>
                              {isStopped && (
                                <span className="px-1.5 py-0.5 text-xs font-semibold bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300 rounded">
                                  {t('stoppedChallenge')}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-300">
                            {t('pending')}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
      
      {showEditModal && (
        <EditConfirmationsModal
          confirmedLogs={confirmedLogs}
          challenges={challenges}
          userTimezone={userTimezone}
          onClose={() => setShowEditModal(false)}
        />
      )}
    </div>
  );
}
