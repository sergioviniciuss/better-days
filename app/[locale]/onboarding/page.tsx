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

  // Check onboarding from user object (no separate query needed)
  if (user.hasCompletedOnboarding) {
    redirect(`/${params.locale}/dashboard`);
  }

  // Check if user already has challenges - pass user to avoid redundant call
  const { challenges } = await getChallenges(false, user);
  if (challenges && challenges.length > 0) {
    // Mark as completed and redirect
    const supabase = await createClient();
    await supabase
      .from('User')
      .update({ hasCompletedOnboarding: true })
      .eq('id', user.id);
    
    redirect(`/${params.locale}/dashboard`);
  }

  return <OnboardingFlow userId={user.id} locale={params.locale} />;
}

