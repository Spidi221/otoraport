import { Resend } from 'resend';
import { supabaseAdmin } from '@/lib/supabase-single';

const resend = new Resend(process.env.RESEND_API_KEY);

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  content: string;
  variables: string[];
  category: 'onboarding' | 'nurture' | 'promotional' | 'transactional' | 'retention';
  created_at: string;
  updated_at: string;
}

export interface ABTestVariant {
  id: string;
  name: string;
  subject: string;
  content: string;
  traffic_percentage: number;
  performance_metrics: {
    sent: number;
    delivered: number;
    opened: number;
    clicked: number;
    converted: number;
    open_rate: number;
    click_rate: number;
    conversion_rate: number;
  };
}

export interface ABTest {
  id: string;
  name: string;
  description: string;
  status: 'draft' | 'active' | 'completed' | 'paused';
  variants: ABTestVariant[];
  winner_variant_id?: string;
  confidence_level: number;
  start_date: string;
  end_date?: string;
  total_recipients: number;
}

export interface EmailDeliveryResult {
  success: boolean;
  message_id?: string;
  error?: string;
  recipient: string;
  template_id: string;
  variant_id?: string;
  sent_at: string;
}

export class EmailMarketingEngine {

  // Send individual email with template
  static async sendTemplatedEmail(
    recipient: string,
    templateId: string,
    variables: Record<string, any> = {},
    options: {
      developerId?: string;
      campaignId?: string;
      workflowId?: string;
      variantId?: string;
    } = {}
  ): Promise<EmailDeliveryResult> {
    try {
      // Get template from database
      const template = await this.getTemplate(templateId);
      if (!template) {
        throw new Error(`Template ${templateId} not found`);
      }

      // Replace variables in content and subject
      const processedSubject = this.replaceVariables(template.subject, variables);
      const processedContent = this.replaceVariables(template.content, variables);

      // Send email via Resend
      const result = await resend.emails.send({
        from: process.env.EMAIL_FROM || 'OtoRaport <noreply@otoraport.pl>',
        to: recipient,
        subject: processedSubject,
        html: processedContent,
        tags: [
          { name: 'template_id', value: templateId },
          { name: 'campaign_id', value: options.campaignId || 'none' },
          { name: 'workflow_id', value: options.workflowId || 'none' }
        ]
      });

      if (result.error) {
        throw new Error(result.error.message);
      }

      // Log email send
      await this.logEmailSend({
        recipient,
        template_id: templateId,
        campaign_id: options.campaignId,
        workflow_id: options.workflowId,
        variant_id: options.variantId,
        message_id: result.data?.id,
        status: 'sent',
        sent_at: new Date().toISOString()
      });

      return {
        success: true,
        message_id: result.data?.id,
        recipient,
        template_id: templateId,
        variant_id: options.variantId,
        sent_at: new Date().toISOString()
      };

    } catch (error) {
      console.error('Email send error:', error);

      // Log failed send
      await this.logEmailSend({
        recipient,
        template_id: templateId,
        campaign_id: options.campaignId,
        workflow_id: options.workflowId,
        variant_id: options.variantId,
        status: 'failed',
        error_message: error instanceof Error ? error.message : 'Unknown error',
        sent_at: new Date().toISOString()
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        recipient,
        template_id: templateId,
        variant_id: options.variantId,
        sent_at: new Date().toISOString()
      };
    }
  }

  // Send A/B test email
  static async sendABTestEmail(
    recipient: string,
    abTestId: string,
    variables: Record<string, any> = {},
    options: {
      developerId?: string;
      campaignId?: string;
    } = {}
  ): Promise<EmailDeliveryResult> {
    try {
      // Get A/B test configuration
      const abTest = await this.getABTest(abTestId);
      if (!abTest || abTest.status !== 'active') {
        throw new Error(`A/B test ${abTestId} not found or not active`);
      }

      // Select variant based on traffic distribution
      const selectedVariant = this.selectABTestVariant(abTest.variants);

      // Send email with selected variant
      const result = await resend.emails.send({
        from: process.env.EMAIL_FROM || 'OtoRaport <noreply@otoraport.pl>',
        to: recipient,
        subject: this.replaceVariables(selectedVariant.subject, variables),
        html: this.replaceVariables(selectedVariant.content, variables),
        tags: [
          { name: 'ab_test_id', value: abTestId },
          { name: 'variant_id', value: selectedVariant.id },
          { name: 'campaign_id', value: options.campaignId || 'none' }
        ]
      });

      if (result.error) {
        throw new Error(result.error.message);
      }

      // Update A/B test metrics
      await this.updateABTestMetrics(abTestId, selectedVariant.id, 'sent');

      return {
        success: true,
        message_id: result.data?.id,
        recipient,
        template_id: abTestId,
        variant_id: selectedVariant.id,
        sent_at: new Date().toISOString()
      };

    } catch (error) {
      console.error('A/B test email error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        recipient,
        template_id: abTestId,
        sent_at: new Date().toISOString()
      };
    }
  }

  // Bulk email sending with rate limiting
  static async sendBulkEmails(
    recipients: string[],
    templateId: string,
    variables: Record<string, any> = {},
    options: {
      developerId?: string;
      campaignId?: string;
      batchSize?: number;
      delayMs?: number;
    } = {}
  ): Promise<EmailDeliveryResult[]> {
    const batchSize = options.batchSize || 50;
    const delayMs = options.delayMs || 1000; // 1 second between batches
    const results: EmailDeliveryResult[] = [];

    // Process in batches to respect rate limits
    for (let i = 0; i < recipients.length; i += batchSize) {
      const batch = recipients.slice(i, i + batchSize);

      // Send batch concurrently
      const batchPromises = batch.map(recipient =>
        this.sendTemplatedEmail(recipient, templateId, variables, options)
      );

      const batchResults = await Promise.allSettled(batchPromises);

      // Collect results
      for (const result of batchResults) {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        } else {
          results.push({
            success: false,
            error: result.reason?.message || 'Unknown error',
            recipient: 'unknown',
            template_id: templateId,
            sent_at: new Date().toISOString()
          });
        }
      }

      // Delay between batches (except for last batch)
      if (i + batchSize < recipients.length) {
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }

    return results;
  }

  // Template management
  static async createTemplate(template: Omit<EmailTemplate, 'id' | 'created_at' | 'updated_at'>): Promise<EmailTemplate> {
    const newTemplate: EmailTemplate = {
      id: `tpl_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...template,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Save to database (with fallback to mock storage)
    try {
      await supabaseAdmin
        .from('email_templates')
        .insert(newTemplate);
    } catch (error) {
      console.warn('Database unavailable, using mock storage for template');
      this.mockTemplates.set(newTemplate.id, newTemplate);
    }

    return newTemplate;
  }

  static async getTemplate(templateId: string): Promise<EmailTemplate | null> {
    try {
      const { data } = await supabaseAdmin
        .from('email_templates')
        .select('*')
        .eq('id', templateId)
        .single();

      return data;
    } catch (error) {
      // Fallback to mock templates
      return this.mockTemplates.get(templateId) || this.getDefaultTemplate(templateId);
    }
  }

  // A/B Testing
  static async createABTest(abTest: Omit<ABTest, 'id' | 'start_date'>): Promise<ABTest> {
    const newABTest: ABTest = {
      id: `ab_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...abTest,
      start_date: new Date().toISOString()
    };

    // Initialize variant metrics
    newABTest.variants = newABTest.variants.map(variant => ({
      ...variant,
      performance_metrics: {
        sent: 0,
        delivered: 0,
        opened: 0,
        clicked: 0,
        converted: 0,
        open_rate: 0,
        click_rate: 0,
        conversion_rate: 0
      }
    }));

    try {
      await supabaseAdmin
        .from('ab_tests')
        .insert(newABTest);
    } catch (error) {
      console.warn('Database unavailable, using mock storage for A/B test');
      this.mockABTests.set(newABTest.id, newABTest);
    }

    return newABTest;
  }

  static async getABTest(abTestId: string): Promise<ABTest | null> {
    try {
      const { data } = await supabaseAdmin
        .from('ab_tests')
        .select('*')
        .eq('id', abTestId)
        .single();

      return data;
    } catch (error) {
      return this.mockABTests.get(abTestId) || null;
    }
  }

  static selectABTestVariant(variants: ABTestVariant[]): ABTestVariant {
    const random = Math.random() * 100;
    let cumulativePercentage = 0;

    for (const variant of variants) {
      cumulativePercentage += variant.traffic_percentage;
      if (random <= cumulativePercentage) {
        return variant;
      }
    }

    // Fallback to first variant
    return variants[0];
  }

  static async updateABTestMetrics(abTestId: string, variantId: string, event: 'sent' | 'delivered' | 'opened' | 'clicked' | 'converted'): Promise<void> {
    try {
      // In a real implementation, this would update the specific variant metrics
      // For now, we'll increment the counter in the database
      const { data: abTest } = await supabaseAdmin
        .from('ab_tests')
        .select('variants')
        .eq('id', abTestId)
        .single();

      if (abTest) {
        const updatedVariants = abTest.variants.map((variant: ABTestVariant) => {
          if (variant.id === variantId) {
            variant.performance_metrics[event]++;

            // Recalculate rates
            const metrics = variant.performance_metrics;
            if (metrics.sent > 0) {
              metrics.open_rate = metrics.opened / metrics.sent;
              metrics.click_rate = metrics.clicked / metrics.sent;
              metrics.conversion_rate = metrics.converted / metrics.sent;
            }
          }
          return variant;
        });

        await supabaseAdmin
          .from('ab_tests')
          .update({ variants: updatedVariants })
          .eq('id', abTestId);
      }
    } catch (error) {
      console.error('Error updating A/B test metrics:', error);
    }
  }

  // Email event tracking (webhooks from Resend)
  static async handleEmailEvent(event: {
    type: 'email.sent' | 'email.delivered' | 'email.opened' | 'email.clicked' | 'email.bounced' | 'email.complained';
    data: {
      email_id: string;
      to: string;
      subject: string;
      tags?: Array<{ name: string; value: string }>;
      created_at: string;
    };
  }): Promise<void> {
    try {
      // Extract metadata from tags
      const tags = event.data.tags || [];
      const getTagValue = (name: string) => tags.find(tag => tag.name === name)?.value;

      const campaignId = getTagValue('campaign_id');
      const workflowId = getTagValue('workflow_id');
      const templateId = getTagValue('template_id');
      const abTestId = getTagValue('ab_test_id');
      const variantId = getTagValue('variant_id');

      // Log event
      await this.logEmailEvent({
        event_type: event.type,
        email_id: event.data.email_id,
        recipient: event.data.to,
        subject: event.data.subject,
        campaign_id: campaignId,
        workflow_id: workflowId,
        template_id: templateId,
        ab_test_id: abTestId,
        variant_id: variantId,
        occurred_at: event.data.created_at
      });

      // Update A/B test metrics if applicable
      if (abTestId && variantId) {
        const eventMap: Record<string, 'sent' | 'delivered' | 'opened' | 'clicked'> = {
          'email.sent': 'sent',
          'email.delivered': 'delivered',
          'email.opened': 'opened',
          'email.clicked': 'clicked'
        };

        const mappedEvent = eventMap[event.type];
        if (mappedEvent) {
          await this.updateABTestMetrics(abTestId, variantId, mappedEvent);
        }
      }

      // Update campaign metrics if applicable
      if (campaignId) {
        await this.updateCampaignMetrics(campaignId, event.type);
      }

    } catch (error) {
      console.error('Error handling email event:', error);
    }
  }

  // Helper methods
  private static replaceVariables(content: string, variables: Record<string, any>): string {
    let result = content;

    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g');
      result = result.replace(regex, String(value));
    });

