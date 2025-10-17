/**
 * Wizard Step Component
 * Task #103 - Individual step wrapper with smooth transitions
 */

'use client'

import { ReactNode } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface WizardStepProps {
  title: string
  description: string
  children: ReactNode
  isActive: boolean
  className?: string
}

export function WizardStep({
  title,
  description,
  children,
  isActive,
  className
}: WizardStepProps) {
  if (!isActive) return null

  return (
    <div
      className={cn(
        'animate-in fade-in slide-in-from-right-4 duration-300',
        className
      )}
    >
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="space-y-1 pb-4">
          <CardTitle className="text-2xl font-bold text-slate-900">
            {title}
          </CardTitle>
          <CardDescription className="text-base text-slate-600">
            {description}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {children}
        </CardContent>
      </Card>
    </div>
  )
}
