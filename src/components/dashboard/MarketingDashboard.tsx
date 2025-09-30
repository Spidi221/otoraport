'use client';

import { useState, useEffect } from 'react';
import {
  Mail,
  Users,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  BarChart3,
  Target,
  Send,
  Eye,
  MousePointer,
  DollarSign,
  Settings,
  Plus,
  Filter,
  Search,
  Calendar
} from 'lucide-react';
import { toast } from 'sonner';

interface MarketingMetrics {
  total_contacts: number;
  active_campaigns: number;
  total_sent: number;
  open_rate: number;
  click_rate: number;
  conversion_rate: number;
  revenue_attributed: number;
  active_workflows: number;
}

interface Campaign {
  id: string;
  name: string;
  type: string;
  status: 'active' | 'paused' | 'draft' | 'completed';
  target_audience: {
    name: string;
    estimated_size: number;
  };
  performance_metrics: {
    total_sent: number;
    open_rate: number;
    click_rate: number;
    conversion_rate: number;
    revenue_attributed: number;
  };
  created_at: string;
  days_active: number;
}

interface Contact {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  lead_status: 'new' | 'qualified' | 'nurturing' | 'hot' | 'cold' | 'converted';
  lead_source: string;
  estimated_revenue: number;
  last_activity_at: string;
  days_since_activity: number;
}

interface Workflow {
  id: string;
  name: string;
  trigger_type: string;
  status: 'active' | 'paused' | 'draft';
  total_executions: number;
  success_rate: number;
  last_executed_at: string;
}

