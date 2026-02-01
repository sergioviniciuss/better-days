'use client';

import { useTranslations } from 'next-intl';
import { useState, useTransition } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { ChallengeIcon } from '@/lib/challenge-icons';
import { formatDateString } from '@/lib/date-utils';
import { LeaderboardPreview } from './LeaderboardPreview';
import { joinPublicChallenge } from '@/app/actions/challenge';
import type { PublicChallenge } from '@/lib/types/public-challenge';

interface PublicChallengeCardProps {
  challenge: PublicChallenge;
}

export const PublicChallengeCard = ({ challenge }: PublicChallengeCardProps) => {
  const t = useTranslations('publicChallenges.card');
  const tCategories = useTranslations('publicChallenges.categories');
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const pathname = usePathname();
  const locale = pathname.split('/')[1];

  // Get display name with current month for MONTHLY challenges
  const getDisplayName = () => {
    if (challenge.category === 'MONTHLY') {
      const monthName = new Date().toLocaleString(locale, { month: 'long' });
      const capitalizedMonth = monthName.charAt(0).toUpperCase() + monthName.slice(1);
      return `${challenge.name} — ${capitalizedMonth}`;
    }
    return challenge.name;
  };

  // Get next month's first day for "Resets on" display
  const getResetDate = () => {
    const now = new Date();
    const firstOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    return firstOfNextMonth.toISOString().split('T')[0];
  };

  // Calculate days until end of month for monthly challenges
  const getDaysUntilEndOfMonth = () => {
    const now = new Date();
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const diffTime = lastDay.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Get category display name
  const getCategoryLabel = () => {
    if (challenge.category === 'MONTHLY') return tCategories('monthly');
    if (challenge.category === 'ANNUAL') return tCategories('annual');
    if (challenge.category === 'LIFETIME') return tCategories('lifetime');
    return challenge.category;
  };

  const handleJoin = async () => {
    if (challenge.isUserMember) {
      router.push(`/${locale}/challenges/${challenge.id}`);
      return;
    }

    setIsJoining(true);
    setError(null);

    try {
      const result = await joinPublicChallenge(challenge.id);

      if (result.error) {
        if (result.error === 'Not authenticated') {
          // Store challenge ID for auto-join after login
          sessionStorage.setItem('joinChallengeId', challenge.id);
          router.push(`/${locale}/login?returnUrl=${pathname}`);
        } else {
          setError(result.error);
          setIsJoining(false);
        }
      } else if (result.success) {
        // Navigate to challenge detail page
        startTransition(() => {
          router.push(`/${locale}/challenges/${challenge.id}`);
        });
      }
    } catch (err) {
      console.error('Error joining challenge:', err);
      setError('Failed to join challenge');
      setIsJoining(false);
    }
  };

  const buttonText = challenge.isUserMember
    ? t('viewChallenge')
    : isJoining || isPending
    ? t('joining')
    : t('joinChallenge');

  const buttonDisabled = isJoining || isPending;

  // Calculate display entries based on screen size
  const mobileEntries = 3;
  const desktopEntries = 10;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 flex flex-col">
      {/* Header */}
      <div className="flex items-start gap-4 mb-4">
        <ChallengeIcon type={challenge.objectiveType as any} size="lg" />
        <div className="flex-1">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            {getDisplayName()}
          </h3>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="px-2 py-1 text-xs font-semibold rounded bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300">
              {getCategoryLabel()}
            </span>
            <span className="px-2 py-1 text-xs font-semibold rounded bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
              {t('publicBadge')}
            </span>
            <span className="px-2 py-1 text-xs font-semibold rounded bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">
              {t('groupBadge')}
            </span>
            {challenge.category === 'MONTHLY' ? (
              <span className="px-2 py-1 text-xs font-semibold rounded bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300">
                {t('endsIn', { days: getDaysUntilEndOfMonth() })}
              </span>
            ) : null}
          </div>
          {challenge.description ? (
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              {challenge.description}
            </p>
          ) : null}
        </div>
      </div>

      {/* Metadata */}
      <div className="text-sm text-gray-600 dark:text-gray-400 mb-4 space-y-1">
        {challenge.category === 'MONTHLY' ? (
          <div>
            {t('resetsOn', { date: formatDateString(getResetDate()) })}
          </div>
        ) : (
          <>
            <div>
              {t('startDate', { date: formatDateString(challenge.startDate) })}
            </div>
            {challenge.dueDate ? (
              <div>
                {t('endDate', { date: formatDateString(challenge.dueDate) })}
              </div>
            ) : null}
          </>
        )}
        <div>
          {t('participants', { count: challenge.participantCount })}
        </div>
      </div>

      {/* Leaderboard Preview */}
      <div className="mb-4 flex-1">
        {/* Mobile: Show 3 entries */}
        <div className="md:hidden">
          <LeaderboardPreview
            entries={challenge.topParticipants}
            maxEntries={mobileEntries}
          />
        </div>
        {/* Desktop: Show 10 entries */}
        <div className="hidden md:block">
          <LeaderboardPreview
            entries={challenge.topParticipants}
            maxEntries={desktopEntries}
          />
        </div>
      </div>

      {/* CTA Button */}
      <div className="mt-auto">
        <button
          onClick={handleJoin}
          disabled={buttonDisabled}
          className={`w-full px-4 py-2 rounded-md font-medium min-h-[44px] transition-colors ${
            buttonDisabled
              ? 'bg-gray-400 dark:bg-gray-600 text-white cursor-not-allowed'
              : challenge.isUserMember
              ? 'bg-gray-600 hover:bg-gray-700 text-white'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          {buttonText}
        </button>
        {error ? (
          <p className="text-sm text-red-600 dark:text-red-400 mt-2">
            {error}
          </p>
        ) : null}
      </div>
    </div>
  );
};
