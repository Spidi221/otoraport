'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle, HelpCircle, Target, CheckCircle, X, ArrowRight } from 'lucide-react';
import { HelpContext } from '@/lib/help-system';

interface ProactiveHelpSystemProps {
  context: HelpContext;
  userId: string;
  isVisible: boolean;
}

interface ProactiveHint {
  id: string;
  type: 'tip' | 'warning' | 'suggestion' | 'celebration';
  title: string;
  message: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  dismissible: boolean;
  priority: 'low' | 'medium' | 'high';
}

export function ProactiveHelpSystem({ context, isVisible }: ProactiveHelpSystemProps) {
  const [activeHints, setActiveHints] = useState<ProactiveHint[]>([]);
  const [dismissedHints, setDismissedHints] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (isVisible) {
      generateProactiveHints();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [context, isVisible]);

  const generateProactiveHints = async () => {
    const hints: ProactiveHint[] = [];

    // New user onboarding hints
    if (context.onboarding_step <= 2) {
      hints.push({
        id: 'welcome_hint',
        type: 'tip',
        title: 'Witamy w DevReporter! 👋',
        message: 'Rozpocznij od przesłania pierwszego pliku z danymi mieszkań. Pomożemy Ci krok po kroku.',
        action: {
          label: 'Rozpocznij przewodnik',
          onClick: () => startOnboardingTour()
        },
        dismissible: true,
        priority: 'high'
      });
    }

    // Upload encouragement for inactive users
    if (context.page === 'dashboard' && context.onboarding_step < 3) {
      hints.push({
        id: 'upload_encouragement',
        type: 'suggestion',
        title: 'Czas na pierwszy upload',
        message: 'Prześlij plik CSV lub Excel z danymi mieszkań, aby rozpocząć automatyczne raportowanie.',
        action: {
          label: 'Przejdź do uploadu',
          onClick: () => window.location.href = '/upload'
        },
        dismissible: true,
        priority: 'medium'
      });
    }

    // Ministry setup reminder
    if (context.subscription_plan !== 'basic' && context.page === 'dashboard') {
      hints.push({
        id: 'ministry_setup',
        type: 'warning',
        title: 'Skonfiguruj raportowanie do Ministerstwa',
        message: 'Pamiętaj o przesłaniu maila do dane.gov.pl z URL-ami do Twoich raportów.',
        action: {
          label: 'Zobacz instrukcje',
          onClick: () => showMinistryInstructions()
        },
        dismissible: true,
        priority: 'high'
      });
    }

    // Subscription upgrade hints
    if (context.subscription_plan === 'basic' && context.page === 'analytics') {
      hints.push({
        id: 'upgrade_analytics',
        type: 'suggestion',
        title: 'Odblokuj zaawansowane analityki',
        message: 'Plan Pro oferuje predykcje AI, optymalizację cen i prognozy sprzedaży.',
        action: {
          label: 'Zobacz plany',
          onClick: () => window.location.href = '/pricing'
        },
        dismissible: true,
        priority: 'medium'
      });
    }

    // Contextual help based on current page
    if (context.page === 'upload' && context.user_action === 'viewing') {
      hints.push({
        id: 'upload_help',
        type: 'tip',
        title: 'Wskazówka dotycząca uploadu',
        message: 'System automatycznie rozpozna kolumny w Twoim pliku. Obsługujemy formaty CSV i Excel.',
        dismissible: true,
        priority: 'low'
      });
    }

    // Celebration hints
    if (context.user_action === 'upload_completed') {
      hints.push({
        id: 'upload_success',
        type: 'celebration',
        title: 'Świetnie! 🎉',
        message: 'Dane zostały przesłane pomyślnie. XML i MD5 są już dostępne dla harvestera.',
        dismissible: true,
        priority: 'low'
      });
    }

    // Filter out dismissed hints
    const newHints = hints.filter(hint => !dismissedHints.has(hint.id));

    // Sort by priority
    newHints.sort((a, b) => {
      const priorities = { high: 3, medium: 2, low: 1 };
      return priorities[b.priority] - priorities[a.priority];
    });

    setActiveHints(newHints.slice(0, 2)); // Show max 2 hints at once
  };

  const startOnboardingTour = () => {
    // In production, this would trigger the guided tour
    console.log('Starting onboarding tour');
  };

  const showMinistryInstructions = () => {
    window.open('/help/ministry-setup', '_blank');
  };

  const dismissHint = (hintId: string) => {
    setDismissedHints(prev => new Set([...prev, hintId]));
    setActiveHints(prev => prev.filter(hint => hint.id !== hintId));

    // Save dismissed hint to localStorage
    const dismissed = JSON.parse(localStorage.getItem('dismissedHints') || '[]');
    localStorage.setItem('dismissedHints', JSON.stringify([...dismissed, hintId]));
  };

  const getHintIcon = (type: string) => {
    switch (type) {
      case 'warning': return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'suggestion': return <Target className="w-5 h-5 text-blue-500" />;
      case 'celebration': return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'tip':
      default: return <HelpCircle className="w-5 h-5 text-gray-500" />;
    }
  };

  const getHintStyle = (type: string) => {
    switch (type) {
      case 'warning': return 'border-yellow-200 bg-yellow-50';
      case 'suggestion': return 'border-blue-200 bg-blue-50';
      case 'celebration': return 'border-green-200 bg-green-50';
      case 'tip':
      default: return 'border-gray-200 bg-gray-50';
    }
  };

  // Load dismissed hints from localStorage on mount
  useEffect(() => {
    const dismissed = JSON.parse(localStorage.getItem('dismissedHints') || '[]');
    setDismissedHints(new Set(dismissed));
  }, []);

  if (!isVisible || activeHints.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-20 right-4 z-30 space-y-3 w-80">
      {activeHints.map((hint) => (
        <div
          key={hint.id}
          className={`border rounded-lg p-4 shadow-lg animate-slide-in-right ${getHintStyle(hint.type)}`}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3 flex-1">
              {getHintIcon(hint.type)}
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-medium text-gray-900 mb-1">
                  {hint.title}
                </h4>
                <p className="text-sm text-gray-600 mb-3">
                  {hint.message}
                </p>

                {hint.action && (
                  <button
                    onClick={hint.action.onClick}
                    className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-700"
                  >
                    {hint.action.label}
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </button>
                )}
              </div>
            </div>

            {hint.dismissible && (
              <button
                onClick={() => dismissHint(hint.id)}
                className="p-1 hover:bg-gray-200 rounded-full"
              >
                <X className="w-4 h-4 text-gray-400" />
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// Smart tooltip component for contextual help
interface SmartTooltipProps {
  children: React.ReactNode;
  content: string;
  helpResourceId?: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  trigger?: 'hover' | 'click' | 'focus';
  delay?: number;
}

export function SmartTooltip({
  children,
  content,
  helpResourceId,
  position = 'top',
  trigger = 'hover',
  delay = 500
}: SmartTooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);

  const showTooltip = () => {
    if (timeoutId) clearTimeout(timeoutId);
    const id = setTimeout(() => setIsVisible(true), delay);
    setTimeoutId(id);
  };

  const hideTooltip = () => {
    if (timeoutId) clearTimeout(timeoutId);
    setIsVisible(false);
  };

  const handleClick = () => {
    if (trigger === 'click') {
      setIsVisible(!isVisible);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (trigger === 'focus' && (e.key === 'Enter' || e.key === ' ')) {
      setIsVisible(!isVisible);
    }
  };

  const tooltipProps = {
    ...(trigger === 'hover' && {
      onMouseEnter: showTooltip,
      onMouseLeave: hideTooltip
    }),
    ...(trigger === 'click' && {
      onClick: handleClick
    }),
    ...(trigger === 'focus' && {
      onFocus: showTooltip,
      onBlur: hideTooltip,
      onKeyDown: handleKeyDown,
      tabIndex: 0
    })
  };

  return (
    <div className="relative inline-block" {...tooltipProps}>
      {children}

      {isVisible && (
        <div
          className={`absolute z-50 px-3 py-2 text-sm text-white bg-gray-900 rounded-lg shadow-lg max-w-xs ${
            position === 'top' ? 'bottom-full mb-2 left-1/2 transform -translate-x-1/2' :
            position === 'bottom' ? 'top-full mt-2 left-1/2 transform -translate-x-1/2' :
            position === 'left' ? 'right-full mr-2 top-1/2 transform -translate-y-1/2' :
            'left-full ml-2 top-1/2 transform -translate-y-1/2'
          }`}
        >
          {content}

          {/* Arrow */}
          <div
            className={`absolute w-0 h-0 ${
              position === 'top' ? 'top-full left-1/2 transform -translate-x-1/2 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-gray-900' :
              position === 'bottom' ? 'bottom-full left-1/2 transform -translate-x-1/2 border-l-4 border-r-4 border-b-4 border-l-transparent border-r-transparent border-b-gray-900' :
              position === 'left' ? 'left-full top-1/2 transform -translate-y-1/2 border-t-4 border-b-4 border-l-4 border-t-transparent border-b-transparent border-l-gray-900' :
              'right-full top-1/2 transform -translate-y-1/2 border-t-4 border-b-4 border-r-4 border-t-transparent border-b-transparent border-r-gray-900'
            }`}
          />

          {helpResourceId && (
            <div className="mt-2 pt-2 border-t border-gray-700">
              <button
                onClick={() => window.open(`/help/article/${helpResourceId}`, '_blank')}
                className="text-xs text-blue-300 hover:text-blue-200"
              >
                Więcej informacji →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}