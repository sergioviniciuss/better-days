'use server';

import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from './auth';
import { revalidatePath } from 'next/cache';

function generateInviteCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

function generateShortId(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  return Array.from({length: 8}, () => 
    chars[Math.floor(Math.random() * chars.length)]
  ).join('');
}

export async function createChallenge(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) {
    return { error: 'Not authenticated' };
  }

  const name = formData.get('name') as string;
  const startDate = formData.get('startDate') as string;
  const dueDate = formData.get('dueDate') as string || null;
  const objectiveType = formData.get('objectiveType') as string || 'NO_SUGAR_STREAK';
  const rules: string[] = [];

  // Collect rules from form data
  if (formData.get('addedSugarCounts') === 'on') {
    rules.push('addedSugarCounts');
  }
  if (formData.get('fruitDoesNotCount') === 'on') {
    rules.push('fruitDoesNotCount');
  }
  if (formData.get('missingDaysPending') === 'on') {
    rules.push('missingDaysPending');
  }
  if (formData.get('processedSugarOnly') === 'on') {
    rules.push('processedSugarOnly');
  }
  if (formData.get('alcoholPermitted') === 'on') {
    rules.push('alcoholPermitted');
  }

  try {
    const supabase = await createClient();

    // Generate unique invite code
    let inviteCode: string = generateInviteCode();
    let isUnique = false;
    let attempts = 0;
    
    while (!isUnique && attempts < 10) {
      const { data: existing } = await supabase
        .from('Invite')
        .select('code')
        .eq('code', inviteCode)
        .single();
      
      if (!existing) {
        isUnique = true;
      } else {
        inviteCode = generateInviteCode();
      }
      attempts++;
    }

    if (!isUnique) {
      return { error: 'Failed to generate unique invite code' };
    }

    // Generate unique shortId
    let shortId: string = generateShortId();
    let shortIdUnique = false;
    let shortIdAttempts = 0;
    
    while (!shortIdUnique && shortIdAttempts < 10) {
      const { data: existingShortId } = await supabase
        .from('Challenge')
        .select('shortId')
        .eq('shortId', shortId)
        .single();
      
      if (!existingShortId) {
        shortIdUnique = true;
      } else {
        shortId = generateShortId();
      }
      shortIdAttempts++;
    }

    if (!shortIdUnique) {
      return { error: 'Failed to generate unique short ID' };
    }

    // Create challenge (default to GROUP type for manually created challenges)
    const { data: challenge, error: challengeError } = await supabase
      .from('Challenge')
      .insert({
        ownerUserId: user.id,
        name,
        startDate,
        dueDate,
        shortId,
        rules,
        objectiveType,
        challengeType: 'GROUP',
        createdAt: new Date().toISOString(),
      })
      .select()
      .single();

    if (challengeError || !challenge) {
      console.error('Error creating challenge:', challengeError);
      return { error: 'Failed to create challenge' };
    }

    // Create invite
    const { error: inviteError } = await supabase
      .from('Invite')
      .insert({
        challengeId: challenge.id,
        code: inviteCode,
        createdAt: new Date().toISOString(),
      });

    if (inviteError) {
      console.error('Error creating invite:', inviteError);
      return { error: 'Failed to create invite' };
    }

    // Add owner as member
    const { error: memberError } = await supabase
      .from('ChallengeMember')
      .insert({
        challengeId: challenge.id,
        userId: user.id,
        role: 'OWNER',
        joinedAt: new Date().toISOString(),
      });

    if (memberError) {
      console.error('Error adding member:', memberError);
      return { error: 'Failed to add member' };
    }

    revalidatePath('/challenges');
    return { success: true, challengeId: challenge.id, inviteCode };
  } catch (error) {
    console.error('Error creating challenge:', error);
    return { error: 'Failed to create challenge' };
  }
}

