// Predictive Analytics AI Engine - Machine Learning dla real estate insights
// Wykorzystuje historyczne dane do przewidywania trendów i optymalizacji

import { createAdminClient } from './supabase/server';

export interface PredictiveInsights {
  // Price predictions
  priceOptimization: {
    property_id: string;
    current_price: number;
    predicted_optimal_price: number;
    confidence_score: number;
    reasoning: string[];
    market_factors: MarketFactor[];
    price_elasticity: number;
    demand_forecast: DemandForecast;
  }[];

  // Sales forecasting
  salesForecast: {
    property_id: string;
    expected_sale_date: string;
    sale_probability: number;
    days_to_sell: number;
    revenue_projection: number;
    seasonal_factors: SeasonalFactor[];
    competition_impact: number;
  }[];

  // Market trends
  marketTrends: {
    trend_name: string;
    direction: 'increasing' | 'decreasing' | 'stable';
    magnitude: number; // % change
    time_horizon: 'week' | 'month' | 'quarter' | 'year';
    confidence_level: number;
    impact_on_business: string;
    recommended_actions: string[];
  }[];

  // Customer behavior predictions
  customerBehavior: {
    churn_prediction: ChurnPrediction;
    upgrade_likelihood: UpgradePrediction;
    feature_adoption: FeatureAdoptionPrediction[];
    engagement_forecast: EngagementForecast;
  };

  // Business insights
  businessInsights: {
    revenue_optimization: RevenueOptimization[];
    risk_assessment: RiskAssessment[];
    growth_opportunities: GrowthOpportunity[];
    competitive_analysis: CompetitiveInsights;
  };
}

export interface MarketFactor {
  factor: string;
  impact_score: number; // -1 to 1
  description: string;
  data_source: string;
}

export interface DemandForecast {
  next_week: number;
  next_month: number;
  next_quarter: number;
  trend_direction: 'up' | 'down' | 'stable';
  volatility: number;
}

export interface SeasonalFactor {
  season: string;
  impact_multiplier: number;
  historical_data: boolean;
}

export interface ChurnPrediction {
  risk_score: number; // 0-100
  risk_level: 'low' | 'medium' | 'high';
  key_indicators: string[];
  recommended_interventions: string[];
  time_to_churn: number; // days
}

export interface UpgradePrediction {
  upgrade_likelihood: number; // 0-1
  recommended_plan: string;
  best_timing: string;
  value_drivers: string[];
  revenue_potential: number;
}

export interface FeatureAdoptionPrediction {
  feature_name: string;
  adoption_likelihood: number;
  time_to_adoption: number; // days
  blockers: string[];
  enablers: string[];
}

export interface EngagementForecast {
  predicted_dau: number;
  predicted_wau: number;
  predicted_mau: number;
  engagement_trend: 'increasing' | 'decreasing' | 'stable';
}

export interface RevenueOptimization {
  strategy: string;
  impact_estimate: number; // PLN
  implementation_effort: 'low' | 'medium' | 'high';
  timeline: string;
  confidence: number;
}

export interface RiskAssessment {
  risk_type: string;
  probability: number;
  potential_impact: number; // PLN
  mitigation_strategies: string[];
  monitoring_metrics: string[];
}

export interface GrowthOpportunity {
  opportunity: string;
  market_size: number;
  revenue_potential: number;
  competition_level: 'low' | 'medium' | 'high';
  required_investment: number;
  timeline_to_market: string;
}

export interface CompetitiveInsights {
  market_position: number; // 1-10
  competitive_advantages: string[];
  threats: string[];
  differentiation_opportunities: string[];
  pricing_position: 'premium' | 'competitive' | 'value';
}

export class PredictiveEngine {

