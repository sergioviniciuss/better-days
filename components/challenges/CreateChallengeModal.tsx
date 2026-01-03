'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { createChallenge } from '@/app/actions/challenge';
import { useRouter } from 'next/navigation';
import { getTodayInTimezone } from '@/lib/date-utils';

interface CreateChallengeModalProps {
  onClose: () => void;
  userTimezone: string;
}

export function CreateChallengeModal({ onClose, userTimezone }: CreateChallengeModalProps) {
  const t = useTranslations('challenges');
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (formData: FormData) => {
    setSubmitting(true);
    setError(null);

    const result = await createChallenge(formData);
    
    if (result.error) {
      setError(result.error);
      setSubmitting(false);
    } else {
      onClose();
      router.push(`/challenges/${result.challengeId}`);
      router.refresh();
    }
  };

  const today = getTodayInTimezone(userTimezone);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {t('createChallenge')}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 min-h-[44px] min-w-[44px]"
            >
              ✕
            </button>
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 px-4 py-3 rounded-md mb-4">
              {error}
            </div>
          )}

          <form action={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('challengeName')}
              </label>
              <input
                type="text"
                id="name"
                name="name"
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-white bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
              />
            </div>

            <div>
              <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('startDate')}
              </label>
              <input
                type="date"
                id="startDate"
                name="startDate"
                required
                defaultValue={today}
                min={today}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-white bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('rules')}
              </label>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="addedSugarCounts"
                    defaultChecked
                    className="mr-2 h-5 w-5"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {t('addedSugarCounts')}
                  </span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="fruitDoesNotCount"
                    defaultChecked
                    className="mr-2 h-5 w-5"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {t('fruitDoesNotCount')}
                  </span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="missingDaysPending"
                    defaultChecked
                    className="mr-2 h-5 w-5"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {t('missingDaysPending')}
                  </span>
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-4 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-md font-medium min-h-[44px]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
              >
                {submitting ? 'Creating...' : 'Create'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