export async function getChallenges(includeLeft: boolean = false, providedUser?: any) {
  const user = providedUser || await getCurrentUser();
  if (!user) {
    return { error: 'Not authenticated', challenges: [] };
  }

  try {
    const supabase = await createClient();

    // Use timezone from user object (no separate query needed)
    const timezone = user.timezone || 'UTC';
    const today = new Date().toLocaleDateString('en-CA', { timeZone: timezone });

    // Get challenge IDs where user is a member (active or left)
    let membershipQuery = supabase
      .from('ChallengeMember')
      .select('challengeId, id, joinedAt, status, leftAt')
      .eq('userId', user.id);

    if (includeLeft) {
      // Include both active and stopped challenges
      membershipQuery = membershipQuery.in('status', ['ACTIVE', 'LEFT']);
    } else {
      // Only active challenges (default)
      membershipQuery = membershipQuery.eq('status', 'ACTIVE');
    }

    const { data: memberships, error: memberError } = await membershipQuery;

    if (memberError) {
      console.error('Error fetching memberships:', memberError);
      return { error: 'Failed to fetch challenges', challenges: [] };
    }

    if (!memberships || memberships.length === 0) {
      return { challenges: [] };
    }

    const challengeIds = memberships.map((m) => m.challengeId);

    // Get challenges with owner and members
    const { data: challenges, error: challengesError } = await supabase
      .from('Challenge')
      .select(`
        *,
        owner:User!Challenge_ownerUserId_fkey(id, email),
        members:ChallengeMember(*, user:User(*))
      `)
      .in('id', challengeIds)
      .order('createdAt', { ascending: false });

    if (challengesError) {
      console.error('Error fetching challenges:', challengesError);
      return { error: 'Failed to fetch challenges', challenges: [] };
    }

    // Auto-archive expired challenges (skip when includeLeft is true)
    let filteredChallenges = challenges || [];
    
    if (!includeLeft) {
      const expiredMembershipIds: string[] = [];
      filteredChallenges = (challenges || []).filter((challenge: any) => {
        if (challenge.dueDate && challenge.dueDate < today) {
          // Find this user's membership for this challenge
          const membership = memberships.find(m => m.challengeId === challenge.id);
          if (membership) {
            expiredMembershipIds.push(membership.id);
          }
          return false; // Exclude from results
        }
        return true; // Include in results
      });

      // Update expired memberships
      if (expiredMembershipIds.length > 0) {
        await supabase
          .from('ChallengeMember')
          .update({ 
            status: 'LEFT',
            leftAt: new Date().toISOString()
          })
          .in('id', expiredMembershipIds);
      }
    }

    // Add user's joinedAt, leftAt, and status to each challenge
    const challengesWithMembershipData = filteredChallenges.map((challenge: any) => {
      const membership = memberships.find(m => m.challengeId === challenge.id);
      return {
        ...challenge,
        userJoinedAt: membership?.joinedAt 
          ? new Date(membership.joinedAt).toISOString().split('T')[0]
          : undefined,
        userLeftAt: membership?.leftAt,
        userStatus: membership?.status
      };
    });

    return { challenges: challengesWithMembershipData };
  } catch (error) {
    console.error('Error fetching challenges:', error);
    return { error: 'Failed to fetch challenges', challenges: [] };
  }
}

export async function getChallenge(challengeId: string, providedUser?: any) {
  const user = providedUser || await getCurrentUser();
  if (!user) {
    return { error: 'Not authenticated', challenge: null };
  }

  try {
    const supabase = await createClient();

    // OPTIMIZATION: Fetch membership and challenge in parallel
    const [membershipResult, challengeResult] = await Promise.all([
      supabase
        .from('ChallengeMember')
        .select('*')
        .eq('challengeId', challengeId)
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
        .eq('id', challengeId)
        .single()
    ]);

    const membership = membershipResult.data;
    const challenge = challengeResult.data;
    const challengeError = challengeResult.error;

    if (!membership) {
      return { error: 'Not a member of this challenge', challenge: null };
    }

    if (challengeError || !challenge) {
      console.error('Error fetching challenge:', challengeError);
      return { error: 'Challenge not found', challenge: null };
    }

    // Add user's joinedAt to the challenge
    const challengeWithMembership = {
      ...challenge,
      userJoinedAt: membership.joinedAt 
        ? new Date(membership.joinedAt).toISOString().split('T')[0]
        : undefined,
      userLeftAt: membership.leftAt,
      userStatus: membership.status
    };

    return { challenge: challengeWithMembership };
  } catch (error) {
    console.error('Error fetching challenge:', error);
    return { error: 'Failed to fetch challenge', challenge: null };
  }
}

