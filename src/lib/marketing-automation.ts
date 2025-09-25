/**
 * Marketing Automation Engine
 * Comprehensive system for lead nurturing, email campaigns, and conversion tracking
 */

export interface MarketingContact {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  company_name?: string;
  phone?: string;
  lead_source: 'website' | 'referral' | 'social' | 'paid' | 'organic' | 'direct';
  lead_status: 'new' | 'qualified' | 'nurturing' | 'hot' | 'cold' | 'converted' | 'unsubscribed';
  subscription_interest: 'basic' | 'pro' | 'enterprise' | 'unknown';
  properties_count?: number;
  estimated_revenue: number;
  lifecycle_stage: 'visitor' | 'lead' | 'mql' | 'sql' | 'customer' | 'evangelist';
  tags: string[];
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  last_activity_at: string;
  created_at: string;
  updated_at: string;
}

export interface EmailCampaign {
  id: string;
  name: string;
  type: 'onboarding' | 'nurture' | 'promotional' | 'retention' | 'reactivation';
  status: 'draft' | 'active' | 'paused' | 'completed' | 'archived';
  target_audience: AudienceSegment;
  email_sequence: EmailTemplate[];
  trigger_conditions: TriggerCondition[];
  performance_metrics: CampaignMetrics;
  created_by: string;
  created_at: string;
  activated_at?: string;
  paused_at?: string;
}

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  preheader?: string;
  html_content: string;
  text_content?: string;
  delay_days: number;
  send_time: string; // HH:MM format
  personalization_tags: string[];
  cta_buttons: CTAButton[];
  a_b_test?: ABTestConfig;
}

export interface CTAButton {
  text: string;
  url: string;
  tracking_id: string;
  primary: boolean;
  style?: 'primary' | 'secondary' | 'outline' | 'text';
}

export interface ABTestConfig {
  enabled: boolean;
  variant_b_subject?: string;
  variant_b_content?: string;
  split_percentage: number; // 0-100
  test_metric: 'open_rate' | 'click_rate' | 'conversion_rate';
}

export interface AudienceSegment {
  id: string;
  name: string;
  criteria: SegmentCriteria[];
  estimated_size: number;
  dynamic: boolean; // Auto-update based on criteria
  created_at: string;
  updated_at: string;
}

export interface SegmentCriteria {
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'greater_than' | 'less_than' | 'in' | 'not_in';
  value: any;
  logical_operator?: 'AND' | 'OR';
}

export interface TriggerCondition {
  type: 'user_action' | 'time_delay' | 'date' | 'behavior' | 'attribute_change';
  event: string;
  value?: any;
  delay_minutes?: number;
}

export interface EmailDelivery {
  id: string;
  contact_id: string;
  campaign_id: string;
  template_id: string;
  status: 'queued' | 'sent' | 'delivered' | 'opened' | 'clicked' | 'bounced' | 'failed' | 'unsubscribed';
  subject: string;
  scheduled_at: string;
  sent_at?: string;
  opened_at?: string;
  clicked_at?: string;
  bounced_at?: string;
  error_message?: string;
  tracking_data: EmailTrackingData;
}

export interface EmailTrackingData {
  opens_count: number;
  unique_opens: number;
  clicks_count: number;
  unique_clicks: number;
  cta_clicks: Record<string, number>;
  user_agent?: string;
  ip_address?: string;
  location?: {
    country: string;
    city?: string;
  };
}

export interface CampaignMetrics {
  total_sent: number;
  total_delivered: number;
  total_opened: number;
  total_clicked: number;
  total_bounced: number;
  total_unsubscribed: number;
  total_conversions: number;

  delivery_rate: number;
  open_rate: number;
  click_rate: number;
  bounce_rate: number;
  unsubscribe_rate: number;
  conversion_rate: number;

  revenue_attributed: number;
  cost_per_conversion: number;
  roi: number;
}

export interface MarketingAutomation {
  id: string;
  name: string;
  description: string;
  trigger_type: 'form_submission' | 'page_visit' | 'email_action' | 'date' | 'behavior' | 'attribute_change';
  trigger_config: any;
  workflow_steps: AutomationStep[];
  is_active: boolean;
  performance: AutomationMetrics;
  created_at: string;
  updated_at: string;
}

export interface AutomationStep {
  id: string;
  type: 'email' | 'sms' | 'wait' | 'condition' | 'tag' | 'webhook' | 'score_change';
  config: any;
  delay_minutes?: number;
  conditions?: SegmentCriteria[];
}

