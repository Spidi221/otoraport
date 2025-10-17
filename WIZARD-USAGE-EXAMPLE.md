# Data Completion Wizard - Usage Examples

## Basic Usage

```tsx
'use client'

import { DataCompletionWizard } from '@/components/wizard'

export default function DeveloperOnboardingPage() {
  const developerId = '123e4567-e89b-12d3-a456-426614174000' // From auth session

  const handleComplete = () => {
    // Redirect to dashboard or show success message
    window.location.href = '/dashboard'
  }

  return (
    <div className="container mx-auto py-8">
      <DataCompletionWizard
        developerId={developerId}
        onComplete={handleComplete}
      />
    </div>
  )
}
```

## With Custom Styling

```tsx
import { DataCompletionWizard } from '@/components/wizard'

export default function StyledWizard() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12">
      <div className="container mx-auto px-4">
        <DataCompletionWizard
          developerId="your-developer-id"
          onComplete={() => console.log('Done!')}
          className="max-w-5xl mx-auto shadow-2xl"
        />
      </div>
    </div>
  )
}
```

## With Loading State

```tsx
'use client'

import { useState, useEffect } from 'react'
import { DataCompletionWizard } from '@/components/wizard'
import { Skeleton } from '@/components/ui/skeleton'

export default function WizardWithLoading() {
  const [developerId, setDeveloperId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchDeveloperId() {
      try {
        const res = await fetch('/api/auth/me')
        const data = await res.json()
        setDeveloperId(data.developerId)
      } finally {
        setLoading(false)
      }
    }
    fetchDeveloperId()
  }, [])

  if (loading) {
    return (
      <div className="container mx-auto py-8 space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (!developerId) {
    return <div>Error: No developer ID found</div>
  }

  return (
    <DataCompletionWizard
      developerId={developerId}
      onComplete={() => alert('Profile completed!')}
    />
  )
}
```

## With Success Modal

```tsx
'use client'

import { useState } from 'react'
import { DataCompletionWizard } from '@/components/wizard'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

export default function WizardWithSuccessModal() {
  const [showSuccess, setShowSuccess] = useState(false)

  const handleComplete = () => {
    setShowSuccess(true)

    // Redirect after 3 seconds
    setTimeout(() => {
      window.location.href = '/dashboard'
    }, 3000)
  }

  return (
    <>
      <DataCompletionWizard
        developerId="your-developer-id"
        onComplete={handleComplete}
      />

      <Dialog open={showSuccess} onOpenChange={setShowSuccess}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Profil uzupełniony!</DialogTitle>
            <DialogDescription>
              Twój profil deweloperski został pomyślnie uzupełniony.
              Przekierowujemy Cię do panelu...
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center py-4">
            <svg
              className="w-16 h-16 text-green-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
```

## Server Component with Client Wizard

```tsx
// app/onboarding/page.tsx
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import WizardClient from './wizard-client'

export default async function OnboardingPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch developer ID
  const { data: developer } = await supabase
    .from('developers')
    .select('id, company_name')
    .eq('user_id', user.id)
    .single()

  if (!developer) {
    redirect('/signup')
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">
        Witaj, {developer.company_name || user.email}!
      </h1>
      <p className="text-lg text-slate-600 mb-8">
        Uzupełnij dane firmy, aby rozpocząć raportowanie do ministerstwa.
      </p>
      <WizardClient developerId={developer.id} />
    </div>
  )
}
```

```tsx
// app/onboarding/wizard-client.tsx
'use client'

import { DataCompletionWizard } from '@/components/wizard'
import { useRouter } from 'next/navigation'

interface WizardClientProps {
  developerId: string
}

export default function WizardClient({ developerId }: WizardClientProps) {
  const router = useRouter()

  return (
    <DataCompletionWizard
      developerId={developerId}
      onComplete={() => {
        router.push('/dashboard?onboarding=complete')
        router.refresh()
      }}
    />
  )
}
```

## With Analytics Tracking

```tsx
'use client'

import { DataCompletionWizard } from '@/components/wizard'
import { usePostHog } from 'posthog-js/react'

export default function WizardWithAnalytics() {
  const posthog = usePostHog()

  const handleComplete = () => {
    // Track completion event
    posthog?.capture('developer_profile_completed', {
      timestamp: new Date().toISOString(),
    })

    // Redirect
    window.location.href = '/dashboard'
  }

  return (
    <DataCompletionWizard
      developerId="your-developer-id"
      onComplete={handleComplete}
    />
  )
}
```

## Checking Completion Status Before Showing Wizard

```tsx
'use client'

import { useEffect, useState } from 'react'
import { DataCompletionWizard } from '@/components/wizard'
import { Alert, AlertDescription } from '@/components/ui/alert'

export default function SmartWizard({ developerId }: { developerId: string }) {
  const [completion, setCompletion] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function checkCompletion() {
      try {
        const res = await fetch(`/api/developers/${developerId}/completion-status`)
        const data = await res.json()
        setCompletion(data.data.overallCompletion)
      } finally {
        setLoading(false)
      }
    }
    checkCompletion()
  }, [developerId])

  if (loading) {
    return <div>Loading...</div>
  }

  if (completion === 100) {
    return (
      <Alert className="border-green-200 bg-green-50">
        <AlertDescription>
          Twój profil jest w 100% kompletny! Możesz przejść do dashboardu.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <>
      <Alert className="mb-8 border-yellow-200 bg-yellow-50">
        <AlertDescription>
          Twój profil jest uzupełniony w {completion}%.
          Uzupełnij brakujące dane poniżej.
        </AlertDescription>
      </Alert>
      <DataCompletionWizard
        developerId={developerId}
        onComplete={() => window.location.reload()}
      />
    </>
  )
}
```

## API Reference

### Props

```typescript
interface DataCompletionWizardProps {
  developerId: string        // Required: Developer UUID from database
  onComplete?: () => void    // Optional: Callback when wizard completes
  className?: string         // Optional: Additional CSS classes
}
```

### Features

- **Auto-save**: Saves every 3 seconds automatically
- **Draft persistence**: Survives page refresh (7 day expiration)
- **Real-time validation**: NIP, REGON, postal codes, email, URL
- **Progress tracking**: Color-coded progress bar (red/yellow/green)
- **Responsive**: Works on mobile, tablet, desktop
- **Accessible**: Full keyboard navigation and screen reader support

### API Endpoints Used

1. `GET /api/developers/{id}/completion-status`
   - Fetches current completion percentage
   - Returns section-by-section breakdown

2. `PATCH /api/developers/update`
   - Updates developer profile fields
   - Automatically validates all fields

### Browser Support

- Chrome/Edge: ✅
- Firefox: ✅
- Safari: ✅
- Mobile browsers: ✅

### Performance

- Bundle size: ~8.5 kB (gzipped)
- Auto-save debounce: 3000ms
- Draft expiration: 7 days
- Validation: Instant (client-side)