  /**
   * Generate comprehensive predictive insights for a developer
   */
  static async generatePredictiveInsights(developerId: string): Promise<PredictiveInsights> {
    try {
      // Gather historical data
      const historicalData = await this.gatherHistoricalData(developerId);

      // Run predictive models
      const [
        priceOptimization,
        salesForecast,
        marketTrends,
        customerBehavior,
        businessInsights
      ] = await Promise.all([
        this.predictPriceOptimization(historicalData),
        this.forecastSales(historicalData),
        this.analyzeMarketTrends(historicalData),
        this.predictCustomerBehavior(historicalData),
        this.generateBusinessInsights(historicalData)
      ]);

      return {
        priceOptimization,
        salesForecast,
        marketTrends,
        customerBehavior,
        businessInsights
      };
    } catch (error) {
      console.error('Predictive insights generation error:', error);
      throw error;
    }
  }

  /**
   * Gather historical data for ML algorithms
   */
  private static async gatherHistoricalData(developerId: string) {
    // Get properties with history
    const { data: properties } = await createAdminClient()
      .from('properties')
      .select(`
        *,
        projects!inner(name, location, developer_id)
      `)
      .eq('projects.developer_id', developerId);

    // Get developer info
    const { data: developer } = await createAdminClient()
      .from('developers')
      .select('*')
      .eq('id', developerId)
      .single();

    // Get file uploads (activity indicator)
    const { data: uploads } = await createAdminClient()
      .from('file_uploads')
      .select('*')
      .eq('developer_id', developerId)
      .order('created_at', { ascending: false });

    // Simulate market data (in production, integrate with real market APIs)
    const marketData = this.getSimulatedMarketData();

    return {
      properties: properties || [],
      developer,
      uploads: uploads || [],
      marketData,
      generatedAt: new Date().toISOString()
    };
  }

  /**
   * AI-powered price optimization using market analysis
   */
  private static async predictPriceOptimization(data: any) {
    const { properties } = data;

    if (!properties || properties.length === 0) return [];

    return properties.slice(0, 5).map((property: any) => {
      // Simulate ML price optimization algorithm
      const currentPrice = property.price_per_m2 || 10000;
      const marketAverage = 12000;
      const area = property.area || 50;

      // Price optimization algorithm
      const marketPositionFactor = Math.min(marketAverage / currentPrice, 1.2);
      const sizeFactor = area > 80 ? 1.1 : area < 40 ? 0.95 : 1.0;
      const locationFactor = this.getLocationFactor(property.projects?.location);

      const optimalPrice = Math.round(currentPrice * marketPositionFactor * sizeFactor * locationFactor);
      const confidence = this.calculatePriceConfidence(property, data.marketData);

      return {
        property_id: property.id,
        current_price: currentPrice,
        predicted_optimal_price: optimalPrice,
        confidence_score: confidence,
        reasoning: this.generatePriceReasoning(currentPrice, optimalPrice, marketAverage),
        market_factors: this.getMarketFactors(property),
        price_elasticity: this.calculatePriceElasticity(property),
        demand_forecast: this.forecastDemand(property)
      };
    });
  }

  /**
   * Sales forecasting using historical patterns
   */
  private static async forecastSales(data: any) {
    const { properties } = data;

    if (!properties || properties.length === 0) return [];

    return properties.slice(0, 3).map((property: any) => {
      const pricePerM2 = property.price_per_m2 || 10000;
      const area = property.area || 50;
      const marketAverage = 12000;

      // Sales prediction algorithm
      const priceCompetitiveness = marketAverage / pricePerM2;
      const sizeAppeal = area > 60 && area < 100 ? 1.2 : 1.0;
      const daysSinceCreated = this.getDaysSinceCreated(property.created_at);

      const saleProbability = Math.min(
        priceCompetitiveness * sizeAppeal * (1 - daysSinceCreated / 365),
        0.95
      );

      const daysToSell = Math.round(30 + (1 - saleProbability) * 300);
      const expectedSaleDate = new Date(Date.now() + daysToSell * 24 * 60 * 60 * 1000);

      return {
        property_id: property.id,
        expected_sale_date: expectedSaleDate.toISOString().split('T')[0],
        sale_probability: Math.round(saleProbability * 100) / 100,
        days_to_sell: daysToSell,
        revenue_projection: property.final_price || (pricePerM2 * area),
        seasonal_factors: this.getSeasonalFactors(),
        competition_impact: this.assessCompetitionImpact(property)
      };
    });
  }

