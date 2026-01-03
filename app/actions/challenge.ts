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

export async function createChallenge(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) {
    return { error: 'Not authenticated' };
  }

  const name = formData.get('name') as string;
  const startDate = formData.get('startDate') as string;
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

    // Create challenge
    const { data: challenge, error: challengeError } = await supabase
      .from('Challenge')
      .insert({
        ownerUserId: user.id,
        name,
        startDate,
        rules,
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

export async function getChallenges() {
  const user = await getCurrentUser();
  if (!user) {
    return { error: 'Not authenticated', challenges: [] };
  }

  try {
    const supabase = await createClient();

    // Get challenge IDs where user is a member
    const { data: memberships, error: memberError } = await supabase
      .from('ChallengeMember')
      .select('challengeId')
      .eq('userId', user.id);

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

    return { challenges: challenges || [] };
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

    return { challenge };
  } catch (error) {
    console.error('Error fetching challenge:', error);
    return { error: 'Failed to fetch challenge', challenge: null };
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
