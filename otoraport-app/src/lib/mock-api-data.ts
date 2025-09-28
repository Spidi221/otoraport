/**
 * Mock API data for testing when database tables are not available
 * This simulates the API key and request logging functionality
 */

import { ApiKey, ApiRequest, WebhookEndpoint, WebhookDelivery } from './api-v1';

// In-memory storage for testing
const mockApiKeys = new Map<string, ApiKey>();
const mockApiRequests: ApiRequest[] = [];
const mockWebhookEndpoints = new Map<string, WebhookEndpoint>();
const mockWebhookDeliveries: WebhookDelivery[] = [];

export class MockApiStorage {
  // API Keys
  static async createApiKey(apiKey: ApiKey): Promise<void> {
    mockApiKeys.set(apiKey.id, apiKey);
  }

  static async findApiKeyByHash(hash: string): Promise<ApiKey | null> {
    for (const [id, key] of mockApiKeys) {
      if (key.key_hash === hash) {
        return key;
      }
    }
    return null;
  }

  static async findApiKeyById(id: string): Promise<ApiKey | null> {
    return mockApiKeys.get(id) || null;
  }

  static async getApiKeysByDeveloper(developerId: string): Promise<ApiKey[]> {
    return Array.from(mockApiKeys.values()).filter(key => key.developer_id === developerId);
  }

  static async updateApiKeyLastUsed(keyId: string, timestamp: string): Promise<void> {
    const key = mockApiKeys.get(keyId);
    if (key) {
      key.last_used_at = timestamp;
      mockApiKeys.set(keyId, key);
    }
  }

  static async deactivateApiKey(keyId: string, developerId: string): Promise<boolean> {
    const key = mockApiKeys.get(keyId);
    if (key && key.developer_id === developerId) {
      key.is_active = false;
      mockApiKeys.set(keyId, key);
      return true;
    }
    return false;
  }

  // API Requests
  static async logApiRequest(request: ApiRequest): Promise<void> {
    mockApiRequests.push(request);
  }

  static async getRecentRequests(apiKeyId: string, since: number): Promise<ApiRequest[]> {
    const sinceDate = new Date(since).toISOString();
    return mockApiRequests.filter(req =>
      req.api_key_id === apiKeyId && req.created_at >= sinceDate
    );
  }

  static async getApiRequestsByDeveloper(developerId: string, limit: number = 100): Promise<ApiRequest[]> {
    return mockApiRequests
      .filter(req => req.developer_id === developerId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, limit);
  }

  // Webhook Endpoints
  static async createWebhookEndpoint(webhook: WebhookEndpoint): Promise<void> {
    mockWebhookEndpoints.set(webhook.id, webhook);
  }

  static async getWebhookEndpointsByDeveloper(developerId: string): Promise<WebhookEndpoint[]> {
    return Array.from(mockWebhookEndpoints.values()).filter(wh => wh.developer_id === developerId);
  }

  static async updateWebhookEndpoint(webhookId: string, updates: Partial<WebhookEndpoint>): Promise<boolean> {
    const webhook = mockWebhookEndpoints.get(webhookId);
    if (webhook) {
      Object.assign(webhook, updates);
      mockWebhookEndpoints.set(webhookId, webhook);
      return true;
    }
    return false;
  }

  // Webhook Deliveries
  static async createWebhookDelivery(delivery: WebhookDelivery): Promise<void> {
    mockWebhookDeliveries.push(delivery);
  }

  static async updateWebhookDelivery(deliveryId: string, updates: Partial<WebhookDelivery>): Promise<boolean> {
    const index = mockWebhookDeliveries.findIndex(d => d.id === deliveryId);
    if (index !== -1) {
      Object.assign(mockWebhookDeliveries[index], updates);
      return true;
    }
    return false;
  }

  static async getWebhookDeliveriesByEndpoint(webhookEndpointId: string, limit: number = 50): Promise<WebhookDelivery[]> {
    return mockWebhookDeliveries
      .filter(d => d.webhook_endpoint_id === webhookEndpointId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, limit);
  }

  // Analytics
  static async getApiUsageStats(developerId: string, startDate?: string, endDate?: string): Promise<any> {
    const now = new Date();
    const start = startDate ? new Date(startDate) : new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : now;

    const requests = mockApiRequests.filter(req =>
      req.developer_id === developerId &&
      new Date(req.created_at) >= start &&
      new Date(req.created_at) <= end
    );

    const totalRequests = requests.length;
    const successRequests = requests.filter(req => req.response_status >= 200 && req.response_status < 400).length;
    const errorRequests = requests.filter(req => req.response_status >= 400).length;

    return {
      total_requests: totalRequests,
      success_requests: successRequests,
      error_requests: errorRequests,
      success_rate: totalRequests > 0 ? successRequests / totalRequests : 0,
      avg_response_time_ms: requests.length > 0
        ? requests.reduce((sum, req) => sum + req.response_time_ms, 0) / requests.length
        : 0,
      requests_by_endpoint: this.groupRequestsByEndpoint(requests),
      requests_by_day: this.groupRequestsByDay(requests)
    };
  }

