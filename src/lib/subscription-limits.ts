/**
 * FAZA 1: System sprawdzania limitów subskrypcji
 * Integruje się z bazą danych i enforces limity według planów
 */

import { createAdminClient } from './database';
import { canAddProperty, canAddProject, SUBSCRIPTION_PLANS, SubscriptionPlanType } from './subscription-plans';

export interface LimitCheckResult {
  allowed: boolean;
  reason?: string;
  currentCount: number;
  limit: number | null;
  canAddPaid?: boolean;
  additionalCost?: number;
}

/**
 * Sprawdza czy developer może dodać nowe mieszkanie
 */
export async function checkPropertyLimit(developerId: string): Promise<LimitCheckResult> {
  try {
    // Pobierz dane dewelopera
    const developer = await createAdminClient()
      .from('developers')
      .select('subscription_plan, properties_limit')
      .eq('id', developerId)
      .single();

    if (developer.error || !developer.data) {
      throw new Error('Developer not found');
    }

    // Policz obecne properties
    const { count: currentPropertiesCount, error: countError } = await createAdminClient()
      .from('properties')
      .select('*', { count: 'exact', head: true })
      .eq('project.developer_id', developerId);

    if (countError) {
      throw new Error('Error counting properties');
    }

    const currentCount = currentPropertiesCount || 0;
    const planType = developer.data.subscription_plan as SubscriptionPlanType;
    const plan = SUBSCRIPTION_PLANS[planType];

    const result = canAddProperty(currentCount, planType);

    return {
      allowed: result.allowed,
      reason: result.reason,
      currentCount,
      limit: plan.propertiesLimit
    };

  } catch (error) {
    console.error('Error checking property limit:', error);
    return {
      allowed: false,
      reason: 'Błąd sprawdzania limitów. Spróbuj ponownie.',
      currentCount: 0,
      limit: null
    };
  }
}

/**
 * Sprawdza czy developer może dodać nowy projekt
 */
export async function checkProjectLimit(developerId: string): Promise<LimitCheckResult> {
  try {
    // Pobierz dane dewelopera
    const developer = await createAdminClient()
      .from('developers')
      .select('subscription_plan, projects_limit, additional_projects_count')
      .eq('id', developerId)
      .single();

    if (developer.error || !developer.data) {
      throw new Error('Developer not found');
    }

    // Policz obecne projekty
    const { count: currentProjectsCount, error: countError } = await createAdminClient()
      .from('projects')
      .select('*', { count: 'exact', head: true })
      .eq('developer_id', developerId)
      .eq('status', 'active');

    if (countError) {
      throw new Error('Error counting projects');
    }

    const currentCount = currentProjectsCount || 0;
    const planType = developer.data.subscription_plan as SubscriptionPlanType;
    const additionalProjects = developer.data.additional_projects_count || 0;
    const plan = SUBSCRIPTION_PLANS[planType];

    const result = canAddProject(currentCount, additionalProjects, planType);
    const totalLimit = plan.projectsLimit ? plan.projectsLimit + additionalProjects : null;

    return {
      allowed: result.allowed,
      reason: result.reason,
      currentCount,
      limit: totalLimit,
      canAddPaid: result.canAddPaid,
      additionalCost: result.additionalCost
    };

  } catch (error) {
    console.error('Error checking project limit:', error);
    return {
      allowed: false,
      reason: 'Błąd sprawdzania limitów. Spróbuj ponownie.',
      currentCount: 0,
      limit: null
    };
  }
}

/**
 * Dodaje płatny projekt do planu Pro
 */
export async function addPaidProject(developerId: string): Promise<{ success: boolean; newMonthlyCost?: number; error?: string }> {
  try {
    // Sprawdź czy to plan Pro
    const developer = await createAdminClient()
      .from('developers')
      .select('subscription_plan, additional_projects_count')
      .eq('id', developerId)
      .single();

    if (developer.error || !developer.data) {
      return { success: false, error: 'Developer not found' };
    }

    if (developer.data.subscription_plan !== 'pro') {
      return { success: false, error: 'Płatne projekty dostępne tylko w planie Pro' };
    }

    const currentAdditional = developer.data.additional_projects_count || 0;
    const newAdditionalCount = currentAdditional + 1;

    // Zaktualizuj liczbę dodatkowych projektów
    const { error: updateError } = await createAdminClient()
      .from('developers')
      .update({
        additional_projects_count: newAdditionalCount,
        updated_at: new Date().toISOString()
      })
      .eq('id', developerId);

    if (updateError) {
      return { success: false, error: 'Błąd aktualizacji planu' };
    }

    // Oblicz nowy koszt miesięczny
    const baseCost = SUBSCRIPTION_PLANS.pro.price;
    const additionalCost = newAdditionalCount * (SUBSCRIPTION_PLANS.pro.additionalProjectFee || 0);
    const newMonthlyCost = baseCost + additionalCost;

    return {
      success: true,
      newMonthlyCost
    };

  } catch (error) {
    console.error('Error adding paid project:', error);
    return { success: false, error: 'Unexpected error' };
  }
}