export default function MarketingDashboard() {
  const [metrics, setMetrics] = useState<MarketingMetrics | null>(null);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'campaigns' | 'contacts' | 'workflows' | 'templates'>('overview');
  const [dateRange, setDateRange] = useState('30d');

  useEffect(() => {
    loadMarketingData();
  }, [dateRange]);

  const loadMarketingData = async () => {
    setLoading(true);
    try {
      // Load all marketing data
      const [metricsRes, campaignsRes, contactsRes, workflowsRes] = await Promise.all([
        fetch('/api/marketing/metrics'),
        fetch('/api/marketing/campaigns'),
        fetch('/api/marketing/contacts?limit=10'),
        fetch('/api/marketing/workflows')
      ]);

      if (metricsRes.ok) {
        const metricsData = await metricsRes.json();
        setMetrics(metricsData.data);
      }

      if (campaignsRes.ok) {
        const campaignsData = await campaignsRes.json();
        setCampaigns(campaignsData.data || []);
      }

      if (contactsRes.ok) {
        const contactsData = await contactsRes.json();
        setContacts(contactsData.data || []);
      }

      if (workflowsRes.ok) {
        const workflowsData = await workflowsRes.json();
        setWorkflows(workflowsData.data || []);
      }

    } catch (error) {
      console.error('Error loading marketing data:', error);
    } finally {
      setLoading(false);
    }
  };

  const createCampaign = () => {
    // Implementation would open campaign creation modal
    toast.warning('Campaign creation modal would open here');
  };

  const createWorkflow = () => {
    // Implementation would open workflow creation modal
    toast.warning('Workflow creation modal would open here');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Marketing Automation</h1>
          <p className="text-gray-600">Manage campaigns, workflows, and lead nurturing</p>
        </div>
        <div className="flex space-x-3">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="rounded-md border-gray-300 text-sm"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>
          <button
            onClick={createCampaign}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>New Campaign</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'overview', name: 'Overview', icon: BarChart3 },
            { id: 'campaigns', name: 'Campaigns', icon: Target },
            { id: 'contacts', name: 'Contacts', icon: Users },
            { id: 'workflows', name: 'Workflows', icon: Settings },
            { id: 'templates', name: 'Templates', icon: Mail }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2`}
            >
              <tab.icon className="h-4 w-4" />
              <span>{tab.name}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <MetricCard
              title="Total Contacts"
              value={metrics?.total_contacts || 0}
              icon={Users}
              color="blue"
              change="+12%"
            />
            <MetricCard
              title="Active Campaigns"
              value={metrics?.active_campaigns || 0}
              icon={Target}
              color="green"
              change="+3"
            />
            <MetricCard
              title="Emails Sent"
              value={metrics?.total_sent || 0}
              icon={Send}
              color="purple"
              change="+156"
            />
            <MetricCard
              title="Revenue Attributed"
              value={`$${(metrics?.revenue_attributed || 0).toLocaleString()}`}
              icon={DollarSign}
              color="emerald"
              change="+$2.3k"
            />
          </div>

          {/* Performance Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <PerformanceCard
              title="Open Rate"
              value={`${((metrics?.open_rate || 0) * 100).toFixed(1)}%`}
              icon={Eye}
              benchmark="Industry: 24.2%"
              trend="up"
            />
            <PerformanceCard
              title="Click Rate"
              value={`${((metrics?.click_rate || 0) * 100).toFixed(1)}%`}
              icon={MousePointer}
              benchmark="Industry: 3.1%"
              trend="up"
            />
            <PerformanceCard
              title="Conversion Rate"
              value={`${((metrics?.conversion_rate || 0) * 100).toFixed(1)}%`}
              icon={TrendingUp}
              benchmark="Industry: 1.8%"
              trend="up"
            />
          </div>

          {/* Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <RecentCampaigns campaigns={campaigns.slice(0, 5)} />
            <RecentContacts contacts={contacts.slice(0, 5)} />
          </div>
        </div>
      )}

      {/* Campaigns Tab */}
      {activeTab === 'campaigns' && (
        <CampaignsView campaigns={campaigns} onCreateCampaign={createCampaign} />
      )}

      {/* Contacts Tab */}
      {activeTab === 'contacts' && (
        <ContactsView contacts={contacts} />
      )}

      {/* Workflows Tab */}
      {activeTab === 'workflows' && (
        <WorkflowsView workflows={workflows} onCreateWorkflow={createWorkflow} />
      )}

      {/* Templates Tab */}
      {activeTab === 'templates' && (
        <TemplatesView />
      )}
    </div>
  );
}

// Component definitions for each view
function MetricCard({
  title,
  value,
  icon: Icon,
  color,
  change
}: {
  title: string;
  value: string | number;
  icon: any;
  color: string;
  change?: string;
}) {
  const colorClasses = {
    blue: 'text-blue-600 bg-blue-100',
    green: 'text-green-600 bg-green-100',
    purple: 'text-purple-600 bg-purple-100',
    emerald: 'text-emerald-600 bg-emerald-100'
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between">
        <div className={`p-2 rounded-lg ${colorClasses[color as keyof typeof colorClasses]}`}>
          <Icon className="h-6 w-6" />
        </div>
        {change && (
          <span className="text-sm text-green-600 font-medium">{change}</span>
        )}
      </div>
      <div className="mt-4">
        <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
        <p className="text-sm text-gray-600">{title}</p>
      </div>
    </div>
  );
}

function PerformanceCard({
  title,
  value,
  icon: Icon,
  benchmark,
  trend
}: {
  title: string;
  value: string;
  icon: any;
  benchmark: string;
  trend: 'up' | 'down';
}) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Icon className="h-5 w-5 text-gray-600" />
          <span className="text-sm font-medium text-gray-900">{title}</span>
        </div>
        <TrendingUp className={`h-4 w-4 ${trend === 'up' ? 'text-green-600' : 'text-red-600'}`} />
      </div>
      <div className="mt-4">
        <div className="text-2xl font-bold text-gray-900">{value}</div>
        <div className="text-xs text-gray-500 mt-1">{benchmark}</div>
      </div>
    </div>
  );
}

function RecentCampaigns({ campaigns }: { campaigns: Campaign[] }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Recent Campaigns</h3>
        <button className="text-sm text-blue-600 hover:text-blue-700">View all</button>
      </div>
      <div className="space-y-3">
        {campaigns.map((campaign) => (
          <div key={campaign.id} className="flex items-center justify-between py-2">
            <div className="flex-1">
              <div className="text-sm font-medium text-gray-900">{campaign.name}</div>
              <div className="text-xs text-gray-500">{campaign.type} • {campaign.days_active} days active</div>
            </div>
            <div className="text-right">
              <div className="text-sm font-medium text-gray-900">
                {(campaign.performance_metrics.open_rate * 100).toFixed(1)}%
              </div>
              <div className="text-xs text-gray-500">open rate</div>
            </div>
            <div className={`ml-3 px-2 py-1 rounded-full text-xs font-medium ${
              campaign.status === 'active' ? 'bg-green-100 text-green-800' :
              campaign.status === 'paused' ? 'bg-yellow-100 text-yellow-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {campaign.status}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function RecentContacts({ contacts }: { contacts: Contact[] }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Recent Contacts</h3>
        <button className="text-sm text-blue-600 hover:text-blue-700">View all</button>
      </div>
      <div className="space-y-3">
        {contacts.map((contact) => (
          <div key={contact.id} className="flex items-center justify-between py-2">
            <div className="flex-1">
              <div className="text-sm font-medium text-gray-900">
                {contact.first_name} {contact.last_name}
              </div>
              <div className="text-xs text-gray-500">{contact.email}</div>
            </div>
            <div className="text-right">
              <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                contact.lead_status === 'hot' ? 'bg-red-100 text-red-800' :
                contact.lead_status === 'qualified' ? 'bg-blue-100 text-blue-800' :
                contact.lead_status === 'nurturing' ? 'bg-yellow-100 text-yellow-800' :
                contact.lead_status === 'converted' ? 'bg-green-100 text-green-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {contact.lead_status}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {contact.days_since_activity}d ago
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CampaignsView({ campaigns, onCreateCampaign }: { campaigns: Campaign[]; onCreateCampaign: () => void }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Email Campaigns</h3>
          <button
            onClick={onCreateCampaign}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Create Campaign
          </button>
        </div>
      </div>
      <div className="divide-y divide-gray-200">
        {campaigns.map((campaign) => (
          <div key={campaign.id} className="p-6 hover:bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3">
                  <h4 className="text-sm font-medium text-gray-900">{campaign.name}</h4>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    campaign.status === 'active' ? 'bg-green-100 text-green-800' :
                    campaign.status === 'paused' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {campaign.status}
                  </span>
                </div>
                <div className="mt-1 text-sm text-gray-500">
                  {campaign.type} • {campaign.target_audience.estimated_size} contacts
                </div>
              </div>
              <div className="grid grid-cols-4 gap-4 text-center">
                <div>
                  <div className="text-sm font-medium text-gray-900">
                    {campaign.performance_metrics.total_sent}
                  </div>
                  <div className="text-xs text-gray-500">Sent</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-900">
                    {(campaign.performance_metrics.open_rate * 100).toFixed(1)}%
                  </div>
                  <div className="text-xs text-gray-500">Opens</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-900">
                    {(campaign.performance_metrics.click_rate * 100).toFixed(1)}%
                  </div>
                  <div className="text-xs text-gray-500">Clicks</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-900">
                    ${campaign.performance_metrics.revenue_attributed}
                  </div>
                  <div className="text-xs text-gray-500">Revenue</div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ContactsView({ contacts }: { contacts: Contact[] }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Marketing Contacts</h3>
          <div className="flex items-center space-x-3">
            <div className="relative">
              <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search contacts..."
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>
            <button className="flex items-center space-x-2 px-3 py-2 border border-gray-300 rounded-lg text-sm">
              <Filter className="h-4 w-4" />
              <span>Filter</span>
            </button>
          </div>
        </div>
      </div>
      <div className="divide-y divide-gray-200">
        {contacts.map((contact) => (
          <div key={contact.id} className="p-6 hover:bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="h-10 w-10 bg-gray-200 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-gray-600">
                    {contact.first_name?.[0]}{contact.last_name?.[0]}
                  </span>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-900">
                    {contact.first_name} {contact.last_name}
                  </div>
                  <div className="text-sm text-gray-500">{contact.email}</div>
                </div>
              </div>
              <div className="flex items-center space-x-6">
                <div className="text-center">
                  <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                    contact.lead_status === 'hot' ? 'bg-red-100 text-red-800' :
                    contact.lead_status === 'qualified' ? 'bg-blue-100 text-blue-800' :
                    contact.lead_status === 'nurturing' ? 'bg-yellow-100 text-yellow-800' :
                    contact.lead_status === 'converted' ? 'bg-green-100 text-green-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {contact.lead_status}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-900">
                    ${contact.estimated_revenue?.toLocaleString() || 0}
                  </div>
                  <div className="text-xs text-gray-500">Est. value</div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-500">
                    {contact.days_since_activity}d ago
                  </div>
                  <div className="text-xs text-gray-500">Last activity</div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function WorkflowsView({ workflows, onCreateWorkflow }: { workflows: Workflow[]; onCreateWorkflow: () => void }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Automation Workflows</h3>
          <button
            onClick={onCreateWorkflow}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Create Workflow
          </button>
        </div>
      </div>
      <div className="divide-y divide-gray-200">
        {workflows.map((workflow) => (
          <div key={workflow.id} className="p-6 hover:bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3">
                  <h4 className="text-sm font-medium text-gray-900">{workflow.name}</h4>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    workflow.status === 'active' ? 'bg-green-100 text-green-800' :
                    workflow.status === 'paused' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {workflow.status}
                  </span>
                </div>
                <div className="mt-1 text-sm text-gray-500">
                  Trigger: {workflow.trigger_type.replace('_', ' ')}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-sm font-medium text-gray-900">
                    {workflow.total_executions}
                  </div>
                  <div className="text-xs text-gray-500">Executions</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-900">
                    {(workflow.success_rate * 100).toFixed(1)}%
                  </div>
                  <div className="text-xs text-gray-500">Success Rate</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-500">
                    {workflow.last_executed_at ?
                      new Date(workflow.last_executed_at).toLocaleDateString() :
                      'Never'
                    }
                  </div>
                  <div className="text-xs text-gray-500">Last Run</div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TemplatesView() {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="text-center py-12">
        <Mail className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Email Templates</h3>
        <p className="text-gray-500 mb-6">Create and manage email templates for your campaigns</p>
        <button className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700">
          Create Your First Template
        </button>
      </div>
    </div>
  );
}