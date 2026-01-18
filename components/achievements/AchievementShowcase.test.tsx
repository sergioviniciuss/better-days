import { render, screen } from '@testing-library/react';
import { AchievementShowcase } from './AchievementShowcase';
import { NextIntlClientProvider } from 'next-intl';

// Mock useRouter
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

const messages = {
  achievements: {
    title: 'Achievements',
    earned: 'earned',
    earnedOn: 'Earned:',
    viewAll: 'View All',
    viewAllBadges: 'View All Badges',
    noAchievementsYet: 'Start completing challenges to earn achievements!',
    badges: {
      streak_3: {
        name: 'Star',
        description: 'Reach a 3-day streak',
      },
    },
  },
  common: {
    of: 'of',
  },
};

const mockAchievements = [
  {
    id: 'ach_1',
    code: 'STREAK_3_DAYS',
    category: 'STREAK' as const,
    tier: 'BRONZE' as const,
    name: 'Star',
    nameKey: 'achievements.badges.streak_3.name',
    description: 'Reach a 3-day streak',
    descriptionKey: 'achievements.badges.streak_3.description',
    iconEmoji: '🌟',
    requirement: { type: 'streak' as const, value: 3 },
    order: 10,
    earned: true,
    earnedAt: new Date('2024-01-15'),
  },
];

describe('AchievementShowcase', () => {
  const renderShowcase = (props?: any) => {
    return render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <AchievementShowcase
          recentAchievements={[]}
          totalEarned={0}
          totalAvailable={10}
          locale="en"
          {...props}
        />
      </NextIntlClientProvider>
    );
  };

  it('should render title and stats', () => {
    renderShowcase({ totalEarned: 5, totalAvailable: 10 });
    expect(screen.getByText('Achievements')).toBeVisible();
    expect(screen.getByText(/5.*of.*10.*earned/i)).toBeVisible();
    expect(screen.getByText(/50%/)).toBeVisible();
  });

  it('should render recent achievements', () => {
    renderShowcase({
      recentAchievements: mockAchievements,
      totalEarned: 1,
      totalAvailable: 10,
    });
    expect(screen.getAllByText('Star')[0]).toBeVisible();
  });

  it('should show empty state when no achievements', () => {
    renderShowcase();
    expect(screen.getByText('Start completing challenges to earn achievements!')).toBeVisible();
  });

  it('should show view all link', () => {
    renderShowcase({
      recentAchievements: mockAchievements,
      totalEarned: 1,
      totalAvailable: 10,
    });
    expect(screen.getByText('View All')).toBeVisible();
  });

  it('should show progress bar with correct percentage', () => {
    const { container } = renderShowcase({
      totalEarned: 3,
      totalAvailable: 10,
    });
    const progressBar = container.querySelector('.bg-gradient-to-r');
    expect(progressBar).toHaveStyle({ width: '30%' });
  });
});
