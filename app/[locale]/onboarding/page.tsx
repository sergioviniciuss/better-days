import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/app/actions/auth';
import { getChallenges } from '@/app/actions/challenge';
import { OnboardingFlow } from '@/components/onboarding/OnboardingFlow';
import { createClient } from '@/lib/supabase/server';

export default async function OnboardingPage({
  params,
}: {
  params: { locale: string };
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect(`/${params.locale}/login`);
  }

  // Check if user has already completed onboarding
  const supabase = await createClient();
  const { data: userData } = await supabase
    .from('User')
    .select('hasCompletedOnboarding')
    .eq('id', user.id)
    .single();

  if (userData?.hasCompletedOnboarding) {
    redirect(`/${params.locale}/dashboard`);
  }

  // Check if user already has challenges (shouldn't happen, but just in case)
  const { challenges } = await getChallenges();
  if (challenges && challenges.length > 0) {
    // Mark as completed and redirect
    await supabase
      .from('User')
      .update({ hasCompletedOnboarding: true })
      .eq('id', user.id);
    
    redirect(`/${params.locale}/dashboard`);
  }

  return <OnboardingFlow userId={user.id} locale={params.locale} />;
}

