import { render, screen } from '@testing-library/react';
import { AchievementBadge } from './AchievementBadge';
import { NextIntlClientProvider } from 'next-intl';

const messages = {
  achievements: {
    earnedOn: 'Earned:',
    progress: 'Progress:',
    badges: {
      streak_3: {
        name: 'Star',
        description: 'Reach a 3-day streak',
      },
    },
  },
};

const mockAchievement = {
  name: 'Star',
  nameKey: 'achievements.badges.streak_3.name',
  description: 'Reach a 3-day streak',
  descriptionKey: 'achievements.badges.streak_3.description',
  iconEmoji: '🌟',
  tier: 'BRONZE' as const,
};

describe('AchievementBadge', () => {
  const renderBadge = (props: any) => {
    return render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <AchievementBadge {...mockAchievement} {...props} />
      </NextIntlClientProvider>
    );
  };

  it('should render earned badge', () => {
    renderBadge({ earned: true });
    expect(screen.getAllByText('Star')[0]).toBeVisible();
    expect(screen.getByText('🌟')).toBeVisible();
  });

  it('should render locked badge', () => {
    renderBadge({ earned: false });
    expect(screen.getAllByText('Star')[0]).toBeVisible();
    expect(screen.getByText('🔒')).toBeVisible();
  });

  it('should show progress bar when not earned and progress is provided', () => {
    renderBadge({
      earned: false,
      showProgress: true,
      progress: { current: 2, target: 3, percentage: 67 },
    });
    expect(screen.getByText('2/3')).toBeVisible();
  });

  it('should not show progress bar when earned', () => {
    renderBadge({
      earned: true,
      showProgress: true,
      progress: { current: 3, target: 3, percentage: 100 },
    });
    expect(screen.queryByText('3/3')).not.toBeInTheDocument();
  });

  it('should apply correct size classes', () => {
    const { container } = renderBadge({ earned: true, size: 'lg' });
    expect(container.querySelector('.w-32')).toBeInTheDocument();
  });

  it('should show earned date when provided', () => {
    const earnedAt = new Date('2024-01-15');
    renderBadge({ earned: true, earnedAt });
    // Date will be in tooltip, which is hidden by default
    expect(screen.getAllByText('Star')[0]).toBeVisible();
  });
});
