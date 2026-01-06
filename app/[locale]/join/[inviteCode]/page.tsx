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

  // If no user, middleware will redirect to login with invite code preserved
  if (!user) {
    redirect(`/${locale}/login`);
  }

  // Get challenge details without joining - pass user to avoid redundant call
  const result = await getChallengeByInviteCode(inviteCode, user);

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