/**
 * Pobiera pełne statystyki użycia dla dewelopera
 */
export async function getDeveloperUsageStats(developerId: string) {
  try {
    // Pobierz dane dewelopera
    const developer = await createAdminClient()
      .from('developers')
      .select(`
        subscription_plan,
        properties_limit,
        projects_limit,
        additional_projects_count,
        created_at
      `)
      .eq('id', developerId)
      .single();

    if (developer.error || !developer.data) {
      throw new Error('Developer not found');
    }

    // Policz properties i projekty
    const [propertiesResult, projectsResult] = await Promise.all([
      createAdminClient
        .from('properties')
        .select('status, project:projects!inner(developer_id)')
        .eq('project.developer_id', developerId),

      createAdminClient
        .from('projects')
        .select('status')
        .eq('developer_id', developerId)
    ]);

    if (propertiesResult.error || projectsResult.error) {
      throw new Error('Error fetching usage statistics');
    }

    const properties = propertiesResult.data || [];
    const projects = projectsResult.data || [];

    const planType = developer.data.subscription_plan as SubscriptionPlanType;
    const plan = SUBSCRIPTION_PLANS[planType];
    const additionalProjects = developer.data.additional_projects_count || 0;

    const stats = {
      plan: {
        type: planType,
        name: plan.displayName,
        color: plan.color,
        icon: plan.icon
      },
      properties: {
        total: properties.length,
        available: properties.filter(p => p.status === 'available').length,
        sold: properties.filter(p => p.status === 'sold').length,
        reserved: properties.filter(p => p.status === 'reserved').length,
        limit: plan.propertiesLimit,
        percentage: plan.propertiesLimit ? (properties.length / plan.propertiesLimit) * 100 : 0
      },
      projects: {
        total: projects.length,
        active: projects.filter(p => p.status === 'active').length,
        baseLimit: plan.projectsLimit,
        additional: additionalProjects,
        totalLimit: plan.projectsLimit ? plan.projectsLimit + additionalProjects : null
      },
      billing: {
        baseCost: plan.price,
        additionalCost: additionalProjects * (plan.additionalProjectFee || 0),
        totalMonthlyCost: plan.price + (additionalProjects * (plan.additionalProjectFee || 0))
      },
      limits: {
        canAddProperty: await checkPropertyLimit(developerId),
        canAddProject: await checkProjectLimit(developerId)
      }
    };

    return { success: true, stats };

  } catch (error) {
    console.error('Error getting usage stats:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Middleware do sprawdzania limitów przed akcjami
 */
export async function enforceSubscriptionLimits(
  developerId: string,
  action: 'add_property' | 'add_project'
): Promise<{ allowed: boolean; message?: string; upgradeRequired?: boolean }> {

  try {
    let result: LimitCheckResult;

    switch (action) {
      case 'add_property':
        result = await checkPropertyLimit(developerId);
        break;
      case 'add_project':
        result = await checkProjectLimit(developerId);
        break;
      default:
        return { allowed: false, message: 'Unknown action' };
    }

    if (!result.allowed) {
      return {
        allowed: false,
        message: result.reason || 'Limit exceeded',
        upgradeRequired: !result.canAddPaid
      };
    }

    return { allowed: true };

  } catch (error) {
    console.error('Error enforcing limits:', error);
    return {
      allowed: false,
      message: 'Błąd sprawdzania limitów. Spróbuj ponownie.'
    };
  }
}

/**
 * Funkcja pomocnicza do aktualizacji limitów po zmianie planu
 */
export async function updatePlanLimits(
  developerId: string,
  newPlan: SubscriptionPlanType,
  additionalProjects: number = 0
): Promise<{ success: boolean; error?: string }> {

  try {
    const plan = SUBSCRIPTION_PLANS[newPlan];

    const { error } = await createAdminClient()
      .from('developers')
      .update({
        subscription_plan: newPlan,
        properties_limit: plan.propertiesLimit,
        projects_limit: plan.projectsLimit,
        additional_projects_count: additionalProjects,
        updated_at: new Date().toISOString()
      })
      .eq('id', developerId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };

  } catch (error) {
    console.error('Error updating plan limits:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}