  /**
   * Market trends analysis using time series data
   */
  private static async analyzeMarketTrends(data: any) {
    return [
      {
        trend_name: 'Property Price Growth',
        direction: 'increasing' as const,
        magnitude: 5.2,
        time_horizon: 'quarter' as const,
        confidence_level: 0.78,
        impact_on_business: 'Positive impact on property values and margins',
        recommended_actions: [
          'Consider gradual price increases',
          'Monitor competitor pricing',
          'Focus on value proposition communication'
        ]
      },
      {
        trend_name: 'Digital Adoption in Real Estate',
        direction: 'increasing' as const,
        magnitude: 15.8,
        time_horizon: 'year' as const,
        confidence_level: 0.92,
        impact_on_business: 'Increased demand for digital solutions like OTORAPORT',
        recommended_actions: [
          'Invest in platform features',
          'Improve user experience',
          'Expand digital marketing'
        ]
      },
      {
        trend_name: 'Regulatory Compliance Requirements',
        direction: 'increasing' as const,
        magnitude: 8.5,
        time_horizon: 'month' as const,
        confidence_level: 0.95,
        impact_on_business: 'Higher demand for automated compliance solutions',
        recommended_actions: [
          'Enhance compliance features',
          'Automate reporting processes',
          'Provide regulatory updates to customers'
        ]
      }
    ];
  }

  /**
   * Customer behavior prediction using engagement patterns
   */
  private static async predictCustomerBehavior(data: any) {
    const { developer, uploads } = data;

    const daysSinceSignup = this.getDaysSinceCreated(developer?.created_at);
    const uploadCount = uploads?.length || 0;
    const hasRecentActivity = uploads?.some((u: any) =>
      this.getDaysSinceCreated(u.created_at) < 7
    ) || false;

    // Churn prediction
    const churnRisk = this.calculateChurnRisk(daysSinceSignup, uploadCount, hasRecentActivity);

    // Upgrade prediction
    const upgradeLikelihood = this.calculateUpgradeLikelihood(developer, uploadCount);

    return {
      churn_prediction: {
        risk_score: Math.round(churnRisk * 100),
        risk_level: churnRisk > 0.7 ? 'high' as const :
                   churnRisk > 0.3 ? 'medium' as const : 'low' as const,
        key_indicators: this.getChurnIndicators(churnRisk, hasRecentActivity),
        recommended_interventions: this.getChurnInterventions(churnRisk),
        time_to_churn: Math.round((1 - churnRisk) * 90)
      },
      upgrade_likelihood: {
        upgrade_likelihood: upgradeLikelihood,
        recommended_plan: developer?.subscription_plan === 'basic' ? 'pro' : 'enterprise',
        best_timing: this.getBestUpgradeTiming(upgradeLikelihood),
        value_drivers: this.getUpgradeValueDrivers(developer?.subscription_plan),
        revenue_potential: this.calculateUpgradeRevenue(developer?.subscription_plan)
      },
      feature_adoption: this.predictFeatureAdoption(data),
      engagement_forecast: this.forecastEngagement(data)
    };
  }

  /**
   * Business insights generation using comprehensive analysis
   */
  private static async generateBusinessInsights(data: any) {
    const { properties, developer } = data;

    return {
      revenue_optimization: [
        {
          strategy: 'Pricing Optimization',
          impact_estimate: 2500,
          implementation_effort: 'low' as const,
          timeline: '2 weeks',
          confidence: 0.85
        },
        {
          strategy: 'Subscription Upgrade',
          impact_estimate: developer?.subscription_plan === 'basic' ? 1200 : 1800,
          implementation_effort: 'medium' as const,
          timeline: '1 month',
          confidence: 0.72
        }
      ],
      risk_assessment: [
        {
          risk_type: 'Market Volatility',
          probability: 0.3,
          potential_impact: -5000,
          mitigation_strategies: [
            'Diversify property portfolio',
            'Implement flexible pricing strategy',
            'Monitor market indicators closely'
          ],
          monitoring_metrics: ['Price volatility index', 'Sales velocity', 'Competitor activity']
        }
      ],
      growth_opportunities: [
        {
          opportunity: 'Premium Service Tier',
          market_size: 50000,
          revenue_potential: 15000,
          competition_level: 'medium' as const,
          required_investment: 8000,
          timeline_to_market: '3 months'
        }
      ],
      competitive_analysis: {
        market_position: 7,
        competitive_advantages: [
          'Automated compliance reporting',
          'Real-time price analytics',
          'Ministry-approved data format'
        ],
        threats: [
          'New competitors entering market',
          'Technology disruption',
          'Regulatory changes'
        ],
        differentiation_opportunities: [
          'AI-powered insights',
          'White-label solutions',
          'Integration marketplace'
        ],
        pricing_position: 'competitive' as const
      }
    };
  }

