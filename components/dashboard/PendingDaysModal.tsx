'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { confirmMultipleDays } from '@/app/actions/daily-log';
import { formatDateString } from '@/lib/date-utils';

interface PendingDaysModalProps {
  pendingDays: string[];
  onClose: () => void;
  userTimezone: string;
}

export function PendingDaysModal({ pendingDays, onClose, userTimezone }: PendingDaysModalProps) {
  const t = useTranslations('pendingDays');
  const [confirmations, setConfirmations] = useState<Record<string, boolean>>({});
  const [submitting, setSubmitting] = useState(false);

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
    }));

    const result = await confirmMultipleDays(confirmationsArray);
    if (result.success) {
      window.location.reload();
    } else {
      alert(result.error || 'Failed to confirm days');
      setSubmitting(false);
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
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 min-h-[44px] min-w-[44px]"
            >
              ✕
            </button>
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

          <div className="flex justify-end gap-4">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-md font-medium min-h-[44px]"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting || pendingDays.length === 0}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
            >
              {submitting ? 'Loading...' : t('confirmSelected')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