    return result;
  }

  private static async logEmailSend(log: {
    recipient: string;
    template_id: string;
    campaign_id?: string;
    workflow_id?: string;
    variant_id?: string;
    message_id?: string;
    status: 'sent' | 'failed';
    error_message?: string;
    sent_at: string;
  }): Promise<void> {
    try {
      await supabaseAdmin
        .from('email_logs')
        .insert(log);
    } catch (error) {
      console.warn('Failed to log email send:', error);
    }
  }

  private static async logEmailEvent(event: {
    event_type: string;
    email_id: string;
    recipient: string;
    subject: string;
    campaign_id?: string;
    workflow_id?: string;
    template_id?: string;
    ab_test_id?: string;
    variant_id?: string;
    occurred_at: string;
  }): Promise<void> {
    try {
      await supabaseAdmin
        .from('email_events')
        .insert(event);
    } catch (error) {
      console.warn('Failed to log email event:', error);
    }
  }

  private static async updateCampaignMetrics(campaignId: string, eventType: string): Promise<void> {
    // Implementation would update campaign performance metrics
    // This is a placeholder for the actual implementation
    console.log(`Updating campaign ${campaignId} metrics for event ${eventType}`);
  }

  // Mock storage for fallback
  private static mockTemplates = new Map<string, EmailTemplate>();
  private static mockABTests = new Map<string, ABTest>();

  private static getDefaultTemplate(templateId: string): EmailTemplate | null {
    const defaultTemplates: Record<string, EmailTemplate> = {
      'welcome_email': {
        id: 'welcome_email',
        name: 'Welcome Email',
        subject: 'Welcome to OtoRaport, {{first_name}}!',
        content: `
          <h1>Welcome to OtoRaport!</h1>
          <p>Hi {{first_name}},</p>
          <p>Thanks for joining OtoRaport. We're excited to help you automate your property price reporting.</p>
          <p>Your dashboard: <a href="{{dashboard_url}}">{{dashboard_url}}</a></p>
          <p>Best regards,<br>The OtoRaport Team</p>
        `,
        variables: ['first_name', 'dashboard_url'],
        category: 'onboarding',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      'trial_day_1': {
        id: 'trial_day_1',
        name: 'Trial Day 1',
        subject: 'Getting started with your OtoRaport trial',
        content: `
          <h1>Welcome to your OtoRaport trial!</h1>
          <p>Hi {{first_name}},</p>
          <p>You've just started your 14-day trial. Here's how to get the most out of it:</p>
          <ul>
            <li>Upload your property data</li>
            <li>Configure your reporting schedule</li>
            <li>Test the Ministry XML generation</li>
          </ul>
          <p><a href="{{dashboard_url}}">Get started now</a></p>
        `,
        variables: ['first_name', 'dashboard_url'],
        category: 'onboarding',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    };

    return defaultTemplates[templateId] || null;
  }
}