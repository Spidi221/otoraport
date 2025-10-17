/**
 * Example usage of EnhancedDataQualityWidget
 *
 * This file shows how to integrate the Enhanced Data Quality Widget
 * into your dashboard pages.
 */

import { EnhancedDataQualityWidget } from './enhanced-data-quality-widget'

// Example 1: Basic usage in a dashboard page
export function DashboardWithWidget() {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

      <div className="grid gap-6">
        {/* Your other dashboard components */}
        <div className="col-span-full lg:col-span-2">
          <EnhancedDataQualityWidget developerId="current-developer-id" />
        </div>

        {/* Other widgets/cards */}
      </div>
    </div>
  )
}

// Example 2: Usage with custom field edit handler
export function DashboardWithCustomHandler() {
  const handleFieldEdit = (fieldName: string) => {
    console.log('Edit field:', fieldName)
    // Custom logic here - e.g., open a specific form section
    // or navigate to an edit page
  }

  return (
    <div className="space-y-6">
      <EnhancedDataQualityWidget
        developerId="current-developer-id"
        onFieldEdit={handleFieldEdit}
      />
    </div>
  )
}

// Example 3: Multiple developers comparison (admin view)
export function AdminMultiDeveloperView({ developerIds }: { developerIds: string[] }) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {developerIds.map((id) => (
        <EnhancedDataQualityWidget key={id} developerId={id} />
      ))}
    </div>
  )
}

// Example 4: With loading and error boundaries
import { Suspense } from 'react'
import { ErrorBoundary } from 'react-error-boundary'

export function RobustDashboard({ developerId }: { developerId: string }) {
  return (
    <ErrorBoundary
      fallback={<div>Something went wrong loading the data quality widget</div>}
    >
      <Suspense fallback={<div>Loading...</div>}>
        <EnhancedDataQualityWidget developerId={developerId} />
      </Suspense>
    </ErrorBoundary>
  )
}
