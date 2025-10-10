/**
 * Subscription Limits Checker - SERVER ONLY
 *
 * Checks subscription limits against database usage
 * IMPORTANT: This file uses server-side dependencies and should NOT be imported by client components
 */

import { createAdminClient } from '@/lib/supabase/server';
import { SUBSCRIPTION_PLANS, type SubscriptionPlanType } from './subscription-plans';

/**
 * Interface for subscription limits check results
 */
export interface SubscriptionLimitsCheck {
  withinLimits: boolean;
  limits: {
    properties: number | null;
    projects: number | null;
  };
  currentUsage: {
    properties: number;
    projects: number;
  };
  recommendations?: string[];
}

/**
 * Check subscription limits for a developer against their current usage
 * SERVER-SIDE ONLY - Uses createAdminClient to query database
 */
export async function checkSubscriptionLimits(developerId: string): Promise<SubscriptionLimitsCheck> {
  try {
    // Get developer with subscription info
    const { data: developer, error: devError } = await createAdminClient()
      .from('developers')
      .select('subscription_plan')
      .eq('id', developerId)
      .single();

    if (devError || !developer) {
      throw new Error('Developer not found');
    }

    // Count current usage
    const { data: projects, error: projectsError } = await createAdminClient()
      .from('projects')
      .select('id')
      .eq('developer_id', developerId)
      .eq('status', 'active');

    const { data: properties, error: propertiesError } = await createAdminClient()
      .from('properties')
      .select('id')
      .eq('developer_id', developerId);

    if (projectsError || propertiesError) {
      throw new Error('Error fetching usage data');
    }

    const currentProjects = projects?.length || 0;
    const currentProperties = properties?.length || 0;

    const plan = SUBSCRIPTION_PLANS[developer.subscription_plan as SubscriptionPlanType];

    // Check if within limits
    const propertiesOk = plan.propertiesLimit === null || currentProperties <= plan.propertiesLimit;
    const projectsOk = plan.projectsLimit === null || currentProjects <= plan.projectsLimit;

    const withinLimits = propertiesOk && projectsOk;

    const recommendations: string[] = [];

    if (!propertiesOk) {
      recommendations.push(`Przekroczono limit ${plan.propertiesLimit} mieszkań. Rozważ upgrade do planu Pro lub Enterprise.`);
    }

    if (!projectsOk) {
      recommendations.push(`Przekroczono limit ${plan.projectsLimit} projektów. W planie Pro możesz dokupić projekty za +50zł każdy.`);
    }

    return {
      withinLimits,
      limits: {
        properties: plan.propertiesLimit,
        projects: plan.projectsLimit
      },
      currentUsage: {
        properties: currentProperties,
        projects: currentProjects
      },
      recommendations: recommendations.length > 0 ? recommendations : undefined
    };

  } catch (error) {
    console.error('Error checking subscription limits:', error);

    // Return safe defaults in case of error
    return {
      withinLimits: true, // Assume OK if we can't check
      limits: {
        properties: null,
        projects: null
      },
      currentUsage: {
        properties: 0,
        projects: 0
      },
      recommendations: ['Nie można sprawdzić limitów subskrypcji. Skontaktuj się z supportem.']
    };
  }
}
