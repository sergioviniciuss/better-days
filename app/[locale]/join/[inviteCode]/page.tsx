import { getCurrentUser } from '@/app/actions/auth';
import { joinChallengeByCode } from '@/app/actions/challenge';
import { redirect } from 'next/navigation';
import { JoinChallengeContent } from '@/components/challenges/JoinChallengeContent';

export default async function JoinChallengePage({
  params,
}: {
  params: Promise<{ locale: string; inviteCode: string }>;
}) {
  const { locale, inviteCode } = await params;
  const user = await getCurrentUser();

  if (!user) {
    redirect(`/${locale}/login`);
  }

  const result = await joinChallengeByCode(inviteCode);

  if (result.error && result.error !== 'Already a member of this challenge') {
    return <JoinChallengeContent error={result.error} inviteCode={inviteCode} />;
  }

  // Success or already member - redirect to challenge
  if (result.challengeId) {
    redirect(`/${locale}/challenges/${result.challengeId}`);
  }

  return <JoinChallengeContent error="Failed to join challenge" inviteCode={inviteCode} />;
}

