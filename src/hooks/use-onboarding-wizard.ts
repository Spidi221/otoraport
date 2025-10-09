'use client';

import { useState, useEffect, useCallback } from 'react';
import { z } from 'zod';

// Validation Schemas
export const companyInfoSchema = z.object({
  company_name: z.string().min(2, 'Nazwa firmy musi mieć co najmniej 2 znaki').max(100, 'Nazwa firmy może mieć maksymalnie 100 znaków'),
  tax_id: z.string().regex(/^\d{3}-?\d{3}-?\d{2}-?\d{2}$/, 'Nieprawidłowy format NIP').optional().or(z.literal('')),
  phone: z.string().regex(/^(\+48)?[\s-]?\d{3}[\s-]?\d{3}[\s-]?\d{3}$/, 'Nieprawidłowy numer telefonu').optional().or(z.literal('')),
  address: z.string().max(500, 'Adres może mieć maksymalnie 500 znaków').optional().or(z.literal('')),
});

export const logoSchema = z.object({
  file: z.instanceof(File).optional().nullable(),
  url: z.string().url().optional().nullable(),
  preview: z.string().optional().nullable(),
});

export const csvSchema = z.object({
  file: z.instanceof(File).optional().nullable(),
  parsed_data: z.array(z.any()).optional().nullable(),
  row_count: z.number().optional().nullable(),
  errors: z.array(z.string()).optional().nullable(),
  warnings: z.array(z.string()).optional().nullable(),
});

export type CompanyInfo = z.infer<typeof companyInfoSchema>;
export type LogoData = z.infer<typeof logoSchema>;
export type CSVData = z.infer<typeof csvSchema>;

export interface OnboardingState {
  currentStep: number;
  completedSteps: number[];
  skippedSteps: number[];
  companyInfo: CompanyInfo;
  logo: LogoData;
  csv: CSVData;
  endpointTests: {
    xml: { status: 'idle' | 'loading' | 'success' | 'error'; message?: string };
    csv: { status: 'idle' | 'loading' | 'success' | 'error'; message?: string };
    md5: { status: 'idle' | 'loading' | 'success' | 'error'; message?: string };
  };
}

const STORAGE_KEY = 'otoraport_onboarding_state';

const initialState: OnboardingState = {
  currentStep: 1,
  completedSteps: [],
  skippedSteps: [],
  companyInfo: {
    company_name: '',
    tax_id: '',
    phone: '',
    address: '',
  },
  logo: {
    file: null,
    url: null,
    preview: null,
  },
  csv: {
    file: null,
    parsed_data: null,
    row_count: null,
    errors: null,
    warnings: null,
  },
  endpointTests: {
    xml: { status: 'idle' },
    csv: { status: 'idle' },
    md5: { status: 'idle' },
  },
};

