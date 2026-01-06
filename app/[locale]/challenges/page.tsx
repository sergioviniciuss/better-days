import { getCurrentUser } from '@/app/actions/auth';
import { getChallenges } from '@/app/actions/challenge';
import { redirect } from 'next/navigation';
import { ChallengesContent } from '@/components/challenges/ChallengesContent';

export default async function ChallengesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const user = await getCurrentUser();

  if (!user) {
    redirect(`/${locale}/login`);
  }

  // Pass user to avoid redundant getCurrentUser call
  const { challenges } = await getChallenges(false, user);

  return <ChallengesContent user={user} challenges={challenges} />;
}