export async function getChallengeByInviteCode(inviteCode: string, providedUser?: any) {
  const user = providedUser || await getCurrentUser();
  if (!user) {
    return { error: 'Not authenticated', challenge: null, isMember: false };
  }

  try {
    const supabase = await createClient();

    // Find invite by code
    const { data: invite, error: inviteError } = await supabase
      .from('Invite')
      .select('*, challenge:Challenge(*)')
      .eq('code', inviteCode)
      .single();

    if (inviteError || !invite) {
      return { error: 'Invalid invite code', challenge: null, isMember: false };
    }

    // Check if invite is expired
    if (invite.expiresAt && new Date(invite.expiresAt) < new Date()) {
      return { error: 'Invite code has expired', challenge: null, isMember: false };
    }

    // Check if user is already a member
    const { data: existingMember } = await supabase
      .from('ChallengeMember')
      .select('*')
      .eq('challengeId', invite.challengeId)
      .eq('userId', user.id)
      .single();

    const isMember = !!existingMember;

    // Get challenge with owner, members, and invites (accessible via invite code)
    const { data: challenge, error: challengeError } = await supabase
      .from('Challenge')
      .select(`
        *,
        owner:User!Challenge_ownerUserId_fkey(id, email),
        members:ChallengeMember(*, user:User(id, email)),
        invites:Invite(*)
      `)
      .eq('id', invite.challengeId)
      .single();

    if (challengeError || !challenge) {
      console.error('Error fetching challenge:', challengeError);
      return { error: 'Challenge not found', challenge: null, isMember: false };
    }

    return { challenge, isMember };
  } catch (error) {
    console.error('Error fetching challenge by invite code:', error);
    return { error: 'Failed to fetch challenge', challenge: null, isMember: false };
  }
}

export async function joinChallengeByCode(inviteCode: string) {
  const user = await getCurrentUser();
  if (!user) {
    return { error: 'Not authenticated' };
  }

  try {
    const supabase = await createClient();

    // Find invite by code
    const { data: invite, error: inviteError } = await supabase
      .from('Invite')
      .select('*, challenge:Challenge(*)')
      .eq('code', inviteCode)
      .single();

    if (inviteError || !invite) {
      return { error: 'Invalid invite code' };
    }

    // Check if invite is expired
    if (invite.expiresAt && new Date(invite.expiresAt) < new Date()) {
      return { error: 'Invite code has expired' };
    }

    // Check if user has an ACTIVE membership
    const { data: activeMember } = await supabase
      .from('ChallengeMember')
      .select('*')
      .eq('challengeId', invite.challengeId)
      .eq('userId', user.id)
      .eq('status', 'ACTIVE')
      .single();

    if (activeMember) {
      return { error: 'Already a member of this challenge', challengeId: invite.challengeId };
    }

    // Check if user previously left this challenge
    // If they did, we create a NEW membership (fresh start)
    const { data: leftMember } = await supabase
      .from('ChallengeMember')
      .select('*')
      .eq('challengeId', invite.challengeId)
      .eq('userId', user.id)
      .eq('status', 'LEFT')
      .single();

    // Whether rejoining or joining for first time, create new membership
    // This ensures fresh joinedAt date for rejoins
    const { error: memberError } = await supabase
      .from('ChallengeMember')
      .insert({
        challengeId: invite.challengeId,
        userId: user.id,
        role: 'MEMBER',
        joinedAt: new Date().toISOString(),
      });

    if (memberError) {
      console.error('Error adding member:', memberError);
      return { error: 'Failed to join challenge' };
    }

    revalidatePath('/challenges');
    return { success: true, challengeId: invite.challengeId, isRejoin: !!leftMember };
  } catch (error) {
    console.error('Error joining challenge:', error);
    return { error: 'Failed to join challenge' };
  }
}

