/**
 * Wizard Progress Component
 * Task #103 - Professional progress bar with color-coded completion
 */

'use client'

import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'

interface WizardProgressProps {
  currentStep: number
  totalSteps: number
  completionPercentage: number
  className?: string
}

export function WizardProgress({
  currentStep,
  totalSteps,
  completionPercentage,
  className
}: WizardProgressProps) {
  // Color-coded progress: Red (<50%), Yellow (50-79%), Green (80%+)
  const getProgressColor = (percentage: number): string => {
    if (percentage < 50) return 'bg-red-500'
    if (percentage < 80) return 'bg-yellow-500'
    return 'bg-green-500'
  }

  const getProgressTextColor = (percentage: number): string => {
    if (percentage < 50) return 'text-red-700'
    if (percentage < 80) return 'text-yellow-700'
    return 'text-green-700'
  }

  const stepProgress = ((currentStep + 1) / totalSteps) * 100

  return (
    <div className={cn('space-y-3', className)}>
      {/* Step indicator */}
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-slate-700">
          Krok {currentStep + 1} z {totalSteps}
        </span>
        <span className={cn('font-semibold', getProgressTextColor(completionPercentage))}>
          {completionPercentage}% kompletności
        </span>
      </div>

      {/* Progress bar */}
      <div className="relative">
        <Progress
          value={completionPercentage}
          className="h-3 bg-slate-200"
        />
        <div
          className={cn(
            'absolute top-0 left-0 h-full rounded-full transition-all duration-500 ease-out',
            getProgressColor(completionPercentage)
          )}
          style={{ width: `${completionPercentage}%` }}
        />
      </div>

      {/* Step dots */}
      <div className="flex items-center justify-between">
        {Array.from({ length: totalSteps }).map((_, index) => (
          <div key={index} className="flex flex-col items-center gap-1">
            <div
              className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all duration-300',
                index <= currentStep
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-slate-200 text-slate-400'
              )}
            >
              {index + 1}
            </div>
            <div
              className={cn(
                'text-xs font-medium transition-colors duration-300',
                index <= currentStep ? 'text-blue-700' : 'text-slate-400'
              )}
            >
              {index === 0 && 'Info'}
              {index === 1 && 'Lokalizacja'}
              {index === 2 && 'Ceny'}
              {index === 3 && 'Techniczne'}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