  private static groupRequestsByEndpoint(requests: ApiRequest[]): Record<string, any> {
    const grouped: Record<string, { count: number; avg_response_time: number }> = {};

    requests.forEach(req => {
      if (!grouped[req.endpoint]) {
        grouped[req.endpoint] = { count: 0, avg_response_time: 0 };
      }
      grouped[req.endpoint].count++;
    });

    // Calculate average response times
    Object.keys(grouped).forEach(endpoint => {
      const endpointRequests = requests.filter(req => req.endpoint === endpoint);
      grouped[endpoint].avg_response_time = endpointRequests.length > 0
        ? endpointRequests.reduce((sum, req) => sum + req.response_time_ms, 0) / endpointRequests.length
        : 0;
    });

    return grouped;
  }

  private static groupRequestsByDay(requests: ApiRequest[]): Record<string, number> {
    const grouped: Record<string, number> = {};

    requests.forEach(req => {
      const day = new Date(req.created_at).toISOString().split('T')[0];
      grouped[day] = (grouped[day] || 0) + 1;
    });

    return grouped;
  }

  // Utility methods
  static async clearAllData(): Promise<void> {
    mockApiKeys.clear();
    mockApiRequests.length = 0;
    mockWebhookEndpoints.clear();
    mockWebhookDeliveries.length = 0;
  }

  static async getDataSummary(): Promise<any> {
    return {
      api_keys_count: mockApiKeys.size,
      api_requests_count: mockApiRequests.length,
      webhook_endpoints_count: mockWebhookEndpoints.size,
      webhook_deliveries_count: mockWebhookDeliveries.length,
      sample_data_available: true
    };
  }

  // Sample data generation for testing
  static async generateSampleData(developerId: string): Promise<void> {
    // Create sample API key
    const sampleApiKey: ApiKey = {
      id: `ak_sample_${Date.now()}`,
      developer_id: developerId,
      name: 'Test API Key',
      key_hash: 'sample_hash_' + Math.random().toString(36).substr(2, 16),
      key_preview: 'ot_test123...',
      permissions: [
        { resource: 'properties', actions: ['read', 'write'], scopes: ['own'] },
        { resource: 'reports', actions: ['read'], scopes: ['own'] }
      ],
      rate_limit: 1000,
      is_active: true,
      last_used_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
    };

    await this.createApiKey(sampleApiKey);

    // Create sample API requests
    for (let i = 0; i < 10; i++) {
      const sampleRequest: ApiRequest = {
        id: `req_sample_${Date.now()}_${i}`,
        api_key_id: sampleApiKey.id,
        developer_id: developerId,
        method: i % 2 === 0 ? 'GET' : 'POST',
        endpoint: i % 3 === 0 ? '/api/v1/properties' : '/api/v1/reports',
        ip_address: '192.168.1.' + (100 + i),
        user_agent: 'Test User Agent',
        request_size: 100 + i * 10,
        response_status: i === 9 ? 500 : 200, // One error for testing
        response_size: 500 + i * 20,
        response_time_ms: 50 + Math.random() * 100,
        created_at: new Date(Date.now() - i * 60000).toISOString() // Spread over last 10 minutes
      };

      await this.logApiRequest(sampleRequest);
    }

    // Create sample webhook endpoint
    const sampleWebhook: WebhookEndpoint = {
      id: `wh_sample_${Date.now()}`,
      developer_id: developerId,
      url: 'https://example.com/webhook',
      secret: 'sample_secret_' + Math.random().toString(36).substr(2, 16),
      events: [
        { event_type: 'property.created', description: 'Fired when a new property is added' },
        { event_type: 'report.generated', description: 'Fired when a report is generated' }
      ],
      is_active: true,
      retry_policy: {
        max_attempts: 3,
        backoff_strategy: 'exponential',
        initial_delay_seconds: 1,
        max_delay_seconds: 300
      },
      last_success_at: new Date().toISOString(),
      last_failure_at: null,
      failure_count: 0,
      created_at: new Date().toISOString()
    };

    await this.createWebhookEndpoint(sampleWebhook);

    // Create sample webhook deliveries
    for (let i = 0; i < 5; i++) {
      const sampleDelivery: WebhookDelivery = {
        id: `whd_sample_${Date.now()}_${i}`,
        webhook_endpoint_id: sampleWebhook.id,
        event_type: i % 2 === 0 ? 'property.created' : 'report.generated',
        payload: { test: true, id: i },
        status: i === 4 ? 'failed' : 'delivered',
        attempt_count: i === 4 ? 2 : 1,
        last_attempt_at: new Date(Date.now() - i * 30000).toISOString(),
        next_attempt_at: i === 4 ? new Date(Date.now() + 60000).toISOString() : null,
        response_status: i === 4 ? 500 : 200,
        response_body: i === 4 ? 'Internal Server Error' : 'OK',
        created_at: new Date(Date.now() - i * 30000).toISOString()
      };

      await this.createWebhookDelivery(sampleDelivery);
    }
  }
}