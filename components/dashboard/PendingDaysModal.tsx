'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { confirmMultipleDays } from '@/app/actions/daily-log';
import { formatDateString } from '@/lib/date-utils';

interface PendingDaysModalProps {
  pendingDays: string[];
  onClose: () => void;
  onRemindLater: () => void;
  userTimezone: string;
  challengeId: string;
}

export function PendingDaysModal({ pendingDays, onClose, onRemindLater, userTimezone, challengeId }: PendingDaysModalProps) {
  const t = useTranslations('pendingDays');
  const [confirmations, setConfirmations] = useState<Record<string, boolean>>({});
  const [submitting, setSubmitting] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  
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

  const renderCalendarView = () => {
    // Generate calendar days
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
    
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'];
    
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    // Create array of days with empty slots for alignment
    const calendarDays = [];
    for (let i = 0; i < firstDayOfMonth; i++) {
      calendarDays.push(null);
    }
    for (let day = 1; day <= daysInMonth; day++) {
      calendarDays.push(day);
    }
    
    const formatDateForComparison = (day: number) => {
      const month = (currentMonth + 1).toString().padStart(2, '0');
      const dayStr = day.toString().padStart(2, '0');
      return `${currentYear}-${month}-${dayStr}`;
    };
    
    const isPendingDay = (day: number | null) => {
      if (day === null) return false;
      const dateStr = formatDateForComparison(day);
      return pendingDays.includes(dateStr);
    };
    
    return (
      <div className="space-y-4">
        {/* Month navigation */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => {
              if (currentMonth === 0) {
                setCurrentMonth(11);
                setCurrentYear(currentYear - 1);
              } else {
                setCurrentMonth(currentMonth - 1);
              }
            }}
            className="px-3 py-1 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md min-h-[36px]"
          >
            ←
          </button>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {monthNames[currentMonth]} {currentYear}
          </h3>
          <button
            onClick={() => {
              if (currentMonth === 11) {
                setCurrentMonth(0);
                setCurrentYear(currentYear + 1);
              } else {
                setCurrentMonth(currentMonth + 1);
              }
            }}
            className="px-3 py-1 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md min-h-[36px]"
          >
            →
          </button>
        </div>
        
        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-1">
          {/* Day names */}
          {dayNames.map(day => (
            <div key={day} className="text-center text-xs font-medium text-gray-600 dark:text-gray-400 py-2">
              {day}
            </div>
          ))}
          
          {/* Calendar days */}
          {calendarDays.map((day, index) => {
            if (day === null) {
              return <div key={`empty-${index}`} className="aspect-square" />;
            }
            
            const dateStr = formatDateForComparison(day);
            const isPending = isPendingDay(day);
            const isConfirmed = confirmations[dateStr] !== undefined;
            const isSuccess = confirmations[dateStr] === false;
            const isFailure = confirmations[dateStr] === true;
            
            return (
              <div
                key={day}
                className={`aspect-square flex flex-col items-center justify-center rounded-md text-sm cursor-pointer transition-colors ${
                  !isPending
                    ? 'text-gray-400 dark:text-gray-600 cursor-not-allowed'
                    : isSuccess
                    ? 'bg-green-600 text-white hover:bg-green-700'
                    : isFailure
                    ? 'bg-red-600 text-white hover:bg-red-700'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
                onClick={() => {
                  if (isPending && !isConfirmed) {
                    handleToggle(dateStr, false);
                  } else if (isPending && isSuccess) {
                    handleToggle(dateStr, true);
                  } else if (isPending && isFailure) {
                    setConfirmations((prev) => {
                      const newConfirmations = { ...prev };
                      delete newConfirmations[dateStr];
                      return newConfirmations;
                    });
                  }
                }}
              >
                <span className="font-medium">{day}</span>
                {isPending && isConfirmed && (
                  <span className="text-xs mt-1">
                    {isSuccess ? '✓' : '✗'}
                  </span>
                )}
              </div>
            );
          })}
        </div>
        
        <p className="text-xs text-gray-600 dark:text-gray-400 text-center mt-4">
          Click once for ✓ (No Sugar), twice for ✗ (Consumed), three times to clear
        </p>
      </div>
    );
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
              {t('markAllNoSugar')}
            </button>
            <button
              onClick={() => handleMarkAll(true)}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md text-sm font-medium min-h-[44px]"
            >
              {t('markAllConsumed')}
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
                      No Sugar
                    </button>
                    <button
                      onClick={() => handleToggle(date, true)}
                      className={`px-4 py-2 rounded-md text-sm font-medium min-h-[44px] ${
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
              {renderCalendarView()}
            </div>
          )}

          <div className="flex justify-between gap-4">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-md font-medium min-h-[44px]"
            >
              Cancel
            </button>
            <div className="flex gap-2">
              <button
                onClick={onRemindLater}
                className="px-4 py-2 border-2 border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400 rounded-md font-medium hover:bg-blue-50 dark:hover:bg-blue-900/20 min-h-[44px]"
              >
                {t('remindLater')}
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting || pendingDays.length === 0 || Object.keys(confirmations).length === 0}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
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

