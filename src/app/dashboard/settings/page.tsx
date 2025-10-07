import { ProfileSettings } from '@/components/settings/profile-settings'
import { ApiConfiguration } from '@/components/settings/api-configuration'
import { EmailPreferences } from '@/components/dashboard/email-preferences'
import { AccountActions } from '@/components/settings/account-actions'
import { Separator } from '@/components/ui/separator'

export default function SettingsPage() {
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
