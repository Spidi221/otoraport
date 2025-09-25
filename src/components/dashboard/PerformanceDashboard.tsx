'use client';

import { useState, useEffect } from 'react';
import {
  Clock,
  Zap,
  Eye,
  MousePointer,
  Monitor,
  Smartphone,
  Tablet,
  Chrome,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  BarChart3,
  Activity,
  Globe,
  Server
} from 'lucide-react';

interface PerformanceMetrics {
  overview: {
    total_samples: number;
    avg_performance_score: number;
    avg_fcp: number;
    avg_lcp: number;
    avg_cls: number;
    avg_fid: number;
    avg_ttfb: number;
    p75_fcp: number;
    p75_lcp: number;
  };
  browser_breakdown: Record<string, {
    count: number;
    avgScore: number;
  }>;
  page_breakdown: Record<string, {
    samples: number;
    avgFCP: number;
    avgLCP: number;
    avgScore: number;
  }>;
  thresholds: {
    fcp: { good: number; poor: number };
    lcp: { good: number; poor: number };
    cls: { good: number; poor: number };
    fid: { good: number; poor: number };
    ttfb: { good: number; poor: number };
  };
}

export default function PerformanceDashboard() {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('7d');
  const [selectedPage, setSelectedPage] = useState('all');

  useEffect(() => {
    loadPerformanceData();
  }, [dateRange, selectedPage]);

  const loadPerformanceData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        range: dateRange,
        page: selectedPage
      });

      const response = await fetch(`/api/analytics/performance?${params}`);
      if (response.ok) {
        const data = await response.json();
        setMetrics(data.data);
      }
    } catch (error) {
      console.error('Error loading performance data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Performance Data</h3>
        <p className="text-gray-500">Performance metrics will appear here once data is collected.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Performance Analytics</h1>
          <p className="text-gray-600">Real user monitoring and Core Web Vitals</p>
        </div>
        <div className="flex space-x-3">
          <select
            value={selectedPage}
            onChange={(e) => setSelectedPage(e.target.value)}
            className="rounded-md border-gray-300 text-sm"
          >
            <option value="all">All Pages</option>
            <option value="/">Homepage</option>
            <option value="/dashboard">Dashboard</option>
            <option value="/properties">Properties</option>
            <option value="/analytics">Analytics</option>
          </select>
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="rounded-md border-gray-300 text-sm"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>
        </div>
      </div>

      {/* Overall Performance Score */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Overall Performance Score</h2>
          <div className="text-sm text-gray-500">
            {metrics.overview.total_samples.toLocaleString()} samples
          </div>
        </div>

        <div className="flex items-center space-x-6">
          <div className="flex-1">
            <div className="relative w-32 h-32 mx-auto">
              <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-gray-200"
                  stroke="currentColor"
                  strokeWidth="3"
                  fill="transparent"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className={getScoreColor(metrics.overview.avg_performance_score)}
                  stroke="currentColor"
                  strokeWidth="3"
                  fill="transparent"
                  strokeDasharray={`${metrics.overview.avg_performance_score}, 100`}
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">
                    {metrics.overview.avg_performance_score}
                  </div>
                  <div className="text-xs text-gray-500">Score</div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex-1 space-y-3">
            <PerformanceIndicator
              label="Performance"
              score={metrics.overview.avg_performance_score}
            />
            <PerformanceIndicator
              label="Core Web Vitals"
              score={calculateWebVitalsScore(metrics.overview)}
            />
            <PerformanceIndicator
              label="SEO Impact"
              score={calculateSEOScore(metrics.overview)}
            />
          </div>
        </div>
      </div>

      {/* Core Web Vitals */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <WebVitalCard
          title="First Contentful Paint"
          subtitle="FCP"
          value={`${(metrics.overview.avg_fcp / 1000).toFixed(1)}s`}
          score={getMetricScore(metrics.overview.avg_fcp, metrics.thresholds.fcp)}
          icon={Eye}
          benchmark="< 1.8s"
        />
        <WebVitalCard
          title="Largest Contentful Paint"
          subtitle="LCP"
          value={`${(metrics.overview.avg_lcp / 1000).toFixed(1)}s`}
          score={getMetricScore(metrics.overview.avg_lcp, metrics.thresholds.lcp)}
          icon={Monitor}
          benchmark="< 2.5s"
        />
        <WebVitalCard
          title="Cumulative Layout Shift"
          subtitle="CLS"
          value={metrics.overview.avg_cls.toFixed(3)}
          score={getMetricScore(metrics.overview.avg_cls, metrics.thresholds.cls, true)}
          icon={Activity}
          benchmark="< 0.1"
        />
        <WebVitalCard
          title="First Input Delay"
          subtitle="FID"
          value={`${metrics.overview.avg_fid}ms`}
          score={getMetricScore(metrics.overview.avg_fid, metrics.thresholds.fid)}
          icon={MousePointer}
          benchmark="< 100ms"
        />
      </div>

      {/* Browser Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance by Browser</h3>
          <div className="space-y-4">
            {Object.entries(metrics.browser_breakdown)
              .sort(([,a], [,b]) => b.count - a.count)
              .map(([browser, stats]) => (
                <div key={browser} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                      <Chrome className="h-4 w-4 text-gray-600" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{browser}</div>
                      <div className="text-sm text-gray-500">
                        {stats.count.toLocaleString()} samples
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`font-medium ${getScoreTextColor(stats.avgScore)}`}>
                      {Math.round(stats.avgScore)}
                    </div>
                    <div className="text-xs text-gray-500">Score</div>
                  </div>
                </div>
              ))}
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance by Page</h3>
          <div className="space-y-4">
            {Object.entries(metrics.page_breakdown)
              .sort(([,a], [,b]) => b.samples - a.samples)
              .slice(0, 5)
              .map(([page, stats]) => (
                <div key={page} className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">
                      {page === '/' ? 'Homepage' : page}
                    </div>
                    <div className="text-sm text-gray-500">
                      {stats.samples.toLocaleString()} samples
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <div className="text-sm font-medium text-gray-900">
                        {(stats.avgLCP / 1000).toFixed(1)}s
                      </div>
                      <div className="text-xs text-gray-500">LCP</div>
                    </div>
                    <div className="text-right">
                      <div className={`text-sm font-medium ${getScoreTextColor(stats.avgScore)}`}>
                        {Math.round(stats.avgScore)}
                      </div>
                      <div className="text-xs text-gray-500">Score</div>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* Performance Optimization Recommendations */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Optimization Recommendations</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <RecommendationCard
            title="Image Optimization"
            description="Implement next-gen image formats (WebP, AVIF) and lazy loading"
            impact="High"
            effort="Medium"
            icon={Eye}
          />
          <RecommendationCard
            title="Code Splitting"
            description="Split JavaScript bundles to reduce initial load time"
            impact="High"
            effort="Medium"
            icon={Zap}
          />
          <RecommendationCard
            title="CDN Implementation"
            description="Use a content delivery network for static assets"
            impact="Medium"
            effort="Low"
            icon={Globe}
          />
          <RecommendationCard
            title="Server Optimization"
            description="Optimize database queries and API response times"
            impact="Medium"
            effort="High"
            icon={Server}
          />
        </div>
      </div>
    </div>
  );
}

// Helper components

function PerformanceIndicator({ label, score }: { label: string; score: number }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-gray-600">{label}</span>
      <div className="flex items-center space-x-2">
        <div className={`w-2 h-2 rounded-full ${getScoreColor(score, 'bg')}`}></div>
        <span className={`text-sm font-medium ${getScoreTextColor(score)}`}>
          {score}
        </span>
      </div>
    </div>
  );
}

function WebVitalCard({
  title,
  subtitle,
  value,
  score,
  icon: Icon,
  benchmark
}: {
  title: string;
  subtitle: string;
  value: string;
  score: number;
  icon: any;
  benchmark: string;
}) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-2">
        <Icon className="h-5 w-5 text-gray-600" />
        {score >= 90 ? (
          <CheckCircle className="h-4 w-4 text-green-600" />
        ) : score >= 50 ? (
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
        ) : (
          <AlertTriangle className="h-4 w-4 text-red-600" />
        )}
      </div>
      <div className="mb-1">
        <div className="text-2xl font-bold text-gray-900">{value}</div>
        <div className="text-sm text-gray-500">{subtitle}</div>
      </div>
      <div className="text-xs text-gray-500 mb-2">{title}</div>
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-400">Target: {benchmark}</span>
        <span className={`text-xs font-medium ${getScoreTextColor(score)}`}>
          {score}/100
        </span>
      </div>
    </div>
  );
}