/**
 * Helper function to create a personal challenge with any objectiveType
 * Used by both onboarding flow and public habit auto-creation
 */
export async function createPersonalChallengeForObjective(
  userId: string, 
  name: string,
  objectiveType: string,
  rules: string[] = []
) {
  try {
    const supabase = await createClient();

    // Get user's timezone
    const { data: user } = await supabase
      .from('User')
      .select('timezone')
      .eq('id', userId)
      .single();

    const timezone = user?.timezone || 'UTC';
    
    // Get today's date in user's timezone
    const today = new Date().toLocaleDateString('en-CA', { timeZone: timezone });

    // Generate unique shortId
    let shortId: string = generateShortId();
    let shortIdUnique = false;
    let shortIdAttempts = 0;
    
    while (!shortIdUnique && shortIdAttempts < 10) {
      const { data: existingShortId } = await supabase
        .from('Challenge')
        .select('shortId')
        .eq('shortId', shortId)
        .single();
      
      if (!existingShortId) {
        shortIdUnique = true;
      } else {
        shortId = generateShortId();
      }
      shortIdAttempts++;
    }

    if (!shortIdUnique) {
      console.error('[createPersonalChallengeForObjective] Failed to generate unique short ID after 10 attempts');
      return { error: 'Failed to generate unique short ID' };
    }

    // Create personal challenge
    const { data: challenge, error: challengeError } = await supabase
      .from('Challenge')
      .insert({
        ownerUserId: userId,
        name,
        objectiveType,
        challengeType: 'PERSONAL',
        rules,
        startDate: today,
        shortId,
        createdAt: new Date().toISOString(),
      })
      .select()
      .single();

    if (challengeError || !challenge) {
      console.error('[createPersonalChallengeForObjective] Error creating challenge:', {
        error: challengeError,
        userId,
        name,
        objectiveType,
      });
      return { error: 'Failed to create personal challenge', details: challengeError };
    }

    console.log('[createPersonalChallengeForObjective] Challenge created successfully:', {
      challengeId: challenge.id,
      name: challenge.name,
      objectiveType: challenge.objectiveType,
    });

    // Add user as owner/member
    const { error: memberError } = await supabase
      .from('ChallengeMember')
      .insert({
        challengeId: challenge.id,
        userId,
        role: 'OWNER',
        joinedAt: new Date().toISOString(),
      });

    if (memberError) {
      console.error('[createPersonalChallengeForObjective] Error adding user as member:', memberError);
      return { error: 'Failed to add user to personal challenge', details: memberError };
    }

    return { success: true, challengeId: challenge.id };
  } catch (error) {
    console.error('[createPersonalChallengeForObjective] Unexpected error:', error);
    return { error: 'Failed to create personal challenge', details: error };
  }
}

export async function createPersonalChallenge(userId: string, rules: string[] = []) {
  // Use the helper function with default "No Sugar Challenge" settings
  return createPersonalChallengeForObjective(
    userId,
    'No Sugar Challenge',
    'NO_SUGAR_STREAK',
    rules
  );
}

export async function upgradeToGroupChallenge(challengeId: string) {
  try {
    const supabase = await createClient();
    
    // Generate unique invite code
    let inviteCode: string = generateInviteCode();
    let isUnique = false;
    let attempts = 0;
    
    while (!isUnique && attempts < 10) {
      const { data: existing } = await supabase
        .from('Invite')
        .select('code')
        .eq('code', inviteCode)
        .single();
      
      if (!existing) {
        isUnique = true;
      } else {
        inviteCode = generateInviteCode();
      }
      attempts++;
    }

    if (!isUnique) {
      return { error: 'Failed to generate unique invite code' };
    }

    // Update challenge to GROUP type
    const { error: updateError } = await supabase
      .from('Challenge')
      .update({ challengeType: 'GROUP' })
      .eq('id', challengeId);

    if (updateError) {
      console.error('Error upgrading challenge:', updateError);
      return { error: 'Failed to upgrade challenge' };
    }

    // Create invite
    const { error: inviteError } = await supabase
      .from('Invite')
      .insert({
        challengeId,
        code: inviteCode,
        createdAt: new Date().toISOString(),
      });

    if (inviteError) {
      console.error('Error creating invite:', inviteError);
      return { error: 'Failed to create invite' };
    }

    return { success: true, inviteCode };
  } catch (error) {
    console.error('Error upgrading challenge:', error);
    return { error: 'Failed to upgrade challenge' };
  }
}

