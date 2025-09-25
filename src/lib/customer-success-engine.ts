// Customer Success Automation Engine
// Proactive support, onboarding automation, and customer health monitoring

import { supabaseAdmin } from './supabase';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export interface CustomerHealthScore {
  overall_score: number; // 0-100
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  health_factors: {
    engagement: number;
    feature_adoption: number;
    support_satisfaction: number;
    subscription_health: number;
    data_quality: number;
  };
  trending: 'improving' | 'stable' | 'declining';
  last_calculated: string;
}

export interface OnboardingProgress {
  developer_id: string;
  current_step: number;
  total_steps: number;
  completion_percentage: number;
  steps_completed: OnboardingStep[];
  next_step: OnboardingStep;
  blockers: OnboardingBlocker[];
  estimated_completion_time: number; // minutes
  personalized_path: OnboardingPath;
}

export interface OnboardingStep {
  id: string;
  name: string;
  description: string;
  type: 'account_setup' | 'data_upload' | 'feature_discovery' | 'integration' | 'customization';
  required: boolean;
  estimated_time: number; // minutes
  completed: boolean;
  completed_at?: string;
  help_resources: HelpResource[];
  success_criteria: string[];
}

export interface OnboardingBlocker {
  type: 'technical' | 'data' | 'knowledge' | 'subscription';
  description: string;
  impact: 'low' | 'medium' | 'high';
  suggested_solution: string;
  escalation_required: boolean;
}

export interface OnboardingPath {
  path_type: 'basic' | 'advanced' | 'enterprise';
  estimated_total_time: number;
  priority_features: string[];
  optional_features: string[];
  success_milestones: string[];
}

export interface HelpResource {
  type: 'video' | 'article' | 'tutorial' | 'demo';
  title: string;
  url: string;
  duration?: number; // for videos
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

export interface AutomatedIntervention {
  trigger: string;
  type: 'email' | 'in_app' | 'phone_call' | 'account_review';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  scheduled_for: string;
  personalization_data: Record<string, any>;
  success_metrics: string[];
}

export interface CustomerSuccessMetrics {
  onboarding_completion_rate: number;
  time_to_first_value: number; // hours
  feature_adoption_rate: number;
  support_ticket_resolution_time: number; // hours
  customer_satisfaction_score: number; // 1-5
  churn_prediction_accuracy: number;
  intervention_success_rate: number;
}

export class CustomerSuccessEngine {

  /**
   * Calculate comprehensive customer health score
   */
  static async calculateHealthScore(developerId: string): Promise<CustomerHealthScore> {
    try {
      // Get developer data
      const { data: developer } = await supabaseAdmin
        .from('developers')
        .select('*')
        .eq('id', developerId)
        .single();

      if (!developer) {
        throw new Error('Developer not found');
      }

      // Get engagement data
      const { data: fileUploads } = await supabaseAdmin
        .from('file_uploads')
        .select('*')
        .eq('developer_id', developerId)
        .order('created_at', { ascending: false });

      // Get properties data
      const { data: properties } = await supabaseAdmin
        .from('properties')
        .select(`
          *,
          projects!inner(developer_id)
        `)
        .eq('projects.developer_id', developerId);

      // Calculate health factors
      const healthFactors = {
        engagement: this.calculateEngagementScore(developer, fileUploads || []),
        feature_adoption: this.calculateFeatureAdoptionScore(developer, properties || []),
        support_satisfaction: this.calculateSupportSatisfactionScore(developerId),
        subscription_health: this.calculateSubscriptionHealthScore(developer),
        data_quality: this.calculateDataQualityScore(properties || [])
      };

      // Calculate overall score
      const overallScore = Math.round(
        (healthFactors.engagement * 0.25) +
        (healthFactors.feature_adoption * 0.25) +
        (healthFactors.support_satisfaction * 0.15) +
        (healthFactors.subscription_health * 0.20) +
        (healthFactors.data_quality * 0.15)
      );

      // Determine risk level
      const riskLevel = overallScore >= 80 ? 'low' :
                       overallScore >= 60 ? 'medium' :
                       overallScore >= 40 ? 'high' : 'critical';

      // Determine trending (simplified)
      const trending = overallScore > 70 ? 'improving' :
                      overallScore > 50 ? 'stable' : 'declining';

      return {
        overall_score: overallScore,
        risk_level: riskLevel,
        health_factors: healthFactors,
        trending,
        last_calculated: new Date().toISOString()
      };

    } catch (error) {
      console.error('Health score calculation error:', error);
      throw error;
    }
  }