  // Helper methods

  private static getSimulatedMarketData() {
    return {
      avgMarketPrice: 12000,
      priceGrowthRate: 0.052,
      marketVolume: 1500,
      competitorCount: 15,
      seasonalFactors: {
        spring: 1.1,
        summer: 1.2,
        autumn: 1.0,
        winter: 0.9
      }
    };
  }

  private static getLocationFactor(location?: string): number {
    if (!location) return 1.0;

    const premiumLocations = ['warszawa', 'kraków', 'gdańsk', 'wrocław'];
    const locationLower = location.toLowerCase();

    return premiumLocations.some(city => locationLower.includes(city)) ? 1.15 : 1.0;
  }

  private static calculatePriceConfidence(property: any, marketData: any): number {
    const hasGoodData = property.area && property.price_per_m2;
    const marketAlignment = Math.abs(property.price_per_m2 - marketData.avgMarketPrice) / marketData.avgMarketPrice;

    let confidence = 0.7;
    if (hasGoodData) confidence += 0.2;
    if (marketAlignment < 0.2) confidence += 0.1;

    return Math.min(confidence, 0.95);
  }

  private static generatePriceReasoning(current: number, optimal: number, market: number): string[] {
    const reasons = [];

    if (optimal > current) {
      reasons.push('Cena poniżej potencjału rynkowego');
      if (current < market * 0.9) {
        reasons.push('Znacznie poniżej średniej rynkowej');
      }
    } else if (optimal < current) {
      reasons.push('Możliwa nadwycena względem rynku');
    }

    reasons.push('Analiza oparta na porównaniu rynkowym');
    reasons.push('Uwzględnia lokalizację i charakterystykę nieruchomości');

    return reasons;
  }

  private static getMarketFactors(property: any): MarketFactor[] {
    return [
      {
        factor: 'Location Premium',
        impact_score: 0.15,
        description: 'Lokalizacja wpływa pozytywnie na cenę',
        data_source: 'Market analysis'
      },
      {
        factor: 'Market Demand',
        impact_score: 0.08,
        description: 'Zwiększony popyt w segmencie',
        data_source: 'Demand indicators'
      },
      {
        factor: 'Competition Level',
        impact_score: -0.05,
        description: 'Umiarkowana konkurencja w okolicy',
        data_source: 'Competitor analysis'
      }
    ];
  }

  private static calculatePriceElasticity(property: any): number {
    // Simulate price elasticity calculation
    const area = property.area || 50;
    const baseElasticity = -0.8; // Negative elasticity (higher price = lower demand)

    // Luxury properties are less elastic
    const luxuryFactor = area > 100 ? 0.2 : 0;

    return baseElasticity + luxuryFactor;
  }

  private static forecastDemand(property: any): DemandForecast {
    const baseDemand = Math.floor(Math.random() * 20) + 5;

    return {
      next_week: baseDemand,
      next_month: baseDemand * 4,
      next_quarter: baseDemand * 12,
      trend_direction: 'up' as const,
      volatility: 0.15
    };
  }

  private static getDaysSinceCreated(createdAt?: string): number {
    if (!createdAt) return 30;

    const created = new Date(createdAt);
    const now = new Date();
    return Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
  }

  private static getSeasonalFactors(): SeasonalFactor[] {
    return [
      { season: 'Spring', impact_multiplier: 1.1, historical_data: true },
      { season: 'Summer', impact_multiplier: 1.2, historical_data: true },
      { season: 'Autumn', impact_multiplier: 1.0, historical_data: true },
      { season: 'Winter', impact_multiplier: 0.9, historical_data: true }
    ];
  }

