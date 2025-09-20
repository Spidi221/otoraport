/**
 * In-app Help & Proactive Support System
 * Comprehensive help system with contextual assistance, guided tours, and AI chatbot
 */

export interface HelpResource {
  id: string;
  title: string;
  content: string;
  type: 'article' | 'video' | 'interactive' | 'faq';
  category: string;
  tags: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimated_read_time: number; // minutes
  created_at: string;
  updated_at: string;
  view_count: number;
  helpful_votes: number;
  not_helpful_votes: number;
}

export interface GuidedTour {
  id: string;
  name: string;
  target_page: string;
  steps: TourStep[];
  trigger_conditions: TriggerCondition[];
  completion_rate: number;
  is_active: boolean;
}

export interface TourStep {
  id: string;
  title: string;
  description: string;
  target_element: string; // CSS selector
  position: 'top' | 'bottom' | 'left' | 'right' | 'center';
  action_required: boolean;
  action_type?: 'click' | 'input' | 'upload' | 'none';
  next_condition?: string;
}

export interface TriggerCondition {
  type: 'page_visit' | 'time_on_page' | 'user_action' | 'feature_flag' | 'subscription_plan';
  value: string;
  operator: 'equals' | 'contains' | 'greater_than' | 'less_than';
}

export interface HelpContext {
  page: string;
  section: string;
  user_action: string;
  subscription_plan: string;
  onboarding_step: number;
  feature_flags: string[];
}

export interface SupportTicket {
  id: string;
  user_id: string;
  subject: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  category: string;
  assigned_to?: string;
  created_at: string;
  updated_at: string;
  resolved_at?: string;
  satisfaction_rating?: number;
  feedback?: string;
}

export interface ChatbotResponse {
  message: string;
  confidence: number;
  suggested_actions: SuggestedAction[];
  escalate_to_human: boolean;
  help_resources: HelpResource[];
}

export interface SuggestedAction {
  title: string;
  description: string;
  action_type: 'link' | 'tour' | 'video' | 'contact_support';
  action_data: any;
}

export class InAppHelpSystem {
  /**
   * Get contextual help based on current user context
   */
  static async getContextualHelp(context: HelpContext): Promise<HelpResource[]> {
    const relevantHelp = await this.findRelevantResources(context);
    return this.rankByRelevance(relevantHelp, context);
  }

  /**
   * Find help resources relevant to current context
   */
  static async findRelevantResources(context: HelpContext): Promise<HelpResource[]> {
    const pageSpecificHelp = HELP_RESOURCES.filter(resource =>
      resource.tags.includes(context.page) ||
      resource.category === context.section
    );

    const actionSpecificHelp = HELP_RESOURCES.filter(resource =>
      resource.tags.includes(context.user_action) ||
      resource.content.toLowerCase().includes(context.user_action.toLowerCase())
    );

    const planSpecificHelp = HELP_RESOURCES.filter(resource =>
      resource.tags.includes(context.subscription_plan) ||
      resource.tags.includes('all_plans')
    );

    // Combine and deduplicate
    const allRelevant = [...pageSpecificHelp, ...actionSpecificHelp, ...planSpecificHelp];
    return Array.from(new Map(allRelevant.map(item => [item.id, item])).values());
  }

  /**
   * Rank help resources by relevance score
   */
  static rankByRelevance(resources: HelpResource[], context: HelpContext): HelpResource[] {
    return resources
      .map(resource => ({
        ...resource,
        relevance_score: this.calculateRelevanceScore(resource, context)
      }))
      .sort((a, b) => b.relevance_score - a.relevance_score)
      .slice(0, 5); // Top 5 most relevant
  }

  /**
   * Calculate relevance score for a help resource
   */
  static calculateRelevanceScore(resource: HelpResource, context: HelpContext): number {
    let score = 0;

    // Page match bonus
    if (resource.tags.includes(context.page)) score += 10;

    // Section match bonus
    if (resource.category === context.section) score += 8;

    // Action match bonus
    if (resource.tags.includes(context.user_action)) score += 6;

    // Plan relevance
    if (resource.tags.includes(context.subscription_plan)) score += 4;

    // Popularity bonus (helpful votes)
    const helpfulnessRatio = resource.helpful_votes / Math.max(resource.helpful_votes + resource.not_helpful_votes, 1);
    score += helpfulnessRatio * 5;

    // Recency bonus (newer content)
    const daysSinceUpdate = (Date.now() - new Date(resource.updated_at).getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceUpdate < 30) score += 2;

    // Difficulty match (prefer beginner for new users)
    if (context.onboarding_step < 5 && resource.difficulty === 'beginner') score += 3;

    return score;
  }