  /**
   * Get personalized onboarding progress
   */
  static async getOnboardingProgress(developerId: string): Promise<OnboardingProgress> {
    try {
      const { data: developer } = await supabaseAdmin
        .from('developers')
        .select('*')
        .eq('id', developerId)
        .single();

      if (!developer) {
        throw new Error('Developer not found');
      }

      // Define onboarding steps
      const allSteps = this.getOnboardingSteps();

      // Check completion status for each step
      const completedSteps = await this.checkStepCompletion(developerId, allSteps);

      // Determine current step
      const currentStepIndex = completedSteps.findIndex(step => !step.completed);
      const currentStep = currentStepIndex === -1 ? completedSteps.length : currentStepIndex;

      // Calculate completion percentage
      const completionPercentage = Math.round((completedSteps.filter(s => s.completed).length / allSteps.length) * 100);

      // Identify blockers
      const blockers = await this.identifyOnboardingBlockers(developerId, developer);

      // Determine personalized path
      const personalizedPath = this.determineOnboardingPath(developer);

      return {
        developer_id: developerId,
        current_step: currentStep,
        total_steps: allSteps.length,
        completion_percentage: completionPercentage,
        steps_completed: completedSteps,
        next_step: completedSteps[currentStep] || completedSteps[completedSteps.length - 1],
        blockers,
        estimated_completion_time: this.calculateRemainingTime(completedSteps),
        personalized_path: personalizedPath
      };

    } catch (error) {
      console.error('Onboarding progress error:', error);
      throw error;
    }
  }

  /**
   * Execute proactive interventions based on health score and behavior
   */
  static async executeProactiveInterventions(developerId: string): Promise<AutomatedIntervention[]> {
    try {
      const healthScore = await this.calculateHealthScore(developerId);
      const onboardingProgress = await this.getOnboardingProgress(developerId);

      const interventions: AutomatedIntervention[] = [];

      // High churn risk intervention
      if (healthScore.risk_level === 'critical' || healthScore.risk_level === 'high') {
        interventions.push({
          trigger: 'high_churn_risk',
          type: 'email',
          priority: healthScore.risk_level === 'critical' ? 'urgent' : 'high',
          scheduled_for: new Date().toISOString(),
          personalization_data: {
            health_score: healthScore.overall_score,
            weak_areas: this.getWeakHealthAreas(healthScore.health_factors)
          },
          success_metrics: ['health_score_improvement', 'engagement_increase']
        });
      }

      // Stalled onboarding intervention
      if (onboardingProgress.completion_percentage < 50 && this.getDaysSinceSignup(await this.getDeveloper(developerId)) > 7) {
        interventions.push({
          trigger: 'stalled_onboarding',
          type: 'email',
          priority: 'medium',
          scheduled_for: new Date().toISOString(),
          personalization_data: {
            current_step: onboardingProgress.next_step.name,
            completion_percentage: onboardingProgress.completion_percentage,
            blockers: onboardingProgress.blockers
          },
          success_metrics: ['onboarding_progress', 'next_step_completion']
        });
      }

      // Feature discovery intervention
      if (healthScore.health_factors.feature_adoption < 50) {
        interventions.push({
          trigger: 'low_feature_adoption',
          type: 'in_app',
          priority: 'medium',
          scheduled_for: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours later
          personalization_data: {
            unused_features: this.getUnusedFeatures(developerId),
            subscription_plan: (await this.getDeveloper(developerId))?.subscription_plan
          },
          success_metrics: ['feature_usage_increase', 'engagement_increase']
        });
      }

      // Success milestone celebration
      if (onboardingProgress.completion_percentage === 100 && healthScore.overall_score > 80) {
        interventions.push({
          trigger: 'onboarding_success',
          type: 'email',
          priority: 'low',
          scheduled_for: new Date().toISOString(),
          personalization_data: {
            completion_time: onboardingProgress.estimated_completion_time,
            health_score: healthScore.overall_score
          },
          success_metrics: ['satisfaction_score', 'referral_likelihood']
        });
      }

      // Execute interventions
      for (const intervention of interventions) {
        await this.executeIntervention(developerId, intervention);
      }

      return interventions;

    } catch (error) {
      console.error('Proactive interventions error:', error);
      throw error;
    }
  }

