'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { acknowledgeRuleChanges } from '@/app/actions/challenge';
import { useRouter } from 'next/navigation';

interface RuleChangeNotificationBannerProps {
  challengeId: string;
  rules: string[];
  onQuit: () => void;
}

export const RuleChangeNotificationBanner = ({ 
  challengeId, 
  rules,
  onQuit 
}: RuleChangeNotificationBannerProps) => {
  const t = useTranslations('ruleChangeNotification');
  const tChallenges = useTranslations('challenges');
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showRules, setShowRules] = useState(true);

  const handleAccept = async () => {
    setLoading(true);
    setError(null);

    const result = await acknowledgeRuleChanges(challengeId);

    if (result.error) {
      setError(result.error);
      setLoading(false);
    } else {
      router.refresh();
    }
  };

  return (
    <div className="bg-orange-50 dark:bg-orange-900/30 border-2 border-orange-400 dark:border-orange-600 rounded-lg p-6 mb-6">
      <div className="flex items-start gap-4 mb-4">
        <div className="flex-shrink-0 text-3xl">⚠️</div>
        <div className="flex-1">
          <h3 className="text-xl font-bold text-orange-900 dark:text-orange-100 mb-2">
            {t('title')}
          </h3>
          <p className="text-orange-800 dark:text-orange-200 mb-2">
            {t('message')}
          </p>
          <p className="text-sm text-orange-700 dark:text-orange-300 font-medium">
            {t('description')}
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 border border-orange-200 dark:border-orange-700 rounded-lg p-4 mb-4">
        <button
          onClick={() => setShowRules(!showRules)}
          className="w-full flex items-center justify-between text-left font-semibold text-gray-900 dark:text-white mb-2"
        >
          <span>{t('viewNewRules')}</span>
          <svg
            className={`w-5 h-5 transition-transform ${showRules ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {showRules && (
          <ul className="space-y-2">
            {rules.length > 0 ? (
              rules.map((rule, index) => (
                <li key={index} className="flex items-start gap-2 text-gray-700 dark:text-gray-300">
                  <svg 
                    className="w-5 h-5 mt-0.5 flex-shrink-0 text-blue-600 dark:text-blue-400" 
                    fill="currentColor" 
                    viewBox="0 0 20 20"
                  >
                    <path 
                      fillRule="evenodd" 
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" 
                      clipRule="evenodd" 
                    />
                  </svg>
                  <span>{tChallenges(rule as any)}</span>
                </li>
              ))
            ) : (
              <li className="text-gray-600 dark:text-gray-400 italic">
                {tChallenges('noRules', { defaultValue: 'No specific rules defined' })}
              </li>
            )}
          </ul>
        )}
      </div>

      {error && (
        <div className="mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 px-4 py-3 rounded-md text-sm">
          {error}
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={handleAccept}
          disabled={loading}
          className="flex-1 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-md font-semibold disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] flex items-center justify-center"
        >
          {loading ? (
            <>
              <svg className="animate-spin h-5 w-5 text-white mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {t('accepting')}
            </>
          ) : (
            t('acceptAndContinue')
          )}
        </button>
        <button
          onClick={onQuit}
          disabled={loading}
          className="flex-1 px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-md font-semibold disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
        >
          {t('leaveChallenge')}
        </button>
      </div>
    </div>
  );
};

