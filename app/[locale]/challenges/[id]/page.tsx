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

  // Check membership status first
  const supabase = await createClient();
  const { data: membership } = await supabase
    .from('ChallengeMember')
    .select('*')
    .eq('challengeId', id)
    .eq('userId', user.id)
    .single();
  
  const isMember = !!membership;

  // If accessed via invite link and not a member, fetch challenge without membership requirement
  let challenge;
  let showJoinConfirmation = false;

  if (invite === 'true' && !isMember) {
    // Get challenge even if not a member (for invite flow)
    const { data: challengeData, error } = await supabase
      .from('Challenge')
      .select(`
        *,
        owner:User!Challenge_ownerUserId_fkey(id, email),
        members:ChallengeMember(*, user:User(id, email)),
        invites:Invite(*)
      `)
      .eq('id', id)
      .single();
    
    if (error || !challengeData) {
      redirect(`/${locale}/challenges`);
    }
    
    challenge = challengeData;
    showJoinConfirmation = true;
  } else {
    // Normal access - require membership
    const challengeResult = await getChallenge(id);
    if (!challengeResult.challenge) {
      redirect(`/${locale}/challenges`);
    }
    challenge = challengeResult.challenge;
  }

  if (!challenge) {
    redirect(`/${locale}/challenges`);
  }

  // Get leaderboard - always fetch it, especially for non-members viewing via invite
  // This allows them to see challenge details before deciding to join
  const { leaderboard } = await getChallengeLeaderboard(id);
  const { logs } = await getDailyLogs(id);

  const inviteCode = challenge.invites?.[0]?.code || '';

  return (
    <ChallengeDetailContent
      challenge={challenge}
      leaderboard={leaderboard}
      user={user}
      userLogs={logs}
      showJoinConfirmation={showJoinConfirmation}
      inviteCode={showJoinConfirmation ? inviteCode : undefined}
      isMember={isMember}
    />
  );
}
