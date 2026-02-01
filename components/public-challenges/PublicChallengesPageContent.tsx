'use client';

import { useTranslations } from 'next-intl';
import { useState, useMemo } from 'react';
import { PublicChallengeCard } from './PublicChallengeCard';
import type { PublicChallengesData, PublicChallenge } from '@/lib/types/public-challenge';

interface PublicChallengesPageContentProps {
  data: PublicChallengesData;
}

type FilterType = 'ALL' | 'NO_SUGAR_STREAK' | 'ZERO_ALCOHOL' | 'DAILY_EXERCISE';

export const PublicChallengesPageContent = ({ data }: PublicChallengesPageContentProps) => {
  const t = useTranslations('publicChallenges');
  const tFilter = useTranslations('publicChallenges.filter');
  const [filter, setFilter] = useState<FilterType>('ALL');

  // Combine all challenges into a single array
  const allChallenges = useMemo(() => {
    return [...data.monthly, ...data.annual, ...data.lifetime];
  }, [data.monthly, data.annual, data.lifetime]);

  // Sort challenges: first by objectiveType, then by category
  const sortedChallenges = useMemo(() => {
    const categoryOrder = { MONTHLY: 1, ANNUAL: 2, LIFETIME: 3 };
    const objectiveOrder = { NO_SUGAR_STREAK: 1, ZERO_ALCOHOL: 2, DAILY_EXERCISE: 3 };
    
    return [...allChallenges].sort((a, b) => {
      const objA = objectiveOrder[a.objectiveType as keyof typeof objectiveOrder] || 999;
      const objB = objectiveOrder[b.objectiveType as keyof typeof objectiveOrder] || 999;
      
      if (objA !== objB) return objA - objB;
      
      const catA = categoryOrder[a.category as keyof typeof categoryOrder] || 999;
      const catB = categoryOrder[b.category as keyof typeof categoryOrder] || 999;
      return catA - catB;
    });
  }, [allChallenges]);

  // Filter challenges based on mobile filter selection
  const filteredChallenges = useMemo(() => {
    if (filter === 'ALL') {
      return sortedChallenges;
    }
    return sortedChallenges.filter(c => c.objectiveType === filter);
  }, [sortedChallenges, filter]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Hero Section */}
      <div className="mb-12 text-center">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
          {t('title')}
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-400 mb-2">
          {t('subtitle')}
        </p>
        <p className="text-lg text-gray-500 dark:text-gray-500">
          {t('tagline')}
        </p>
      </div>

      {/* Mobile Filter Dropdown */}
      <div className="mb-6 md:hidden">
        <label htmlFor="challenge-filter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {tFilter('label')}
        </label>
        <select
          id="challenge-filter"
          value={filter}
          onChange={(e) => setFilter(e.target.value as FilterType)}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="ALL">{tFilter('all')}</option>
          <option value="NO_SUGAR_STREAK">{tFilter('noSugar')}</option>
          <option value="ZERO_ALCOHOL">{tFilter('zeroAlcohol')}</option>
          <option value="DAILY_EXERCISE">{tFilter('activeDays')}</option>
        </select>
      </div>

      {/* Challenges Grid */}
      {filteredChallenges.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {filteredChallenges.map((challenge) => (
            <PublicChallengeCard key={challenge.id} challenge={challenge} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            No public challenges available at the moment.
          </p>
        </div>
      )}
    </div>
  );
};
