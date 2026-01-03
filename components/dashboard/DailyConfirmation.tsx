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
          className="flex-1 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-md font-medium disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
        >
          {buttonLabels.success}
        </button>
        <button
          onClick={() => handleConfirm(true)}
          disabled={submitting || loading}
          className="flex-1 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-md font-medium disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
        >
          {buttonLabels.failure}
        </button>
      </div>
    </div>
  );
}
