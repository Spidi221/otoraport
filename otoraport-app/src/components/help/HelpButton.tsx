'use client';

import { useState, useEffect } from 'react';
import { HelpCircle, MessageCircle, BookOpen, Zap, ChevronDown } from 'lucide-react';
import { HelpOverlay } from './HelpOverlay';
import { GuidedTour } from './GuidedTour';
import { InAppHelpSystem, HelpContext, GuidedTour as TourType } from '@/lib/help-system';
import { usePathname } from 'next/navigation';

interface HelpButtonProps {
  userId: string;
  subscriptionPlan: string;
  onboardingStep: number;
  className?: string;
}

export function HelpButton({ userId, subscriptionPlan, onboardingStep, className = '' }: HelpButtonProps) {
  const [isOverlayOpen, setIsOverlayOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeTour, setActiveTour] = useState<TourType | null>(null);
  const [context, setContext] = useState<HelpContext>({
    page: 'dashboard',
    section: 'main',
    user_action: 'viewing',
    subscription_plan: subscriptionPlan,
    onboarding_step: onboardingStep,
    feature_flags: []
  });

  const pathname = usePathname();

  useEffect(() => {
    // Update context based on current page
    const page = pathname.split('/').pop() || 'dashboard';
    const section = getPageSection(pathname);

    setContext(prev => ({
      ...prev,
      page,
      section,
      user_action: 'viewing',
      subscription_plan: subscriptionPlan,
      onboarding_step: onboardingStep
    }));
  }, [pathname, subscriptionPlan, onboardingStep]);

  const getPageSection = (path: string): string => {
    if (path.includes('/dashboard')) return 'dashboard';
    if (path.includes('/upload')) return 'data_management';
    if (path.includes('/subscription')) return 'billing';
    if (path.includes('/settings')) return 'settings';
    if (path.includes('/analytics')) return 'analytics';
    return 'main';
  };

  const openHelp = () => {
    setIsOverlayOpen(true);
    setIsMenuOpen(false);
  };

  const startTour = async () => {
    const tour = await InAppHelpSystem.getGuidedTour(context);
    if (tour) {
      setActiveTour(tour);
      setIsMenuOpen(false);
    }
  };

  const openQuickHelp = () => {
    // Quick help - show contextual tooltip
    setIsMenuOpen(false);
    // Implementation for quick contextual help
  };

  const openChat = () => {
    setIsOverlayOpen(true);
    setIsMenuOpen(false);
    // Set default tab to chat - you'd need to pass this to HelpOverlay
  };

  return (
    <>
      {/* Help Button */}
      <div className={`relative ${className}`}>
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
        >
          <HelpCircle className="w-4 h-4" />
          <span className="text-sm font-medium">Pomoc</span>
          <ChevronDown className={`w-4 h-4 transition-transform ${isMenuOpen ? 'rotate-180' : ''}`} />
        </button>

        {/* Quick Menu */}
        {isMenuOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsMenuOpen(false)}
            />

            {/* Menu */}
            <div className="absolute top-full right-0 mt-2 w-64 bg-white rounded-lg shadow-xl border z-50">
              <div className="p-2">
                {/* Quick Help */}
                <button
                  onClick={openQuickHelp}
                  className="w-full flex items-center space-x-3 px-3 py-2 text-left hover:bg-gray-50 rounded-md transition-colors"
                >
                  <Zap className="w-4 h-4 text-yellow-500" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900">Szybka pomoc</div>
                    <div className="text-xs text-gray-500">Kontekstowe wskazówki</div>
                  </div>
                </button>

                {/* Guided Tour */}
                <button
                  onClick={startTour}
                  className="w-full flex items-center space-x-3 px-3 py-2 text-left hover:bg-gray-50 rounded-md transition-colors"
                >
                  <BookOpen className="w-4 h-4 text-blue-500" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900">Przewodnik</div>
                    <div className="text-xs text-gray-500">Krok po kroku przez funkcje</div>
                  </div>
                </button>

                {/* Chat Support */}
                <button
                  onClick={openChat}
                  className="w-full flex items-center space-x-3 px-3 py-2 text-left hover:bg-gray-50 rounded-md transition-colors"
                >
                  <MessageCircle className="w-4 h-4 text-green-500" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900">Chat z AI</div>
                    <div className="text-xs text-gray-500">Zadaj pytanie asystentowi</div>
                  </div>
                </button>

                <div className="border-t my-2" />

                {/* Full Help Center */}
                <button
                  onClick={openHelp}
                  className="w-full flex items-center space-x-3 px-3 py-2 text-left hover:bg-gray-50 rounded-md transition-colors"
                >
                  <HelpCircle className="w-4 h-4 text-gray-500" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900">Centrum pomocy</div>
                    <div className="text-xs text-gray-500">Pełna baza wiedzy</div>
                  </div>
                </button>

                {/* Current Context Info */}
                <div className="border-t mt-2 pt-2">
                  <div className="px-3 py-2 text-xs text-gray-500">
                    <div>Strona: <span className="font-medium">{context.page}</span></div>
                    <div>Plan: <span className="font-medium">{context.subscription_plan}</span></div>
                    {onboardingStep < 5 && (
                      <div>Krok onboardingu: <span className="font-medium">{onboardingStep}/5</span></div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Help Overlay */}
      <HelpOverlay
        isOpen={isOverlayOpen}
        onClose={() => setIsOverlayOpen(false)}
        context={context}
        userId={userId}
      />

      {/* Guided Tour */}
      {activeTour && (
        <GuidedTour
          tour={activeTour}
          isActive={!!activeTour}
          onComplete={() => setActiveTour(null)}
          onSkip={() => setActiveTour(null)}
          userId={userId}
        />
      )}
    </>
  );
}

// Floating Help Button for always-visible access
export function FloatingHelpButton({ userId, subscriptionPlan, onboardingStep }: HelpButtonProps) {
  const [isMinimized, setIsMinimized] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  useEffect(() => {
    // Show tooltip for new users
    if (onboardingStep <= 2) {
      const timer = setTimeout(() => setShowTooltip(true), 3000);
      return () => clearTimeout(timer);
    }
  }, [onboardingStep]);

  return (
    <div className="fixed bottom-6 right-6 z-40">
      {/* Tooltip for new users */}
      {showTooltip && onboardingStep <= 2 && (
        <div className="absolute bottom-full right-0 mb-2 bg-white rounded-lg shadow-lg border p-3 max-w-xs">
          <div className="text-sm font-medium text-gray-900 mb-1">
            Potrzebujesz pomocy?
          </div>
          <div className="text-xs text-gray-600 mb-2">
            Kliknij tutaj, aby uzyskać wsparcie lub rozpocząć przewodnik po aplikacji.
          </div>
          <button
            onClick={() => setShowTooltip(false)}
            className="text-xs text-blue-600 hover:text-blue-700"
          >
            Rozumiem
          </button>
          {/* Arrow */}
          <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-white" />
        </div>
      )}

      {/* Floating Button */}
      {isMinimized ? (
        <button
          onClick={() => setIsMinimized(false)}
          className="w-12 h-12 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-all flex items-center justify-center hover:scale-105"
        >
          <HelpCircle className="w-5 h-5" />
        </button>
      ) : (
        <div className="bg-white rounded-lg shadow-lg border">
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm font-medium text-gray-900">Pomoc</div>
              <button
                onClick={() => setIsMinimized(true)}
                className="text-gray-400 hover:text-gray-600"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>

            <HelpButton
              userId={userId}
              subscriptionPlan={subscriptionPlan}
              onboardingStep={onboardingStep}
              className="w-full"
            />
          </div>
        </div>
      )}
    </div>
  );
}