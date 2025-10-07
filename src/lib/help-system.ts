'use client';

// Types for the help system

export interface HelpContext {
  page: string;
  section: string;
  user_action: string;
  subscription_plan: string;
  onboarding_step: number;
  feature_flags: string[];
}

export interface TourStep {
  id: string;
  title: string;
  description: string;
  target: string;
  position: 'top' | 'bottom' | 'left' | 'right' | 'center';
  action_required: boolean;
  action_type?: 'click' | 'input' | 'upload';
  next_trigger?: string;
}

export interface GuidedTour {
  id: string;
  name: string;
  description: string;
  steps: TourStep[];
  estimated_duration: number;
  completion_reward?: string;
}

export interface HelpResource {
  id: string;
  type: 'article' | 'video' | 'guide' | 'faq';
  title: string;
  description: string;
  url?: string;
  content?: string;
  tags: string[];
  relevance_score: number;
}

export interface ChatbotResponse {
  message: string;
  suggested_actions?: Array<{
    label: string;
    action: string;
  }>;
  related_resources?: HelpResource[];
}

// Main help system class
export class InAppHelpSystem {
  private static baseUrl = '/api/help';

  /**
   * Get contextual help resources based on the current context
   */
  static async getContextualHelp(context: HelpContext): Promise<HelpResource[]> {
    try {
      const response = await fetch(`${this.baseUrl}/contextual`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(context),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch contextual help');
      }

      const data = await response.json();
      return data.resources || [];
    } catch (error) {
      console.error('Error fetching contextual help:', error);
      // Return default help resources as fallback
      return this.getDefaultHelpResources(context);
    }
  }

  /**
   * Get available guided tour for the current context
   */
  static async getGuidedTour(context: HelpContext): Promise<GuidedTour | null> {
    try {
      const response = await fetch(`${this.baseUrl}/tour`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(context),
      });

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      return data.tour || null;
    } catch (error) {
      console.error('Error fetching guided tour:', error);
      // Return default tour as fallback
      return this.getDefaultTour(context);
    }
  }

  /**
   * Process chatbot query and return response
   */
  static async processChatbotQuery(query: string, context: HelpContext): Promise<ChatbotResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/chatbot`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query, context }),
      });

      if (!response.ok) {
        throw new Error('Failed to process chatbot query');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error processing chatbot query:', error);
      // Return default response as fallback
      return {
        message: 'Przepraszam, nie mogę teraz pomóc. Prosimy spróbować ponownie później lub skontaktować się z naszym zespołem wsparcia.',
        suggested_actions: [
          {
            label: 'Skontaktuj się z pomocą',
            action: 'contact_support'
          },
          {
            label: 'Zobacz FAQ',
            action: 'view_faq'
          }
        ]
      };
    }
  }

  /**
   * Track help system usage for analytics
   */
  static async trackUsage(event: string, context: HelpContext, metadata?: Record<string, any>): Promise<void> {
    try {
      await fetch(`${this.baseUrl}/track`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          event,
          context,
          metadata,
          timestamp: new Date().toISOString()
        }),
      });
    } catch (error) {
      // Silently fail tracking to not disrupt user experience
      console.debug('Failed to track help system usage:', error);
    }
  }

  /**
   * Get default help resources as fallback
   */
  private static getDefaultHelpResources(context: HelpContext): HelpResource[] {
    const resources: HelpResource[] = [
      {
        id: 'getting-started',
        type: 'guide',
        title: 'Jak zacząć z OTORAPORT',
        description: 'Kompletny przewodnik po systemie OTORAPORT',
        url: '/help/getting-started',
        tags: ['start', 'tutorial', 'podstawy'],
        relevance_score: 0.9
      },
      {
        id: 'csv-upload',
        type: 'article',
        title: 'Przesyłanie plików CSV',
        description: 'Dowiedz się, jak przygotować i przesłać pliki CSV',
        url: '/help/csv-upload',
        tags: ['csv', 'upload', 'import'],
        relevance_score: 0.8
      },
      {
        id: 'faq',
        type: 'faq',
        title: 'Często zadawane pytania',
        description: 'Odpowiedzi na najczęściej zadawane pytania',
        url: '/help/faq',
        tags: ['faq', 'pomoc', 'pytania'],
        relevance_score: 0.7
      }
    ];

    // Filter and sort by context relevance
    if (context.page === 'upload') {
      return resources.filter(r => r.tags.includes('upload') || r.tags.includes('csv'))
        .sort((a, b) => b.relevance_score - a.relevance_score);
    }

    return resources.sort((a, b) => b.relevance_score - a.relevance_score);
  }

  /**
   * Get default tour as fallback
   */
  private static getDefaultTour(context: HelpContext): GuidedTour | null {
    if (context.onboarding_step === 0 && context.page === 'dashboard') {
      return {
        id: 'onboarding-tour',
        name: 'Pierwsze kroki w OTORAPORT',
        description: 'Poznaj podstawowe funkcje systemu',
        estimated_duration: 5,
        steps: [
          {
            id: 'welcome',
            title: 'Witaj w OTORAPORT!',
            description: 'System automatyzacji compliance dla deweloperów nieruchomości',
            target: 'body',
            position: 'center',
            action_required: false
          },
          {
            id: 'upload-section',
            title: 'Przesyłanie danych',
            description: 'Tutaj możesz przesłać swoje pliki CSV z danymi nieruchomości',
            target: '[data-tour="upload-section"]',
            position: 'bottom',
            action_required: false
          },
          {
            id: 'properties-list',
            title: 'Lista nieruchomości',
            description: 'Tu znajdziesz wszystkie przesłane nieruchomości',
            target: '[data-tour="properties-list"]',
            position: 'top',
            action_required: false
          },
          {
            id: 'export-data',
            title: 'Eksport danych',
            description: 'Możesz wyeksportować dane w formatach wymaganych przez ministerstwo',
            target: '[data-tour="export-button"]',
            position: 'left',
            action_required: false
          },
          {
            id: 'complete',
            title: 'Gotowe!',
            description: 'Teraz możesz zacząć korzystać z systemu. Powodzenia!',
            target: 'body',
            position: 'center',
            action_required: false
          }
        ],
        completion_reward: 'Gratulacje! Ukończyłeś przewodnik wprowadzający.'
      };
    }

    return null;
  }

  /**
   * Start a guided tour
   */
  static async startTour(tourId: string, userId: string): Promise<void> {
    await this.trackUsage('tour_started', {
      page: 'tour',
      section: tourId,
      user_action: 'start_tour',
      subscription_plan: 'unknown',
      onboarding_step: 0,
      feature_flags: []
    }, { tourId, userId });
  }

  /**
   * Complete a guided tour
   */
  static async completeTour(tourId: string, userId: string, completedSteps: number): Promise<void> {
    await this.trackUsage('tour_completed', {
      page: 'tour',
      section: tourId,
      user_action: 'complete_tour',
      subscription_plan: 'unknown',
      onboarding_step: 0,
      feature_flags: []
    }, { tourId, userId, completedSteps });
  }
}