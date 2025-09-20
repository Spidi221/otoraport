'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Home,
  Users,
  Target,
  BarChart3,
  PieChart,
  Activity,
  Zap,
  Crown,
  RefreshCw,
  Download,
  Filter,
  Calendar,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { BusinessAnalytics } from '@/lib/analytics-engine';

interface AnalyticsResponse {
  success: boolean;
  data: BusinessAnalytics;
  metadata: any;
  insights_summary: {
    key_highlights: string[];
    action_items: string[];
    health_score: number;
  };
  error?: string;
  upgrade_required?: boolean;
  current_plan?: string;
}

export default function AdvancedAnalyticsDashboard() {
  const [analytics, setAnalytics] = useState<AnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/analytics/dashboard');
      const data = await response.json();

      if (response.ok && data.success) {
        setAnalytics(data);
        setLastUpdated(new Date());
      } else {
        if (data.upgrade_required) {
          setAnalytics(data); // Show upgrade prompt
        } else {
          setError(data.error || 'Failed to load analytics');
        }
      }
    } catch (err) {
      console.error('Analytics loading error:', err);
      setError('Network error loading analytics');
    } finally {
      setLoading(false);
    }
  };

  const refreshAnalytics = async () => {
    await loadAnalytics();
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="flex items-center space-x-2">
            <RefreshCw className="h-6 w-6 animate-spin" />
            <span>Loading advanced analytics...</span>
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
                onClick={refreshAnalytics}
              >
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (analytics?.upgrade_required) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Advanced Analytics
            <Badge variant="outline" className="ml-auto">
              <Crown className="h-3 w-3 mr-1" />
              Pro/Enterprise
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 space-y-4">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
              <BarChart3 className="h-8 w-8 text-blue-600" />
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2">Unlock Advanced Analytics</h3>
              <p className="text-gray-600 mb-4">
                Get deep insights into your business performance, predictive analytics,
                and market intelligence with Pro or Enterprise plans.
              </p>
              <div className="space-y-2 text-sm text-gray-500">
                <div className="flex items-center justify-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  Revenue projections & growth tracking
                </div>
                <div className="flex items-center justify-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  Property performance insights
                </div>
                <div className="flex items-center justify-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  Market comparison & benchmarking
                </div>
                <div className="flex items-center justify-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  AI-powered predictions & recommendations
                </div>
              </div>
              <Button className="mt-6" onClick={() => window.location.href = '/pricing'}>
                Upgrade to Pro
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!analytics?.data) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Advanced Analytics</h2>
          <p className="text-gray-600">
            Real-time business intelligence and predictive insights
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="secondary" className="text-xs">
            Health Score: {analytics.insights_summary.health_score}%
          </Badge>
          <Button variant="outline" size="sm" onClick={refreshAnalytics}>
            <RefreshCw className="h-4 w-4 mr-1" />
            Refresh
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-1" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Highlights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Key Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium mb-2">Highlights</h4>
              <ul className="space-y-1 text-sm">
                {analytics.insights_summary.key_highlights.map((highlight, index) => (
                  <li key={index} className="flex items-center">
                    <CheckCircle className="h-3 w-3 text-green-500 mr-2 flex-shrink-0" />
                    {highlight}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Recommended Actions</h4>
              <ul className="space-y-1 text-sm">
                {analytics.insights_summary.action_items.map((action, index) => (
                  <li key={index} className="flex items-center">
                    <Target className="h-3 w-3 text-blue-500 mr-2 flex-shrink-0" />
                    {action}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Revenue Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <MetricCard
          title="Current MRR"
          value={`${analytics.data.revenueMetrics.currentMRR} zł`}
          change={analytics.data.revenueMetrics.growthRate}
          icon={DollarSign}
          trend={analytics.data.revenueMetrics.growthRate > 0 ? 'up' : 'down'}
        />
        <MetricCard
          title="Projected MRR"
          value={`${analytics.data.revenueMetrics.projectedMRR} zł`}
          change={10}
          icon={TrendingUp}
          trend="up"
        />
        <MetricCard
          title="Churn Rate"
          value={`${analytics.data.revenueMetrics.churnRate}%`}
          change={-2}
          icon={Users}
          trend={analytics.data.revenueMetrics.churnRate < 5 ? 'up' : 'down'}
        />
        <MetricCard
          title="Customer LTV"
          value={`${Math.round(analytics.data.revenueMetrics.customerLifetimeValue)} zł`}
          change={15}
          icon={Target}
          trend="up"
        />
      </div>

      {/* Property Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Home className="h-5 w-5" />
              Property Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {analytics.data.propertyInsights.totalProperties}
                  </div>
                  <div className="text-gray-600">Total Properties</div>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {Math.round(analytics.data.propertyInsights.avgPricePerM2).toLocaleString()} zł/m²
                  </div>
                  <div className="text-gray-600">Avg Price/m²</div>
                </div>
              </div>

              {analytics.data.propertyInsights.fastestSelling.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Top Performers</h4>
                  <div className="space-y-2">
                    {analytics.data.propertyInsights.fastestSelling.slice(0, 3).map((property, index) => (
                      <div key={property.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <div>
                          <div className="font-medium">{property.apartment_number}</div>
                          <div className="text-sm text-gray-600">{property.project_name}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">{property.price_per_m2.toLocaleString()} zł/m²</div>
                          <div className="text-sm text-gray-600">{property.area} m²</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Engagement Metrics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="text-center p-3 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">
                    {analytics.data.engagementMetrics.onboardingCompletion}%
                  </div>
                  <div className="text-gray-600">Onboarding</div>
                </div>
                <div className="text-center p-3 bg-orange-50 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">
                    {analytics.data.engagementMetrics.featureUsage.csv_uploads}
                  </div>
                  <div className="text-gray-600">CSV Uploads</div>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">Feature Usage</h4>
                <div className="space-y-2">
                  {analytics.data.engagementMetrics.featureUsage.most_used_features.map((feature, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm">{feature}</span>
                      <Badge variant="secondary" className="text-xs">Active</Badge>
                    </div>
                  ))}
                </div>
              </div>

              {analytics.data.engagementMetrics.timeToFirstValue > 0 && (
                <div className="p-3 bg-yellow-50 rounded-lg">
                  <div className="text-sm text-yellow-800">
                    <strong>Time to First Value:</strong> {analytics.data.engagementMetrics.timeToFirstValue} hours
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Market Comparison */}
      {analytics.data.propertyInsights.marketComparison && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Market Position
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 mb-2">
                  #{analytics.data.propertyInsights.marketComparison.developer_position}
                </div>
                <div className="text-gray-600">Market Ranking</div>
                <div className="text-sm text-gray-500 mt-1">
                  Out of 10 competitors
                </div>
              </div>

              <div className="text-center">
                <div className="text-3xl font-bold text-green-600 mb-2">
                  {analytics.data.propertyInsights.marketComparison.price_advantage > 0 ? '+' : ''}
                  {analytics.data.propertyInsights.marketComparison.price_advantage.toFixed(1)}%
                </div>
                <div className="text-gray-600">Price Advantage</div>
                <div className="text-sm text-gray-500 mt-1">
                  vs Market Average
                </div>
              </div>

              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600 mb-2">
                  {(analytics.data.propertyInsights.marketComparison.demand_indicators.conversion_rate * 100).toFixed(1)}%
                </div>
                <div className="text-gray-600">Conversion Rate</div>
                <div className="text-sm text-gray-500 mt-1">
                  Inquiry to Sale
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Predictions */}
      {analytics.data.predictions && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Revenue Projection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Revenue Projection
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-lg font-bold">
                      {analytics.data.predictions.revenueProjection.next_month} zł
                    </div>
                    <div className="text-sm text-gray-600">Next Month</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold">
                      {analytics.data.predictions.revenueProjection.next_quarter} zł
                    </div>
                    <div className="text-sm text-gray-600">Next Quarter</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold">
                      {Math.round(analytics.data.predictions.revenueProjection.next_year).toLocaleString()} zł
                    </div>
                    <div className="text-sm text-gray-600">Next Year</div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Growth Drivers</h4>
                  <ul className="text-sm space-y-1">
                    {analytics.data.predictions.revenueProjection.growth_drivers.map((driver, index) => (
                      <li key={index} className="flex items-center">
                        <CheckCircle className="h-3 w-3 text-green-500 mr-2" />
                        {driver}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Opportunities */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Opportunities
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics.data.predictions.expansionOpportunities.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Expansion Opportunities</h4>
                    {analytics.data.predictions.expansionOpportunities.map((opportunity, index) => (
                      <div key={index} className="p-3 bg-blue-50 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium">Upgrade to {opportunity.recommended_plan}</span>
                          <Badge variant="secondary">
                            {Math.round(opportunity.expansion_probability * 100)}% likely
                          </Badge>
                        </div>
                        <div className="text-sm text-gray-600">
                          Potential revenue: +{opportunity.revenue_potential} zł/month
                        </div>
                        <div className="text-sm text-gray-600">
                          {opportunity.recommended_timing}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {analytics.data.propertyInsights.priceOptimization.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Price Optimization</h4>
                    {analytics.data.propertyInsights.priceOptimization.slice(0, 2).map((rec, index) => (
                      <div key={index} className="p-3 bg-green-50 rounded-lg mb-2">
                        <div className="text-sm">
                          <strong>Property:</strong> {rec.property_id.slice(0, 8)}...
                        </div>
                        <div className="text-sm">
                          <strong>Recommendation:</strong> {rec.recommended_price.toLocaleString()} zł/m²
                        </div>
                        <div className="text-sm text-gray-600">
                          {rec.reasoning}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Footer */}
      <div className="text-center text-sm text-gray-500">
        Last updated: {lastUpdated?.toLocaleString('pl-PL')} |
        Data refreshed every hour |
        Health Score: {analytics.insights_summary.health_score}%
      </div>
    </div>
  );
}

// Metric Card Component
interface MetricCardProps {
  title: string;
  value: string;
  change: number;
  icon: any;
  trend: 'up' | 'down';
}

function MetricCard({ title, value, change, icon: Icon, trend }: MetricCardProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            <div className="flex items-center mt-1">
              {trend === 'up' ? (
                <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
              )}
              <span className={`text-xs ${trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                {change > 0 ? '+' : ''}{change}%
              </span>
            </div>
          </div>
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
            <Icon className="h-6 w-6 text-blue-600" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}