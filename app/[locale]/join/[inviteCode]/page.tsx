import { getCurrentUser } from '@/app/actions/auth';
import { getChallengeByInviteCode } from '@/app/actions/challenge';
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
    redirect(`/${locale}/login?returnUrl=/${locale}/join/${inviteCode}`);
  }

  // Get challenge details without joining
  const result = await getChallengeByInviteCode(inviteCode);

  if (result.error) {
    return <JoinChallengeContent error={result.error} inviteCode={inviteCode} />;
  }

  if (!result.challenge) {
    return <JoinChallengeContent error="Challenge not found" inviteCode={inviteCode} />;
  }

  // If already a member, redirect to challenge without invite param
  if (result.isMember) {
    redirect(`/${locale}/challenges/${result.challenge.id}`);
  }

  // If not a member, redirect to challenge with invite param to show confirmation banner
  redirect(`/${locale}/challenges/${result.challenge.id}?invite=true`);
}
