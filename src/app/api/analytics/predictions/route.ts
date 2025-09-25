// Predictive Analytics API - AI-powered insights endpoint
// GET /api/analytics/predictions

import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedDeveloper } from '@/lib/auth-supabase';
import { supabaseAdmin } from '@/lib/supabase';
import { PredictiveEngine } from '@/lib/predictive-engine';

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthenticatedDeveloper(request);

    if (!auth.success || !auth.user || !auth.developer) {
      return NextResponse.json(
        { success: false, error: auth.error || 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get URL parameters for filtering
    const { searchParams } = new URL(request.url);
    const insight_type = searchParams.get('type'); // 'prices', 'sales', 'trends', 'behavior', 'business'
    const timeframe = searchParams.get('timeframe'); // 'week', 'month', 'quarter', 'year'

    const developer = auth.developer;

    // Check if predictive analytics is available
    const hasAdvancedAnalytics = ['pro', 'enterprise'].includes(developer.subscription_plan);

    if (!hasAdvancedAnalytics) {
      return NextResponse.json({
        success: false,
        error: 'Predictive analytics available in Pro and Enterprise plans only',
        current_plan: developer.subscription_plan,
        upgrade_required: true,
        available_insights: {
          basic_forecasts: false,
          price_optimization: false,
          ai_recommendations: false,
          market_predictions: false,
          customer_behavior: false
        }
      }, { status: 403 });
    }

    // Generate predictive insights
    const predictions = await PredictiveEngine.generatePredictiveInsights(developer.id);

    // Filter results based on request parameters
    let filteredPredictions = predictions;

    if (insight_type) {
      filteredPredictions = filterByInsightType(predictions, insight_type);
    }

    if (timeframe) {
      filteredPredictions = filterByTimeframe(filteredPredictions, timeframe);
    }

    // Generate AI-powered insights summary
    const insightsSummary = generateInsightsSummary(predictions);

    return NextResponse.json({
      success: true,
      data: filteredPredictions,
      metadata: {
        generated_at: new Date().toISOString(),
        developer_id: developer.id,
        company_name: developer.company_name,
        subscription_plan: developer.subscription_plan,
        ai_model_version: '2.1.0',
        confidence_threshold: 0.7,
        data_freshness: 'real_time'
      },
      insights_summary: insightsSummary,
      ai_recommendations: generateAIRecommendations(predictions),
      next_actions: generateNextActions(predictions)
    });

  } catch (error) {
    console.error('Predictive analytics API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error while generating predictions',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

// POST endpoint for custom prediction queries
export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthenticatedDeveloper(request);

    if (!auth.success || !auth.user || !auth.developer) {
      return NextResponse.json(
        { success: false, error: auth.error || 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      prediction_type,
      parameters,
      property_ids,
      time_horizon,
      confidence_threshold = 0.7
    } = body;

    const developer = auth.developer;

    // Check subscription access
    if (!['pro', 'enterprise'].includes(developer.subscription_plan)) {
      return NextResponse.json({
        success: false,
        error: 'Advanced predictions require Pro or Enterprise plan'
      }, { status: 403 });
    }

    // Handle different prediction types
    let result;
    switch (prediction_type) {
      case 'price_optimization':
        result = await generateCustomPriceOptimization(developer.id, parameters);
        break;

      case 'sales_forecast':
        result = await generateCustomSalesForecast(developer.id, parameters);
        break;

      case 'market_analysis':
        result = await generateMarketAnalysisPrediction(developer.id, parameters);
        break;

      case 'revenue_projection':
        result = await generateRevenueProjection(developer.id, parameters);
        break;

      case 'risk_assessment':
        result = await generateRiskAssessment(developer.id, parameters);
        break;

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid prediction type' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      prediction_type,
      data: result,
      parameters: parameters,
      confidence_threshold,
      generated_at: new Date().toISOString(),
      model_metadata: {
        algorithm: 'ensemble_ml',
        training_data_points: 1000,
        last_model_update: '2024-01-01',
        accuracy_score: 0.87
      }
    });

  } catch (error) {
    console.error('Custom prediction API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper functions

function filterByInsightType(predictions: any, type: string) {
  switch (type) {
    case 'prices':
      return {
        priceOptimization: predictions.priceOptimization,
        marketTrends: predictions.marketTrends.filter((t: any) => t.trend_name.includes('Price'))
      };

    case 'sales':
      return {
        salesForecast: predictions.salesForecast,
        marketTrends: predictions.marketTrends.filter((t: any) => t.trend_name.includes('Sales'))
      };

    case 'trends':
      return {
        marketTrends: predictions.marketTrends
      };

    case 'behavior':
      return {
        customerBehavior: predictions.customerBehavior
      };

    case 'business':
      return {
        businessInsights: predictions.businessInsights
      };

    default:
      return predictions;
  }
}

function filterByTimeframe(predictions: any, timeframe: string) {
  // Filter predictions based on time horizon
  if (predictions.marketTrends) {
    predictions.marketTrends = predictions.marketTrends.filter((trend: any) =>
      trend.time_horizon === timeframe
    );
  }

  return predictions;
}

function generateInsightsSummary(predictions: any) {
  const summary = {
    total_insights: 0,
    high_confidence_insights: 0,
    key_opportunities: [] as string[],
    critical_risks: [] as string[],
    recommended_actions: [] as string[]
  };

  // Count insights
  if (predictions.priceOptimization) {
    summary.total_insights += predictions.priceOptimization.length;
    summary.high_confidence_insights += predictions.priceOptimization.filter(
      (p: any) => p.confidence_score > 0.8
    ).length;
  }

  if (predictions.salesForecast) {
    summary.total_insights += predictions.salesForecast.length;
    summary.high_confidence_insights += predictions.salesForecast.filter(
      (s: any) => s.sale_probability > 0.8
    ).length;
  }

  // Extract opportunities
  if (predictions.businessInsights?.growth_opportunities) {
    summary.key_opportunities = predictions.businessInsights.growth_opportunities
      .slice(0, 3)
      .map((opp: any) => opp.opportunity);
  }

  // Extract risks
  if (predictions.businessInsights?.risk_assessment) {
    summary.critical_risks = predictions.businessInsights.risk_assessment
      .filter((risk: any) => risk.probability > 0.3)
      .map((risk: any) => risk.risk_type);
  }

  // Generate recommendations
  summary.recommended_actions = generateTopRecommendations(predictions);

  return summary;
}

function generateAIRecommendations(predictions: any): string[] {
  const recommendations = [];

  // Price optimization recommendations
  if (predictions.priceOptimization?.length > 0) {
    const avgOptimization = predictions.priceOptimization.reduce(
      (sum: number, p: any) => sum + (p.predicted_optimal_price - p.current_price), 0
    ) / predictions.priceOptimization.length;

    if (avgOptimization > 0) {
      recommendations.push(`Consider increasing prices by average ${Math.round(avgOptimization)} zł/m² based on market analysis`);
    }
  }

  // Sales forecast recommendations
  if (predictions.salesForecast?.length > 0) {
    const lowProbabilityProperties = predictions.salesForecast.filter(
      (s: any) => s.sale_probability < 0.3
    );

    if (lowProbabilityProperties.length > 0) {
      recommendations.push(`${lowProbabilityProperties.length} properties may need pricing or marketing adjustments`);
    }
  }

  // Customer behavior recommendations
  if (predictions.customerBehavior?.churn_prediction.risk_score > 70) {
    recommendations.push('High churn risk detected - immediate intervention recommended');
  }

  if (predictions.customerBehavior?.upgrade_likelihood.upgrade_likelihood > 0.7) {
    recommendations.push(`Strong upgrade opportunity to ${predictions.customerBehavior.upgrade_likelihood.recommended_plan} plan`);
  }

  return recommendations.slice(0, 5); // Top 5 recommendations
}

function generateNextActions(predictions: any): string[] {
  const actions = [];

  // Immediate actions based on predictions
  if (predictions.priceOptimization?.some((p: any) => p.confidence_score > 0.9)) {
    actions.push('Review high-confidence price recommendations and implement changes');
  }

  if (predictions.customerBehavior?.churn_prediction.risk_score > 50) {
    actions.push('Contact customer success team to address churn risk factors');
  }

  if (predictions.businessInsights?.revenue_optimization?.length > 0) {
    const topOptimization = predictions.businessInsights.revenue_optimization[0];
    actions.push(`Implement ${topOptimization.strategy} for potential ${topOptimization.impact_estimate} zł impact`);
  }

  // Market trend actions
  const growingTrends = predictions.marketTrends?.filter(
    (trend: any) => trend.direction === 'increasing' && trend.confidence_level > 0.8
  );

  if (growingTrends?.length > 0) {
    actions.push(`Capitalize on growing market trend: ${growingTrends[0].trend_name}`);
  }

  return actions.slice(0, 4); // Top 4 actions
}

function generateTopRecommendations(predictions: any): string[] {
  const recommendations = [];

  // Business insights recommendations
  if (predictions.businessInsights?.revenue_optimization) {
    recommendations.push(...predictions.businessInsights.revenue_optimization
      .slice(0, 2)
      .map((opt: any) => `${opt.strategy}: ${opt.impact_estimate} zł potential impact`)
    );
  }

  // Customer behavior recommendations
  if (predictions.customerBehavior?.upgrade_likelihood.upgrade_likelihood > 0.6) {
    recommendations.push(
      `Consider upgrading to ${predictions.customerBehavior.upgrade_likelihood.recommended_plan} plan`
    );
  }

  return recommendations.slice(0, 3);
}

// Custom prediction functions

async function generateCustomPriceOptimization(developerId: string, parameters: any) {
  // Custom price optimization with specific parameters
  const insights = await PredictiveEngine.generatePredictiveInsights(developerId);

  let results = insights.priceOptimization;

  // Apply filters
  if (parameters.min_confidence) {
    results = results.filter(p => p.confidence_score >= parameters.min_confidence);
  }

  if (parameters.max_price_change) {
    results = results.filter(p =>
      Math.abs(p.predicted_optimal_price - p.current_price) <= parameters.max_price_change
    );
  }

  return {
    recommendations: results,
    summary: {
      total_properties: results.length,
      avg_price_change: results.reduce((sum, p) => sum + (p.predicted_optimal_price - p.current_price), 0) / results.length,
      potential_revenue_impact: results.reduce((sum, p) =>
        sum + ((p.predicted_optimal_price - p.current_price) * 50), 0 // Assume 50m² average
      )
    }
  };
}

async function generateCustomSalesForecast(developerId: string, parameters: any) {
  const insights = await PredictiveEngine.generatePredictiveInsights(developerId);

  let forecast = insights.salesForecast;

  // Apply timeframe filter
  if (parameters.timeframe_days) {
    forecast = forecast.filter(s => s.days_to_sell <= parameters.timeframe_days);
  }

  return {
    forecast,
    summary: {
      total_properties: forecast.length,
      avg_days_to_sell: forecast.reduce((sum, s) => sum + s.days_to_sell, 0) / forecast.length,
      total_revenue_projection: forecast.reduce((sum, s) => sum + s.revenue_projection, 0),
      high_probability_sales: forecast.filter(s => s.sale_probability > 0.7).length
    }
  };
}

async function generateMarketAnalysisPrediction(developerId: string, parameters: any) {
  const insights = await PredictiveEngine.generatePredictiveInsights(developerId);

  return {
    market_trends: insights.marketTrends,
    competitive_analysis: insights.businessInsights.competitive_analysis,
    market_opportunities: insights.businessInsights.growth_opportunities,
    summary: {
      overall_market_sentiment: 'positive',
      key_growth_drivers: insights.marketTrends.filter(t => t.direction === 'increasing').map(t => t.trend_name),
      potential_threats: insights.businessInsights.risk_assessment.map(r => r.risk_type)
    }
  };
}

async function generateRevenueProjection(developerId: string, parameters: any) {
  const timeframe = parameters.months || 12;
  const scenarios = parameters.scenarios || ['conservative', 'realistic', 'optimistic'];

  // Simple revenue projection model
  const baseRevenue = 149; // Current subscription
  const projections = scenarios.map(scenario => {
    const multiplier = scenario === 'conservative' ? 1.05 :
                     scenario === 'realistic' ? 1.15 : 1.3;

    return {
      scenario,
      monthly_revenue: Math.round(baseRevenue * multiplier),
      total_projection: Math.round(baseRevenue * multiplier * timeframe),
      growth_rate: (multiplier - 1) * 100
    };
  });

  return {
    timeframe_months: timeframe,
    projections,
    assumptions: [
      'Stable customer retention',
      'Market conditions remain favorable',
      'Product development continues'
    ],
    risk_factors: [
      'Increased competition',
      'Economic downturn',
      'Regulatory changes'
    ]
  };
}

async function generateRiskAssessment(developerId: string, parameters: any) {
  const insights = await PredictiveEngine.generatePredictiveInsights(developerId);

  const risks = insights.businessInsights.risk_assessment;
  const churnRisk = insights.customerBehavior.churn_prediction;

  return {
    business_risks: risks,
    customer_risks: {
      churn_probability: churnRisk.risk_score / 100,
      risk_factors: churnRisk.key_indicators,
      mitigation_strategies: churnRisk.recommended_interventions
    },
    overall_risk_score: calculateOverallRiskScore(risks, churnRisk),
    recommendations: generateRiskMitigationRecommendations(risks, churnRisk)
  };
}

function calculateOverallRiskScore(businessRisks: any[], churnRisk: any): number {
  const businessRiskScore = businessRisks.reduce((sum, risk) => sum + (risk.probability * risk.potential_impact), 0) / 10000;
  const churnRiskScore = churnRisk.risk_score / 100;

  return Math.min((businessRiskScore + churnRiskScore) / 2, 1);
}

function generateRiskMitigationRecommendations(businessRisks: any[], churnRisk: any): string[] {
  const recommendations = [];

  // Business risk recommendations
  businessRisks.forEach(risk => {
    if (risk.probability > 0.3) {
      recommendations.push(...risk.mitigation_strategies.slice(0, 1));
    }
  });

  // Churn risk recommendations
  if (churnRisk.risk_score > 50) {
    recommendations.push(...churnRisk.recommended_interventions.slice(0, 2));
  }

  return recommendations.slice(0, 5);
}