'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { confirmMultipleDays } from '@/app/actions/daily-log';
import { ConfirmationCalendar } from './ConfirmationCalendar';
import { getTodayInTimezone, getDaysAgoInTimezone } from '@/lib/date-utils';
import { useRouter } from 'next/navigation';

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
}

interface EditConfirmationsModalProps {
  confirmedLogs: DailyLog[];
  challenges: Challenge[];
  challengeId?: string; // If provided, editing single challenge; if undefined, editing all challenges
  userTimezone: string;
  onClose: () => void;
}

export function EditConfirmationsModal({
  confirmedLogs,
  challenges,
  challengeId,
  userTimezone,
  onClose,
}: EditConfirmationsModalProps) {
  const t = useTranslations('editConfirmations');
  const tCommon = useTranslations('common');
  const tHistory = useTranslations('history');
  const tChallenge = useTranslations('challengeConfirmation');
  const tDashboard = useTranslations('dashboard');
  const router = useRouter();
  
  // Filter to last 30 days
  const today = getTodayInTimezone(userTimezone);
  const thirtyDaysAgo = getDaysAgoInTimezone(userTimezone, 30);
  
  const editableLogs = confirmedLogs.filter((log) => {
    return log.date >= thirtyDaysAgo && log.date <= today;
  });
  
  // Get challenge map
  const challengeMap = new Map(challenges.map(c => [c.id, c]));
  
  // Initialize states from logs
  const initialStates: Record<string, boolean> = {};
  editableLogs.forEach((log) => {
    initialStates[log.date] = log.consumedSugar;
  });
  
  const [currentStates, setCurrentStates] = useState<Record<string, boolean | undefined>>(initialStates);
  const [submitting, setSubmitting] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('calendar');
  
  // Calendar state
  const firstDate = editableLogs.length > 0 
    ? new Date(editableLogs[0].date + 'T00:00:00') 
    : new Date();
  const [currentMonth, setCurrentMonth] = useState(firstDate.getMonth());
  const [currentYear, setCurrentYear] = useState(firstDate.getFullYear());
  
  const editableDates = editableLogs.map(log => log.date);
  
  const handleDateClick = (date: string) => {
    const currentState = currentStates[date];
    // Cycle: unconfirmed -> success -> failure -> unconfirmed
    if (currentState === undefined) {
      setCurrentStates(prev => ({ ...prev, [date]: false }));
    } else if (currentState === false) {
      setCurrentStates(prev => ({ ...prev, [date]: true }));
    } else if (currentState === true) {
      setCurrentStates(prev => {
        const newStates = { ...prev };
        delete newStates[date];
        return newStates;
      });
    }
  };
  
  const handleToggle = (date: string, consumedSugar: boolean) => {
    setCurrentStates(prev => ({ ...prev, [date]: consumedSugar }));
  };
  
  const handleMarkAll = (consumedSugar: boolean) => {
    const all: Record<string, boolean> = {};
    editableDates.forEach((date) => {
      all[date] = consumedSugar;
    });
    setCurrentStates(all);
  };
  
  const handleSubmit = async () => {
    setSubmitting(true);
    
    // Find changed dates
    const changes: Array<{ date: string; consumedSugar: boolean; challengeId: string }> = [];
    
    editableLogs.forEach((log) => {
      const originalState = initialStates[log.date];
      const currentState = currentStates[log.date];
      
      // If state changed, add to changes
      if (originalState !== currentState) {
        // If currentState is undefined, we need to handle it - but for confirmed logs, we shouldn't allow unconfirmed
        // Actually, for editing confirmed logs, we should only allow toggling between success and failure
        // So if currentState is undefined, we'll skip it (user cleared it, but we'll keep original)
        if (currentState !== undefined) {
          changes.push({
            date: log.date,
            consumedSugar: currentState,
            challengeId: log.challengeId,
          });
        }
      }
    });
    
    if (changes.length === 0) {
      setSubmitting(false);
      onClose();
      return;
    }
    
    const result = await confirmMultipleDays(changes);
    if (result.success) {
      router.refresh();
      onClose();
    } else {
      alert(result.error || 'Failed to save changes');
      setSubmitting(false);
    }
  };
  
  const getLabels = (challengeId: string) => {
    const challenge = challengeMap.get(challengeId);
    if (!challenge) {
      return { success: tDashboard('noSugar'), failure: tDashboard('consumedSugar') };
    }
    
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
  
  if (editableLogs.length === 0) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full">
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {t('title')}
              </h2>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 min-h-[44px] min-w-[44px]"
              >
                ✕
              </button>
            </div>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {t('noEditableConfirmations')}
            </p>
            <div className="flex justify-end">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-md font-medium min-h-[44px]"
              >
                {tCommon('close')}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {t('title')}
            </h2>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setViewMode(viewMode === 'list' ? 'calendar' : 'list')}
                className="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 min-h-[36px]"
              >
                {viewMode === 'list' ? '📅 Calendar' : '📋 List'}
              </button>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 min-h-[44px] min-w-[44px]"
              >
                ✕
              </button>
            </div>
          </div>

          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {t('description')}
          </p>

          <div className="mb-4 flex gap-2">
            <button
              onClick={() => handleMarkAll(false)}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md text-sm font-medium min-h-[44px]"
            >
              {tDashboard('noSugar')}
            </button>
            <button
              onClick={() => handleMarkAll(true)}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md text-sm font-medium min-h-[44px]"
            >
              {tDashboard('consumedSugar')}
            </button>
          </div>

          {viewMode === 'list' ? (
            <div className="space-y-2 mb-6">
              {editableLogs.map((log) => {
                const challenge = challengeMap.get(log.challengeId);
                const labels = getLabels(log.challengeId);
                const currentState = currentStates[log.date];
                const isSuccess = currentState === false;
                const isFailure = currentState === true;
                
                return (
                  <div
                    key={log.id}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-md"
                  >
                    <div className="flex-1">
                      <span className="text-gray-900 dark:text-white block">
                        {new Date(log.date + 'T00:00:00').toLocaleDateString()}
                      </span>
                      {challenge && (
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {challenge.name}
                        </span>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleToggle(log.date, false)}
                        className={`px-4 py-2 rounded-md text-sm font-medium min-h-[44px] ${
                          isSuccess
                            ? 'bg-green-600 text-white'
                            : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        {labels.success}
                      </button>
                      <button
                        onClick={() => handleToggle(log.date, true)}
                        className={`px-4 py-2 rounded-md text-sm font-medium min-h-[44px] ${
                          isFailure
                            ? 'bg-red-600 text-white'
                            : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        {labels.failure}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="mb-6">
              <ConfirmationCalendar
                dates={editableDates}
                currentStates={currentStates}
                editableDates={editableDates}
                onDateClick={handleDateClick}
                currentMonth={currentMonth}
                currentYear={currentYear}
                onMonthChange={(month, year) => {
                  setCurrentMonth(month);
                  setCurrentYear(year);
                }}
                userTimezone={userTimezone}
              />
            </div>
          )}

          <div className="flex justify-between gap-4">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-md font-medium min-h-[44px]"
            >
              {tCommon('cancel')}
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
            >
              {submitting ? tCommon('loading') : t('saveChanges')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

