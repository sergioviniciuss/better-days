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
  onJoinSuccess?: () => void;
}

export function JoinChallengeBanner({
  challengeId,
  challengeName,
  inviteCode,
  memberCount,
  onJoinSuccess,
}: JoinChallengeBannerProps) {
  const t = useTranslations('joinChallenge');
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
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
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
          {error && (
            <div className="mt-3 bg-red-500/20 border border-red-300 rounded-md px-3 py-2 text-sm">
              {error}
            </div>
          )}
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
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

