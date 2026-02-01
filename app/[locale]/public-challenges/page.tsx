import { getPublicHabitsList } from '@/app/actions/public-habit';
import { PublicHabitsGrid } from '@/components/public-challenges/PublicHabitsGrid';
import { useTranslations } from 'next-intl';
import { getTranslations } from 'next-intl/server';

export async function generateMetadata({ params }: { params: { locale: string } }) {
  const t = await getTranslations({ locale: params.locale, namespace: 'publicChallenges' });
  
  return {
    title: `${t('title')} - Better Habits`,
    description: t('subtitle'),
  };
}

export default async function PublicChallengesPage() {
  // Fetch public habits (no auth required, but includes membership status if logged in)
  const habits = await getPublicHabitsList();

  const t = await getTranslations('publicChallenges');

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

      {/* Habits Grid */}
      <PublicHabitsGrid habits={habits} />
    </div>
  );
}
