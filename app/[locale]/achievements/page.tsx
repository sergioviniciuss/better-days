import { getCurrentUser } from '@/app/actions/auth';
import { getAchievementsByCategory, getAchievementStats } from '@/app/actions/achievement';
import { redirect } from 'next/navigation';
import { AchievementsContent } from '@/components/achievements/AchievementsContent';

export default async function AchievementsPage() {
  const user = await getCurrentUser();
  
  if (!user) {
    redirect('/login');
  }

  const { grouped } = await getAchievementsByCategory(user.id);
  const { stats } = await getAchievementStats(user.id);

  return (
    <AchievementsContent
      grouped={grouped || {}}
      stats={stats || {
        totalEarned: 0,
        totalAvailable: 0,
        percentage: 0,
        byTier: { BRONZE: 0, SILVER: 0, GOLD: 0, PLATINUM: 0, LEGENDARY: 0 },
        mostRecent: null,
      }}
      userId={user.id}
      userTimezone={user.timezone}
    />
  );
}
