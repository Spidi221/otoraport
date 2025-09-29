// Advanced Analytics API - Real-time business intelligence endpoint
// GET /api/analytics/dashboard

import { NextRequest, NextResponse } from 'next/server';
// Note: This import needs to be replaced with new auth system
import { supabaseAdmin } from '@/lib/supabase-single';
import { AnalyticsEngine } from '@/lib/analytics-engine';

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthenticatedDeveloper(request);

    if (!auth.success || !auth.user || !auth.developer) {
      return NextResponse.json(
        { success: false, error: auth.error || 'Unauthorized' },
        { status: 401 }
      );
    }

    const developer = auth.developer;

    // Check if analytics feature is available
    const hasAnalytics = ['pro', 'enterprise'].includes(developer.subscription_plan);

    if (!hasAnalytics) {
      return NextResponse.json({
        success: false,
        error: 'Advanced analytics available in Pro and Enterprise plans',
        current_plan: developer.subscription_plan,
        upgrade_required: true,
        features_available: {
          basic_stats: true,
          advanced_analytics: false,
          predictive_insights: false,
          market_comparison: false
        }
      }, { status: 403 });
    }

    // Get comprehensive analytics
    const analytics = await AnalyticsEngine.getBusinessAnalytics(developer.id);

    // Add metadata
    const response = {
      success: true,
      data: analytics,
      metadata: {
        generated_at: new Date().toISOString(),
        developer_id: developer.id,
        company_name: developer.company_name,
        subscription_plan: developer.subscription_plan,
        data_freshness: 'real_time',
        next_update: new Date(Date.now() + 60 * 60 * 1000).toISOString() // 1 hour
      },
      insights_summary: {
        total_metrics: Object.keys(analytics).length,
        key_highlights: generateKeyHighlights(analytics),
        action_items: generateActionItems(analytics),
        health_score: calculateOverallHealthScore(analytics)
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Analytics dashboard API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error while generating analytics',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

// Helper functions for insights generation

function generateKeyHighlights(analytics: any): string[] {
  const highlights = [];

  // Revenue highlights
  if (analytics.revenueMetrics.growthRate > 0) {
    highlights.push(`Revenue growing at ${analytics.revenueMetrics.growthRate}% monthly`);
  }

  if (analytics.revenueMetrics.churnRate < 5) {
    highlights.push(`Low churn rate of ${analytics.revenueMetrics.churnRate}%`);
  }

  // Property highlights
  if (analytics.propertyInsights.totalProperties > 0) {
    highlights.push(`Managing ${analytics.propertyInsights.totalProperties} properties`);
  }

  if (analytics.propertyInsights.priceGrowthRate > 0) {
    highlights.push(`Property prices growing at ${analytics.propertyInsights.priceGrowthRate}%`);
  }

  // Engagement highlights
  if (analytics.engagementMetrics.onboardingCompletion > 80) {
    highlights.push(`High onboarding completion: ${analytics.engagementMetrics.onboardingCompletion}%`);
  }

  return highlights.slice(0, 5); // Top 5 highlights
}

function generateActionItems(analytics: any): string[] {
  const actions = [];

  // Revenue actions
  if (analytics.revenueMetrics.churnRate > 10) {
    actions.push('Focus on customer retention - churn rate is high');
  }

  if (analytics.predictions.expansionOpportunities.length > 0) {
    actions.push('Consider upgrading subscription plan for additional features');
  }

  // Property actions
  if (analytics.propertyInsights.priceOptimization.length > 0) {
    actions.push('Review price recommendations for optimal positioning');
  }

  if (analytics.propertyInsights.slowestSelling.length > 0) {
    actions.push('Focus marketing efforts on slow-moving properties');
  }

  // Engagement actions
  if (analytics.engagementMetrics.onboardingCompletion < 50) {
    actions.push('Complete account setup to unlock more features');
  }

  if (analytics.engagementMetrics.featureUsage.csv_uploads === 0) {
    actions.push('Upload your first property data to get started');
  }

  return actions.slice(0, 5); // Top 5 actions
}

function calculateOverallHealthScore(analytics: any): number {
  let score = 0;
  let maxScore = 0;

  // Revenue health (30 points)
  maxScore += 30;
  if (analytics.revenueMetrics.growthRate > 0) score += 15;
  if (analytics.revenueMetrics.churnRate < 10) score += 15;

  // Property health (25 points)
  maxScore += 25;
  if (analytics.propertyInsights.totalProperties > 0) score += 10;
  if (analytics.propertyInsights.inventoryTurnover > 20) score += 15;

  // Engagement health (25 points)
  maxScore += 25;
  score += (analytics.engagementMetrics.onboardingCompletion / 100) * 25;

  // Prediction health (20 points)
  maxScore += 20;
  if (analytics.predictions.churnPrediction.length === 0 ||
      analytics.predictions.churnPrediction[0]?.churn_probability < 0.3) {
    score += 20;
  } else {
    score += 10;
  }

  return Math.round((score / maxScore) * 100);
}

// POST endpoint for custom analytics queries
export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthenticatedDeveloper(request);

    if (!auth.success || !auth.user || !auth.developer) {
      return NextResponse.json(
        { success: false, error: auth.error || 'Unauthorized' },
        { status: 401 }
      );
    }

    const { query_type, parameters } = await request.json();
    const developer = auth.developer;

    // Handle different query types
    let result;
    switch (query_type) {
      case 'property_performance':
        result = await getPropertyPerformanceAnalytics(developer.id, parameters);
        break;

      case 'revenue_projection':
        result = await getRevenueProjectionAnalytics(developer.id, parameters);
        break;

      case 'market_comparison':
        result = await getMarketComparisonAnalytics(developer.id, parameters);
        break;

      case 'custom_timeframe':
        result = await getCustomTimeframeAnalytics(developer.id, parameters);
        break;

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid query type' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      query_type,
      data: result,
      generated_at: new Date().toISOString()
    });

  } catch (error) {
    console.error('Custom analytics query error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper functions for custom queries

async function getPropertyPerformanceAnalytics(developerId: string, parameters: any) {
  // Get detailed property performance metrics
  const { data: properties } = await supabaseAdmin
    .from('properties')
    .select(`
      *,
      projects!inner(name, developer_id)
    `)
    .eq('projects.developer_id', developerId);

  if (!properties) return { properties: [] };

  // Apply filters from parameters
  let filteredProperties = properties;

  if (parameters?.project_id) {
    filteredProperties = properties.filter(p => p.project_id === parameters.project_id);
  }

  if (parameters?.status) {
    filteredProperties = properties.filter(p => p.status === parameters.status);
  }

  if (parameters?.price_range) {
    filteredProperties = properties.filter(p =>
      p.final_price >= parameters.price_range.min &&
      p.final_price <= parameters.price_range.max
    );
  }

  // Calculate performance metrics
  return {
    total_properties: filteredProperties.length,
    avg_price_per_m2: filteredProperties.reduce((sum, p) => sum + (p.price_per_m2 || 0), 0) / filteredProperties.length,
    price_distribution: calculatePriceDistribution(filteredProperties),
    status_breakdown: calculateStatusBreakdown(filteredProperties),
    top_performers: filteredProperties
      .sort((a, b) => (b.final_price || 0) - (a.final_price || 0))
      .slice(0, 5)
  };
}

async function getRevenueProjectionAnalytics(developerId: string, parameters: any) {
  const timeframe = parameters?.timeframe || '12_months';
  const scenarios = parameters?.scenarios || ['conservative', 'realistic', 'optimistic'];

  // Get current metrics
  const analytics = await AnalyticsEngine.getBusinessAnalytics(developerId);
  const currentMRR = analytics.revenueMetrics.currentMRR;

  // Generate projections
  const projections = scenarios.map(scenario => {
    const multiplier = scenario === 'conservative' ? 1.05 :
                     scenario === 'realistic' ? 1.15 : 1.3;

    return {
      scenario,
      monthly_projection: Math.round(currentMRR * multiplier),
      annual_projection: Math.round(currentMRR * multiplier * 12),
      confidence_level: scenario === 'conservative' ? 0.9 :
                       scenario === 'realistic' ? 0.7 : 0.4
    };
  });

  return {
    current_mrr: currentMRR,
    timeframe,
    projections,
    key_assumptions: [
      'Stable customer retention',
      'Consistent pricing strategy',
      'Market conditions remain favorable'
    ]
  };
}

async function getMarketComparisonAnalytics(developerId: string, parameters: any) {
  const region = parameters?.region || 'all';
  const propertyType = parameters?.property_type || 'all';

  // Get developer's properties for comparison
  const { data: properties } = await supabaseAdmin
    .from('properties')
    .select(`
      *,
      projects!inner(name, location, developer_id)
    `)
    .eq('projects.developer_id', developerId);

  if (!properties) return { comparison: null };

  // Calculate developer metrics
  const avgPrice = properties.reduce((sum, p) => sum + (p.price_per_m2 || 0), 0) / properties.length;
  const marketAvg = 12000; // Simulated market average

  return {
    developer_metrics: {
      avg_price_per_m2: avgPrice,
      total_properties: properties.length,
      price_range: {
        min: Math.min(...properties.map(p => p.price_per_m2 || 0)),
        max: Math.max(...properties.map(p => p.price_per_m2 || 0))
      }
    },
    market_metrics: {
      avg_price_per_m2: marketAvg,
      estimated_properties: 1500,
      price_trend: 'increasing'
    },
    comparison: {
      price_difference_percent: ((avgPrice - marketAvg) / marketAvg) * 100,
      market_position: avgPrice > marketAvg ? 'above_market' : 'below_market',
      competitiveness_score: Math.min((avgPrice / marketAvg) * 100, 150)
    }
  };
}

async function getCustomTimeframeAnalytics(developerId: string, parameters: any) {
  const startDate = parameters?.start_date;
  const endDate = parameters?.end_date;
  const metrics = parameters?.metrics || ['revenue', 'properties', 'engagement'];

  // Simulate timeframe-specific analytics
  return {
    timeframe: {
      start_date: startDate,
      end_date: endDate,
      duration_days: startDate && endDate ?
        Math.floor((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)) : 30
    },
    metrics: metrics.reduce((acc: any, metric: string) => {
      acc[metric] = generateTimeframeMetric(metric, startDate, endDate);
      return acc;
    }, {})
  };
}

function calculatePriceDistribution(properties: any[]) {
  const ranges = [
    { label: '< 8,000 PLN/m²', min: 0, max: 8000, count: 0 },
    { label: '8,000 - 12,000 PLN/m²', min: 8000, max: 12000, count: 0 },
    { label: '12,000 - 16,000 PLN/m²', min: 12000, max: 16000, count: 0 },
    { label: '> 16,000 PLN/m²', min: 16000, max: Infinity, count: 0 }
  ];

  properties.forEach(property => {
    const price = property.price_per_m2 || 0;
    const range = ranges.find(r => price >= r.min && price < r.max);
    if (range) range.count++;
  });

  return ranges;
}

function calculateStatusBreakdown(properties: any[]) {
  return {
    available: properties.filter(p => p.status === 'available').length,
    reserved: properties.filter(p => p.status === 'reserved').length,
    sold: properties.filter(p => p.status === 'sold').length
  };
}

function generateTimeframeMetric(metric: string, startDate?: string, endDate?: string) {
  // Simulate metric generation for custom timeframes
  const baseValue = Math.floor(Math.random() * 1000) + 100;

  return {
    value: baseValue,
    change_from_previous: Math.floor(Math.random() * 20) - 10, // -10% to +10%
    trend: Math.random() > 0.5 ? 'increasing' : 'decreasing',
    data_points: 30 // Simulated daily data points
  };
}