export async function archiveChallenge(challengeId: string) {
  const user = await getCurrentUser();
  if (!user) {
    return { error: 'Not authenticated' };
  }

  try {
    const supabase = await createClient();

    // Verify user is a member of this challenge
    const { data: membership, error: membershipError } = await supabase
      .from('ChallengeMember')
      .select('*')
      .eq('challengeId', challengeId)
      .eq('userId', user.id)
      .eq('status', 'ACTIVE')
      .single();

    if (membershipError || !membership) {
      return { error: 'Not a member of this challenge' };
    }

    const isAdmin = membership.role === 'OWNER';

    if (isAdmin) {
      // Admin: Archive challenge for ALL members
      const { error: updateError } = await supabase
        .from('ChallengeMember')
        .update({ 
          status: 'LEFT',
          leftAt: new Date().toISOString()
        })
        .eq('challengeId', challengeId)
        .eq('status', 'ACTIVE');

      if (updateError) {
        console.error('Error archiving challenge for all:', updateError);
        return { error: 'Failed to archive challenge' };
      }
    } else {
      // Regular member: Only update their own membership
      const { error: updateError } = await supabase
        .from('ChallengeMember')
        .update({ 
          status: 'LEFT',
          leftAt: new Date().toISOString()
        })
        .eq('id', membership.id);

      if (updateError) {
        console.error('Error archiving challenge:', updateError);
        return { error: 'Failed to stop challenge' };
      }
    }

    revalidatePath('/dashboard');
    revalidatePath('/challenges');
    return { success: true };
  } catch (error) {
    console.error('Error archiving challenge:', error);
    return { error: 'Failed to stop challenge' };
  }
}

export async function updateChallengeRules(challengeId: string, newRules: string[]) {
  const user = await getCurrentUser();
  if (!user) {
    return { error: 'Not authenticated' };
  }

  try {
    const supabase = await createClient();

    // Verify user is the admin (owner) of this challenge
    const { data: membership, error: membershipError } = await supabase
      .from('ChallengeMember')
      .select('*')
      .eq('challengeId', challengeId)
      .eq('userId', user.id)
      .eq('status', 'ACTIVE')
      .single();

    if (membershipError || !membership) {
      return { error: 'Not a member of this challenge' };
    }

    if (membership.role !== 'OWNER') {
      return { error: 'Only the challenge admin can update rules' };
    }

    // Update challenge rules and set rulesUpdatedAt
    const { error: updateError } = await supabase
      .from('Challenge')
      .update({ 
        rules: newRules,
        rulesUpdatedAt: new Date().toISOString()
      })
      .eq('id', challengeId);

    if (updateError) {
      console.error('Error updating challenge rules:', updateError);
      return { error: 'Failed to update challenge rules' };
    }

    revalidatePath('/challenges');
    revalidatePath(`/challenges/${challengeId}`);
    return { success: true };
  } catch (error) {
    console.error('Error updating challenge rules:', error);
    return { error: 'Failed to update challenge rules' };
  }
}

export async function quitChallenge(challengeId: string) {
  const user = await getCurrentUser();
  if (!user) {
    return { error: 'Not authenticated' };
  }

  try {
    const supabase = await createClient();

    // Verify user is a member of this challenge
    const { data: membership, error: membershipError } = await supabase
      .from('ChallengeMember')
      .select('*')
      .eq('challengeId', challengeId)
      .eq('userId', user.id)
      .eq('status', 'ACTIVE')
      .single();

    if (membershipError || !membership) {
      return { error: 'Not a member of this challenge' };
    }

    if (membership.role === 'OWNER') {
      return { error: 'Challenge admin should use archive instead of quit' };
    }

    // Update membership status to LEFT
    const { error: updateError } = await supabase
      .from('ChallengeMember')
      .update({ 
        status: 'LEFT',
        leftAt: new Date().toISOString()
      })
      .eq('id', membership.id);

    if (updateError) {
      console.error('Error quitting challenge:', updateError);
      return { error: 'Failed to quit challenge' };
    }

    revalidatePath('/dashboard');
    revalidatePath('/challenges');
    return { success: true };
  } catch (error) {
    console.error('Error quitting challenge:', error);
    return { error: 'Failed to quit challenge' };
  }
}

