'use client';

import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { joinChallengeByCode } from '@/app/actions/challenge';

interface JoinChallengeBannerProps {
  challengeId: string;
  challengeName: string;
  inviteCode: string;
  memberCount: number;
  rules: string[];
  onJoinSuccess?: () => void;
}

export function JoinChallengeBanner({
  challengeId,
  challengeName,
  inviteCode,
  memberCount,
  rules,
  onJoinSuccess,
}: JoinChallengeBannerProps) {
  const t = useTranslations('joinChallenge');
  const tChallenges = useTranslations('challenges');
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleJoin = async () => {
    setError(null);
    startTransition(async () => {
      const result = await joinChallengeByCode(inviteCode);
      
      if (result.error) {
        setError(result.error);
      } else if (result.success && result.challengeId) {
        // Call success callback if provided
        if (onJoinSuccess) {
          onJoinSuccess();
        }
        // Refresh the page to show full challenge details
        router.refresh();
      }
    });
  };

  const handleMaybeLater = () => {
    // Remove invite query param from URL
    const url = new URL(window.location.href);
    url.searchParams.delete('invite');
    router.push(url.pathname + url.search);
  };

  return (
    <div className="bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-700 dark:to-purple-700 rounded-lg shadow-lg p-6 mb-6 text-white">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div className="flex-1">
            <h2 className="text-2xl font-bold mb-2">
              {t('joinConfirmationTitle')}
            </h2>
            <p className="text-blue-100 dark:text-blue-200 mb-2">
              {t('joinConfirmationMessage')}
            </p>
            <p className="text-sm text-blue-200 dark:text-blue-300">
              <strong>{challengeName}</strong> • {memberCount} {memberCount === 1 ? t('member') : t('members')}
            </p>
          </div>
        </div>

        {/* Challenge Rules Section */}
        <div className="border-t border-white/20 pt-4">
          <h3 className="text-lg font-semibold mb-3">
            {t('challengeRules')}
          </h3>
          {rules.length > 0 ? (
            <ul className="space-y-2">
              {rules.map((rule, index) => (
                <li key={index} className="flex items-start gap-2 text-blue-100 dark:text-blue-200">
                  <svg 
                    className="w-5 h-5 mt-0.5 flex-shrink-0" 
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
              ))}
            </ul>
          ) : (
            <p className="text-blue-100 dark:text-blue-200 italic">
              {t('noRules')}
            </p>
          )}
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-300 rounded-md px-3 py-2 text-sm">
            {error}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            onClick={handleJoin}
            disabled={isPending}
            className="px-6 py-3 bg-white text-blue-600 rounded-md font-semibold hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] whitespace-nowrap"
          >
            {isPending ? t('joining') : t('joinChallengeButton')}
          </button>
          <button
            onClick={handleMaybeLater}
            disabled={isPending}
            className="px-6 py-3 bg-blue-500/20 border-2 border-white/50 text-white rounded-md font-semibold hover:bg-blue-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] whitespace-nowrap"
          >
            {t('maybeLaterButton')}
          </button>
        </div>
      </div>
    </div>
  );
}

