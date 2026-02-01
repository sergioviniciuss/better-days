'use client';

import { useTranslations } from 'next-intl';
import { useState, useTransition } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { joinPublicHabit } from '@/app/actions/public-habit';
import type { PublicHabitDetail } from '@/lib/types/public-habit';

interface PublicHabitDetailHeaderProps {
  habit: PublicHabitDetail;
}

export const PublicHabitDetailHeader = ({ habit }: PublicHabitDetailHeaderProps) => {
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
      // Already a member, do nothing or show message
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
          router.push(`/${locale}/login?returnUrl=${pathname}`);
        } else {
          setError(result.error);
          setIsJoining(false);
        }
      } else if (result.success) {
        // Refresh page to show updated membership status
        startTransition(() => {
          router.refresh();
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

  const buttonDisabled = isJoining || isPending || habit.isUserMember;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <div className="flex items-start gap-4">
        {/* Icon */}
        {habit.icon ? (
          <div className="text-6xl">{habit.icon}</div>
        ) : null}

        {/* Content */}
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {habitTitle}
          </h1>

          {/* Badges */}
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="px-2 py-1 text-xs font-semibold rounded bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
              {t('card.publicBadge')}
            </span>
            <span className="px-2 py-1 text-xs font-semibold rounded bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">
              {t('card.groupBadge')}
            </span>
          </div>

          {/* Description */}
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {habitDescription}
          </p>

          {/* Participant Count */}
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            {t('participants', { count: habit.participantCount })}
          </p>

          {/* CTA Button */}
          <div>
            <button
              onClick={handleJoin}
              disabled={buttonDisabled}
              className={`px-6 py-2 rounded-md font-medium min-h-[44px] transition-colors ${
                buttonDisabled
                  ? 'bg-gray-400 dark:bg-gray-600 text-white cursor-not-allowed'
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
      </div>
    </div>
  );
};
