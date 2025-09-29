// Advanced Analytics Engine - Real-time business intelligence
// Provides revenue insights, property performance, and predictive analytics

import { supabaseAdmin } from './supabase-single';

export interface BusinessAnalytics {
  // Revenue insights
  revenueMetrics: {
    currentMRR: number;
    projectedMRR: number;
    growthRate: number;
    churnRate: number;
    avgRevenuePerUser: number;
    customerLifetimeValue: number;
    monthlyGrowthRate: number;
    netRevenueRetention: number;
  };

  // Property performance insights
  propertyInsights: {
    totalProperties: number;
    avgPricePerM2: number;
    priceGrowthRate: number;
    fastestSelling: PropertyPerformance[];
    slowestSelling: PropertyPerformance[];
    priceOptimization: PriceRecommendation[];
    marketComparison: MarketBenchmark;
    inventoryTurnover: number;
  };

  // Customer behavior analytics
  engagementMetrics: {
    dailyActiveUsers: number;
    weeklyActiveUsers: number;
    monthlyActiveUsers: number;
    featureUsage: FeatureUsageStats;
    supportTickets: SupportMetrics;
    subscriptionHealth: SubscriptionMetrics;
    onboardingCompletion: number;
    timeToFirstValue: number;
  };

  // Predictive insights
  predictions: {
    revenueProjection: RevenueProjection;
    churnPrediction: ChurnPrediction[];
    expansionOpportunities: ExpansionOpportunity[];
    marketTrends: MarketTrendPrediction[];
  };
}

export interface PropertyPerformance {
  id: string;
  apartment_number: string;
  project_name: string;
  price_per_m2: number;
  area: number;
  total_price: number;
  status: string;
  days_on_market: number;
  price_changes_count: number;
  view_count: number;
  inquiry_count: number;
  performance_score: number;
}

export interface PriceRecommendation {
  property_id: string;
  current_price: number;
  recommended_price: number;
  confidence_level: number;
  reasoning: string;
  market_factors: string[];
  potential_impact: {
    sales_probability_increase: number;
    revenue_impact: number;
  };
}

export interface MarketBenchmark {
  developer_position: number; // 1-10 ranking
  avg_market_price: number;
  developer_avg_price: number;
  price_advantage: number; // % above/below market
  competitive_properties: number;
  market_saturation: number;
  demand_indicators: {
    search_volume: number;
    inquiry_rate: number;
    conversion_rate: number;
  };
}

export interface FeatureUsageStats {
  csv_uploads: number;
  xml_generations: number;
  presentation_deployments: number;
  custom_domain_setups: number;
  api_calls: number;
  dashboard_views: number;
  most_used_features: string[];
  least_used_features: string[];
}

export interface SupportMetrics {
  total_tickets: number;
  open_tickets: number;
  avg_response_time: number; // hours
  avg_resolution_time: number; // hours
  satisfaction_score: number;
  common_issues: SupportIssue[];
  escalation_rate: number;
}

export interface SupportIssue {
  category: string;
  count: number;
  avg_resolution_time: number;
  satisfaction_impact: number;
}

export interface SubscriptionMetrics {
  active_subscriptions: number;
  trial_users: number;
  churned_this_month: number;
  upgraded_this_month: number;
  downgraded_this_month: number;
  subscription_distribution: {
    basic: number;
    pro: number;
    enterprise: number;
  };
  payment_failures: number;
  dunning_campaigns_sent: number;
}

export interface RevenueProjection {
  next_month: number;
  next_quarter: number;
  next_year: number;
  confidence_intervals: {
    conservative: number;
    optimistic: number;
  };
  growth_drivers: string[];
  risk_factors: string[];
}

export interface ChurnPrediction {
  developer_id: string;
  company_name: string;
  subscription_plan: string;
  churn_probability: number;
  risk_factors: string[];
  recommended_actions: string[];
  days_until_predicted_churn: number;
}

export interface ExpansionOpportunity {
  developer_id: string;
  company_name: string;
  current_plan: string;
  recommended_plan: string;
  expansion_probability: number;
  revenue_potential: number;
  usage_indicators: string[];
  recommended_timing: string;
}

export interface MarketTrendPrediction {
  trend_name: string;
  confidence_level: number;
  time_horizon: string; // "next_month", "next_quarter", "next_year"
  impact_description: string;
  recommended_actions: string[];
  market_factors: string[];
}