  /**
   * Send automated email sequences based on customer journey
   */
  static async sendAutomatedEmailSequence(developerId: string, sequenceType: string): Promise<boolean> {
    try {
      const developer = await this.getDeveloper(developerId);
      if (!developer) return false;

      const emailContent = await this.generateEmailContent(sequenceType, developer);

      await resend.emails.send({
        from: 'OTORAPORT <success@otoraport.pl>',
        to: [developer.email],
        subject: emailContent.subject,
        html: emailContent.html
      });

      // Log email sent
      await supabaseAdmin
        .from('notification_logs')
        .insert([{
          developer_id: developerId,
          type: 'automated_email',
          subject: emailContent.subject,
          recipient_email: developer.email,
          status: 'sent',
          sent_at: new Date().toISOString()
        }]);

      return true;

    } catch (error) {
      console.error('Automated email sequence error:', error);
      return false;
    }
  }

  /**
   * Get customer success metrics
   */
  static async getCustomerSuccessMetrics(): Promise<CustomerSuccessMetrics> {
    try {
      // Get developers data
      const { data: developers } = await supabaseAdmin
        .from('developers')
        .select('*');

      if (!developers || developers.length === 0) {
        return this.getEmptyMetrics();
      }

      // Calculate metrics
      const onboardingData = await Promise.all(
        developers.map(dev => this.getOnboardingProgress(dev.id))
      );

      const healthScores = await Promise.all(
        developers.map(dev => this.calculateHealthScore(dev.id))
      );

      const onboardingCompletionRate = onboardingData.filter(
        progress => progress.completion_percentage === 100
      ).length / developers.length * 100;

      const avgTimeToFirstValue = onboardingData.reduce(
        (sum, progress) => sum + (progress.estimated_completion_time || 0), 0
      ) / onboardingData.length / 60; // Convert to hours

      const avgFeatureAdoption = healthScores.reduce(
        (sum, health) => sum + health.health_factors.feature_adoption, 0
      ) / healthScores.length;

      return {
        onboarding_completion_rate: Math.round(onboardingCompletionRate),
        time_to_first_value: Math.round(avgTimeToFirstValue),
        feature_adoption_rate: Math.round(avgFeatureAdoption),
        support_ticket_resolution_time: 4, // Mock: 4 hours average
        customer_satisfaction_score: 4.2, // Mock: 4.2/5 average
        churn_prediction_accuracy: 85, // Mock: 85% accuracy
        intervention_success_rate: 78 // Mock: 78% success rate
      };

    } catch (error) {
      console.error('Customer success metrics error:', error);
      return this.getEmptyMetrics();
    }
  }

  // Helper methods

  private static calculateEngagementScore(developer: any, uploads: any[]): number {
    const daysSinceSignup = this.getDaysSinceSignup(developer);
    const uploadsCount = uploads.length;
    const recentUploads = uploads.filter(upload =>
      this.getDaysSinceCreated(upload.created_at) <= 7
    ).length;

    let score = 0;
    if (uploadsCount > 0) score += 40;
    if (uploadsCount > 3) score += 20;
    if (recentUploads > 0) score += 30;
    if (daysSinceSignup > 0 && uploadsCount / daysSinceSignup > 0.1) score += 10;

    return Math.min(score, 100);
  }

