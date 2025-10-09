/**
 * FAZA 1: Nowy system planów subskrypcji
 * - Basic: 20 mieszkań, 1 projekt, 149zł/miesiąc
 * - Pro: unlimited mieszkania, 2 projekty, 249zł/miesiąc + 50zł za dodatkowy projekt
 * - Enterprise: unlimited wszystko, 499zł/miesiąc + custom domains
 */

export type SubscriptionPlanType = 'basic' | 'pro' | 'enterprise';

export interface SubscriptionPlan {
  id: SubscriptionPlanType;
  name: string;
  displayName: string;
  price: number; // w groszach (np. 14900 = 149zł)
  yearlyPrice?: number; // opcjonalnie dla przyszłości
  propertiesLimit: number | null; // null = unlimited
  projectsLimit: number | null; // null = unlimited
  additionalProjectFee?: number; // w groszach, tylko dla Pro
  features: string[];
  limitations?: string[];
  recommended?: boolean;
  color: string; // dla UI
  icon: string;
}

export const SUBSCRIPTION_PLANS: Record<SubscriptionPlanType, SubscriptionPlan> = {
  basic: {
    id: 'basic',
    name: 'Basic',
    displayName: 'Plan Basic',
    price: 14900, // 149zł
    propertiesLimit: 20,
    projectsLimit: 1,
    features: [
      '1 inwestycja',
      'Maksymalnie 20 mieszkań',
      'Automatyczne raporty XML/CSV/MD5',
      'Publiczne endpointy dla dane.gov.pl',
      'Codzienne automatyczne aktualizacje',
      'Email support (odpowiedź do 24h)',
      'Historia zmian cen'
    ],
    limitations: [
      'Maksymalnie 20 mieszkań',
      'Maksymalnie 1 projekt'
    ],
    color: 'blue',
    icon: '🏠'
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    displayName: 'Plan Pro',
    price: 24900, // 249zł
    propertiesLimit: null, // unlimited
    projectsLimit: 2,
    additionalProjectFee: 5000, // +50zł za projekt
    features: [
      '2 inwestycje w cenie bazowej',
      '+50 zł/msc za każdą dodatkową',
      'Unlimited liczba mieszkań',
      'Wszystko z planu Basic',
      'Subdomena nazwa.oto-raport.pl',
      'Strona z cenami dla klientów',
      'Priority email support',
      'Zaawansowane analytics i raporty',
      'Historia cen z wykresami'
    ],
    limitations: [
      'Dodatkowe projekty: +50zł/miesiąc każdy'
    ],
    recommended: true,
    color: 'green',
    icon: '🚀'
  },
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    displayName: 'Plan Enterprise',
    price: 49900, // 499zł
    propertiesLimit: null, // unlimited
    projectsLimit: null, // unlimited
    features: [
      'Unlimited inwestycje i mieszkania',
      'Wszystko z planu Pro',
      'Custom domena (ceny.twojafirma.pl)',
      'Własne SSL certificate',
      'White-label branding',
      'Dedicated account manager',
      'API access dla integracji',
      'SLA 99.9% uptime z kompensacją',
      'Priorytetowy support (odpowiedź do 2h)',
      'Custom raportowanie i eksporty'
    ],
    color: 'purple',
    icon: '⭐'
  }
};

// Funkcja do obliczania miesięcznego kosztu
export function calculateMonthlyCost(
  planType: SubscriptionPlanType,
  additionalProjects: number = 0
): number {
  const plan = SUBSCRIPTION_PLANS[planType];
  let totalCost = plan.price;

  // Dodaj koszt dodatkowych projektów (tylko dla Pro)
  if (planType === 'pro' && additionalProjects > 0 && plan.additionalProjectFee) {
    totalCost += additionalProjects * plan.additionalProjectFee;
  }

  return totalCost;
}

// Funkcja dedykowana do obliczania kosztu Pro plan (dla UI components)
export function calculateProPlanCost(additionalProjects: number = 0): {
  basePrice: number;
  additionalFee: number;
  totalPrice: number;
  breakdown: string;
} {
  const proPlan = SUBSCRIPTION_PLANS.pro;
  const basePrice = proPlan.price;
  const additionalFee = additionalProjects * (proPlan.additionalProjectFee || 0);
  const totalPrice = basePrice + additionalFee;

  const breakdown = additionalProjects > 0
    ? `${formatPrice(basePrice)} (bazowy) + ${additionalProjects} × ${formatPrice(proPlan.additionalProjectFee || 0)} = ${formatPrice(totalPrice)}`
    : formatPrice(basePrice);

  return {
    basePrice,
    additionalFee,
    totalPrice,
    breakdown
  };
}

// Funkcja do formatowania ceny w polskiej walucie
export function formatPrice(priceInGrosze: number): string {
  return `${(priceInGrosze / 100).toLocaleString('pl-PL')} zł`;
}

// Sprawdzenie czy użytkownik może dodać property
export function canAddProperty(
  currentPropertiesCount: number,
  planType: SubscriptionPlanType
): { allowed: boolean; reason?: string } {
  const plan = SUBSCRIPTION_PLANS[planType];

  if (plan.propertiesLimit === null) {
    return { allowed: true }; // unlimited
  }

  if (currentPropertiesCount >= plan.propertiesLimit) {
    return {
      allowed: false,
      reason: `Osiągnąłeś limit ${plan.propertiesLimit} mieszkań dla planu ${plan.displayName}. Przejdź na plan Pro lub Enterprise.`
    };
  }

  return { allowed: true };
}

