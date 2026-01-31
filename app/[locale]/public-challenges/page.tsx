import { getPublicChallenges } from '@/app/actions/challenge';
import { PublicChallengesPageContent } from '@/components/public-challenges/PublicChallengesPageContent';
import { getCurrentUser } from '@/app/actions/auth';

export const metadata = {
  title: 'Public Challenges - Better Habits',
  description: 'Join open challenges and build better habits together.',
};

export default async function PublicChallengesPage() {
  // Fetch public challenges (no auth required)
  const data = await getPublicChallenges();

  // Optionally check if user is authenticated (for membership status)
  // This doesn't block the page, just enhances the experience
  const user = await getCurrentUser();

  return <PublicChallengesPageContent data={data} />;
}