export interface AutomationMetrics {
  total_entered: number;
  total_completed: number;
  total_active: number;
  completion_rate: number;
  avg_completion_time_hours: number;
  conversions: number;
  conversion_rate: number;
}

export interface LeadScoringRule {
  id: string;
  name: string;
  criteria: SegmentCriteria;
  score_change: number; // Can be negative for penalties
  decay_days?: number; // Score decreases over time
  max_score?: number; // Maximum score from this rule
  is_active: boolean;
}

export interface ContactScore {
  contact_id: string;
  total_score: number;
  demographic_score: number;
  behavioral_score: number;
  engagement_score: number;
  score_history: ScoreEvent[];
  last_updated: string;
}

export interface ScoreEvent {
  timestamp: string;
  rule_id: string;
  score_change: number;
  reason: string;
  total_score_after: number;
}

export class MarketingAutomationEngine {

  /**
   * Create and segment contacts for targeted marketing
   */
  static async createContact(contactData: Partial<MarketingContact>): Promise<MarketingContact> {
    const contact: MarketingContact = {
      id: `contact_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      email: contactData.email!,
      first_name: contactData.first_name,
      last_name: contactData.last_name,
      company_name: contactData.company_name,
      phone: contactData.phone,
      lead_source: contactData.lead_source || 'direct',
      lead_status: 'new',
      subscription_interest: contactData.subscription_interest || 'unknown',
      properties_count: contactData.properties_count || 0,
      estimated_revenue: this.calculateEstimatedRevenue(contactData.subscription_interest, contactData.properties_count),
      lifecycle_stage: 'visitor',
      tags: contactData.tags || [],
      utm_source: contactData.utm_source,
      utm_medium: contactData.utm_medium,
      utm_campaign: contactData.utm_campaign,
      utm_content: contactData.utm_content,
      last_activity_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Automatically assign initial tags based on criteria
    contact.tags = this.assignInitialTags(contact);

    // Start lead scoring
    await this.updateLeadScore(contact.id, 'contact_created', 5);

    // Trigger welcome automation
    await this.triggerAutomation('new_contact', contact);

    return contact;
  }

  /**
   * Calculate estimated revenue based on interest and property count
   */
  private static calculateEstimatedRevenue(interest?: string, propertyCount?: number): number {
    const basePrices = {
      basic: 1490, // 149 zł/month * 10 months average
      pro: 2490,   // 249 zł/month * 10 months
      enterprise: 3990 // 399 zł/month * 10 months
    };

    const baseRevenue = basePrices[interest as keyof typeof basePrices] || basePrices.basic;

    // Multiply by property count factor (more properties = higher plan likelihood)
    const propertyFactor = propertyCount ? Math.min(propertyCount / 10, 3) : 1;

    return Math.round(baseRevenue * propertyFactor);
  }

  /**
   * Assign initial tags based on contact attributes
   */
  private static assignInitialTags(contact: MarketingContact): string[] {
    const tags = [...contact.tags];

    // Source tags
    tags.push(`source:${contact.lead_source}`);

    // UTM tags
    if (contact.utm_campaign) tags.push(`campaign:${contact.utm_campaign}`);
    if (contact.utm_source) tags.push(`utm_source:${contact.utm_source}`);

    // Interest tags
    if (contact.subscription_interest !== 'unknown') {
      tags.push(`interest:${contact.subscription_interest}`);
    }

    // Property count segments
    if (contact.properties_count) {
      if (contact.properties_count <= 5) tags.push('segment:small_portfolio');
      else if (contact.properties_count <= 20) tags.push('segment:medium_portfolio');
      else tags.push('segment:large_portfolio');
    }

    return [...new Set(tags)]; // Remove duplicates
  }

  /**
   * Create targeted email campaigns with automation
   */
  static async createEmailCampaign(campaignData: Partial<EmailCampaign>): Promise<EmailCampaign> {
    const campaign: EmailCampaign = {
      id: `campaign_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: campaignData.name!,
      type: campaignData.type!,
      status: 'draft',
      target_audience: campaignData.target_audience!,
      email_sequence: campaignData.email_sequence || [],
      trigger_conditions: campaignData.trigger_conditions || [],
      performance_metrics: {
        total_sent: 0,
        total_delivered: 0,
        total_opened: 0,
        total_clicked: 0,
        total_bounced: 0,
        total_unsubscribed: 0,
        total_conversions: 0,
        delivery_rate: 0,
        open_rate: 0,
        click_rate: 0,
        bounce_rate: 0,
        unsubscribe_rate: 0,
        conversion_rate: 0,
        revenue_attributed: 0,
        cost_per_conversion: 0,
        roi: 0
      },
      created_by: campaignData.created_by!,
      created_at: new Date().toISOString()
    };

    return campaign;
  }

