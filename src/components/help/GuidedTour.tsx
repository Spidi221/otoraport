'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { X, ArrowLeft, ArrowRight, CheckCircle, Target } from 'lucide-react';
import { GuidedTour as TourType, TourStep } from '@/lib/help-system';

interface GuidedTourProps {
  tour: TourType;
  isActive: boolean;
  onComplete: () => void;
  onSkip: () => void;
  userId: string;
}

interface TourState {
  currentStep: number;
  completedSteps: number[];
  isVisible: boolean;
  highlightedElement: HTMLElement | null;
}

export function GuidedTour({ tour, isActive, onComplete, onSkip, userId }: GuidedTourProps) {
  const [tourState, setTourState] = useState<TourState>({
    currentStep: 0,
    completedSteps: [],
    isVisible: isActive,
    highlightedElement: null
  });

  const overlayRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const handleRequiredActionRef = useRef<(() => void) | null>(null);
  // Store the exact handler instance attached to prevent memory leaks (Task 19)
  const attachedActionHandlerRef = useRef<(() => void) | null>(null);

  const currentStep = tour.steps[tourState.currentStep];
  const isLastStep = tourState.currentStep === tour.steps.length - 1;
  const isFirstStep = tourState.currentStep === 0;

  const cleanupHighlight = useCallback(() => {
    if (tourState.highlightedElement) {
      tourState.highlightedElement.classList.remove('tour-highlight');
      tourState.highlightedElement.style.position = '';
      tourState.highlightedElement.style.zIndex = '';
      tourState.highlightedElement.style.boxShadow = '';
      tourState.highlightedElement.style.borderRadius = '';
      // Use the exact handler that was attached (Task 19 - memory leak fix)
      if (attachedActionHandlerRef.current) {
        tourState.highlightedElement.removeEventListener('click', attachedActionHandlerRef.current);
        attachedActionHandlerRef.current = null; // Prevent stale references
      }
    }

    // Remove any existing highlights
    document.querySelectorAll('.tour-highlight').forEach(el => {
      (el as HTMLElement).classList.remove('tour-highlight');
      (el as HTMLElement).style.position = '';
      (el as HTMLElement).style.zIndex = '';
      (el as HTMLElement).style.boxShadow = '';
      (el as HTMLElement).style.borderRadius = '';
    });
  }, [tourState.highlightedElement]);

  const trackTourEvent = useCallback((event: string, stepIndex: number) => {
    // In production, send to analytics
    console.log(`Tour ${tour.id} - ${event} - Step ${stepIndex} - User ${userId}`);
  }, [tour.id, userId]);

  const startStep = useCallback((stepIndex: number) => {
    const step = tour.steps[stepIndex];
    if (!step) return;

    setTourState(prev => ({
      ...prev,
      currentStep: stepIndex
    }));

    // Track step start
    trackTourEvent('step_started', stepIndex);
  }, [tour.steps, trackTourEvent]);

  // Hoisted to fix TDZ error - must be defined before completeCurrentStep
  const completeTour = useCallback(() => {
    trackTourEvent('tour_completed', tour.steps.length);
    cleanupHighlight();
    onComplete();
  }, [trackTourEvent, tour.steps.length, cleanupHighlight, onComplete]);

  const nextStep = useCallback(() => {
    if (!isLastStep) {
      startStep(tourState.currentStep + 1);
    }
  }, [isLastStep, startStep, tourState.currentStep]);

  const completeCurrentStep = useCallback(() => {
    const stepIndex = tourState.currentStep;

    setTourState(prev => ({
      ...prev,
      completedSteps: [...prev.completedSteps, stepIndex]
    }));

    trackTourEvent('step_completed', stepIndex);

    // Auto-advance to next step after action
    setTimeout(() => {
      if (isLastStep) {
        completeTour();
      } else {
        nextStep();
      }
    }, 500);
  }, [tourState.currentStep, trackTourEvent, isLastStep, completeTour, nextStep]);

  const handleRequiredAction = useCallback(() => {
    if (currentStep?.action_required) {
      completeCurrentStep();
    }
  }, [currentStep, completeCurrentStep]);

  // Keep ref updated
  handleRequiredActionRef.current = handleRequiredAction;

  const highlightElement = useCallback((step: TourStep) => {
    cleanupHighlight();

    const element = document.querySelector(step.target_element) as HTMLElement;
    if (!element) {
      console.warn(`Tour step target element not found: ${step.target_element}`);
      return;
    }

    // Add highlight class
    element.classList.add('tour-highlight');
    element.style.position = 'relative';
    element.style.zIndex = '9999';
    element.style.boxShadow = '0 0 0 4px rgba(59, 130, 246, 0.5), 0 0 0 9999px rgba(0, 0, 0, 0.3)';
    element.style.borderRadius = '8px';

    setTourState(prev => ({
      ...prev,
      highlightedElement: element
    }));

    // Scroll element into view
    element.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
      inline: 'center'
    });

    // Add click listener if action required (Task 19 - store handler to fix memory leak)
    if (step.action_required && step.action_type === 'click' && handleRequiredActionRef.current) {
      attachedActionHandlerRef.current = handleRequiredActionRef.current;
      element.addEventListener('click', attachedActionHandlerRef.current);
    }
  }, [cleanupHighlight]);

  const positionTooltip = useCallback((step: TourStep) => {
    if (!tooltipRef.current) return;

    const element = document.querySelector(step.target_element) as HTMLElement;
    if (!element) return;

    const rect = element.getBoundingClientRect();
    const tooltipRect = tooltipRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let top = 0;
    let left = 0;

    switch (step.position) {
      case 'top':
        top = rect.top - tooltipRect.height - 16;
        left = rect.left + (rect.width - tooltipRect.width) / 2;
        break;
      case 'bottom':
        top = rect.bottom + 16;
        left = rect.left + (rect.width - tooltipRect.width) / 2;
        break;
      case 'left':
        top = rect.top + (rect.height - tooltipRect.height) / 2;
        left = rect.left - tooltipRect.width - 16;
        break;
      case 'right':
        top = rect.top + (rect.height - tooltipRect.height) / 2;
        left = rect.right + 16;
        break;
      case 'center':
        top = (viewportHeight - tooltipRect.height) / 2;
        left = (viewportWidth - tooltipRect.width) / 2;
        break;
    }

    // Ensure tooltip stays within viewport
    top = Math.max(16, Math.min(top, viewportHeight - tooltipRect.height - 16));
    left = Math.max(16, Math.min(left, viewportWidth - tooltipRect.width - 16));

    tooltipRef.current.style.top = `${top}px`;
    tooltipRef.current.style.left = `${left}px`;
  }, []);

  const prevStep = useCallback(() => {
    if (!isFirstStep) {
      startStep(tourState.currentStep - 1);
    }
  }, [isFirstStep, startStep, tourState.currentStep]);

  const skipTour = useCallback(() => {
    trackTourEvent('tour_skipped', tourState.currentStep);
    cleanupHighlight();
    onSkip();
  }, [trackTourEvent, tourState.currentStep, cleanupHighlight, onSkip]);

  useEffect(() => {
    if (isActive) {
      setTourState(prev => ({ ...prev, isVisible: true }));
      startStep(0);
    } else {
      setTourState(prev => ({ ...prev, isVisible: false }));
      cleanupHighlight();
    }

    return () => cleanupHighlight();
  }, [isActive, startStep, cleanupHighlight]);

  useEffect(() => {
    if (tourState.isVisible && currentStep) {
      highlightElement(currentStep);
      positionTooltip(currentStep);
    }
  }, [tourState.currentStep, tourState.isVisible, currentStep, highlightElement, positionTooltip]);

  if (!tourState.isVisible || !currentStep) {
    return null;
  }

  return (
    <>
      {/* Tour Overlay */}
      <div
        ref={overlayRef}
        className="fixed inset-0 z-[9998] pointer-events-none"
        style={{ background: 'rgba(0, 0, 0, 0.3)' }}
      />

      {/* Tour Tooltip */}
      <div
        ref={tooltipRef}
        className="fixed z-[10000] bg-white rounded-lg shadow-xl border p-4 max-w-sm pointer-events-auto"
        style={{ position: 'fixed' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <Target className="w-5 h-5 text-blue-600" />
            <span className="text-sm font-medium text-gray-900">
              Krok {tourState.currentStep + 1} z {tour.steps.length}
            </span>
          </div>
          <button
            onClick={skipTour}
            className="p-1 hover:bg-gray-100 rounded-full"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${((tourState.currentStep + 1) / tour.steps.length) * 100}%` }}
          />
        </div>

        {/* Step Content */}
        <div className="mb-4">
          <h3 className="text-base font-semibold text-gray-900 mb-2">
            {currentStep.title}
          </h3>
          <p className="text-sm text-gray-600 mb-3">
            {currentStep.description}
          </p>

          {/* Action Required Badge */}
          {currentStep.action_required && (
            <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mb-3">
              <Target className="w-3 h-3 mr-1" />
              {currentStep.action_type === 'click' && 'Kliknij element'}
              {currentStep.action_type === 'input' && 'Wprowadź dane'}
              {currentStep.action_type === 'upload' && 'Prześlij plik'}
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={prevStep}
            disabled={isFirstStep}
            className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Wstecz
          </button>

          <div className="flex items-center space-x-2">
            <button
              onClick={skipTour}
              className="px-3 py-2 text-sm font-medium text-gray-500 hover:text-gray-700"
            >
              Pomiń
            </button>

            {currentStep.action_required ? (
              <div className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg">
                Wykonaj akcję
              </div>
            ) : (
              <button
                onClick={isLastStep ? completeTour : nextStep}
                className="flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
              >
                {isLastStep ? (
                  <>
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Zakończ
                  </>
                ) : (
                  <>
                    Dalej
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Step Indicators */}
        <div className="flex justify-center mt-4 space-x-2">
          {tour.steps.map((_, index) => (
            <div
              key={index}
              className={`w-2 h-2 rounded-full ${
                index === tourState.currentStep
                  ? 'bg-blue-600'
                  : tourState.completedSteps.includes(index)
                  ? 'bg-green-500'
                  : 'bg-gray-300'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Tooltip Arrow */}
      {currentStep.position !== 'center' && (
        <div
          className="fixed z-[10000] w-0 h-0 pointer-events-none"
          style={{
            top: currentStep.position === 'top' ?
              `${tooltipRef.current?.getBoundingClientRect().bottom ?? 0}px` :
              currentStep.position === 'bottom' ?
              `${(tooltipRef.current?.getBoundingClientRect().top ?? 0) - 8}px` :
              `${(tooltipRef.current?.getBoundingClientRect().top ?? 0) + (tooltipRef.current?.getBoundingClientRect().height ?? 0) / 2 - 4}px`,
            left: currentStep.position === 'left' ?
              `${tooltipRef.current?.getBoundingClientRect().right ?? 0}px` :
              currentStep.position === 'right' ?
              `${(tooltipRef.current?.getBoundingClientRect().left ?? 0) - 8}px` :
              `${(tooltipRef.current?.getBoundingClientRect().left ?? 0) + (tooltipRef.current?.getBoundingClientRect().width ?? 0) / 2 - 4}px`,
            borderLeft: currentStep.position === 'right' ? '8px solid white' : '8px solid transparent',
            borderRight: currentStep.position === 'left' ? '8px solid white' : '8px solid transparent',
            borderTop: currentStep.position === 'bottom' ? '8px solid white' : '8px solid transparent',
            borderBottom: currentStep.position === 'top' ? '8px solid white' : '8px solid transparent'
          }}
        />
      )}
    </>
  );
}