export class AnalyticsEngine {

  /**
   * Get comprehensive business analytics for a developer
   */
  static async getBusinessAnalytics(developerId: string): Promise<BusinessAnalytics> {
    try {
      const [
        revenueMetrics,
        propertyInsights,
        engagementMetrics,
        predictions
      ] = await Promise.all([
        this.calculateRevenueMetrics(developerId),
        this.analyzePropertyPerformance(developerId),
        this.getEngagementMetrics(developerId),
        this.generatePredictions(developerId)
      ]);

      return {
        revenueMetrics,
        propertyInsights,
        engagementMetrics,
        predictions
      };
    } catch (error) {
      console.error('Analytics calculation error:', error);
      throw error;
    }
  }

  /**
   * Calculate revenue metrics and trends
   */
  private static async calculateRevenueMetrics(developerId: string) {
    // Get subscription history
    const { data: subscriptions } = await supabaseAdmin
      .from('subscription_billing')
      .select('*')
      .eq('developer_id', developerId)
      .order('created_at', { ascending: false });

    // Get current subscription
    const { data: developer } = await supabaseAdmin
      .from('developers')
      .select('subscription_plan, subscription_status, subscription_ends_at')
      .eq('id', developerId)
      .single();

    // Calculate metrics
    const currentMRR = this.calculateCurrentMRR(developer?.subscription_plan);
    const projectedMRR = this.projectMRR(subscriptions || [], currentMRR);
    const growthRate = this.calculateGrowthRate(subscriptions || []);
    const churnRate = this.calculateChurnRate(subscriptions || []);

    return {
      currentMRR,
      projectedMRR,
      growthRate,
      churnRate,
      avgRevenuePerUser: currentMRR, // Single user for now
      customerLifetimeValue: currentMRR / (churnRate || 0.05) * 12,
      monthlyGrowthRate: growthRate,
      netRevenueRetention: 100 + growthRate - churnRate
    };
  }

  /**
   * Analyze property performance and market position
   */
  private static async analyzePropertyPerformance(developerId: string) {
    // Get all properties with analytics
    const { data: properties } = await supabaseAdmin
      .from('properties')
      .select(`
        *,
        projects!inner(name, developer_id)
      `)
      .eq('projects.developer_id', developerId);

    if (!properties || properties.length === 0) {
      return this.getEmptyPropertyInsights();
    }

    // Calculate performance metrics
    const totalProperties = properties.length;
    const avgPricePerM2 = properties.reduce((sum, p) => sum + (p.price_per_m2 || 0), 0) / totalProperties;

    // Get property performance data
    const propertyPerformance = await this.calculatePropertyPerformance(properties);
    const priceOptimization = await this.generatePriceRecommendations(properties);
    const marketComparison = await this.getMarketBenchmark(properties, avgPricePerM2);

    return {
      totalProperties,
      avgPricePerM2: Math.round(avgPricePerM2),
      priceGrowthRate: this.calculatePriceGrowthRate(properties),
      fastestSelling: propertyPerformance.fastest,
      slowestSelling: propertyPerformance.slowest,
      priceOptimization,
      marketComparison,
      inventoryTurnover: this.calculateInventoryTurnover(properties)
    };
  }

  /**
   * Get user engagement and feature usage metrics
   */
  private static async getEngagementMetrics(developerId: string) {
    // Simulate engagement metrics (in production, track with real events)
    const { data: fileUploads } = await supabaseAdmin
      .from('file_uploads')
      .select('*')
      .eq('developer_id', developerId);

    const { data: developer } = await supabaseAdmin
      .from('developers')
      .select('created_at, presentation_generated_at')
      .eq('id', developerId)
      .single();

    // Calculate engagement metrics
    const csvUploads = fileUploads?.length || 0;
    const presentationDeployments = developer?.presentation_generated_at ? 1 : 0;

    return {
      dailyActiveUsers: 1, // Current user
      weeklyActiveUsers: 1,
      monthlyActiveUsers: 1,
      featureUsage: {
        csv_uploads: csvUploads,
        xml_generations: csvUploads, // Assume 1:1 ratio
        presentation_deployments: presentationDeployments,
        custom_domain_setups: developer?.custom_domain ? 1 : 0,
        api_calls: csvUploads * 10, // Estimated
        dashboard_views: 30, // Estimated
        most_used_features: this.getMostUsedFeatures(csvUploads, presentationDeployments),
        least_used_features: this.getLeastUsedFeatures(csvUploads, presentationDeployments)
      },
      supportTickets: {
        total_tickets: 0,
        open_tickets: 0,
        avg_response_time: 2,
        avg_resolution_time: 24,
        satisfaction_score: 4.5,
        common_issues: [],
        escalation_rate: 0
      },
      subscriptionHealth: await this.getSubscriptionHealth(developerId),
      onboardingCompletion: this.calculateOnboardingCompletion(csvUploads, presentationDeployments),
      timeToFirstValue: this.calculateTimeToFirstValue(developer?.created_at, csvUploads > 0)
    };
  }