export async function acknowledgeRuleChanges(challengeId: string) {
  const user = await getCurrentUser();
  if (!user) {
    return { error: 'Not authenticated' };
  }

  try {
    const supabase = await createClient();

    // Verify user is a member of this challenge
    const { data: membership, error: membershipError } = await supabase
      .from('ChallengeMember')
      .select('*')
      .eq('challengeId', challengeId)
      .eq('userId', user.id)
      .eq('status', 'ACTIVE')
      .single();

    if (membershipError || !membership) {
      return { error: 'Not a member of this challenge' };
    }

    // Update lastAcknowledgedRulesAt
    const { error: updateError } = await supabase
      .from('ChallengeMember')
      .update({ 
        lastAcknowledgedRulesAt: new Date().toISOString()
      })
      .eq('id', membership.id);

    if (updateError) {
      console.error('Error acknowledging rule changes:', updateError);
      return { error: 'Failed to acknowledge rule changes' };
    }

    revalidatePath('/dashboard');
    revalidatePath('/challenges');
    revalidatePath(`/challenges/${challengeId}`);
    return { success: true };
  } catch (error) {
    console.error('Error acknowledging rule changes:', error);
    return { error: 'Failed to acknowledge rule changes' };
  }
}

// Helper function to check if a member has unacknowledged rule changes
export const hasUnacknowledgedRuleChanges = (challenge: any, membership: any): boolean => {
  // If rulesUpdatedAt is null, undefined, or doesn't exist, rules have never been updated
  // This handles cases where the migration hasn't been run or existing challenges
  if (!challenge || !challenge.rulesUpdatedAt || challenge.rulesUpdatedAt === null) {
    return false;
  }
  
  // Admin doesn't need to acknowledge their own changes
  if (!membership || membership.role === 'OWNER') {
    return false;
  }
  
  // If there's a valid rulesUpdatedAt timestamp and member hasn't acknowledged yet
  if (!membership.lastAcknowledgedRulesAt || membership.lastAcknowledgedRulesAt === null) {
    return true;
  }
  
  // Compare timestamps
  try {
    const rulesUpdatedAt = new Date(challenge.rulesUpdatedAt);
    const lastAcknowledgedAt = new Date(membership.lastAcknowledgedRulesAt);
    
    return rulesUpdatedAt > lastAcknowledgedAt;
  } catch (error) {
    // If there's any error parsing dates, don't block the user
    console.error('Error comparing rule acknowledgment dates:', error);
    return false;
  }
}

// Public challenges functionality

import type { PublicChallengesData, PublicChallenge, LeaderboardEntry } from '@/lib/types/public-challenge';
import { calculateStreaks } from '@/lib/streak-utils';

/**
 * Get all public challenges grouped by category
 * No authentication required - public data
 */