function RecommendationCard({
  title,
  description,
  impact,
  effort,
  icon: Icon
}: {
  title: string;
  description: string;
  impact: string;
  effort: string;
  icon: any;
}) {
  return (
    <div className="border border-gray-200 rounded-lg p-4">
      <div className="flex items-start space-x-3">
        <div className="p-2 bg-blue-100 rounded-lg">
          <Icon className="h-4 w-4 text-blue-600" />
        </div>
        <div className="flex-1">
          <h4 className="font-medium text-gray-900 mb-1">{title}</h4>
          <p className="text-sm text-gray-600 mb-2">{description}</p>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              <span className="text-xs text-gray-500">Impact:</span>
              <span className={`text-xs font-medium ${
                impact === 'High' ? 'text-red-600' :
                impact === 'Medium' ? 'text-yellow-600' : 'text-green-600'
              }`}>
                {impact}
              </span>
            </div>
            <div className="flex items-center space-x-1">
              <span className="text-xs text-gray-500">Effort:</span>
              <span className={`text-xs font-medium ${
                effort === 'High' ? 'text-red-600' :
                effort === 'Medium' ? 'text-yellow-600' : 'text-green-600'
              }`}>
                {effort}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper functions

function getScoreColor(score: number, type: 'text' | 'bg' = 'text'): string {
  const prefix = type === 'bg' ? 'bg' : 'text';

  if (score >= 90) return `${prefix}-green-600`;
  if (score >= 50) return `${prefix}-yellow-600`;
  return `${prefix}-red-600`;
}

function getScoreTextColor(score: number): string {
  if (score >= 90) return 'text-green-600';
  if (score >= 50) return 'text-yellow-600';
  return 'text-red-600';
}

function getMetricScore(value: number, thresholds: { good: number; poor: number }, invert = false): number {
  const { good, poor } = thresholds;

  if (invert) {
    if (value <= good) return 100;
    if (value >= poor) return 0;
    return Math.round(100 - ((value - good) / (poor - good)) * 100);
  } else {
    if (value <= good) return 100;
    if (value >= poor) return 0;
    return Math.round(100 - ((value - good) / (poor - good)) * 100);
  }
}

function calculateWebVitalsScore(overview: any): number {
  const fcpScore = getMetricScore(overview.avg_fcp, { good: 1800, poor: 3000 });
  const lcpScore = getMetricScore(overview.avg_lcp, { good: 2500, poor: 4000 });
  const clsScore = getMetricScore(overview.avg_cls, { good: 0.1, poor: 0.25 }, true);
  const fidScore = getMetricScore(overview.avg_fid, { good: 100, poor: 300 });

  return Math.round((fcpScore + lcpScore + clsScore + fidScore) / 4);
}

function calculateSEOScore(overview: any): number {
  // SEO score based on Core Web Vitals and performance
  const webVitalsScore = calculateWebVitalsScore(overview);
  const performanceScore = overview.avg_performance_score;

  return Math.round((webVitalsScore * 0.6) + (performanceScore * 0.4));
}