// Sprawdzenie czy użytkownik może dodać projekt
export function canAddProject(
  currentProjectsCount: number,
  additionalProjectsCount: number,
  planType: SubscriptionPlanType
): { allowed: boolean; reason?: string; canAddPaid?: boolean; additionalCost?: number } {
  const plan = SUBSCRIPTION_PLANS[planType];

  if (plan.projectsLimit === null) {
    return { allowed: true }; // unlimited dla Enterprise
  }

  const maxProjects = plan.projectsLimit + additionalProjectsCount;

  if (currentProjectsCount >= maxProjects) {
    if (planType === 'pro') {
      return {
        allowed: false,
        reason: 'Osiągnąłeś limit projektów. Możesz dodać kolejny za +50zł/miesiąc lub przejść na Enterprise.',
        canAddPaid: true,
        additionalCost: plan.additionalProjectFee
      };
    } else {
      return {
        allowed: false,
        reason: `Osiągnąłeś limit ${plan.projectsLimit} projekt${plan.projectsLimit === 1 ? '' : 'ów'} dla planu ${plan.displayName}. Przejdź na plan Pro lub Enterprise.`
      };
    }
  }

  return { allowed: true };
}

// Rekomendacje upgrade'u
export function getUpgradeRecommendation(
  currentPlan: SubscriptionPlanType,
  propertiesCount: number,
  projectsCount: number
): { shouldUpgrade: boolean; recommendedPlan?: SubscriptionPlanType; reasons: string[] } {
  const reasons: string[] = [];
  let shouldUpgrade = false;
  let recommendedPlan: SubscriptionPlanType | undefined;

  if (currentPlan === 'basic') {
    if (propertiesCount > 15) {
      reasons.push('Masz dużo mieszkań - w Pro nie ma limitów');
      shouldUpgrade = true;
      recommendedPlan = 'pro';
    }
    if (projectsCount > 0) {
      reasons.push('Potrzebujesz więcej projektów');
      shouldUpgrade = true;
      recommendedPlan = 'pro';
    }
  }

  if (currentPlan === 'pro') {
    if (projectsCount > 3) {
      reasons.push('Enterprise będzie tańszy przy wielu projektach');
      shouldUpgrade = true;
      recommendedPlan = 'enterprise';
    }
  }

  return { shouldUpgrade, recommendedPlan, reasons };
}

// Funkcja do tworzenia billing record
export interface BillingCalculation {
  basePlanPrice: number;
  additionalProjectsFee: number;
  totalMonthlyCost: number;
  breakdown: {
    planName: string;
    basePrice: string;
    additionalProjects?: {
      count: number;
      unitPrice: string;
      totalPrice: string;
    };
    total: string;
  };
}

export function calculateBilling(
  planType: SubscriptionPlanType,
  additionalProjects: number = 0
): BillingCalculation {
  const plan = SUBSCRIPTION_PLANS[planType];
  const basePlanPrice = plan.price;
  const additionalProjectsFee = (planType === 'pro' && additionalProjects > 0)
    ? additionalProjects * (plan.additionalProjectFee || 0)
    : 0;
  const totalMonthlyCost = basePlanPrice + additionalProjectsFee;

  const breakdown: BillingCalculation['breakdown'] = {
    planName: plan.displayName,
    basePrice: formatPrice(basePlanPrice),
    total: formatPrice(totalMonthlyCost)
  };

  if (additionalProjects > 0 && additionalProjectsFee > 0) {
    breakdown.additionalProjects = {
      count: additionalProjects,
      unitPrice: formatPrice(plan.additionalProjectFee || 0),
      totalPrice: formatPrice(additionalProjectsFee)
    };
  }

  return {
    basePlanPrice,
    additionalProjectsFee,
    totalMonthlyCost,
    breakdown
  };
}

// Helper do UI - pobieranie planu z opisem
export function getPlanWithUsage(
  planType: SubscriptionPlanType,
  currentProperties: number,
  currentProjects: number,
  additionalProjects: number = 0
) {
  const plan = SUBSCRIPTION_PLANS[planType];
  const billing = calculateBilling(planType, additionalProjects);

  return {
    ...plan,
    billing,
    usage: {
      properties: {
        current: currentProperties,
        limit: plan.propertiesLimit,
        percentage: plan.propertiesLimit ? (currentProperties / plan.propertiesLimit) * 100 : 0
      },
      projects: {
        current: currentProjects,
        baseLimit: plan.projectsLimit,
        additional: additionalProjects,
        totalLimit: plan.projectsLimit ? plan.projectsLimit + additionalProjects : null
      }
    }
  };
}

// Interface dla sprawdzania limitów subskrypcji
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

// Sprawdzenie limitów subskrypcji dla developera
export async function checkSubscriptionLimits(developerId: string): Promise<SubscriptionLimitsCheck> {
  try {
    // Import Supabase dynamically to avoid circular dependencies
    const { createAdminClient } = await import('@/lib/supabase/server');

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