  private static calculateFeatureAdoptionScore(developer: any, properties: any[]): number {
    let score = 0;

    if (properties.length > 0) score += 30; // Has uploaded properties
    if (developer.presentation_generated_at) score += 25; // Generated presentation
    if (developer.custom_domain) score += 20; // Using custom domain
    if (developer.xml_url) score += 15; // XML endpoint configured
    if (properties.length > 10) score += 10; // Active user

    return Math.min(score, 100);
  }

  private static calculateSupportSatisfactionScore(developerId: string): number {
    // Mock implementation - in production, calculate from support tickets
    return 85; // 85% satisfaction
  }

  private static calculateSubscriptionHealthScore(developer: any): number {
    let score = 50; // Base score

    if (developer.subscription_status === 'active') score += 30;
    if (developer.subscription_plan === 'pro') score += 10;
    if (developer.subscription_plan === 'enterprise') score += 20;
    if (!developer.subscription_ends_at || new Date(developer.subscription_ends_at) > new Date()) score += 10;

    return Math.min(score, 100);
  }

  private static calculateDataQualityScore(properties: any[]): number {
    if (properties.length === 0) return 0;

    let totalFields = 0;
    let completedFields = 0;

    properties.forEach(property => {
      const requiredFields = ['apartment_number', 'area', 'price_per_m2', 'final_price'];
      totalFields += requiredFields.length;

      requiredFields.forEach(field => {
        if (property[field] && property[field] !== null) {
          completedFields++;
        }
      });
    });

    return Math.round((completedFields / totalFields) * 100);
  }

  private static getOnboardingSteps(): OnboardingStep[] {
    return [
      {
        id: 'account_setup',
        name: 'Account Setup',
        description: 'Complete your developer profile',
        type: 'account_setup',
        required: true,
        estimated_time: 5,
        completed: false,
        help_resources: [
          {
            type: 'video',
            title: 'Getting Started with OTORAPORT',
            url: '/help/getting-started',
            duration: 3,
            difficulty: 'beginner'
          }
        ],
        success_criteria: ['Profile completed', 'Company information added']
      },
      {
        id: 'first_upload',
        name: 'First Data Upload',
        description: 'Upload your first property data file',
        type: 'data_upload',
        required: true,
        estimated_time: 10,
        completed: false,
        help_resources: [
          {
            type: 'tutorial',
            title: 'How to Upload Property Data',
            url: '/help/upload-data',
            difficulty: 'beginner'
          }
        ],
        success_criteria: ['CSV/Excel file uploaded', 'Data validated successfully']
      },
      {
        id: 'xml_generation',
        name: 'XML Generation',
        description: 'Generate your first Ministry-compliant XML',
        type: 'feature_discovery',
        required: true,
        estimated_time: 5,
        completed: false,
        help_resources: [
          {
            type: 'article',
            title: 'Understanding XML Generation',
            url: '/help/xml-generation',
            difficulty: 'intermediate'
          }
        ],
        success_criteria: ['XML generated successfully', 'MD5 checksum created']
      },
      {
        id: 'ministry_integration',
        name: 'Ministry Integration',
        description: 'Send registration email to Ministry',
        type: 'integration',
        required: true,
        estimated_time: 15,
        completed: false,
        help_resources: [
          {
            type: 'tutorial',
            title: 'Ministry Registration Process',
            url: '/help/ministry-registration',
            difficulty: 'intermediate'
          }
        ],
        success_criteria: ['Registration email sent', 'URLs configured']
      },
      {
        id: 'presentation_setup',
        name: 'Presentation Page',
        description: 'Create your property presentation page',
        type: 'feature_discovery',
        required: false,
        estimated_time: 10,
        completed: false,
        help_resources: [
          {
            type: 'demo',
            title: 'Presentation Pages Demo',
            url: '/help/presentation-demo',
            difficulty: 'beginner'
          }
        ],
        success_criteria: ['Presentation page generated', 'Preview successful']
      }
    ];
  }