  /**
   * Get appropriate guided tour for current context
   */
  static async getGuidedTour(context: HelpContext): Promise<GuidedTour | null> {
    const availableTours = GUIDED_TOURS.filter(tour =>
      tour.is_active &&
      tour.target_page === context.page &&
      this.meetsTriggerConditions(tour.trigger_conditions, context)
    );

    if (availableTours.length === 0) return null;

    // Return tour with highest completion rate
    return availableTours.sort((a, b) => b.completion_rate - a.completion_rate)[0];
  }

  /**
   * Check if user meets trigger conditions for a tour
   */
  static meetsTriggerConditions(conditions: TriggerCondition[], context: HelpContext): boolean {
    return conditions.every(condition => {
      switch (condition.type) {
        case 'page_visit':
          return context.page === condition.value;
        case 'subscription_plan':
          return this.evaluateCondition(context.subscription_plan, condition);
        case 'feature_flag':
          return context.feature_flags.includes(condition.value);
        default:
          return true;
      }
    });
  }

  /**
   * Evaluate condition based on operator
   */
  static evaluateCondition(actual: string | number, condition: TriggerCondition): boolean {
    switch (condition.operator) {
      case 'equals':
        return actual === condition.value;
      case 'contains':
        return String(actual).includes(condition.value);
      case 'greater_than':
        return Number(actual) > Number(condition.value);
      case 'less_than':
        return Number(actual) < Number(condition.value);
      default:
        return false;
    }
  }

  /**
   * Process chatbot query and return intelligent response
   */
  static async processChatbotQuery(query: string, context: HelpContext): Promise<ChatbotResponse> {
    // Simple keyword matching (in production, use AI/NLP service)
    const lowerQuery = query.toLowerCase();

    let confidence = 0;
    let message = '';
    let suggestedActions: SuggestedAction[] = [];
    let escalateToHuman = false;
    let helpResources: HelpResource[] = [];

    // Common queries and responses
    if (lowerQuery.includes('upload') || lowerQuery.includes('csv') || lowerQuery.includes('excel')) {
      confidence = 0.9;
      message = 'Pomogę Ci z przesyłaniem danych. Możesz przesłać plik CSV lub Excel z danymi mieszkań. System automatycznie rozpozna kolumny i zweryfikuje dane.';

      suggestedActions = [
        {
          title: 'Obejrzyj tutorial przesyłania',
          description: 'Krok po kroku jak przesłać dane',
          action_type: 'video',
          action_data: { video_id: 'upload_tutorial' }
        },
        {
          title: 'Rozpocznij przewodnik',
          description: 'Interaktywny przewodnik przesyłania',
          action_type: 'tour',
          action_data: { tour_id: 'upload_guide' }
        }
      ];

      helpResources = await this.findResourcesByKeywords(['upload', 'csv', 'excel']);
    }

    else if (lowerQuery.includes('ministry') || lowerQuery.includes('ministerstwo') || lowerQuery.includes('raport')) {
      confidence = 0.85;
      message = 'Rozumiem, że masz pytanie o raportowanie do Ministerstwa. System automatycznie generuje raporty zgodne z wymaganiami. Czy chodzi o konfigurację harvestera?';

      suggestedActions = [
        {
          title: 'Przewodnik Ministry Setup',
          description: 'Jak skonfigurować raportowanie',
          action_type: 'tour',
          action_data: { tour_id: 'ministry_setup' }
        },
        {
          title: 'Sprawdź status raportowania',
          description: 'Przejdź do panelu statusu',
          action_type: 'link',
          action_data: { url: '/dashboard/reporting' }
        }
      ];

      helpResources = await this.findResourcesByKeywords(['ministry', 'reporting', 'harvester']);
    }

    else if (lowerQuery.includes('subscription') || lowerQuery.includes('plan') || lowerQuery.includes('payment')) {
      confidence = 0.8;
      message = 'Masz pytanie o subskrypcję lub płatności. Mogę pomóc z zarządzaniem planem, fakturowaniem lub aktualizacją subskrypcji.';

      suggestedActions = [
        {
          title: 'Zarządzaj subskrypcją',
          description: 'Zmień plan lub metodę płatności',
          action_type: 'link',
          action_data: { url: '/dashboard/subscription' }
        },
        {
          title: 'Porównaj plany',
          description: 'Zobacz funkcje dostępne w planach',
          action_type: 'link',
          action_data: { url: '/pricing' }
        }
      ];

      helpResources = await this.findResourcesByKeywords(['subscription', 'billing', 'payment']);
    }

    else if (lowerQuery.includes('error') || lowerQuery.includes('problem') || lowerQuery.includes('not working')) {
      confidence = 0.7;
      message = 'Widzę, że napotkałeś problem. Opowiedz mi więcej o błędzie, a postaram się pomóc lub przekażę sprawę do zespołu wsparcia.';
      escalateToHuman = true;

      suggestedActions = [
        {
          title: 'Zgłoś problem',
          description: 'Wyślij szczegóły do wsparcia',
          action_type: 'contact_support',
          action_data: { category: 'technical_issue' }
        },
        {
          title: 'Sprawdź status systemu',
          description: 'Zobacz czy są znane problemy',
          action_type: 'link',
          action_data: { url: '/status' }
        }
      ];

      helpResources = await this.findResourcesByKeywords(['troubleshooting', 'errors', 'problems']);
    }

    else {
      confidence = 0.3;
      message = 'Nie jestem pewien jak najlepiej Ci pomóc. Możesz przeszukać bazę wiedzy lub skontaktować się z naszym zespołem wsparcia.';
      escalateToHuman = true;

      suggestedActions = [
        {
          title: 'Przeszukaj bazę wiedzy',
          description: 'Znajdź odpowiedzi w artykułach',
          action_type: 'link',
          action_data: { url: '/help/search' }
        },
        {
          title: 'Kontakt z wsparciem',
          description: 'Porozmawiaj z ekspertem',
          action_type: 'contact_support',
          action_data: { category: 'general_inquiry' }
        }
      ];

      // Get general help resources for current page
      helpResources = await this.getContextualHelp(context);
    }

    return {
      message,
      confidence,
      suggested_actions: suggestedActions,
      escalate_to_human: escalateToHuman,
      help_resources: helpResources.slice(0, 3) // Top 3 resources
    };
  }