export function useOnboardingWizard() {
  const [state, setState] = useState<OnboardingState>(initialState);
  const [isLoading, setIsLoading] = useState(false);

  // Load state from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setState((prev) => ({
          ...prev,
          ...parsed,
          // Don't restore file objects or endpoint test states
          logo: { ...parsed.logo, file: null },
          csv: { ...parsed.csv, file: null },
          endpointTests: initialState.endpointTests,
        }));
      } catch (error) {
        console.error('Failed to load onboarding state:', error);
      }
    }
  }, []);

  // Save state to localStorage whenever it changes
  useEffect(() => {
    const toSave = {
      ...state,
      // Don't save file objects
      logo: { ...state.logo, file: null },
      csv: { ...state.csv, file: null },
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
  }, [state]);

  const saveProgress = useCallback(async () => {
    try {
      await fetch('/api/onboarding/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          step: state.currentStep,
          completed_steps: state.completedSteps,
          skipped_steps: state.skippedSteps,
          data: {
            company_info: state.companyInfo,
            has_logo: !!state.logo.url,
            has_csv: !!state.csv.parsed_data,
          },
          timestamp: new Date().toISOString(),
        }),
      });
    } catch (error) {
      console.error('Failed to save progress:', error);
      // Non-blocking error - continue anyway
    }
  }, [state]);

  const goToStep = useCallback((step: number) => {
    setState((prev) => ({ ...prev, currentStep: step }));
  }, []);

  const nextStep = useCallback(async () => {
    const currentStep = state.currentStep;

    // Mark current step as completed
    setState((prev) => ({
      ...prev,
      completedSteps: [...new Set([...prev.completedSteps, currentStep])],
    }));

    // Determine next step based on skip logic
    let nextStep = currentStep + 1;

    // If skipping CSV upload (step 3), skip verification (step 4) too
    if (currentStep === 3 && state.skippedSteps.includes(3)) {
      nextStep = 5;
    }

    setState((prev) => ({ ...prev, currentStep: nextStep }));

    // Save progress to backend
    await saveProgress();
  }, [state.currentStep, state.skippedSteps, saveProgress]);

  const prevStep = useCallback(() => {
    let prevStep = state.currentStep - 1;

    // If current step is 5 and step 3 was skipped, go back to step 3
    if (state.currentStep === 5 && state.skippedSteps.includes(3)) {
      prevStep = 3;
    }

    // If current step is 4, always go back to step 3
    if (state.currentStep === 4) {
      prevStep = 3;
    }

    setState((prev) => ({ ...prev, currentStep: prevStep }));
  }, [state.currentStep, state.skippedSteps]);

  const skipStep = useCallback(async () => {
    const currentStep = state.currentStep;

    setState((prev) => ({
      ...prev,
      skippedSteps: [...new Set([...prev.skippedSteps, currentStep])],
    }));

    await nextStep();
  }, [state.currentStep, nextStep]);

  const updateCompanyInfo = useCallback((data: Partial<CompanyInfo>) => {
    setState((prev) => ({
      ...prev,
      companyInfo: { ...prev.companyInfo, ...data },
    }));
  }, []);

  const updateLogo = useCallback((data: Partial<LogoData>) => {
    setState((prev) => ({
      ...prev,
      logo: { ...prev.logo, ...data },
    }));
  }, []);

  const updateCSV = useCallback((data: Partial<CSVData>) => {
    setState((prev) => ({
      ...prev,
      csv: { ...prev.csv, ...data },
    }));
  }, []);

  const updateEndpointTest = useCallback((
    endpoint: 'xml' | 'csv' | 'md5',
    status: 'idle' | 'loading' | 'success' | 'error',
    message?: string
  ) => {
    setState((prev) => ({
      ...prev,
      endpointTests: {
        ...prev.endpointTests,
        [endpoint]: { status, message },
      },
    }));
  }, []);

  const testEndpoint = useCallback(async (endpoint: 'xml' | 'csv' | 'md5', clientId: string) => {
    updateEndpointTest(endpoint, 'loading');

    try {
      const response = await fetch(`/api/public/${clientId}/data.${endpoint}`, {
        method: 'GET',
        signal: AbortSignal.timeout(10000), // 10s timeout
      });

      if (response.ok) {
        updateEndpointTest(endpoint, 'success', `HTTP ${response.status}`);
      } else {
        updateEndpointTest(endpoint, 'error', `HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      updateEndpointTest(endpoint, 'error', error instanceof Error ? error.message : 'Błąd połączenia');
    }
  }, [updateEndpointTest]);

  const testAllEndpoints = useCallback(async (clientId: string) => {
    await Promise.all([
      testEndpoint('xml', clientId),
      testEndpoint('csv', clientId),
      testEndpoint('md5', clientId),
    ]);
  }, [testEndpoint]);

  const completeOnboarding = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setState((prev) => ({
      ...prev,
      completedSteps: [...new Set([...prev.completedSteps, 6])],
    }));
  }, []);

  const resetOnboarding = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setState(initialState);
  }, []);

  const getTotalSteps = useCallback(() => {
    // Base steps: 1 (welcome), 2 (logo), 3 (csv), 5 (endpoints), 6 (completion)
    // Step 4 (verification) only counts if CSV was uploaded
    const hasCSV = !state.skippedSteps.includes(3) && state.currentStep >= 4;
    return hasCSV ? 6 : 5;
  }, [state.skippedSteps, state.currentStep]);

  const getEffectiveStepNumber = useCallback(() => {
    // Calculate which step number to display (accounting for skipped step 4)
    const { currentStep, skippedSteps } = state;

    if (currentStep <= 3) return currentStep;
    if (skippedSteps.includes(3) && currentStep === 5) return 4; // Skip step 4
    if (skippedSteps.includes(3) && currentStep === 6) return 5; // Skip step 4
    return currentStep;
  }, [state]);

  return {
    state,
    isLoading,
    setIsLoading,
    goToStep,
    nextStep,
    prevStep,
    skipStep,
    updateCompanyInfo,
    updateLogo,
    updateCSV,
    updateEndpointTest,
    testEndpoint,
    testAllEndpoints,
    completeOnboarding,
    resetOnboarding,
    getTotalSteps,
    getEffectiveStepNumber,
  };
}
