'use client';

import { useTranslations } from 'next-intl';
import { useState, useTransition } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { joinPublicHabit } from '@/app/actions/public-habit';
import type { PublicHabitListItem } from '@/lib/types/public-habit';

interface PublicHabitCardProps {
  habit: PublicHabitListItem;
}

export const PublicHabitCard = ({ habit }: PublicHabitCardProps) => {
  const t = useTranslations('publicChallenges');
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const pathname = usePathname();
  const locale = pathname.split('/')[1];

  // Get localized title and description
  const habitTitle = t(`habits.${habit.slug}.title`);
  const habitDescription = t(`habits.${habit.slug}.description`);

  const handleJoin = async () => {
    if (habit.isUserMember) {
      // Navigate to detail page
      router.push(`/${locale}/public-challenges/${habit.slug}?timeframe=month`);
      return;
    }

    setIsJoining(true);
    setError(null);

    try {
      const result = await joinPublicHabit(habit.id);

      if (result.error) {
        if (result.error === 'Not authenticated') {
          // Store habit ID for auto-join after login
          sessionStorage.setItem('joinHabitId', habit.id);
          router.push(`/${locale}/login?returnTo=${pathname}`);
        } else {
          setError(result.error);
          setIsJoining(false);
        }
      } else if (result.success) {
        // Navigate to detail page
        startTransition(() => {
          router.push(`/${locale}/public-challenges/${result.slug}?timeframe=month`);
        });
      }
    } catch (err) {
      console.error('Error joining habit:', err);
      setError('Failed to join');
      setIsJoining(false);
    }
  };

  const buttonText = habit.isUserMember
    ? t('view')
    : isJoining || isPending
    ? t('joining')
    : t('join');

  const buttonDisabled = isJoining || isPending;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 flex flex-col">
      {/* Header with Icon */}
      <div className="flex items-start gap-4 mb-4">
        {habit.icon ? (
          <div className="text-5xl">{habit.icon}</div>
        ) : null}
        <div className="flex-1">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            {habitTitle}
          </h3>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="px-2 py-1 text-xs font-semibold rounded bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
              {t('card.publicBadge')}
            </span>
            <span className="px-2 py-1 text-xs font-semibold rounded bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">
              {t('card.groupBadge')}
            </span>
          </div>
        </div>
      </div>

      {/* Description */}
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        {habitDescription}
      </p>

      {/* Participant Count */}
      <div className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        {t('participants', { count: habit.participantCount })}
      </div>

      {/* Top 3 Preview */}
      {habit.topParticipants && habit.topParticipants.length > 0 ? (
        <div className="mb-4 flex-1">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {t('topThisMonth')}
          </p>
          <div className="space-y-1">
            {habit.topParticipants.map(entry => (
              <div key={entry.rank} className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                <span>#{entry.rank} {entry.displayName}</span>
                <span>{entry.score} days</span>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {/* CTA Button */}
      <div className="mt-auto">
        <button
          onClick={handleJoin}
          disabled={buttonDisabled}
          className={`w-full px-4 py-2 rounded-md font-medium min-h-[44px] transition-colors ${
            buttonDisabled
              ? 'bg-gray-400 dark:bg-gray-600 text-white cursor-not-allowed'
              : habit.isUserMember
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