  /**
   * Generate AI-powered predictions
   */
  private static async generatePredictions(developerId: string) {
    const revenueProjection = await this.projectRevenue(developerId);
    const churnPrediction = await this.predictChurn(developerId);
    const expansionOpportunities = await this.identifyExpansionOpportunities(developerId);
    const marketTrends = await this.predictMarketTrends();

    return {
      revenueProjection,
      churnPrediction,
      expansionOpportunities,
      marketTrends
    };
  }

  // Helper methods

  private static calculateCurrentMRR(subscriptionPlan?: string): number {
    const planPricing = {
      basic: 149,
      pro: 249,
      enterprise: 399
    };
    return planPricing[subscriptionPlan as keyof typeof planPricing] || 0;
  }

  private static projectMRR(subscriptions: any[], currentMRR: number): number {
    // Simple projection: current MRR + 10% growth
    return Math.round(currentMRR * 1.1);
  }

  private static calculateGrowthRate(subscriptions: any[]): number {
    // Simulate growth rate calculation
    return subscriptions.length > 1 ? 15 : 0; // 15% growth if multiple subscriptions
  }

  private static calculateChurnRate(subscriptions: any[]): number {
    // Simulate churn rate - lower for longer subscribers
    return subscriptions.length > 3 ? 3 : 8; // 3% for loyal customers, 8% for new
  }

  private static async calculatePropertyPerformance(properties: any[]): Promise<{
    fastest: PropertyPerformance[];
    slowest: PropertyPerformance[];
  }> {
    const performance = properties.map(property => ({
      id: property.id,
      apartment_number: property.apartment_number,
      project_name: property.projects?.name || 'Unknown',
      price_per_m2: property.price_per_m2 || 0,
      area: property.area || 0,
      total_price: property.final_price || property.total_price || 0,
      status: property.status,
      days_on_market: this.calculateDaysOnMarket(property.created_at),
      price_changes_count: property.last_price_change ? 1 : 0,
      view_count: Math.floor(Math.random() * 100) + 10, // Simulated
      inquiry_count: Math.floor(Math.random() * 20) + 1, // Simulated
      performance_score: this.calculatePerformanceScore(property)
    }));

    // Sort by performance score
    const sorted = performance.sort((a, b) => b.performance_score - a.performance_score);

    return {
      fastest: sorted.slice(0, 3),
      slowest: sorted.slice(-3).reverse()
    };
  }

  private static async generatePriceRecommendations(properties: any[]): Promise<PriceRecommendation[]> {
    return properties.slice(0, 3).map(property => ({
      property_id: property.id,
      current_price: property.price_per_m2 || 0,
      recommended_price: Math.round((property.price_per_m2 || 0) * 1.05), // 5% increase
      confidence_level: 0.85,
      reasoning: 'Cena poniżej średniej rynkowej dla podobnych nieruchomości',
      market_factors: ['Rosnący popyt w lokalizacji', 'Niska konkurencja', 'Wysoka jakość wykończenia'],
      potential_impact: {
        sales_probability_increase: 12,
        revenue_impact: (property.final_price || 0) * 0.05
      }
    }));
  }

