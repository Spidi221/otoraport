'use client';

import { useState, useEffect } from 'react';
import { Key, Plus, Trash2, Eye, EyeOff, Copy, Check, Activity, Webhook, AlertTriangle, BarChart3 } from 'lucide-react';

interface ApiKey {
  id: string;
  name: string;
  key_preview: string;
  permissions: any[];
  rate_limit: number;
  is_active: boolean;
  last_used_at?: string;
  created_at: string;
  expires_at?: string;
}

interface WebhookEndpoint {
  id: string;
  url: string;
  events: any[];
  is_active: boolean;
  last_success_at?: string;
  last_failure_at?: string;
  failure_count: number;
  created_at: string;
}

interface ApiStats {
  total_requests: number;
  success_requests: number;
  error_requests: number;
  avg_response_time_ms: number;
  requests_by_day: Record<string, number>;
}

export function ApiManagementSection() {
  const [activeTab, setActiveTab] = useState<'keys' | 'webhooks' | 'analytics'>('keys');
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [webhooks, setWebhooks] = useState<WebhookEndpoint[]>([]);
  const [apiStats, setApiStats] = useState<ApiStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showNewKeyForm, setShowNewKeyForm] = useState(false);
  const [showNewWebhookForm, setShowNewWebhookForm] = useState(false);
  const [newlyCreatedKey, setNewlyCreatedKey] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  useEffect(() => {
    loadApiKeys();
    loadWebhooks();
    loadApiStats();
  }, []);

  const loadApiKeys = async () => {
    try {
      const response = await fetch('/api/v1/keys');
      const result = await response.json();
      if (result.success) {
        setApiKeys(result.data);
      }
    } catch (error) {
      console.error('Error loading API keys:', error);
    }
  };

  const loadWebhooks = async () => {
    try {
      const response = await fetch('/api/v1/webhooks');
      const result = await response.json();
      if (result.success) {
        setWebhooks(result.data);
      }
    } catch (error) {
      console.error('Error loading webhooks:', error);
    }
  };

  const loadApiStats = async () => {
    try {
      const response = await fetch('/api/dashboard/api-stats');
      const result = await response.json();
      if (result.success) {
        setApiStats(result.data);
      }
    } catch (error) {
      console.error('Error loading API stats:', error);
    }
  };

  const createApiKey = async (formData: any) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/v1/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const result = await response.json();
      if (result.success) {
        setNewlyCreatedKey(result.data.key);
        await loadApiKeys();
        setShowNewKeyForm(false);
      } else {
        alert(result.error);
      }
    } catch (error) {
      console.error('Error creating API key:', error);
      alert('Failed to create API key');
    } finally {
      setIsLoading(false);
    }
  };

  const deleteApiKey = async (keyId: string) => {
    if (!confirm('Are you sure you want to deactivate this API key?')) return;

    try {
      const response = await fetch('/api/v1/keys', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key_id: keyId })
      });

      const result = await response.json();
      if (result.success) {
        await loadApiKeys();
      } else {
        alert(result.error);
      }
    } catch (error) {
      console.error('Error deleting API key:', error);
      alert('Failed to delete API key');
    }
  };

  const createWebhook = async (formData: any) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/v1/webhooks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const result = await response.json();
      if (result.success) {
        await loadWebhooks();
        setShowNewWebhookForm(false);
      } else {
        alert(result.error);
      }
    } catch (error) {
      console.error('Error creating webhook:', error);
      alert('Failed to create webhook');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async (text: string, keyId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(keyId);
      setTimeout(() => setCopiedKey(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pl-PL', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <Key className="w-5 h-5 text-blue-600" />
          <h2 className="text-lg font-semibold">API Management</h2>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setActiveTab('keys')}
            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'keys'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            API Keys
          </button>
          <button
            onClick={() => setActiveTab('webhooks')}
            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'webhooks'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Webhooks
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'analytics'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Analytics
          </button>
        </div>
      </div>

      {/* Newly Created Key Alert */}
      {newlyCreatedKey && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-start space-x-3">
            <Check className="w-5 h-5 text-green-500 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-sm font-medium text-green-800">API Key Created Successfully</h3>
              <p className="text-sm text-green-700 mt-1">
                Copy your API key now - it won't be shown again:
              </p>
              <div className="mt-2 flex items-center space-x-2">
                <code className="bg-white px-3 py-2 rounded border text-sm font-mono flex-1">
                  {newlyCreatedKey}
                </code>
                <button
                  onClick={() => copyToClipboard(newlyCreatedKey, 'new')}
                  className="px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
                >
                  {copiedKey === 'new' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <button
              onClick={() => setNewlyCreatedKey(null)}
              className="text-green-500 hover:text-green-700"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* API Keys Tab */}
      {activeTab === 'keys' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <p className="text-sm text-gray-600">
              Manage API keys for programmatic access to your data
            </p>
            <button
              onClick={() => setShowNewKeyForm(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Plus className="w-4 h-4" />
              <span>Create API Key</span>
            </button>
          </div>

          {/* API Keys List */}
          <div className="space-y-3">
            {apiKeys.map((key) => (
              <div key={key.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <h3 className="font-medium text-gray-900">{key.name}</h3>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        key.is_active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {key.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center space-x-4 text-sm text-gray-500">
                      <span>Key: {key.key_preview}</span>
                      <span>Rate limit: {key.rate_limit.toLocaleString()}/min</span>
                      <span>Created: {formatDate(key.created_at)}</span>
                      {key.last_used_at && <span>Last used: {formatDate(key.last_used_at)}</span>}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => copyToClipboard(key.key_preview, key.id)}
                      className="p-2 text-gray-400 hover:text-gray-600"
                      title="Copy key preview"
                    >
                      {copiedKey === key.id ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => deleteApiKey(key.id)}
                      className="p-2 text-red-400 hover:text-red-600"
                      title="Deactivate key"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {apiKeys.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Key className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No API keys created yet</p>
                <p className="text-sm">Create your first API key to get started</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Webhooks Tab */}
      {activeTab === 'webhooks' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <p className="text-sm text-gray-600">
              Configure webhook endpoints to receive real-time notifications
            </p>
            <button
              onClick={() => setShowNewWebhookForm(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Plus className="w-4 h-4" />
              <span>Add Webhook</span>
            </button>
          </div>

          {/* Webhooks List */}
          <div className="space-y-3">
            {webhooks.map((webhook) => (
              <div key={webhook.id} className="border rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <code className="font-medium text-gray-900">{webhook.url}</code>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        webhook.is_active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {webhook.is_active ? 'Active' : 'Inactive'}
                      </span>
                      {webhook.failure_count > 0 && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          <AlertTriangle className="w-3 h-3 mr-1" />
                          {webhook.failure_count} failures
                        </span>
                      )}
                    </div>
                    <div className="mt-2">
                      <div className="text-sm text-gray-600">
                        Events: {webhook.events.map(e => e.event_type).join(', ')}
                      </div>
                      <div className="mt-1 flex items-center space-x-4 text-sm text-gray-500">
                        <span>Created: {formatDate(webhook.created_at)}</span>
                        {webhook.last_success_at && (
                          <span>Last success: {formatDate(webhook.last_success_at)}</span>
                        )}
                        {webhook.last_failure_at && (
                          <span className="text-red-500">Last failure: {formatDate(webhook.last_failure_at)}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button className="p-2 text-gray-400 hover:text-gray-600" title="View details">
                      <Eye className="w-4 h-4" />
                    </button>
                    <button className="p-2 text-red-400 hover:text-red-600" title="Delete webhook">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {webhooks.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Webhook className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No webhooks configured</p>
                <p className="text-sm">Add webhooks to receive real-time notifications</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && (
        <div>
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-4">API Usage Analytics</h3>

            {apiStats && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center">
                    <Activity className="w-5 h-5 text-blue-500 mr-2" />
                    <span className="text-sm font-medium text-gray-600">Total Requests</span>
                  </div>
                  <div className="mt-2 text-2xl font-bold text-gray-900">
                    {apiStats.total_requests.toLocaleString()}
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center">
                    <Check className="w-5 h-5 text-green-500 mr-2" />
                    <span className="text-sm font-medium text-gray-600">Success Rate</span>
                  </div>
                  <div className="mt-2 text-2xl font-bold text-gray-900">
                    {apiStats.total_requests > 0 ?
                      Math.round((apiStats.success_requests / apiStats.total_requests) * 100) : 0}%
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center">
                    <AlertTriangle className="w-5 h-5 text-red-500 mr-2" />
                    <span className="text-sm font-medium text-gray-600">Error Rate</span>
                  </div>
                  <div className="mt-2 text-2xl font-bold text-gray-900">
                    {apiStats.total_requests > 0 ?
                      Math.round((apiStats.error_requests / apiStats.total_requests) * 100) : 0}%
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center">
                    <BarChart3 className="w-5 h-5 text-purple-500 mr-2" />
                    <span className="text-sm font-medium text-gray-600">Avg Response</span>
                  </div>
                  <div className="mt-2 text-2xl font-bold text-gray-900">
                    {Math.round(apiStats.avg_response_time_ms)}ms
                  </div>
                </div>
              </div>
            )}
          </div>

          {!apiStats && (
            <div className="text-center py-8 text-gray-500">
              <BarChart3 className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No API usage data available</p>
              <p className="text-sm">Start making API calls to see analytics</p>
            </div>
          )}
        </div>
      )}

      {/* Create API Key Modal */}
      {showNewKeyForm && (
        <CreateApiKeyModal
          onClose={() => setShowNewKeyForm(false)}
          onSubmit={createApiKey}
          isLoading={isLoading}
        />
      )}

      {/* Create Webhook Modal */}
      {showNewWebhookForm && (
        <CreateWebhookModal
          onClose={() => setShowNewWebhookForm(false)}
          onSubmit={createWebhook}
          isLoading={isLoading}
        />
      )}
    </div>
  );
}

// Create API Key Modal Component
function CreateApiKeyModal({ onClose, onSubmit, isLoading }: any) {
  const [formData, setFormData] = useState({
    name: '',
    permissions_template: 'read_only',
    expires_in_days: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-medium mb-4">Create API Key</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Key Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="My API Key"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Permissions
            </label>
            <select
              value={formData.permissions_template}
              onChange={(e) => setFormData({ ...formData, permissions_template: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="read_only">Read Only</option>
              <option value="full_access">Full Access</option>
              <option value="webhook_only">Webhooks Only</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Expires in (days, optional)
            </label>
            <input
              type="number"
              value={formData.expires_in_days}
              onChange={(e) => setFormData({ ...formData, expires_in_days: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Never expires if empty"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {isLoading ? 'Creating...' : 'Create Key'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Create Webhook Modal Component
function CreateWebhookModal({ onClose, onSubmit, isLoading }: any) {
  const [formData, setFormData] = useState({
    url: '',
    events: [] as string[]
  });

  const availableEvents = [
    'property.created',
    'property.updated',
    'property.deleted',
    'report.generated',
    'report.failed',
    'ministry.sync_success',
    'ministry.sync_failed'
  ];

  const handleEventToggle = (event: string) => {
    const newEvents = formData.events.includes(event)
      ? formData.events.filter(e => e !== event)
      : [...formData.events, event];
    setFormData({ ...formData, events: newEvents });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-medium mb-4">Create Webhook</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Webhook URL
            </label>
            <input
              type="url"
              value={formData.url}
              onChange={(e) => setFormData({ ...formData, url: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="https://your-app.com/webhook"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Events to Subscribe
            </label>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {availableEvents.map((event) => (
                <label key={event} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.events.includes(event)}
                    onChange={() => handleEventToggle(event)}
                    className="mr-2"
                  />
                  <span className="text-sm">{event}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || formData.events.length === 0}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {isLoading ? 'Creating...' : 'Create Webhook'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}