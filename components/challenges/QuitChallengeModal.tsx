'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { quitChallenge } from '@/app/actions/challenge';
import { useRouter } from 'next/navigation';

interface QuitChallengeModalProps {
  challengeId: string;
  challengeName: string;
  onClose: () => void;
}

export const QuitChallengeModal = ({ challengeId, challengeName, onClose }: QuitChallengeModalProps) => {
  const t = useTranslations('quitChallenge');
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    setLoading(true);
    setError(null);

    const result = await quitChallenge(challengeId);

    if (result.error) {
      setError(result.error);
      setLoading(false);
    } else {
      onClose();
      setTimeout(() => {
        router.push('/dashboard');
        router.refresh();
      }, 100);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
        <div className="mb-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            {t('title')}
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {challengeName}
          </p>
        </div>

        <div className="mb-6">
          <p className="text-gray-700 dark:text-gray-300 mb-4">
            {t('confirm')}
          </p>

          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-4">
            <p className="text-sm text-yellow-800 dark:text-yellow-200 font-medium mb-2">
              ⚠️ {t('warning')}
            </p>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <p className="text-sm text-blue-800 dark:text-blue-200 font-medium mb-2">
              {t('keepData', { defaultValue: 'Your data will be preserved' })}
            </p>
            <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
              <li>✓ {t('keepData')}</li>
              <li>✓ {t('newStreak')}</li>
            </ul>
          </div>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 px-4 py-3 rounded-md text-sm">
            {error}
          </div>
        )}

        <div className="flex flex-col-reverse sm:flex-row gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-4 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md font-medium hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
          >
            {t('cancel', { defaultValue: 'Cancel' })}
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading}
            className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-md font-medium disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] flex items-center justify-center"
          >
            {loading ? (
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              t('quitButton')
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