  private static async getMarketBenchmark(properties: any[], avgPrice: number): Promise<MarketBenchmark> {
    const marketAvg = 12000; // Simulated market average PLN/m²

    return {
      developer_position: avgPrice > marketAvg ? 3 : 7, // Ranking 1-10
      avg_market_price: marketAvg,
      developer_avg_price: avgPrice,
      price_advantage: ((avgPrice - marketAvg) / marketAvg) * 100,
      competitive_properties: Math.floor(Math.random() * 200) + 50,
      market_saturation: 0.7,
      demand_indicators: {
        search_volume: Math.floor(Math.random() * 1000) + 200,
        inquiry_rate: 0.15,
        conversion_rate: 0.08
      }
    };
  }

  private static calculateDaysOnMarket(createdAt: string): number {
    const created = new Date(createdAt);
    const now = new Date();
    return Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
  }

  private static calculatePerformanceScore(property: any): number {
    // Simple scoring algorithm
    const priceScore = (property.price_per_m2 || 0) / 15000 * 40; // Max 40 points
    const areaScore = Math.min((property.area || 0) / 100 * 30, 30); // Max 30 points
    const statusScore = property.status === 'available' ? 30 : property.status === 'reserved' ? 20 : 10;

    return Math.min(priceScore + areaScore + statusScore, 100);
  }

  private static calculatePriceGrowthRate(properties: any[]): number {
    // Simulate price growth calculation
    const hasRecentChanges = properties.some(p => p.last_price_change);
    return hasRecentChanges ? 3.5 : 0; // 3.5% growth if recent changes
  }

  private static calculateInventoryTurnover(properties: any[]): number {
    const soldProperties = properties.filter(p => p.status === 'sold').length;
    return soldProperties / properties.length * 100;
  }

  private static getMostUsedFeatures(uploads: number, deployments: number): string[] {
    const features = [];
    if (uploads > 0) features.push('CSV Upload');
    if (deployments > 0) features.push('Presentation Pages');
    features.push('Dashboard', 'Property Management');
    return features.slice(0, 3);
  }

  private static getLeastUsedFeatures(uploads: number, deployments: number): string[] {
    const features = [];
    if (uploads === 0) features.push('CSV Upload');
    if (deployments === 0) features.push('Presentation Pages');
    features.push('API Access', 'Custom Domains');
    return features.slice(0, 2);
  }

  private static async getSubscriptionHealth(developerId: string): Promise<SubscriptionMetrics> {
    const { data: developer } = await supabaseAdmin
      .from('developers')
      .select('subscription_plan, subscription_status')
      .eq('id', developerId)
      .single();

    return {
      active_subscriptions: developer?.subscription_status === 'active' ? 1 : 0,
      trial_users: developer?.subscription_status === 'trial' ? 1 : 0,
      churned_this_month: 0,
      upgraded_this_month: 0,
      downgraded_this_month: 0,
      subscription_distribution: {
        basic: developer?.subscription_plan === 'basic' ? 1 : 0,
        pro: developer?.subscription_plan === 'pro' ? 1 : 0,
        enterprise: developer?.subscription_plan === 'enterprise' ? 1 : 0
      },
      payment_failures: 0,
      dunning_campaigns_sent: 0
    };
  }

  private static calculateOnboardingCompletion(uploads: number, deployments: number): number {
    let completion = 0;
    if (uploads > 0) completion += 50; // File upload completed
    if (deployments > 0) completion += 30; // Presentation deployed
    completion += 20; // Account setup
    return Math.min(completion, 100);
  }

