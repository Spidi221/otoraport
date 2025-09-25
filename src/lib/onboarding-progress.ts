/**
 * OTORAPORT Chatbot Phase 2 - Onboarding Progress Tracking
 * Manages user progress through the onboarding flow with local storage persistence
 */

export type OnboardingStage = 
  | 'pre-registration'
  | 'account-setup' 
  | 'company-data'
  | 'file-upload'
  | 'data-validation'
  | 'xml-preview'
  | 'ministry-registration'
  | 'first-sync'
  | 'dashboard-tour'
  | 'completed';

export interface OnboardingProgress {
  currentStage: OnboardingStage;
  completedStages: OnboardingStage[];
  startedAt: Date;
  lastActivity: Date;
  estimatedTimeRemaining: number; // in minutes
  hasEncounteredErrors: boolean;
  errorHistory: string[];
}

export interface StageMetadata {
  id: OnboardingStage;
  name: string;
  description: string;
  estimatedDuration: number; // in minutes
  isCompleted: boolean;
  isActive: boolean;
  prerequisites?: OnboardingStage[];
}

/**
 * Onboarding stage definitions with timing and metadata
 */
export const ONBOARDING_STAGES: Record<OnboardingStage, Omit<StageMetadata, 'isCompleted' | 'isActive'>> = {
  'pre-registration': {
    id: 'pre-registration',
    name: 'Wprowadzenie',
    description: 'Poznanie systemu i wymagań',
    estimatedDuration: 1
  },
  'account-creation': {
    id: 'account-creation',
    name: 'Rejestracja konta',
    description: 'Utworzenie konta i dane firmowe',
    estimatedDuration: 2,
    prerequisites: ['pre-registration']
  },
  'plan-selection': {
    id: 'plan-selection',
    name: 'Wybór planu',
    description: 'Dopasowanie planu do potrzeb',
    estimatedDuration: 1,
    prerequisites: ['account-creation']
  },
  'data-upload': {
    id: 'data-upload',
    name: 'Upload danych',
    description: 'Przesłanie pliku z mieszkaniami',
    estimatedDuration: 3,
    prerequisites: ['plan-selection']
  },
  'file-validation': {
    id: 'file-validation',
    name: 'Walidacja pliku',
    description: 'Sprawdzenie i mapowanie danych',
    estimatedDuration: 2,
    prerequisites: ['data-upload']
  },
  'configuration': {
    id: 'configuration',
    name: 'Konfiguracja',
    description: 'Ustawienia systemu i powiadomień',
    estimatedDuration: 2,
    prerequisites: ['file-validation']
  },
  'test-generation': {
    id: 'test-generation',
    name: 'Test systemu',
    description: 'Weryfikacja przed aktywacją',
    estimatedDuration: 1,
    prerequisites: ['configuration']
  },
  'activation': {
    id: 'activation',
    name: 'Aktywacja',
    description: 'Uruchomienie automatyzacji',
    estimatedDuration: 3,
    prerequisites: ['test-generation']
  },
  'post-onboarding': {
    id: 'post-onboarding',
    name: 'Pierwsze kroki',
    description: 'Zapoznanie z dashboard i funkcjami',
    estimatedDuration: 5,
    prerequisites: ['activation']
  }
};

/**
 * OnboardingProgressManager - manages user progress through onboarding
 */
export class OnboardingProgressManager {
  private static readonly STORAGE_KEY = 'otoraport_onboarding_progress';
  private static readonly SESSION_TIMEOUT = 24 * 60 * 60 * 1000; // 24 hours

  /**
   * Initialize or load existing progress
   */
  static initializeProgress(): OnboardingProgress {
    const stored = this.loadProgress();
    if (stored && this.isSessionValid(stored)) {
      return stored;
    }

    // Create new progress
    const newProgress: OnboardingProgress = {
      currentStage: 'pre-registration',
      completedStages: [],
      startedAt: new Date(),
      lastActivity: new Date(),
      estimatedTimeRemaining: this.calculateTotalTime(),
      hasEncounteredErrors: false,
      errorHistory: []
    };

    this.saveProgress(newProgress);
    return newProgress;
  }

  /**
   * Update current stage and recalculate progress
   */
  static updateStage(newStage: OnboardingStage, hasError = false, errorType?: string): OnboardingProgress {
    const progress = this.loadProgress() || this.initializeProgress();
    
    // Mark previous stage as completed if moving forward
    if (this.isStageAdvancement(progress.currentStage, newStage)) {
      if (!progress.completedStages.includes(progress.currentStage)) {
        progress.completedStages.push(progress.currentStage);
      }
    }

    progress.currentStage = newStage;
    progress.lastActivity = new Date();
    progress.estimatedTimeRemaining = this.calculateRemainingTime(progress);

    // Handle errors
    if (hasError) {
      progress.hasEncounteredErrors = true;
      if (errorType) {
        progress.errorHistory.push(`${new Date().toISOString()}: ${errorType} in ${newStage}`);
      }
    }

    this.saveProgress(progress);
    return progress;
  }

