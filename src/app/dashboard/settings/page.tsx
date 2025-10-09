import { ProfileSettings } from '@/components/settings/profile-settings'
import { ApiConfiguration } from '@/components/settings/api-configuration'
import { EmailPreferences } from '@/components/dashboard/email-preferences'
import { AccountActions } from '@/components/settings/account-actions'
import { SubdomainSettings } from '@/components/dashboard/subdomain-settings'
import { BrandingSettings } from '@/components/dashboard/branding-settings'
import { Separator } from '@/components/ui/separator'
import { createClient } from '@/lib/supabase/server'

export default async function SettingsPage() {
  const supabase = await createClient()

  // Get current user and developer profile
  const { data: { user } } = await supabase.auth.getUser()

  let subdomain = null
  let subscriptionPlan = null
  let brandingLogoUrl = null
  let brandingPrimaryColor = null
  let brandingSecondaryColor = null

  if (user) {
    const { data: developer } = await supabase
      .from('developers')
      .select('subdomain, subscription_plan, branding_logo_url, branding_primary_color, branding_secondary_color')
      .eq('user_id', user.id)
      .single()

    subdomain = developer?.subdomain
    subscriptionPlan = developer?.subscription_plan
    brandingLogoUrl = developer?.branding_logo_url
    brandingPrimaryColor = developer?.branding_primary_color
    brandingSecondaryColor = developer?.branding_secondary_color
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-5xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Ustawienia</h1>
        <p className="text-muted-foreground mt-2">
          Zarządzaj swoimi preferencjami i ustawieniami konta
        </p>
      </div>

      <div className="space-y-8">
        {/* Profile Settings */}
        <section>
          <ProfileSettings />
        </section>

        <Separator />

        {/* API Configuration */}
        <section>
          <ApiConfiguration />
        </section>

        <Separator />

        {/* Subdomain Settings (Pro/Enterprise only) */}
        <section>
          <SubdomainSettings
            currentSubdomain={subdomain}
            subscriptionPlan={subscriptionPlan}
          />
        </section>

        <Separator />

        {/* Branding Settings (Pro/Enterprise only) */}
        <section>
          <BrandingSettings
            currentLogoUrl={brandingLogoUrl}
            currentPrimaryColor={brandingPrimaryColor}
            currentSecondaryColor={brandingSecondaryColor}
            subscriptionPlan={subscriptionPlan}
            subdomain={subdomain}
          />
        </section>

        <Separator />

        {/* Notification Preferences */}
        <section>
          <EmailPreferences />
        </section>

        <Separator />

        {/* Account Actions */}
        <section>
          <AccountActions />
        </section>
      </div>
    </div>
  )
}
