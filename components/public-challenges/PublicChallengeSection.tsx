'use client';

import { useTranslations } from 'next-intl';
import { PublicChallengeCard } from './PublicChallengeCard';
import type { PublicChallenge } from '@/lib/types/public-challenge';

interface PublicChallengeSectionProps {
  title: string;
  subtitle: string;
  challenges: PublicChallenge[];
  category: 'MONTHLY' | 'ANNUAL' | 'LIFETIME';
  endsInDays?: number;
}

export const PublicChallengeSection = ({
  title,
  subtitle,
  challenges,
  category,
  endsInDays,
}: PublicChallengeSectionProps) => {
  const t = useTranslations('publicChallenges.monthly');

  if (challenges.length === 0) {
    return null;
  }

  return (
    <section className="mb-12">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {title}
          </h2>
          {category === 'MONTHLY' && endsInDays !== undefined ? (
            <span className="px-3 py-1 text-sm font-semibold rounded bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300">
              {t('endsIn', { days: endsInDays })}
            </span>
          ) : null}
        </div>
        <p className="text-gray-600 dark:text-gray-400">
          {subtitle}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {challenges.map((challenge) => (
          <PublicChallengeCard key={challenge.id} challenge={challenge} />
        ))}
      </div>
    </section>
  );
};