export async function getPublicChallenges(): Promise<PublicChallengesData> {
  try {
    const supabase = await createClient();
    
    // Get current user (optional - to check membership)
    const user = await getCurrentUser();
    
    // Fetch all public challenges
    const { data: challenges, error: challengesError } = await supabase
      .from('Challenge')
      .select(`
        id,
        name,
        description,
        category,
        objectiveType,
        startDate,
        dueDate,
        isFeatured
      `)
      .eq('visibility', 'PUBLIC')
      .eq('status', 'ACTIVE')
      .order('isFeatured', { ascending: false })
      .order('createdAt', { ascending: false });

    if (challengesError) {
      console.error('Error fetching public challenges:', challengesError);
      return { monthly: [], annual: [], lifetime: [] };
    }

    if (!challenges || challenges.length === 0) {
      return { monthly: [], annual: [], lifetime: [] };
    }

    // Fetch leaderboard data for each challenge
    const publicChallenges = await Promise.all(
      challenges.map(async (challenge) => {
        const { participantCount, topParticipants, isUserMember } = await getPublicChallengeLeaderboard(
          challenge.id,
          10,
          user?.id
        );

        return {
          id: challenge.id,
          name: challenge.name,
          description: challenge.description || undefined,
          category: challenge.category as 'MONTHLY' | 'ANNUAL' | 'LIFETIME',
          objectiveType: challenge.objectiveType,
          startDate: challenge.startDate,
          dueDate: challenge.dueDate || undefined,
          participantCount,
          topParticipants,
          isUserMember,
        } as PublicChallenge;
      })
    );

    // Group by category
    const grouped: PublicChallengesData = {
      monthly: publicChallenges.filter(c => c.category === 'MONTHLY'),
      annual: publicChallenges.filter(c => c.category === 'ANNUAL'),
      lifetime: publicChallenges.filter(c => c.category === 'LIFETIME'),
    };

    return grouped;
  } catch (error) {
    console.error('Error fetching public challenges:', error);
    return { monthly: [], annual: [], lifetime: [] };
  }
}

/**
 * Get leaderboard data for a public challenge
 * @param challengeId - Challenge ID
 * @param limit - Max number of top participants (default 10)
 * @param userId - Optional user ID to check membership
 */
async function getPublicChallengeLeaderboard(
  challengeId: string,
  limit: number = 10,
  userId?: string
): Promise<{ participantCount: number; topParticipants: LeaderboardEntry[]; isUserMember?: boolean }> {
  try {
    const supabase = await createClient();

    // Get all ACTIVE members (include joinedAt for mid-month filtering)
    const { data: members, error: membersError } = await supabase
      .from('ChallengeMember')
      .select('userId, joinedAt, user:User(email, timezone)')
      .eq('challengeId', challengeId)
      .eq('status', 'ACTIVE');

    if (membersError || !members) {
      console.error('Error fetching challenge members:', membersError);
      return { participantCount: 0, topParticipants: [] };
    }

    const participantCount = members.length;
    
    // Check if current user is a member
    const isUserMember = userId ? members.some(m => m.userId === userId) : undefined;

    if (participantCount === 0) {
      return { participantCount: 0, topParticipants: [], isUserMember };
    }

    // Get challenge details for date range
    const { data: challenge, error: challengeError } = await supabase
      .from('Challenge')
      .select('startDate, dueDate, objectiveType, category')
      .eq('id', challengeId)
      .single();

    if (challengeError || !challenge) {
      return { participantCount, topParticipants: [], isUserMember };
    }

    // Get member IDs
    const memberIds = members.map(m => m.userId);

    // Calculate date range based on challenge category
    const now = new Date();
    let startDateFilter = challenge.startDate;
    let endDateFilter: string | undefined = challenge.dueDate || undefined;

    // For MONTHLY challenges, filter to current month only
    if (challenge.category === 'MONTHLY') {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      startDateFilter = startOfMonth.toISOString().split('T')[0];
      endDateFilter = endOfMonth.toISOString().split('T')[0];
    }

    // Fetch daily logs for members with date filtering
    let logsQuery = supabase
      .from('DailyLog')
      .select('userId, date, consumedSugar, confirmedAt')
      .in('userId', memberIds)
      .eq('challengeId', challengeId)
      .gte('date', startDateFilter)
      .order('date', { ascending: false });

    // Add end date filter if applicable
    if (endDateFilter) {
      logsQuery = logsQuery.lte('date', endDateFilter);
    }

    const { data: allLogs, error: logsError } = await logsQuery;

    if (logsError) {
      console.error('Error fetching logs for leaderboard:', logsError);
      // Continue with empty logs
    }

    // Calculate scores for each member
    const memberScores = members
      .filter(m => m.user)
      .map(member => {
        let userLogs = (allLogs || [])
          .filter(log => log.userId === member.userId)
          .map(log => ({
            date: log.date,
            consumedSugar: log.consumedSugar,
            confirmedAt: log.confirmedAt,
          }));

        // For MONTHLY challenges with mid-month joins, filter to dates >= joinedAt
        if (challenge.category === 'MONTHLY' && member.joinedAt) {
          const joinedDate = new Date(member.joinedAt).toISOString().split('T')[0];
          userLogs = userLogs.filter(log => log.date >= joinedDate);
        }

        const timezone = (member.user as any)?.timezone || 'UTC';
        const { currentStreak, bestStreak } = calculateStreaks(userLogs, timezone);

        // Score calculation based on category
        // For Monthly/Annual: use bestStreak within date range
        // For Lifetime: use currentStreak
        const score = challenge.category === 'LIFETIME' ? currentStreak : bestStreak;

        return {
          userId: member.userId,
          displayName: (member.user as any)?.email || 'Anonymous',
          score,
        };
      });

    // Sort by score (highest first)
    memberScores.sort((a, b) => b.score - a.score);

    // Take top N and add ranks
    const topParticipants: LeaderboardEntry[] = memberScores
      .slice(0, limit)
      .map((entry, index) => ({
        rank: index + 1,
        displayName: entry.displayName,
        score: entry.score,
      }));

    return { participantCount, topParticipants, isUserMember };
  } catch (error) {
    console.error('Error calculating leaderboard:', error);
    return { participantCount: 0, topParticipants: [] };
  }
}

