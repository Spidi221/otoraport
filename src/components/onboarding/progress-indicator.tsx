'use client';

import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProgressIndicatorProps {
  currentStep: number;
  totalSteps: number;
  completedSteps: number[];
}

export function ProgressIndicator({ currentStep, totalSteps, completedSteps }: ProgressIndicatorProps) {
  const steps = Array.from({ length: totalSteps }, (_, i) => i + 1);

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-8">
      <div className="relative">
        {/* Progress bar background */}
        <div className="absolute top-5 left-0 w-full h-0.5 bg-gray-200" />

        {/* Progress bar fill */}
        <div
          className="absolute top-5 left-0 h-0.5 bg-blue-600 transition-all duration-500 ease-out"
          style={{
            width: `${((currentStep - 1) / (totalSteps - 1)) * 100}%`,
          }}
        />

        {/* Step circles */}
        <div className="relative flex justify-between">
          {steps.map((step) => {
            const isCompleted = completedSteps.includes(step);
            const isCurrent = step === currentStep;
            const isPast = step < currentStep;

            return (
              <div key={step} className="flex flex-col items-center">
                {/* Circle */}
                <div
                  className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm transition-all duration-300',
                    'border-2',
                    {
                      'bg-blue-600 border-blue-600 text-white': isCurrent || isCompleted || isPast,
                      'bg-white border-gray-300 text-gray-400': !isCurrent && !isCompleted && !isPast,
                      'scale-110 shadow-lg': isCurrent,
                    }
                  )}
                >
                  {isCompleted || isPast ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <span>{step}</span>
                  )}
                </div>

                {/* Step label */}
                <div
                  className={cn(
                    'mt-2 text-xs font-medium text-center max-w-[80px] transition-colors duration-300',
                    {
                      'text-blue-600': isCurrent,
                      'text-gray-900': isCompleted || isPast,
                      'text-gray-400': !isCurrent && !isCompleted && !isPast,
                    }
                  )}
                >
                  {getStepLabel(step, totalSteps)}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Mobile progress text */}
      <div className="mt-6 text-center md:hidden">
        <p className="text-sm font-medium text-gray-600">
          Krok {currentStep} z {totalSteps}
        </p>
      </div>
    </div>
  );
}

function getStepLabel(step: number, totalSteps: number): string {
  // Handle both 5-step (skipped CSV) and 6-step flows
  if (totalSteps === 5) {
    const labels = ['Powitanie', 'Logo', 'Dane CSV', 'Endpointy', 'Gotowe'];
    return labels[step - 1] || '';
  }

  const labels = ['Powitanie', 'Logo', 'Dane CSV', 'Weryfikacja', 'Endpointy', 'Gotowe'];
  return labels[step - 1] || '';
}