  /**
   * Mark current stage as completed
   */
  static completeCurrentStage(): OnboardingProgress {
    const progress = this.loadProgress() || this.initializeProgress();
    
    if (!progress.completedStages.includes(progress.currentStage)) {
      progress.completedStages.push(progress.currentStage);
    }

    progress.lastActivity = new Date();
    progress.estimatedTimeRemaining = this.calculateRemainingTime(progress);
    
    this.saveProgress(progress);
    return progress;
  }

  /**
   * Get current progress with stage metadata
   */
  static getProgressWithMetadata(): OnboardingProgress & { stageMetadata: StageMetadata[] } {
    const progress = this.loadProgress() || this.initializeProgress();
    const stageMetadata = this.getAllStagesWithStatus(progress);
    
    return { ...progress, stageMetadata };
  }

  /**
   * Check if user needs proactive assistance
   */
  static needsProactiveHelp(progress?: OnboardingProgress): { needsHelp: boolean; reason?: string } {
    const currentProgress = progress || this.loadProgress();
    if (!currentProgress) return { needsHelp: false };

    const stageStartTime = currentProgress.lastActivity.getTime();
    const currentTime = Date.now();
    const timeInStage = currentTime - stageStartTime;
    const expectedDuration = ONBOARDING_STAGES[currentProgress.currentStage].estimatedDuration * 60 * 1000; // convert to ms

    // Offer help if user has been on stage too long
    if (timeInStage > expectedDuration * 2) {
      return { 
        needsHelp: true, 
        reason: `Dłużej niż zwykle w etapie: ${ONBOARDING_STAGES[currentProgress.currentStage].name}` 
      };
    }

    // Offer help if user has encountered errors
    if (currentProgress.hasEncounteredErrors && currentProgress.errorHistory.length > 2) {
      return { 
        needsHelp: true, 
        reason: 'Wystąpiło kilka błędów podczas onboardingu' 
      };
    }

    return { needsHelp: false };
  }

  /**
   * Reset progress (start over)
   */
  static resetProgress(): OnboardingProgress {
    localStorage.removeItem(this.STORAGE_KEY);
    return this.initializeProgress();
  }

  /**
   * Private helper methods
   */
  private static saveProgress(progress: OnboardingProgress): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify({
        ...progress,
        startedAt: progress.startedAt.toISOString(),
        lastActivity: progress.lastActivity.toISOString()
      }));
    } catch (error) {
      console.warn('[OnboardingProgress] Failed to save progress:', error);
    }
  }

  private static loadProgress(): OnboardingProgress | null {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) return null;

      const parsed = JSON.parse(stored);
      return {
        ...parsed,
        startedAt: new Date(parsed.startedAt),
        lastActivity: new Date(parsed.lastActivity)
      };
    } catch (error) {
      console.warn('[OnboardingProgress] Failed to load progress:', error);
      return null;
    }
  }

  private static isSessionValid(progress: OnboardingProgress): boolean {
    const now = Date.now();
    const lastActivity = progress.lastActivity.getTime();
    return (now - lastActivity) < this.SESSION_TIMEOUT;
  }

  private static calculateTotalTime(): number {
    return Object.values(ONBOARDING_STAGES).reduce((total, stage) => total + stage.estimatedDuration, 0);
  }

  private static calculateRemainingTime(progress: OnboardingProgress): number {
    const completedTime = progress.completedStages.reduce((total, stageId) => {
      return total + ONBOARDING_STAGES[stageId].estimatedDuration;
    }, 0);

    const totalTime = this.calculateTotalTime();
    return Math.max(0, totalTime - completedTime);
  }

  private static isStageAdvancement(currentStage: OnboardingStage, newStage: OnboardingStage): boolean {
    const stages = Object.keys(ONBOARDING_STAGES) as OnboardingStage[];
    const currentIndex = stages.indexOf(currentStage);
    const newIndex = stages.indexOf(newStage);
    return newIndex > currentIndex;
  }

  private static getAllStagesWithStatus(progress: OnboardingProgress): StageMetadata[] {
    return Object.values(ONBOARDING_STAGES).map(stage => ({
      ...stage,
      isCompleted: progress.completedStages.includes(stage.id),
      isActive: progress.currentStage === stage.id
    }));
  }
}

/**
 * Hook for React components to use onboarding progress
 */
export function useOnboardingProgress() {
  const getProgress = () => OnboardingProgressManager.getProgressWithMetadata();
  const updateStage = (stage: OnboardingStage, hasError = false, errorType?: string) => 
    OnboardingProgressManager.updateStage(stage, hasError, errorType);
  const completeStage = () => OnboardingProgressManager.completeCurrentStage();
  const resetProgress = () => OnboardingProgressManager.resetProgress();
  const needsHelp = () => OnboardingProgressManager.needsProactiveHelp();

  return {
    getProgress,
    updateStage,
    completeStage,
    resetProgress,
    needsHelp
  };
}