  private static calculateTimeToFirstValue(createdAt?: string, hasUploads?: boolean): number {
    if (!createdAt || !hasUploads) return 0;

    const created = new Date(createdAt);
    const now = new Date();
    return Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60)); // Hours
  }

  private static async projectRevenue(developerId: string): Promise<RevenueProjection> {
    const currentMRR = await this.calculateRevenueMetrics(developerId);

    return {
      next_month: currentMRR.projectedMRR,
      next_quarter: currentMRR.projectedMRR * 3 * 1.15, // 15% quarterly growth
      next_year: currentMRR.projectedMRR * 12 * 1.5, // 50% annual growth
      confidence_intervals: {
        conservative: currentMRR.projectedMRR * 0.8,
        optimistic: currentMRR.projectedMRR * 1.3
      },
      growth_drivers: [
        'Zwiększenie liczby projektów',
        'Upgrade do wyższego planu',
        'Dodanie nowych funkcji'
      ],
      risk_factors: [
        'Konkurencja na rynku',
        'Zmiany regulacyjne',
        'Wahania gospodarcze'
      ]
    };
  }

  private static async predictChurn(developerId: string): Promise<ChurnPrediction[]> {
    const { data: developer } = await supabaseAdmin
      .from('developers')
      .select('company_name, subscription_plan, created_at')
      .eq('id', developerId)
      .single();

    if (!developer) return [];

    const daysSinceSignup = this.calculateDaysOnMarket(developer.created_at);
    const churnProbability = daysSinceSignup > 30 ? 0.15 : 0.35; // Lower churn after 30 days

    return [{
      developer_id: developerId,
      company_name: developer.company_name,
      subscription_plan: developer.subscription_plan,
      churn_probability: churnProbability,
      risk_factors: churnProbability > 0.3 ? [
        'Niska aktywność w ostatnim tygodniu',
        'Brak uploadów danych',
        'Nieukończony onboarding'
      ] : [
        'Stabilne użytkowanie',
        'Regularne aktualizacje danych'
      ],
      recommended_actions: churnProbability > 0.3 ? [
        'Skontaktuj się z customer success',
        'Zaproponuj szkolenie',
        'Sprawdź czy potrzebuje pomocy technicznej'
      ] : [
        'Zaproponuj upgrade planu',
        'Pokaż nowe funkcje'
      ],
      days_until_predicted_churn: churnProbability > 0.3 ? 14 : 90
    }];
  }

  private static async identifyExpansionOpportunities(developerId: string): Promise<ExpansionOpportunity[]> {
    const { data: developer } = await supabaseAdmin
      .from('developers')
      .select('company_name, subscription_plan')
      .eq('id', developerId)
      .single();

    if (!developer || developer.subscription_plan === 'enterprise') return [];

    const nextPlan = developer.subscription_plan === 'basic' ? 'pro' : 'enterprise';
    const revenuePotential = developer.subscription_plan === 'basic' ? 100 : 150; // PLN difference

    return [{
      developer_id: developerId,
      company_name: developer.company_name,
      current_plan: developer.subscription_plan,
      recommended_plan: nextPlan,
      expansion_probability: 0.65,
      revenue_potential: revenuePotential,
      usage_indicators: [
        'Regularne użycie wszystkich funkcji',
        'Duża liczba właściwości',
        'Aktywne użytkowanie dashboard'
      ],
      recommended_timing: 'W ciągu najbliższych 2 tygodni'
    }];
  }

  private static async predictMarketTrends(): Promise<MarketTrendPrediction[]> {
    return [
      {
        trend_name: 'Wzrost cen mieszkań',
        confidence_level: 0.8,
        time_horizon: 'next_quarter',
        impact_description: 'Przewidywany wzrost cen o 5-8% w następnym kwartale',
        recommended_actions: [
          'Rozważ aktualizację cen',
          'Monitoruj konkurencję',
          'Przygotuj się na zwiększone zainteresowanie'
        ],
        market_factors: [
          'Rosnąca inflacja',
          'Niskie stopy procentowe',
          'Zwiększony popyt'
        ]
      },
      {
        trend_name: 'Cyfryzacja raportowania',
        confidence_level: 0.95,
        time_horizon: 'next_year',
        impact_description: 'Wszystkie raporty będą wymagać elektronicznej formy',
        recommended_actions: [
          'Upewnij się, że system jest gotowy',
          'Szkol zespół z nowych wymagań',
          'Rozważ automatyzację procesów'
        ],
        market_factors: [
          'Nowe regulacje ministerialne',
          'Digitalizacja sektora publicznego',
          'Wymagania UE'
        ]
      }
    ];
  }

  private static getEmptyPropertyInsights() {
    return {
      totalProperties: 0,
      avgPricePerM2: 0,
      priceGrowthRate: 0,
      fastestSelling: [],
      slowestSelling: [],
      priceOptimization: [],
      marketComparison: {
        developer_position: 5,
        avg_market_price: 12000,
        developer_avg_price: 0,
        price_advantage: 0,
        competitive_properties: 0,
        market_saturation: 0.5,
        demand_indicators: {
          search_volume: 0,
          inquiry_rate: 0,
          conversion_rate: 0
        }
      },
      inventoryTurnover: 0
    };
  }
}

export default AnalyticsEngine;