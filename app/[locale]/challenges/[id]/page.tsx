import { getCurrentUser } from '@/app/actions/auth';
import { getChallenge } from '@/app/actions/challenge';
import { getChallengeLeaderboard } from '@/app/actions/leaderboard';
import { getDailyLogs } from '@/app/actions/daily-log';
import { redirect } from 'next/navigation';
import { ChallengeDetailContent } from '@/components/challenges/ChallengeDetailContent';
import { createClient } from '@/lib/supabase/server';

export default async function ChallengeDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; id: string }>;
  searchParams: Promise<{ invite?: string }>;
}) {
  const { locale, id } = await params;
  const { invite } = await searchParams;
  const user = await getCurrentUser();

  if (!user) {
    redirect(`/${locale}/login`);
  }

  const supabase = await createClient();

  // OPTIMIZATION: Run all queries in parallel instead of sequential

  // If accessed via invite link, handle invite flow
  if (invite === 'true') {
    // For invite flow: Check membership, fetch challenge, and get leaderboard in parallel
    const [membershipResult, challengeResult, leaderboardResult] = await Promise.all([
      supabase
        .from('ChallengeMember')
        .select('*')
        .eq('challengeId', id)
        .eq('userId', user.id)
        .single(),
      supabase
        .from('Challenge')
        .select(`
          *,
          owner:User!Challenge_ownerUserId_fkey(id, email),
          members:ChallengeMember(*, user:User(id, email)),
          invites:Invite(*)
        `)
        .eq('id', id)
        .single(),
      getChallengeLeaderboard(id, user)
    ]);

    const isMember = !!membershipResult.data;
    const challenge = challengeResult.data;
    const { leaderboard } = leaderboardResult;

    if (!challenge || challengeResult.error) {
      redirect(`/${locale}/challenges`);
    }

    if (!isMember) {
      // Not a member - show join confirmation with leaderboard data
      const inviteCode = challenge.invites?.[0]?.code || '';
      
      return (
        <ChallengeDetailContent
          challenge={challenge}
          leaderboard={leaderboard}
          user={user}
          userLogs={[]}
          showJoinConfirmation={true}
          inviteCode={inviteCode}
          isMember={false}
        />
      );
    }

    // Member accessing via invite - fall through to normal member flow below
  }

  // Normal member flow: Fetch everything in parallel
  const [challengeResult, leaderboardResult, logsResult] = await Promise.all([
    getChallenge(id, user),
    getChallengeLeaderboard(id, user),
    getDailyLogs(id, user)
  ]);

  if (!challengeResult.challenge) {
    redirect(`/${locale}/challenges`);
  }

  const challenge = challengeResult.challenge;
  const { leaderboard } = leaderboardResult;
  const { logs } = logsResult;

  const inviteCode = challenge.invites?.[0]?.code || '';

  return (
    <ChallengeDetailContent
      challenge={challenge}
      leaderboard={leaderboard}
      user={user}
      userLogs={logs}
      showJoinConfirmation={false}
      inviteCode={undefined}
      isMember={true}
    />
  );
}