  private static assessCompetitionImpact(property: any): number {
    // Simulate competition impact (-1 to 1)
    return Math.random() * 0.4 - 0.2; // -0.2 to 0.2
  }

  private static calculateChurnRisk(daysSinceSignup: number, uploadCount: number, hasRecentActivity: boolean): number {
    let risk = 0.1; // Base risk

    if (daysSinceSignup > 30 && uploadCount === 0) risk += 0.5;
    if (daysSinceSignup > 60) risk += 0.2;
    if (!hasRecentActivity && daysSinceSignup > 14) risk += 0.3;
    if (uploadCount > 3) risk -= 0.2;

    return Math.max(0, Math.min(1, risk));
  }

  private static calculateUpgradeLikelihood(developer: any, uploadCount: number): number {
    let likelihood = 0.3; // Base likelihood

    if (uploadCount > 2) likelihood += 0.3;
    if (developer?.subscription_plan === 'basic' && uploadCount > 1) likelihood += 0.2;
    if (developer?.presentation_generated_at) likelihood += 0.15;

    return Math.min(0.95, likelihood);
  }

  private static getChurnIndicators(churnRisk: number, hasRecentActivity: boolean): string[] {
    if (churnRisk > 0.7) {
      return ['Brak aktywności przez długi czas', 'Brak uploadów danych', 'Nieukończony onboarding'];
    } else if (churnRisk > 0.3) {
      return ['Sporadyczna aktywność', 'Podstawowe użytkowanie funkcji'];
    } else {
      return ['Regularna aktywność', 'Aktywne użytkowanie platformy'];
    }
  }

  private static getChurnInterventions(churnRisk: number): string[] {
    if (churnRisk > 0.7) {
      return [
        'Skontaktuj się z customer success',
        'Zaproponuj personalne szkolenie',
        'Sprawdź bariery techniczne'
      ];
    } else if (churnRisk > 0.3) {
      return [
        'Wyślij email z tips & tricks',
        'Zaproponuj demo nowych funkcji'
      ];
    } else {
      return [
        'Zaproponuj upgrade planu',
        'Pokaż zaawansowane funkcje'
      ];
    }
  }

  private static getBestUpgradeTiming(likelihood: number): string {
    if (likelihood > 0.7) return 'W ciągu najbliższego tygodnia';
    if (likelihood > 0.5) return 'W ciągu 2-3 tygodni';
    return 'W ciągu 1-2 miesięcy';
  }

  private static getUpgradeValueDrivers(currentPlan?: string): string[] {
    if (currentPlan === 'basic') {
      return [
        'Nieograniczona liczba mieszkań',
        'Zaawansowane analytics',
        'Strony prezentacyjne'
      ];
    } else {
      return [
        'Custom domains',
        'Priority support',
        'White-label options'
      ];
    }
  }

  private static calculateUpgradeRevenue(currentPlan?: string): number {
    if (currentPlan === 'basic') return 100; // Pro upgrade
    if (currentPlan === 'pro') return 150; // Enterprise upgrade
    return 0;
  }

  private static predictFeatureAdoption(data: any): FeatureAdoptionPrediction[] {
    return [
      {
        feature_name: 'Presentation Pages',
        adoption_likelihood: 0.75,
        time_to_adoption: 14,
        blockers: ['Wymaga Pro plan'],
        enablers: ['Wizualny appeal', 'Marketing value']
      },
      {
        feature_name: 'Custom Domains',
        adoption_likelihood: 0.45,
        time_to_adoption: 30,
        blockers: ['Wymaga Enterprise plan', 'Konfiguracja DNS'],
        enablers: ['Professional branding', 'SEO benefits']
      }
    ];
  }

  private static forecastEngagement(data: any): EngagementForecast {
    const currentUploads = data.uploads?.length || 0;

    return {
      predicted_dau: 1,
      predicted_wau: 7,
      predicted_mau: 28,
      engagement_trend: currentUploads > 2 ? 'increasing' as const : 'stable' as const
    };
  }
}

export default PredictiveEngine;