  /**
   * Segment contacts for targeted campaigns
   */
  static async segmentContacts(criteria: SegmentCriteria[]): Promise<MarketingContact[]> {
    // In production, this would query the database
    // For now, return mock contacts that match criteria

    const mockContacts: MarketingContact[] = [
      {
        id: 'contact_1',
        email: 'developer1@example.com',
        first_name: 'Jan',
        last_name: 'Kowalski',
        company_name: 'Kowalski Development',
        lead_source: 'website',
        lead_status: 'qualified',
        subscription_interest: 'pro',
        properties_count: 15,
        estimated_revenue: 4985,
        lifecycle_stage: 'mql',
        tags: ['source:website', 'interest:pro', 'segment:medium_portfolio'],
        last_activity_at: new Date().toISOString(),
        created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'contact_2',
        email: 'anna.nowak@buildcorp.pl',
        first_name: 'Anna',
        last_name: 'Nowak',
        company_name: 'BuildCorp Sp. z o.o.',
        lead_source: 'referral',
        lead_status: 'hot',
        subscription_interest: 'enterprise',
        properties_count: 50,
        estimated_revenue: 19950,
        lifecycle_stage: 'sql',
        tags: ['source:referral', 'interest:enterprise', 'segment:large_portfolio'],
        last_activity_at: new Date().toISOString(),
        created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date().toISOString()
      }
    ];

    // Filter contacts based on criteria
    return mockContacts.filter(contact =>
      this.evaluateSegmentCriteria(contact, criteria)
    );
  }

  /**
   * Evaluate if contact matches segment criteria
   */
  private static evaluateSegmentCriteria(contact: MarketingContact, criteria: SegmentCriteria[]): boolean {
    if (criteria.length === 0) return true;

    return criteria.every(criterion => {
      const fieldValue = (contact as any)[criterion.field];

      switch (criterion.operator) {
        case 'equals':
          return fieldValue === criterion.value;
        case 'not_equals':
          return fieldValue !== criterion.value;
        case 'contains':
          return String(fieldValue).toLowerCase().includes(String(criterion.value).toLowerCase());
        case 'not_contains':
          return !String(fieldValue).toLowerCase().includes(String(criterion.value).toLowerCase());
        case 'greater_than':
          return Number(fieldValue) > Number(criterion.value);
        case 'less_than':
          return Number(fieldValue) < Number(criterion.value);
        case 'in':
          return Array.isArray(criterion.value) && criterion.value.includes(fieldValue);
        case 'not_in':
          return Array.isArray(criterion.value) && !criterion.value.includes(fieldValue);
        default:
          return false;
      }
    });
  }

  /**
   * Lead scoring system
   */
  static async updateLeadScore(contactId: string, action: string, scoreChange: number): Promise<void> {
    // Update contact score based on actions
    const scoreEvent: ScoreEvent = {
      timestamp: new Date().toISOString(),
      rule_id: `rule_${action}`,
      score_change: scoreChange,
      reason: action,
      total_score_after: 0 // Would be calculated from existing score
    };

    // In production, save to database and update contact
    console.log(`Score update for ${contactId}: ${action} (+${scoreChange} points)`);
  }

  /**
   * Trigger marketing automation workflows
   */
  static async triggerAutomation(triggerType: string, contact: MarketingContact): Promise<void> {
    const automations = await this.getAutomationsByTrigger(triggerType);

    for (const automation of automations) {
      if (automation.is_active) {
        await this.executeAutomation(automation, contact);
      }
    }
  }

