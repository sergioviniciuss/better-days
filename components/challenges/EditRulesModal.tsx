'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { updateChallengeRules } from '@/app/actions/challenge';
import { useRouter } from 'next/navigation';

interface EditRulesModalProps {
  challengeId: string;
  currentRules: string[];
  onClose: () => void;
}

const AVAILABLE_RULES = [
  'addedSugarCounts',
  'fruitDoesNotCount',
  'missingDaysPending',
  'processedSugarOnly',
  'alcoholPermitted',
];

export const EditRulesModal = ({ challengeId, currentRules, onClose }: EditRulesModalProps) => {
  const t = useTranslations('editRules');
  const tChallenges = useTranslations('challenges');
  const router = useRouter();
  const [selectedRules, setSelectedRules] = useState<string[]>(currentRules);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleRule = (rule: string) => {
    setSelectedRules(prev =>
      prev.includes(rule)
        ? prev.filter(r => r !== rule)
        : [...prev, rule]
    );
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);

    const result = await updateChallengeRules(challengeId, selectedRules);

    if (result.error) {
      setError(result.error);
      setLoading(false);
    } else {
      onClose();
      router.refresh();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {t('title')}
            </h2>
            <button
              onClick={onClose}
              disabled={loading}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 min-h-[44px] min-w-[44px]"
            >
              ✕
            </button>
          </div>

          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {t('description')}
          </p>

          <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4 mb-6">
            <p className="text-sm text-orange-800 dark:text-orange-200">
              ⚠️ {t('warning')}
            </p>
          </div>

          <div className="space-y-3 mb-6">
            {AVAILABLE_RULES.map((rule) => (
              <label
                key={rule}
                className="flex items-start gap-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selectedRules.includes(rule)}
                  onChange={() => toggleRule(rule)}
                  disabled={loading}
                  className="mt-1 w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <div className="flex-1">
                  <div className="font-medium text-gray-900 dark:text-white">
                    {tChallenges(rule as any)}
                  </div>
                </div>
              </label>
            ))}
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
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] flex items-center justify-center"
            >
              {loading ? (
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                t('saveChanges')
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

