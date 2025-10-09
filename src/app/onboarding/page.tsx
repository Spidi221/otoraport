import { redirect } from 'next/navigation';
import { createServerClient } from '@/lib/supabase/server';
import { OnboardingWizard } from '@/components/onboarding/onboarding-wizard';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Konfiguracja konta | OTORAPORT',
  description: 'Skonfiguruj swoje konto OTORAPORT i zacznij automatyzować raportowanie nieruchomości',
};

export default async function OnboardingPage() {
  const supabase = await createServerClient();

  // Check authentication
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/signin?redirect=/onboarding');
  }

  // Get user profile with client_id
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('client_id, company_name, onboarding_completed')
    .eq('id', user.id)
    .single();

  if (error || !profile) {
    // If profile doesn't exist, create one
    const { data: newProfile } = await supabase
      .from('profiles')
      .insert({
        id: user.id,
        email: user.email!,
      })
      .select('client_id')
      .single();

    if (!newProfile) {
      throw new Error('Failed to create user profile');
    }

    return (
      <OnboardingWizard userId={user.id} clientId={newProfile.client_id} />
    );
  }

  // If onboarding already completed, redirect to dashboard
  if (profile.onboarding_completed) {
    redirect('/dashboard');
  }

  return (
    <OnboardingWizard userId={user.id} clientId={profile.client_id} />
  );
}