  /**
   * Get automations that match trigger type
   */
  private static async getAutomationsByTrigger(triggerType: string): Promise<MarketingAutomation[]> {
    // Mock automations for different triggers
    const automations: MarketingAutomation[] = [
      {
        id: 'automation_welcome',
        name: 'Welcome Series',
        description: 'Welcome new contacts and introduce DevReporter',
        trigger_type: triggerType as any,
        trigger_config: {},
        workflow_steps: [
          {
            id: 'step_1',
            type: 'wait',
            config: {},
            delay_minutes: 15 // Wait 15 minutes after signup
          },
          {
            id: 'step_2',
            type: 'email',
            config: {
              template_id: 'welcome_email',
              subject: 'Witamy w DevReporter! 🏠',
              personalized: true
            }
          },
          {
            id: 'step_3',
            type: 'wait',
            config: {},
            delay_minutes: 2 * 24 * 60 // Wait 2 days
          },
          {
            id: 'step_4',
            type: 'email',
            config: {
              template_id: 'getting_started',
              subject: 'Jak zacząć z DevReporter - przewodnik krok po kroku'
            }
          }
        ],
        is_active: true,
        performance: {
          total_entered: 45,
          total_completed: 32,
          total_active: 8,
          completion_rate: 0.71,
          avg_completion_time_hours: 72,
          conversions: 12,
          conversion_rate: 0.27
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];

    return automations.filter(automation => automation.trigger_type === triggerType);
  }

  /**
   * Execute automation workflow for contact
   */
  private static async executeAutomation(automation: MarketingAutomation, contact: MarketingContact): Promise<void> {
    console.log(`Executing automation "${automation.name}" for contact ${contact.email}`);

    for (const step of automation.workflow_steps) {
      switch (step.type) {
        case 'email':
          await this.sendAutomationEmail(step.config, contact);
          break;
        case 'wait':
          // Schedule next step with delay
          await this.scheduleDelayedStep(step.delay_minutes || 0, contact.id, step.id);
          break;
        case 'tag':
          await this.addContactTag(contact.id, step.config.tag);
          break;
        case 'score_change':
          await this.updateLeadScore(contact.id, step.config.reason, step.config.score_change);
          break;
        case 'condition':
          // Evaluate condition and branch workflow
          const conditionMet = this.evaluateSegmentCriteria(contact, step.conditions || []);
          if (!conditionMet) {
            console.log('Condition not met, stopping automation');
            break;
          }
          break;
      }
    }
  }

  /**
   * Send automated email
   */
  private static async sendAutomationEmail(emailConfig: any, contact: MarketingContact): Promise<void> {
    const personalizedSubject = this.personalizeContent(emailConfig.subject, contact);

    const email: EmailDelivery = {
      id: `email_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      contact_id: contact.id,
      campaign_id: 'automation',
      template_id: emailConfig.template_id,
      status: 'queued',
      subject: personalizedSubject,
      scheduled_at: new Date().toISOString(),
      tracking_data: {
        opens_count: 0,
        unique_opens: 0,
        clicks_count: 0,
        unique_clicks: 0,
        cta_clicks: {}
      }
    };

    // In production, queue email for sending via Resend/SendGrid
    console.log(`Queued email: "${personalizedSubject}" for ${contact.email}`);
  }

  /**
   * Personalize email content with contact data
   */
  private static personalizeContent(content: string, contact: MarketingContact): string {
    return content
      .replace(/\{\{first_name\}\}/g, contact.first_name || 'there')
      .replace(/\{\{last_name\}\}/g, contact.last_name || '')
      .replace(/\{\{company_name\}\}/g, contact.company_name || 'your company')
      .replace(/\{\{properties_count\}\}/g, contact.properties_count?.toString() || '0');
  }

  /**
   * Schedule delayed automation step
   */
  private static async scheduleDelayedStep(delayMinutes: number, contactId: string, stepId: string): Promise<void> {
    const executeAt = new Date(Date.now() + delayMinutes * 60 * 1000);
    console.log(`Scheduled step ${stepId} for contact ${contactId} at ${executeAt.toISOString()}`);

    // In production, use job queue (Redis, BullMQ) or cron jobs
  }

  /**
   * Add tag to contact
   */
  private static async addContactTag(contactId: string, tag: string): Promise<void> {
    console.log(`Adding tag "${tag}" to contact ${contactId}`);
    // In production, update contact tags in database
  }

  /**
   * Generate campaign performance report
   */
  static generateCampaignReport(campaigns: EmailCampaign[]): any {
    const totalSent = campaigns.reduce((sum, c) => sum + c.performance_metrics.total_sent, 0);
    const totalOpened = campaigns.reduce((sum, c) => sum + c.performance_metrics.total_opened, 0);
    const totalClicked = campaigns.reduce((sum, c) => sum + c.performance_metrics.total_clicked, 0);
    const totalRevenue = campaigns.reduce((sum, c) => sum + c.performance_metrics.revenue_attributed, 0);

    return {
      overview: {
        total_campaigns: campaigns.length,
        active_campaigns: campaigns.filter(c => c.status === 'active').length,
        total_emails_sent: totalSent,
        overall_open_rate: totalSent > 0 ? (totalOpened / totalSent) * 100 : 0,
        overall_click_rate: totalSent > 0 ? (totalClicked / totalSent) * 100 : 0,
        total_revenue_attributed: totalRevenue
      },
      top_performing_campaigns: campaigns
        .sort((a, b) => b.performance_metrics.conversion_rate - a.performance_metrics.conversion_rate)
        .slice(0, 5)
        .map(campaign => ({
          id: campaign.id,
          name: campaign.name,
          type: campaign.type,
          conversion_rate: campaign.performance_metrics.conversion_rate,
          revenue_attributed: campaign.performance_metrics.revenue_attributed,
          roi: campaign.performance_metrics.roi
        })),
      campaign_types_performance: this.analyzePerformanceByType(campaigns)
    };
  }

  /**
   * Analyze performance by campaign type
   */
  private static analyzePerformanceByType(campaigns: EmailCampaign[]): any {
    const typeGroups = campaigns.reduce((groups, campaign) => {
      if (!groups[campaign.type]) {
        groups[campaign.type] = [];
      }
      groups[campaign.type].push(campaign);
      return groups;
    }, {} as Record<string, EmailCampaign[]>);

    return Object.entries(typeGroups).map(([type, typeCampaigns]) => {
      const totalSent = typeCampaigns.reduce((sum, c) => sum + c.performance_metrics.total_sent, 0);
      const totalOpened = typeCampaigns.reduce((sum, c) => sum + c.performance_metrics.total_opened, 0);
      const totalClicked = typeCampaigns.reduce((sum, c) => sum + c.performance_metrics.total_clicked, 0);
      const totalConversions = typeCampaigns.reduce((sum, c) => sum + c.performance_metrics.total_conversions, 0);

      return {
        type,
        campaign_count: typeCampaigns.length,
        avg_open_rate: totalSent > 0 ? (totalOpened / totalSent) * 100 : 0,
        avg_click_rate: totalSent > 0 ? (totalClicked / totalSent) * 100 : 0,
        avg_conversion_rate: totalSent > 0 ? (totalConversions / totalSent) * 100 : 0
      };
    });
  }

  /**
   * A/B test email campaigns
   */
  static async runABTest(template: EmailTemplate, contacts: MarketingContact[]): Promise<void> {
    if (!template.a_b_test?.enabled) return;

    const splitIndex = Math.floor(contacts.length * (template.a_b_test.split_percentage / 100));
    const variantA = contacts.slice(0, splitIndex);
    const variantB = contacts.slice(splitIndex);

    // Send variant A (original)
    for (const contact of variantA) {
      await this.sendAutomationEmail({
        template_id: template.id,
        subject: template.subject,
        content: template.html_content
      }, contact);
    }

    // Send variant B (test)
    for (const contact of variantB) {
      await this.sendAutomationEmail({
        template_id: `${template.id}_variant_b`,
        subject: template.a_b_test.variant_b_subject || template.subject,
        content: template.a_b_test.variant_b_content || template.html_content
      }, contact);
    }

    console.log(`A/B test started: ${variantA.length} contacts in variant A, ${variantB.length} in variant B`);
  }
}

// Predefined email templates for different scenarios
export const EMAIL_TEMPLATES = {
  welcome: {
    subject: 'Witamy w DevReporter, {{first_name}}! 🏠',
    html_content: `
      <h1>Witamy w DevReporter!</h1>
      <p>Dzień dobry {{first_name}},</p>
      <p>Cieszymy się, że dołączyłeś do DevReporter - najlepszego narzędzia do automatyzacji raportowania cen mieszkań.</p>
      <h2>Co dalej?</h2>
      <ol>
        <li>Prześlij swój pierwszy plik z danymi mieszkań</li>
        <li>Skonfiguruj automatyczne raportowanie do Ministerstwa</li>
        <li>Odbierz pierwszy raport XML w ciągu 24h</li>
      </ol>
      <a href="{{dashboard_url}}" style="background: #0066cc; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
        Przejdź do dashboardu
      </a>
      <p>Masz pytania? Odpowiedz na tego maila - chętnie pomożemy!</p>
    `,
    cta_buttons: [
      { text: 'Przejdź do dashboardu', url: '/dashboard', tracking_id: 'welcome_cta_dashboard', primary: true }
    ]
  },

  trial_ending: {
    subject: 'Twój trial kończy się za {{days_left}} dni',
    html_content: `
      <h1>{{first_name}}, Twój trial wkrótce się kończy</h1>
      <p>Zostało Ci tylko {{days_left}} dni trial DevReporter.</p>
      <p>W ciągu ostatnich dni korzystałeś z:</p>
      <ul>
        <li>{{properties_count}} mieszkań w systemie</li>
        <li>{{reports_generated}} wygenerowanych raportów</li>
        <li>Automatycznego raportowania do Ministerstwa</li>
      </ul>
      <p>Nie trać dostępu - wybierz plan który pasuje do Twoich potrzeb:</p>
      <a href="{{upgrade_url}}" style="background: #00cc66; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
        Wybierz plan
      </a>
    `,
    cta_buttons: [
      { text: 'Wybierz plan', url: '/pricing', tracking_id: 'trial_ending_cta_upgrade', primary: true }
    ]
  },

  onboarding_step2: {
    subject: 'Jak przesłać swój pierwszy plik do DevReporter?',
    html_content: `
      <h1>Czas na pierwszy upload! 📁</h1>
      <p>Cześć {{first_name}},</p>
      <p>Widzę, że założyłeś konto w DevReporter, ale jeszcze nie przesłałeś danych mieszkań.</p>
      <p>To proste - wystarczy przesłać plik CSV lub Excel, a my zajmiemy się resztą!</p>
      <h2>Krok po kroku:</h2>
      <ol>
        <li>Przejdź do sekcji "Upload danych"</li>
        <li>Przeciągnij swój plik CSV/Excel</li>
        <li>System automatycznie rozpozna kolumny</li>
        <li>Sprawdź podgląd i zatwierdź</li>
      </ol>
      <a href="{{upload_url}}" style="background: #0066cc; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
        Prześlij dane teraz
      </a>
      <p>Potrzebujesz przykładowy plik? <a href="{{template_url}}">Pobierz szablon CSV</a></p>
    `,
    cta_buttons: [
      { text: 'Prześlij dane teraz', url: '/upload', tracking_id: 'onboarding_step2_cta_upload', primary: true },
      { text: 'Pobierz szablon', url: '/template.csv', tracking_id: 'onboarding_step2_cta_template', primary: false }
    ]
  }
};

// Lead scoring rules
export const LEAD_SCORING_RULES: LeadScoringRule[] = [
  {
    id: 'contact_created',
    name: 'New contact created',
    criteria: { field: 'created_at', operator: 'greater_than', value: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() },
    score_change: 5,
    is_active: true
  },
  {
    id: 'email_opened',
    name: 'Email opened',
    criteria: { field: 'last_email_opened', operator: 'greater_than', value: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() },
    score_change: 2,
    max_score: 10,
    is_active: true
  },
  {
    id: 'pricing_page_visit',
    name: 'Visited pricing page',
    criteria: { field: 'visited_pages', operator: 'contains', value: '/pricing' },
    score_change: 15,
    decay_days: 30,
    is_active: true
  },
  {
    id: 'trial_signup',
    name: 'Started trial',
    criteria: { field: 'lifecycle_stage', operator: 'equals', value: 'trial' },
    score_change: 25,
    is_active: true
  },
  {
    id: 'multiple_logins',
    name: 'Multiple logins (engaged user)',
    criteria: { field: 'login_count', operator: 'greater_than', value: 3 },
    score_change: 10,
    is_active: true
  }
];

// Audience segments for targeting
export const AUDIENCE_SEGMENTS: AudienceSegment[] = [
  {
    id: 'hot_leads',
    name: 'Hot Leads',
    criteria: [
      { field: 'lead_status', operator: 'equals', value: 'hot' },
      { field: 'estimated_revenue', operator: 'greater_than', value: 2000 }
    ],
    estimated_size: 45,
    dynamic: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'enterprise_prospects',
    name: 'Enterprise Prospects',
    criteria: [
      { field: 'properties_count', operator: 'greater_than', value: 30 },
      { field: 'subscription_interest', operator: 'in', value: ['enterprise', 'pro'] }
    ],
    estimated_size: 23,
    dynamic: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'trial_users',
    name: 'Trial Users',
    criteria: [
      { field: 'lifecycle_stage', operator: 'equals', value: 'trial' },
      { field: 'created_at', operator: 'greater_than', value: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString() }
    ],
    estimated_size: 78,
    dynamic: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];