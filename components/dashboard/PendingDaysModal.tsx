'use client';

import { useTranslations } from 'next-intl';
import { useState, useEffect } from 'react';
import { confirmMultipleDays } from '@/app/actions/daily-log';
import { formatDateString } from '@/lib/date-utils';
import { ConfirmationCalendar } from './ConfirmationCalendar';
import { getChallenge } from '@/app/actions/challenge';

interface PendingDaysModalProps {
  pendingDays: string[];
  onClose: () => void;
  onRemindLater: () => void;
  userTimezone: string;
  challengeId: string;
}

export function PendingDaysModal({ pendingDays, onClose, onRemindLater, userTimezone, challengeId }: PendingDaysModalProps) {
  const t = useTranslations('pendingDays');
  const tDashboard = useTranslations('dashboard');
  const tChallenge = useTranslations('challengeConfirmation');
  const [confirmations, setConfirmations] = useState<Record<string, boolean>>({});
  const [submitting, setSubmitting] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [objectiveType, setObjectiveType] = useState<string>('NO_SUGAR_STREAK');

  // Fetch challenge data to determine labels
  useEffect(() => {
    const fetchChallenge = async () => {
      const result = await getChallenge(challengeId);
      if (result.challenge && result.challenge.objectiveType) {
        setObjectiveType(result.challenge.objectiveType);
      }
    };
    fetchChallenge();
  }, [challengeId]);

  // Get labels based on objectiveType
  const getLabels = (objType: string) => {
    switch (objType) {
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

  const labels = getLabels(objectiveType);
  
  // Calendar state - must be at top level
  const firstDate = pendingDays.length > 0 
    ? new Date(pendingDays[0] + 'T00:00:00') 
    : new Date();
  const [currentMonth, setCurrentMonth] = useState(firstDate.getMonth());
  const [currentYear, setCurrentYear] = useState(firstDate.getFullYear());

  const handleToggle = (date: string, consumedSugar: boolean) => {
    setConfirmations((prev) => ({
      ...prev,
      [date]: consumedSugar,
    }));
  };

  const handleMarkAll = (consumedSugar: boolean) => {
    const all: Record<string, boolean> = {};
    pendingDays.forEach((date) => {
      all[date] = consumedSugar;
    });
    setConfirmations(all);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    const confirmationsArray = pendingDays.map((date) => ({
      date,
      consumedSugar: confirmations[date] ?? false,
      challengeId,
    }));

    const result = await confirmMultipleDays(confirmationsArray);
    if (result.success) {
      window.location.reload();
    } else {
      alert(result.error || 'Failed to confirm days');
      setSubmitting(false);
    }
  };

  const handleDateClick = (date: string) => {
    const currentState = confirmations[date];
    // Cycle: unconfirmed -> success -> failure -> unconfirmed
    if (currentState === undefined) {
      handleToggle(date, false);
    } else if (currentState === false) {
      handleToggle(date, true);
    } else if (currentState === true) {
      setConfirmations((prev) => {
        const newConfirmations = { ...prev };
        delete newConfirmations[date];
        return newConfirmations;
      });
    }
  };

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
                {viewMode === 'list' ? `📅 ${t('calendar')}` : `📋 ${t('list')}`}
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
              {labels.success}
            </button>
            <button
              onClick={() => handleMarkAll(true)}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md text-sm font-medium min-h-[44px]"
            >
              {labels.failure}
            </button>
          </div>

          {viewMode === 'list' ? (
            <div className="space-y-2 mb-6">
              {pendingDays.map((date) => (
                <div
                  key={date}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-md"
                >
                  <span className="text-gray-900 dark:text-white">
                    {formatDateString(date)}
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleToggle(date, false)}
                      className={`px-4 py-2 rounded-md text-sm font-medium min-h-[44px] ${
                        confirmations[date] === false
                          ? 'bg-green-600 text-white'
                          : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {labels.success}
                    </button>
                    <button
                      onClick={() => handleToggle(date, true)}
                      className={`px-4 py-2 rounded-md text-sm font-medium min-h-[44px] ${
                        confirmations[date] === true
                          ? 'bg-red-600 text-white'
                          : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {labels.failure}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="mb-6">
              <ConfirmationCalendar
                dates={pendingDays}
                currentStates={confirmations}
                editableDates={pendingDays}
                onDateClick={handleDateClick}
                currentMonth={currentMonth}
                currentYear={currentYear}
                onMonthChange={(month, year) => {
                  setCurrentMonth(month);
                  setCurrentYear(year);
                }}
                userTimezone={userTimezone}
                labels={labels}
              />
            </div>
          )}

          <div className="flex flex-col-reverse sm:flex-row sm:justify-between gap-4">
            <button
              onClick={onClose}
              className="w-full sm:w-auto px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-md font-medium min-h-[44px]"
            >
              {t('cancel')}
            </button>
            <div className="flex flex-col-reverse sm:flex-row gap-2">
              <button
                onClick={onRemindLater}
                className="w-full sm:w-auto px-4 py-2 border-2 border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400 rounded-md font-medium hover:bg-blue-50 dark:hover:bg-blue-900/20 min-h-[44px]"
              >
                {t('remindLater')}
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting || pendingDays.length === 0 || Object.keys(confirmations).length === 0}
                className="w-full sm:w-auto px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
              >
                {submitting ? t('loading') : t('confirmSelected')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

