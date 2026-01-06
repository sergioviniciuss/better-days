'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { confirmMultipleDays } from '@/app/actions/daily-log';
import { formatDateString } from '@/lib/date-utils';
import { ConfirmationCalendar } from './ConfirmationCalendar';
import { ChallengeIcon } from '@/lib/challenge-icons';
import { clearReminder } from '@/lib/reminder-utils';
import { useRouter } from 'next/navigation';
import type { GroupedPendingDays } from '@/lib/streak-utils';

interface GroupedPendingDaysModalProps {
  group: GroupedPendingDays;
  onClose: () => void;
  onRemindLater: () => void;
  userTimezone: string;
}

export function GroupedPendingDaysModal({ group, onClose, onRemindLater, userTimezone }: GroupedPendingDaysModalProps) {
  const t = useTranslations('pendingDays');
  const router = useRouter();
  const [confirmations, setConfirmations] = useState<Record<string, boolean>>({});
  const [submitting, setSubmitting] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  
  // Calendar state - must be at top level
  const firstDate = group.allPendingDays.length > 0 
    ? new Date(group.allPendingDays[0] + 'T00:00:00') 
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
    group.allPendingDays.forEach((date) => {
      all[date] = consumedSugar;
    });
    setConfirmations(all);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    const confirmationsArray: Array<{ date: string; consumedSugar: boolean; challengeId: string }> = [];
    
    // For each date that has been confirmed, create entries for ALL challenges in the group
    group.allPendingDays.forEach(date => {
      if (confirmations[date] !== undefined) {
        group.challenges.forEach(challenge => {
          confirmationsArray.push({
            date,
            consumedSugar: confirmations[date],
            challengeId: challenge.id
          });
        });
      }
    });

    const result = await confirmMultipleDays(confirmationsArray);
    if (result.success) {
      // Clear reminder for this group
      clearReminder(`pending_${group.objectiveType}`);
      // Clear reminders for individual challenges in the group
      group.challenges.forEach(challenge => {
        clearReminder(challenge.id);
      });
      // Close modal and refresh
      onClose();
      router.refresh();
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
        <div className="p-4 sm:p-6">
          <div className="flex justify-between items-center mb-4">
            <div className="flex-1 pr-2 sm:pr-4">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                {t('title')}
              </h2>
            </div>
            <div className="flex items-center gap-1 sm:gap-2">
              <button
                onClick={() => setViewMode(viewMode === 'list' ? 'calendar' : 'list')}
                className="px-2 sm:px-3 py-1 text-xs sm:text-sm bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 min-h-[36px] whitespace-nowrap"
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

          <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p className="text-sm text-blue-800 dark:text-blue-200 font-medium mb-2">
              {t('applyToAll')}
            </p>
            <ul className="space-y-2">
              {group.challenges.map((challenge) => (
                <li
                  key={challenge.id}
                  className="flex items-center gap-2"
                >
                  <ChallengeIcon type={challenge.objectiveType as any} size="sm" />
                  <span className="text-sm text-blue-900 dark:text-blue-100 font-medium">
                    {challenge.name}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="mb-4 flex flex-col sm:flex-row gap-2">
            <button
              onClick={() => handleMarkAll(false)}
              className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md text-sm font-medium min-h-[44px]"
            >
              {t('markAllNoSugar')}
            </button>
            <button
              onClick={() => handleMarkAll(true)}
              className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md text-sm font-medium min-h-[44px]"
            >
              {t('markAllConsumed')}
            </button>
          </div>

          {viewMode === 'list' ? (
            <div className="space-y-2 mb-6">
              {group.allPendingDays.map((date) => (
                <div
                  key={date}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-3 bg-gray-50 dark:bg-gray-700 rounded-md"
                >
                  <span className="text-gray-900 dark:text-white font-medium">
                    {formatDateString(date)}
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleToggle(date, false)}
                      className={`flex-1 sm:flex-none px-4 py-2 rounded-md text-sm font-medium min-h-[44px] ${
                        confirmations[date] === false
                          ? 'bg-green-600 text-white'
                          : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      No Sugar
                    </button>
                    <button
                      onClick={() => handleToggle(date, true)}
                      className={`flex-1 sm:flex-none px-4 py-2 rounded-md text-sm font-medium min-h-[44px] ${
                        confirmations[date] === true
                          ? 'bg-red-600 text-white'
                          : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      Consumed Sugar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="mb-6">
              <ConfirmationCalendar
                dates={group.allPendingDays}
                currentStates={confirmations}
                editableDates={group.allPendingDays}
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

          <div className="flex flex-col sm:flex-row sm:justify-between gap-3">
            <button
              onClick={onClose}
              className="w-full sm:w-auto px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-md font-medium min-h-[44px]"
            >
              Cancel
            </button>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-2">
              <button
                onClick={onRemindLater}
                className="w-full sm:w-auto px-4 py-2 border-2 border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400 rounded-md font-medium hover:bg-blue-50 dark:hover:bg-blue-900/20 min-h-[44px]"
              >
                {t('remindLater')}
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting || group.allPendingDays.length === 0 || Object.keys(confirmations).length === 0}
                className="w-full sm:w-auto px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
              >
                {submitting ? 'Loading...' : t('confirmSelected')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