/**
 * Join a public challenge
 * Requires authentication
 */
export async function joinPublicChallenge(challengeId: string) {
  const user = await getCurrentUser();
  if (!user) {
    return { error: 'Not authenticated' };
  }

  try {
    const supabase = await createClient();

    // Verify challenge is public and active
    const { data: challenge, error: challengeError } = await supabase
      .from('Challenge')
      .select('id, visibility, status, name')
      .eq('id', challengeId)
      .single();

    if (challengeError || !challenge) {
      console.error('Error fetching challenge:', challengeError);
      return { error: 'Challenge not found' };
    }

    if (challenge.visibility !== 'PUBLIC') {
      return { error: 'Challenge is not public' };
    }

    if (challenge.status !== 'ACTIVE') {
      return { error: 'Challenge is not active' };
    }

    // Check if user is already a member
    const { data: existingMembership, error: membershipError } = await supabase
      .from('ChallengeMember')
      .select('id, status')
      .eq('challengeId', challengeId)
      .eq('userId', user.id)
      .maybeSingle();

    if (membershipError) {
      console.error('Error checking membership:', membershipError);
      return { error: 'Failed to check membership' };
    }

    if (existingMembership) {
      if (existingMembership.status === 'ACTIVE') {
        // Already a member - idempotent
        return { success: true, challengeId };
      } else if (existingMembership.status === 'LEFT') {
        // Rejoin - update status
        const { error: updateError } = await supabase
          .from('ChallengeMember')
          .update({
            status: 'ACTIVE',
            joinedAt: new Date().toISOString(),
            leftAt: null,
          })
          .eq('id', existingMembership.id);

        if (updateError) {
          console.error('Error updating membership:', updateError);
          return { error: 'Failed to rejoin challenge' };
        }

        revalidatePath('/challenges');
        revalidatePath(`/challenges/${challengeId}`);
        revalidatePath('/public-challenges');
        return { success: true, challengeId };
      }
    }

    // Create new membership
    const { error: insertError } = await supabase
      .from('ChallengeMember')
      .insert({
        challengeId,
        userId: user.id,
        role: 'MEMBER',
        joinedAt: new Date().toISOString(),
      });

    if (insertError) {
      console.error('Error creating membership:', insertError);
      return { error: 'Failed to join challenge' };
    }

    revalidatePath('/challenges');
    revalidatePath(`/challenges/${challengeId}`);
    revalidatePath('/public-challenges');
    return { success: true, challengeId };
  } catch (error) {
    console.error('Error joining public challenge:', error);
    return { error: 'Failed to join challenge' };
  }
}