  private static async checkStepCompletion(developerId: string, steps: OnboardingStep[]): Promise<OnboardingStep[]> {
    const developer = await this.getDeveloper(developerId);
    if (!developer) return steps;

    const { data: uploads } = await supabaseAdmin
      .from('file_uploads')
      .select('*')
      .eq('developer_id', developerId)
      .limit(1);

    return steps.map(step => {
      let completed = false;

      switch (step.id) {
        case 'account_setup':
          completed = !!(developer.company_name && developer.email);
          break;
        case 'first_upload':
          completed = uploads && uploads.length > 0;
          break;
        case 'xml_generation':
          completed = !!developer.xml_url;
          break;
        case 'ministry_integration':
          completed = !!developer.xml_url; // Simplified check
          break;
        case 'presentation_setup':
          completed = !!developer.presentation_generated_at;
          break;
      }

      return {
        ...step,
        completed,
        completed_at: completed ? new Date().toISOString() : undefined
      };
    });
  }

  private static async identifyOnboardingBlockers(developerId: string, developer: any): Promise<OnboardingBlocker[]> {
    const blockers: OnboardingBlocker[] = [];

    // Check for subscription blockers
    if (developer.subscription_status === 'trial' || developer.subscription_status === 'expired') {
      blockers.push({
        type: 'subscription',
        description: 'Trial expired or payment required',
        impact: 'high',
        suggested_solution: 'Upgrade to paid subscription',
        escalation_required: false
      });
    }

    // Check for data quality blockers
    const { data: properties } = await supabaseAdmin
      .from('properties')
      .select(`
        *,
        projects!inner(developer_id)
      `)
      .eq('projects.developer_id', developerId);

    if (properties && properties.length > 0) {
      const invalidProperties = properties.filter(p =>
        !p.apartment_number || !p.area || !p.price_per_m2
      );

      if (invalidProperties.length > 0) {
        blockers.push({
          type: 'data',
          description: `${invalidProperties.length} properties have incomplete data`,
          impact: 'medium',
          suggested_solution: 'Review and complete property information',
          escalation_required: false
        });
      }
    }

    return blockers;
  }

  private static determineOnboardingPath(developer: any): OnboardingPath {
    const plan = developer.subscription_plan || 'basic';

    if (plan === 'enterprise') {
      return {
        path_type: 'enterprise',
        estimated_total_time: 45,
        priority_features: ['data_upload', 'xml_generation', 'custom_domains', 'presentation_pages'],
        optional_features: ['api_access', 'white_label'],
        success_milestones: ['First upload', 'Ministry registration', 'Custom domain setup', 'Presentation deployment']
      };
    } else if (plan === 'pro') {
      return {
        path_type: 'advanced',
        estimated_total_time: 35,
        priority_features: ['data_upload', 'xml_generation', 'presentation_pages'],
        optional_features: ['analytics', 'api_access'],
        success_milestones: ['First upload', 'Ministry registration', 'Presentation deployment']
      };
    } else {
      return {
        path_type: 'basic',
        estimated_total_time: 25,
        priority_features: ['data_upload', 'xml_generation'],
        optional_features: ['presentation_pages'],
        success_milestones: ['First upload', 'Ministry registration']
      };
    }
  }

  private static calculateRemainingTime(steps: OnboardingStep[]): number {
    return steps
      .filter(step => !step.completed)
      .reduce((total, step) => total + step.estimated_time, 0);
  }

  private static getDaysSinceSignup(developer: any): number {
    if (!developer?.created_at) return 0;

    const created = new Date(developer.created_at);
    const now = new Date();
    return Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
  }

  private static getDaysSinceCreated(createdAt: string): number {
    const created = new Date(createdAt);
    const now = new Date();
    return Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
  }

