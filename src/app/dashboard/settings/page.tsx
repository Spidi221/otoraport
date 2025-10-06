import { EmailPreferences } from '@/components/dashboard/email-preferences'

export default function SettingsPage() {
  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Ustawienia</h1>
        <p className="text-muted-foreground mt-2">
          Zarządzaj swoimi preferencjami i ustawieniami konta
        </p>
      </div>

      <div className="space-y-6">
        <EmailPreferences />
      </div>
    </div>
  )
}