  /**
   * Find help resources by keywords
   */
  static async findResourcesByKeywords(keywords: string[]): Promise<HelpResource[]> {
    return HELP_RESOURCES.filter(resource =>
      keywords.some(keyword =>
        resource.title.toLowerCase().includes(keyword) ||
        resource.content.toLowerCase().includes(keyword) ||
        resource.tags.some(tag => tag.toLowerCase().includes(keyword))
      )
    ).slice(0, 5);
  }

  /**
   * Create support ticket from user query
   */
  static async createSupportTicket(
    userId: string,
    subject: string,
    description: string,
    context: HelpContext,
    priority: 'low' | 'medium' | 'high' | 'urgent' = 'medium'
  ): Promise<SupportTicket> {
    const ticket: SupportTicket = {
      id: `ticket_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      user_id: userId,
      subject,
      description: `${description}\n\nContext:\n- Page: ${context.page}\n- Section: ${context.section}\n- Plan: ${context.subscription_plan}\n- Onboarding Step: ${context.onboarding_step}`,
      priority,
      status: 'open',
      category: this.categorizeTicket(subject, description),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // In production, save to database and notify support team
    console.log('Support ticket created:', ticket);

    return ticket;
  }

  /**
   * Automatically categorize support ticket
   */
  static categorizeTicket(subject: string, description: string): string {
    const text = `${subject} ${description}`.toLowerCase();

    if (text.includes('upload') || text.includes('csv') || text.includes('excel')) return 'data_upload';
    if (text.includes('ministry') || text.includes('reporting') || text.includes('harvester')) return 'ministry_reporting';
    if (text.includes('payment') || text.includes('billing') || text.includes('subscription')) return 'billing';
    if (text.includes('error') || text.includes('bug') || text.includes('not working')) return 'technical_issue';
    if (text.includes('feature') || text.includes('enhancement')) return 'feature_request';

    return 'general_inquiry';
  }

  /**
   * Track help resource usage
   */
  static async trackResourceUsage(resourceId: string, userId: string, action: 'view' | 'helpful' | 'not_helpful'): Promise<void> {
    // In production, save to analytics database
    console.log(`Help resource ${resourceId} - ${action} by user ${userId}`);
  }

  /**
   * Get help statistics for analytics
   */
  static async getHelpStatistics(): Promise<any> {
    return {
      total_resources: HELP_RESOURCES.length,
      total_tours: GUIDED_TOURS.length,
      most_viewed_resources: HELP_RESOURCES
        .sort((a, b) => b.view_count - a.view_count)
        .slice(0, 5),
      most_helpful_resources: HELP_RESOURCES
        .sort((a, b) => (b.helpful_votes / Math.max(b.helpful_votes + b.not_helpful_votes, 1)) -
                       (a.helpful_votes / Math.max(a.helpful_votes + a.not_helpful_votes, 1)))
        .slice(0, 5),
      tour_completion_rates: GUIDED_TOURS.map(tour => ({
        name: tour.name,
        completion_rate: tour.completion_rate
      }))
    };
  }
}

// Sample Help Resources Database
const HELP_RESOURCES: HelpResource[] = [
  {
    id: 'upload_csv_guide',
    title: 'Jak przesłać dane mieszkań (CSV/Excel)',
    content: 'Przewodnik krok po kroku jak przesłać dane mieszkań w formacie CSV lub Excel. System automatycznie rozpozna kolumny i przeprowadzi walidację.',
    type: 'article',
    category: 'data_upload',
    tags: ['upload', 'csv', 'excel', 'data', 'dashboard', 'all_plans'],
    difficulty: 'beginner',
    estimated_read_time: 3,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
    view_count: 1247,
    helpful_votes: 89,
    not_helpful_votes: 3
  },
  {
    id: 'ministry_setup_complete',
    title: 'Kompletna konfiguracja raportowania do Ministerstwa',
    content: 'Jak skonfigurować automatyczne raportowanie do dane.gov.pl, założyć profil dostawcy i uruchomić harvester.',
    type: 'article',
    category: 'ministry_reporting',
    tags: ['ministry', 'reporting', 'harvester', 'dane.gov.pl', 'all_plans'],
    difficulty: 'intermediate',
    estimated_read_time: 8,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
    view_count: 892,
    helpful_votes: 76,
    not_helpful_votes: 1
  },
  {
    id: 'subscription_management',
    title: 'Zarządzanie subskrypcją i planami',
    content: 'Jak zmienić plan subskrypcji, zaktualizować metodę płatności i zarządzać fakturowaniem.',
    type: 'article',
    category: 'billing',
    tags: ['subscription', 'billing', 'payment', 'plans', 'settings'],
    difficulty: 'beginner',
    estimated_read_time: 2,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
    view_count: 654,
    helpful_votes: 45,
    not_helpful_votes: 2
  },
  {
    id: 'analytics_dashboard_guide',
    title: 'Korzystanie z Advanced Analytics',
    content: 'Przewodnik po zaawansowanych analitykach dostępnych w planach Pro i Enterprise.',
    type: 'interactive',
    category: 'analytics',
    tags: ['analytics', 'dashboard', 'reports', 'pro', 'enterprise'],
    difficulty: 'intermediate',
    estimated_read_time: 5,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
    view_count: 423,
    helpful_votes: 32,
    not_helpful_votes: 1
  },
  {
    id: 'troubleshooting_common_issues',
    title: 'Rozwiązywanie najczęstszych problemów',
    content: 'Lista najczęstszych problemów i ich rozwiązań: błędy przesyłania, problemy z logowaniem, błędy walidacji danych.',
    type: 'faq',
    category: 'troubleshooting',
    tags: ['troubleshooting', 'errors', 'problems', 'support', 'all_plans'],
    difficulty: 'beginner',
    estimated_read_time: 4,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
    view_count: 789,
    helpful_votes: 67,
    not_helpful_votes: 5
  }
];

// Sample Guided Tours Database
const GUIDED_TOURS: GuidedTour[] = [
  {
    id: 'onboarding_tour',
    name: 'Pierwszy przewodnik po aplikacji',
    target_page: 'dashboard',
    completion_rate: 0.78,
    is_active: true,
    trigger_conditions: [
      { type: 'page_visit', value: 'dashboard', operator: 'equals' },
      { type: 'user_action', value: 'first_login', operator: 'equals' }
    ],
    steps: [
      {
        id: 'step_1',
        title: 'Witamy w DevReporter!',
        description: 'To jest Twój główny panel kontrolny. Stąd zarządzasz wszystkimi raportami.',
        target_element: '.dashboard-header',
        position: 'bottom',
        action_required: false
      },
      {
        id: 'step_2',
        title: 'Przesyłanie danych',
        description: 'Kliknij tutaj, aby przesłać pierwszy plik z danymi mieszkań.',
        target_element: '.upload-widget',
        position: 'top',
        action_required: true,
        action_type: 'click'
      },
      {
        id: 'step_3',
        title: 'Status raportowania',
        description: 'Tutaj sprawdzisz status automatycznego raportowania do Ministerstwa.',
        target_element: '.status-cards',
        position: 'left',
        action_required: false
      }
    ]
  },
  {
    id: 'upload_guide',
    name: 'Przewodnik przesyłania danych',
    target_page: 'upload',
    completion_rate: 0.85,
    is_active: true,
    trigger_conditions: [
      { type: 'page_visit', value: 'upload', operator: 'equals' }
    ],
    steps: [
      {
        id: 'upload_step_1',
        title: 'Wybór pliku',
        description: 'Przeciągnij plik CSV lub Excel lub kliknij aby wybrać z dysku.',
        target_element: '.file-upload-area',
        position: 'top',
        action_required: true,
        action_type: 'upload'
      },
      {
        id: 'upload_step_2',
        title: 'Weryfikacja danych',
        description: 'System automatycznie sprawdzi format i pokaże podgląd danych.',
        target_element: '.data-preview',
        position: 'bottom',
        action_required: false
      }
    ]
  }
];

export { HELP_RESOURCES, GUIDED_TOURS };