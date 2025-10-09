'use client';

import { useOnboardingWizard } from '@/hooks/use-onboarding-wizard';
import { ProgressIndicator } from './progress-indicator';
import { StepWelcome } from './step-welcome';
import { StepLogo } from './step-logo';
import { StepCSV } from './step-csv';
import { StepVerification } from './step-verification';
import { StepEndpoints } from './step-endpoints';
import { StepCompletion } from './step-completion';

interface OnboardingWizardProps {
  userId: string;
  clientId: string;
}

export function OnboardingWizard({ userId, clientId }: OnboardingWizardProps) {
  const wizard = useOnboardingWizard();

  const { state, updateCompanyInfo, updateLogo, updateCSV } = wizard;
  const { currentStep, completedSteps } = state;

  const totalSteps = wizard.getTotalSteps();

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <StepWelcome
            data={state.companyInfo}
            onUpdate={updateCompanyInfo}
            onNext={wizard.nextStep}
          />
        );

      case 2:
        return (
          <StepLogo
            data={state.logo}
            onUpdate={updateLogo}
            onNext={wizard.nextStep}
            onBack={wizard.prevStep}
            onSkip={wizard.skipStep}
          />
        );

      case 3:
        return (
          <StepCSV
            data={state.csv}
            onUpdate={updateCSV}
            onNext={wizard.nextStep}
            onBack={wizard.prevStep}
            onSkip={wizard.skipStep}
          />
        );

      case 4:
        // Only show if CSV was uploaded
        if (state.skippedSteps.includes(3)) {
          wizard.goToStep(5);
          return null;
        }

        return (
          <StepVerification
            data={state.csv}
            onNext={wizard.nextStep}
            onBack={wizard.prevStep}
          />
        );

      case 5:
        return (
          <StepEndpoints
            endpointTests={state.endpointTests}
            clientId={clientId}
            onTestEndpoint={(endpoint) => wizard.testEndpoint(endpoint, clientId)}
            onTestAll={() => wizard.testAllEndpoints(clientId)}
            onNext={wizard.nextStep}
            onBack={wizard.prevStep}
          />
        );

      case 6:
        return <StepCompletion onComplete={wizard.completeOnboarding} />;

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 py-8">
      {/* Progress Indicator - Don't show on completion step */}
      {currentStep < 6 && (
        <ProgressIndicator
          currentStep={wizard.getEffectiveStepNumber()}
          totalSteps={totalSteps}
          completedSteps={completedSteps}
        />
      )}

      {/* Step Content */}
      <div className="mt-8">{renderStep()}</div>

      {/* Debug Info - Remove in production */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 right-4 bg-black/80 text-white text-xs p-3 rounded-lg font-mono max-w-xs">
          <div>Step: {currentStep}/{totalSteps}</div>
          <div>Completed: {completedSteps.join(', ') || 'none'}</div>
          <div>Skipped: {state.skippedSteps.join(', ') || 'none'}</div>
          <div>User ID: {userId.slice(0, 8)}...</div>
          <div>Client ID: {clientId.slice(0, 8)}...</div>
        </div>
      )}
    </div>
  );
}
