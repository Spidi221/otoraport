import { ProfileSettings } from '@/components/settings/profile-settings'
import { ApiConfiguration } from '@/components/settings/api-configuration'
import { EmailPreferences } from '@/components/dashboard/email-preferences'
import { AccountActions } from '@/components/settings/account-actions'
import { SubdomainSettings } from '@/components/dashboard/subdomain-settings'
import { BrandingSettings } from '@/components/dashboard/branding-settings'
import { MissingFieldsSection } from '@/components/settings/missing-fields-section'
import { Separator } from '@/components/ui/separator'
import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/dashboard/header'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

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
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header showUserMenu={true} />

      <main className="flex-1 mx-auto max-w-7xl w-full px-4 py-6 lg:px-6">
        {/* Breadcrumb Navigation */}
        <div className="mb-6 flex items-center gap-4">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm" className="gap-2">
              <ChevronLeft className="h-4 w-4" />
              Powrót do Dashboardu
            </Button>
          </Link>
          <nav className="flex items-center space-x-2 text-sm text-gray-600">
            <Link href="/dashboard" className="hover:text-blue-600 transition-colors">
              Dashboard
            </Link>
            <span>/</span>
            <span className="text-gray-900 font-medium">Ustawienia</span>
          </nav>
        </div>

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

        {/* Missing Fields Section - Ministry Compliance */}
        <section>
          <MissingFieldsSection />
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
      </main>
    </div>
  )
}
