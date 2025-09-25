'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Brain,
  TrendingUp,
  TrendingDown,
  Target,
  AlertTriangle,
  Lightbulb,
  Zap,
  Clock,
  DollarSign,
  Users,
  BarChart3,
  RefreshCw,
  Sparkles,
  ArrowUp,
  ArrowDown,
  Minus,
  CheckCircle,
  XCircle,
  Crown
} from 'lucide-react';
import { PredictiveInsights } from '@/lib/predictive-engine';

interface PredictiveResponse {
  success: boolean;
  data: PredictiveInsights;
  metadata: any;
  insights_summary: {
    total_insights: number;
    high_confidence_insights: number;
    key_opportunities: string[];
    critical_risks: string[];
    recommended_actions: string[];
  };
  ai_recommendations: string[];
  next_actions: string[];
  error?: string;
  upgrade_required?: boolean;
  current_plan?: string;
}

export default function PredictiveInsightsDashboard() {
  const [predictions, setPredictions] = useState<PredictiveResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'prices' | 'sales' | 'behavior' | 'business'>('overview');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPredictions();
  }, []);

  const loadPredictions = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/analytics/predictions');
      const data = await response.json();

      if (response.ok && data.success) {
        setPredictions(data);
      } else {
        if (data.upgrade_required) {
          setPredictions(data); // Show upgrade prompt
        } else {
          setError(data.error || 'Failed to load predictions');
        }
      }
    } catch (err) {
      console.error('Predictions loading error:', err);
      setError('Network error loading predictions');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="flex items-center space-x-2">
            <Brain className="h-6 w-6 animate-pulse text-purple-600" />
            <span>AI is analyzing your data...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-8">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {error}
              <Button
                variant="outline"
                size="sm"
                className="ml-2"
                onClick={loadPredictions}
              >
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (predictions?.upgrade_required) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            AI Predictive Insights
            <Badge variant="outline" className="ml-auto">
              <Crown className="h-3 w-3 mr-1" />
              Pro/Enterprise
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 space-y-4">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto">
              <Brain className="h-8 w-8 text-purple-600" />
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2">Unlock AI-Powered Insights</h3>
              <p className="text-gray-600 mb-4">
                Get advanced machine learning predictions, price optimization recommendations,
                and market intelligence with Pro or Enterprise plans.
              </p>
              <div className="grid grid-cols-2 gap-4 text-sm text-gray-500 mb-6">
                <div className="flex items-center">
                  <Sparkles className="h-4 w-4 text-purple-500 mr-2" />
                  AI price optimization
                </div>
                <div className="flex items-center">
                  <Target className="h-4 w-4 text-purple-500 mr-2" />
                  Sales forecasting
                </div>
                <div className="flex items-center">
                  <TrendingUp className="h-4 w-4 text-purple-500 mr-2" />
                  Market trend analysis
                </div>
                <div className="flex items-center">
                  <Users className="h-4 w-4 text-purple-500 mr-2" />
                  Customer behavior predictions
                </div>
              </div>
              <Button className="bg-purple-600 hover:bg-purple-700" onClick={() => window.location.href = '/pricing'}>
                Upgrade for AI Insights
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!predictions?.data) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Brain className="h-6 w-6 text-purple-600" />
            AI Predictive Insights
          </h2>
          <p className="text-gray-600">
            Machine learning-powered predictions and recommendations
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="secondary" className="text-xs">
            {predictions.insights_summary.high_confidence_insights} high confidence
          </Badge>
          <Button variant="outline" size="sm" onClick={loadPredictions}>
            <RefreshCw className="h-4 w-4 mr-1" />
            Refresh
          </Button>
        </div>
      </div>

      {/* AI Recommendations Summary */}
      <Card className="border-purple-200 bg-gradient-to-r from-purple-50 to-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-600" />
            AI Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-3 flex items-center">
                <Lightbulb className="h-4 w-4 text-yellow-500 mr-2" />
                Key Insights
              </h4>
              <ul className="space-y-2">
                {predictions.ai_recommendations.slice(0, 3).map((rec, index) => (
                  <li key={index} className="flex items-start text-sm">
                    <CheckCircle className="h-3 w-3 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    {rec}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-3 flex items-center">
                <Target className="h-4 w-4 text-blue-500 mr-2" />
                Next Actions
              </h4>
              <ul className="space-y-2">
                {predictions.next_actions.slice(0, 3).map((action, index) => (
                  <li key={index} className="flex items-start text-sm">
                    <Clock className="h-3 w-3 text-blue-500 mr-2 mt-0.5 flex-shrink-0" />
                    {action}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
        {[
          { key: 'overview', label: 'Overview', icon: BarChart3 },
          { key: 'prices', label: 'Price AI', icon: DollarSign },
          { key: 'sales', label: 'Sales Forecast', icon: TrendingUp },
          { key: 'behavior', label: 'Customer AI', icon: Users },
          { key: 'business', label: 'Business Intel', icon: Target }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm transition-colors ${
              activeTab === tab.key
                ? 'bg-white text-purple-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <tab.icon className="h-4 w-4" />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Insights Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Insights Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Total Insights</span>
                  <span className="font-semibold">{predictions.insights_summary.total_insights}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">High Confidence</span>
                  <span className="font-semibold text-green-600">
                    {predictions.insights_summary.high_confidence_insights}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Opportunities</span>
                  <span className="font-semibold text-blue-600">
                    {predictions.insights_summary.key_opportunities.length}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Risks</span>
                  <span className="font-semibold text-orange-600">
                    {predictions.insights_summary.critical_risks.length}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Key Opportunities */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-600" />
                Opportunities
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {predictions.insights_summary.key_opportunities.slice(0, 3).map((opp, index) => (
                  <div key={index} className="p-3 bg-green-50 rounded-lg">
                    <div className="text-sm font-medium text-green-800">{opp}</div>
                  </div>
                ))}
                {predictions.insights_summary.key_opportunities.length === 0 && (
                  <p className="text-sm text-gray-500">No major opportunities identified</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Critical Risks */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-orange-600" />
                Risks
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {predictions.insights_summary.critical_risks.slice(0, 3).map((risk, index) => (
                  <div key={index} className="p-3 bg-orange-50 rounded-lg">
                    <div className="text-sm font-medium text-orange-800">{risk}</div>
                  </div>
                ))}
                {predictions.insights_summary.critical_risks.length === 0 && (
                  <p className="text-sm text-gray-500">No critical risks detected</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'prices' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                AI Price Optimization
              </CardTitle>
            </CardHeader>
            <CardContent>
              {predictions.data.priceOptimization && predictions.data.priceOptimization.length > 0 ? (
                <div className="space-y-4">
                  {predictions.data.priceOptimization.map((opt, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="font-medium">Property {opt.property_id.slice(0, 8)}...</div>
                        <Badge variant={opt.confidence_score > 0.8 ? 'default' : 'secondary'}>
                          {Math.round(opt.confidence_score * 100)}% confidence
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mb-3">
                        <div>
                          <div className="text-sm text-gray-600">Current Price</div>
                          <div className="font-semibold">{opt.current_price.toLocaleString()} zł/m²</div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-600">Recommended Price</div>
                          <div className="font-semibold text-green-600">
                            {opt.predicted_optimal_price.toLocaleString()} zł/m²
                          </div>
                        </div>
                      </div>

                      <div className="mb-3">
                        <div className="text-sm text-gray-600 mb-1">AI Reasoning</div>
                        <ul className="text-sm space-y-1">
                          {opt.reasoning.map((reason, i) => (
                            <li key={i} className="flex items-center">
                              <div className="w-1 h-1 bg-gray-400 rounded-full mr-2"></div>
                              {reason}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="flex items-center space-x-4 text-sm">
                        <div className="flex items-center">
                          {opt.predicted_optimal_price > opt.current_price ? (
                            <ArrowUp className="h-3 w-3 text-green-500 mr-1" />
                          ) : opt.predicted_optimal_price < opt.current_price ? (
                            <ArrowDown className="h-3 w-3 text-red-500 mr-1" />
                          ) : (
                            <Minus className="h-3 w-3 text-gray-500 mr-1" />
                          )}
                          <span>
                            {((opt.predicted_optimal_price - opt.current_price) / opt.current_price * 100).toFixed(1)}% change
                          </span>
                        </div>
                        <div className="flex items-center">
                          <Zap className="h-3 w-3 text-purple-500 mr-1" />
                          <span>Elasticity: {opt.price_elasticity.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No price optimization recommendations available</p>
                  <p className="text-sm">Add more property data to get AI insights</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'sales' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                AI Sales Forecast
              </CardTitle>
            </CardHeader>
            <CardContent>
              {predictions.data.salesForecast && predictions.data.salesForecast.length > 0 ? (
                <div className="space-y-4">
                  {predictions.data.salesForecast.map((forecast, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="font-medium">Property {forecast.property_id.slice(0, 8)}...</div>
                        <Badge
                          variant={forecast.sale_probability > 0.7 ? 'default' :
                                  forecast.sale_probability > 0.4 ? 'secondary' : 'outline'}
                        >
                          {Math.round(forecast.sale_probability * 100)}% sale probability
                        </Badge>
                      </div>

                      <div className="grid grid-cols-3 gap-4 mb-3">
                        <div>
                          <div className="text-sm text-gray-600">Expected Sale Date</div>
                          <div className="font-semibold">{forecast.expected_sale_date}</div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-600">Days to Sell</div>
                          <div className="font-semibold">{forecast.days_to_sell} days</div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-600">Revenue Projection</div>
                          <div className="font-semibold text-green-600">
                            {forecast.revenue_projection.toLocaleString()} zł
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center">
                          <Clock className="h-3 w-3 text-blue-500 mr-1" />
                          <span>Competition Impact: {(forecast.competition_impact * 100).toFixed(1)}%</span>
                        </div>
                        <div className="flex items-center space-x-4">
                          {forecast.seasonal_factors.map((factor, i) => (
                            <span key={i} className="text-xs bg-gray-100 px-2 py-1 rounded">
                              {factor.season}: {factor.impact_multiplier}x
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No sales forecasts available</p>
                  <p className="text-sm">Add property data to get sales predictions</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'behavior' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Churn Prediction */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Churn Prediction
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-center">
                  <div className={`text-3xl font-bold mb-2 ${
                    predictions.data.customerBehavior.churn_prediction.risk_level === 'high' ? 'text-red-600' :
                    predictions.data.customerBehavior.churn_prediction.risk_level === 'medium' ? 'text-orange-600' :
                    'text-green-600'
                  }`}>
                    {predictions.data.customerBehavior.churn_prediction.risk_score}%
                  </div>
                  <div className="text-gray-600">Churn Risk Score</div>
                  <Badge
                    variant={predictions.data.customerBehavior.churn_prediction.risk_level === 'high' ? 'destructive' :
                            predictions.data.customerBehavior.churn_prediction.risk_level === 'medium' ? 'default' : 'secondary'}
                    className="mt-2"
                  >
                    {predictions.data.customerBehavior.churn_prediction.risk_level.toUpperCase()} RISK
                  </Badge>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Risk Indicators</h4>
                  <ul className="space-y-1 text-sm">
                    {predictions.data.customerBehavior.churn_prediction.key_indicators.map((indicator, index) => (
                      <li key={index} className="flex items-center">
                        <AlertTriangle className="h-3 w-3 text-orange-500 mr-2" />
                        {indicator}
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Recommended Actions</h4>
                  <ul className="space-y-1 text-sm">
                    {predictions.data.customerBehavior.churn_prediction.recommended_interventions.map((action, index) => (
                      <li key={index} className="flex items-center">
                        <CheckCircle className="h-3 w-3 text-green-500 mr-2" />
                        {action}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Upgrade Likelihood */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Upgrade Prediction
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600 mb-2">
                    {Math.round(predictions.data.customerBehavior.upgrade_likelihood.upgrade_likelihood * 100)}%
                  </div>
                  <div className="text-gray-600">Upgrade Likelihood</div>
                  <Badge variant="secondary" className="mt-2">
                    TO {predictions.data.customerBehavior.upgrade_likelihood.recommended_plan.toUpperCase()}
                  </Badge>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Best Timing</h4>
                  <p className="text-sm text-gray-600">
                    {predictions.data.customerBehavior.upgrade_likelihood.best_timing}
                  </p>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Value Drivers</h4>
                  <ul className="space-y-1 text-sm">
                    {predictions.data.customerBehavior.upgrade_likelihood.value_drivers.map((driver, index) => (
                      <li key={index} className="flex items-center">
                        <Sparkles className="h-3 w-3 text-blue-500 mr-2" />
                        {driver}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-blue-50 p-3 rounded-lg">
                  <div className="text-sm font-medium text-blue-800">Revenue Potential</div>
                  <div className="text-lg font-bold text-blue-600">
                    +{predictions.data.customerBehavior.upgrade_likelihood.revenue_potential} zł/month
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'business' && (
        <div className="space-y-6">
          {/* Revenue Optimization */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Revenue Optimization
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {predictions.data.businessInsights.revenue_optimization.map((opt, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-medium">{opt.strategy}</div>
                      <Badge variant="secondary">
                        {opt.implementation_effort} effort
                      </Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <div className="text-gray-600">Impact</div>
                        <div className="font-semibold text-green-600">+{opt.impact_estimate} zł</div>
                      </div>
                      <div>
                        <div className="text-gray-600">Timeline</div>
                        <div className="font-semibold">{opt.timeline}</div>
                      </div>
                      <div>
                        <div className="text-gray-600">Confidence</div>
                        <div className="font-semibold">{Math.round(opt.confidence * 100)}%</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Growth Opportunities */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Growth Opportunities
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {predictions.data.businessInsights.growth_opportunities.map((opp, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-medium">{opp.opportunity}</div>
                      <Badge variant={opp.competition_level === 'low' ? 'default' : 'secondary'}>
                        {opp.competition_level} competition
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                      <div>
                        <div className="text-gray-600">Market Size</div>
                        <div className="font-semibold">{opp.market_size.toLocaleString()} zł</div>
                      </div>
                      <div>
                        <div className="text-gray-600">Revenue Potential</div>
                        <div className="font-semibold text-green-600">{opp.revenue_potential.toLocaleString()} zł</div>
                      </div>
                    </div>
                    <div className="text-sm text-gray-600">
                      Timeline: {opp.timeline_to_market} • Investment: {opp.required_investment.toLocaleString()} zł
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Footer */}
      <div className="text-center text-sm text-gray-500">
        Powered by AI • Model version {predictions.metadata.ai_model_version} •
        Last updated: {new Date(predictions.metadata.generated_at).toLocaleString('pl-PL')}
      </div>
    </div>
  );
}