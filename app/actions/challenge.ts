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

export async function getChallenges(includeLeft: boolean = false) {
  const user = await getCurrentUser();
  if (!user) {
    return { error: 'Not authenticated', challenges: [] };
  }

  try {
    const supabase = await createClient();

    // Get user timezone for date comparison
    const { data: userData } = await supabase
      .from('User')
      .select('timezone')
      .eq('id', user.id)
      .single();

    const timezone = userData?.timezone || 'UTC';
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

export async function getChallenge(challengeId: string) {
  const user = await getCurrentUser();
  if (!user) {
    return { error: 'Not authenticated', challenge: null };
  }

  try {
    const supabase = await createClient();

    // Check if user is a member
    const { data: membership } = await supabase
      .from('ChallengeMember')
      .select('*')
      .eq('challengeId', challengeId)
      .eq('userId', user.id)
      .single();

    if (!membership) {
      return { error: 'Not a member of this challenge', challenge: null };
    }

    // Get challenge with owner, members, and invites
    const { data: challenge, error: challengeError } = await supabase
      .from('Challenge')
      .select(`
        *,
        owner:User!Challenge_ownerUserId_fkey(id, email),
        members:ChallengeMember(*, user:User(id, email)),
        invites:Invite(*)
      `)
      .eq('id', challengeId)
      .single();

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

export async function getChallengeByInviteCode(inviteCode: string) {
  const user = await getCurrentUser();
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

    // Check if user is already a member
    const { data: existingMember } = await supabase
      .from('ChallengeMember')
      .select('*')
      .eq('challengeId', invite.challengeId)
      .eq('userId', user.id)
      .single();

    if (existingMember) {
      return { error: 'Already a member of this challenge', challengeId: invite.challengeId };
    }

    // Add user as member
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
    return { success: true, challengeId: invite.challengeId };
  } catch (error) {
    console.error('Error joining challenge:', error);
    return { error: 'Failed to join challenge' };
  }
}

export async function createPersonalChallenge(userId: string, rules: string[] = []) {
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
      return { error: 'Failed to generate unique short ID' };
    }

    // Create personal "No Sugar Challenge"
    const { data: challenge, error: challengeError } = await supabase
      .from('Challenge')
      .insert({
        ownerUserId: userId,
        name: 'No Sugar Challenge',
        objectiveType: 'NO_SUGAR_STREAK',
        challengeType: 'PERSONAL',
        rules: rules,
        startDate: today,
        shortId,
        createdAt: new Date().toISOString(),
      })
      .select()
      .single();

    if (challengeError || !challenge) {
      console.error('Error creating personal challenge:', challengeError);
      return { error: 'Failed to create personal challenge' };
    }

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
      console.error('Error adding user to personal challenge:', memberError);
      return { error: 'Failed to add user to personal challenge' };
    }

    return { success: true, challengeId: challenge.id };
  } catch (error) {
    console.error('Error creating personal challenge:', error);
    return { error: 'Failed to create personal challenge' };
  }
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

    // Update membership status to LEFT
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

    revalidatePath('/dashboard');
    revalidatePath('/challenges');
    return { success: true };
  } catch (error) {
    console.error('Error archiving challenge:', error);
    return { error: 'Failed to stop challenge' };
  }
}