  private static getWeakHealthAreas(healthFactors: any): string[] {
    const weak = [];
    if (healthFactors.engagement < 50) weak.push('engagement');
    if (healthFactors.feature_adoption < 50) weak.push('feature_adoption');
    if (healthFactors.support_satisfaction < 50) weak.push('support_satisfaction');
    if (healthFactors.subscription_health < 50) weak.push('subscription_health');
    if (healthFactors.data_quality < 50) weak.push('data_quality');
    return weak;
  }

  private static getUnusedFeatures(developerId: string): string[] {
    // Mock implementation - in production, track feature usage
    return ['presentation_pages', 'custom_domains', 'api_access'];
  }

  private static async getDeveloper(developerId: string) {
    const { data } = await supabaseAdmin
      .from('developers')
      .select('*')
      .eq('id', developerId)
      .single();
    return data;
  }

  private static async executeIntervention(developerId: string, intervention: AutomatedIntervention): Promise<void> {
    switch (intervention.type) {
      case 'email':
        await this.sendAutomatedEmailSequence(developerId, intervention.trigger);
        break;
      case 'in_app':
        // Store in-app notification
        await supabaseAdmin
          .from('notification_logs')
          .insert([{
            developer_id: developerId,
            type: 'in_app_notification',
            message: `Proactive intervention: ${intervention.trigger}`,
            status: 'pending'
          }]);
        break;
      // Add other intervention types as needed
    }
  }

  private static async generateEmailContent(sequenceType: string, developer: any): Promise<{subject: string, html: string}> {
    const templates = {
      high_churn_risk: {
        subject: `${developer.company_name} - Let's get you back on track! 🚀`,
        html: `
          <h2>We're here to help, ${developer.name}!</h2>
          <p>We noticed you haven't been active lately. Our team is ready to help you succeed with OTORAPORT.</p>
          <p><strong>Quick wins:</strong></p>
          <ul>
            <li>Upload your property data in under 10 minutes</li>
            <li>Generate Ministry-compliant XML automatically</li>
            <li>Set up your presentation page</li>
          </ul>
          <p><a href="mailto:success@otoraport.pl">Reply to this email</a> and we'll schedule a 15-minute success call.</p>
        `
      },
      stalled_onboarding: {
        subject: `${developer.company_name} - Let's complete your setup! ⚡`,
        html: `
          <h2>You're almost there, ${developer.name}!</h2>
          <p>You've started setting up OTORAPORT - let's finish strong!</p>
          <p><strong>Next step:</strong> Complete your property data upload</p>
          <p>Need help? Here are some resources:</p>
          <ul>
            <li><a href="/help/getting-started">Getting Started Guide</a></li>
            <li><a href="/help/upload-data">Data Upload Tutorial</a></li>
            <li><a href="mailto:support@otoraport.pl">Contact Support</a></li>
          </ul>
        `
      },
      onboarding_success: {
        subject: `🎉 Congratulations! You've mastered OTORAPORT`,
        html: `
          <h2>Amazing work, ${developer.name}!</h2>
          <p>You've successfully completed your OTORAPORT onboarding. You're now fully compliant with Ministry requirements!</p>
          <p><strong>What's next?</strong></p>
          <ul>
            <li>Explore advanced analytics (Pro/Enterprise)</li>
            <li>Set up custom domains for your presentations</li>
            <li>Invite team members to collaborate</li>
          </ul>
          <p>Questions? We're always here to help at <a href="mailto:success@otoraport.pl">success@otoraport.pl</a></p>
        `
      }
    };

    return templates[sequenceType as keyof typeof templates] || templates.high_churn_risk;
  }

  private static getEmptyMetrics(): CustomerSuccessMetrics {
    return {
      onboarding_completion_rate: 0,
      time_to_first_value: 0,
      feature_adoption_rate: 0,
      support_ticket_resolution_time: 0,
      customer_satisfaction_score: 0,
      churn_prediction_accuracy: 0,
      intervention_success_rate: 0
    };
  }
}

export default CustomerSuccessEngine;