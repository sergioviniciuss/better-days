'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';

interface DailyConfirmationProps {
  onConfirm: (consumedSugar: boolean) => Promise<void>;
  loading: boolean;
  labels?: {
    success: string;
    failure: string;
  };
}

export function DailyConfirmation({ onConfirm, loading, labels }: DailyConfirmationProps) {
  const t = useTranslations('dashboard');
  const [submitting, setSubmitting] = useState(false);

  const defaultLabels = {
    success: t('noSugar'),
    failure: t('consumedSugar')
  };
  const buttonLabels = labels || defaultLabels;

  const handleConfirm = async (consumedSugar: boolean) => {
    setSubmitting(true);
    await onConfirm(consumedSugar);
    setSubmitting(false);
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        {t('confirmToday')}
      </p>
      <div className="flex gap-4">
        <button
          onClick={() => handleConfirm(false)}
          disabled={submitting || loading}
          className="flex-1 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-md font-medium disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] flex items-center justify-center"
        >
          {submitting || loading ? (
            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : (
            buttonLabels.success
          )}
        </button>
        <button
          onClick={() => handleConfirm(true)}
          disabled={submitting || loading}
          className="flex-1 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-md font-medium disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] flex items-center justify-center"
        >
          {submitting || loading ? (
            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : (
            buttonLabels.failure
          )}
        </button>
      </div>
    </div>
  );
}
