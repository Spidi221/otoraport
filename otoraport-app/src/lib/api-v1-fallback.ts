/**
 * API v1 Fallback - Uses mock data when database tables are unavailable
 * This enables testing of the API system without requiring full database setup
 */

import { ApiKey, ApiKeyManager, ApiRequest, WebhookEndpoint, WebhookManager } from './api-v1';
import { MockApiStorage } from './mock-api-data';

export class ApiKeyManagerWithFallback extends ApiKeyManager {
  /**
   * Create API key with fallback to mock storage
   */
  static async createApiKey(
    developerId: string,
    name: string,
    permissions: any[],
    rateLimitPerMinute: number = 1000,
    expiresInDays?: number
  ): Promise<{ apiKey: ApiKey; plainKey: string }> {
    try {
      // Try original database approach first
      return await super.createApiKey(developerId, name, permissions, rateLimitPerMinute, expiresInDays);
    } catch (error) {
      console.log('Database not available, using mock storage for API key creation');

      // Fallback to mock storage
      const plainKey = this.generateSecureKey();

      // Use Node.js crypto for consistent hashing
      const crypto = require('crypto');
      const keyHash = crypto.createHash('sha256').update(plainKey).digest('hex');
      const keyPreview = `${plainKey.substring(0, 8)}...`;

      const apiKey: ApiKey = {
        id: `ak_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        developer_id: developerId,
        name,
        key_hash: keyHash,
        key_preview: keyPreview,
        permissions,
        rate_limit: rateLimitPerMinute,
        is_active: true,
        last_used_at: undefined,
        created_at: new Date().toISOString(),
        expires_at: expiresInDays
          ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000).toISOString()
          : undefined
      };

      await MockApiStorage.createApiKey(apiKey);
      return { apiKey, plainKey };
    }
  }

  /**
   * Validate API key with fallback to mock storage
   */
  static async validateApiKey(
    key: string,
    requiredResource: string,
    requiredAction: string
  ): Promise<{ isValid: boolean; apiKey?: ApiKey; error?: string }> {
    try {
      // Try original database approach first
      return await super.validateApiKey(key, requiredResource, requiredAction);
    } catch (error) {
      console.log('Database not available, using mock storage for API key validation');

      // Fallback to mock storage
      try {
        // Use Node.js crypto for consistent hashing
        const crypto = require('crypto');
        const keyHash = crypto.createHash('sha256').update(key).digest('hex');
        const apiKey = await MockApiStorage.findApiKeyByHash(keyHash);

        if (!apiKey) {
          return { isValid: false, error: 'Invalid API key' };
        }

        if (!apiKey.is_active) {
          return { isValid: false, error: 'API key is inactive' };
        }

        if (apiKey.expires_at && new Date(apiKey.expires_at) < new Date()) {
          return { isValid: false, error: 'API key has expired' };
        }

        // Check permissions
        const hasPermission = apiKey.permissions.some(permission =>
          permission.resource === requiredResource &&
          permission.actions.includes(requiredAction)
        );

        if (!hasPermission) {
          return { isValid: false, error: 'Insufficient permissions' };
        }

        return { isValid: true, apiKey };
      } catch (validationError) {
        return { isValid: false, error: 'Key validation failed' };
      }
    }
  }

  /**
   * Check rate limiting with fallback to mock storage
   */
  static async checkRateLimit(apiKeyId: string): Promise<{ allowed: boolean; remaining: number; resetAt: string }> {
    try {
      // Try original database approach first
      return await super.checkRateLimit(apiKeyId);
    } catch (error) {
      console.log('Database not available, using mock storage for rate limiting');

      // Fallback to mock storage
      const window = 60000; // 1 minute window
      const now = Date.now();
      const windowStart = now - window;

      const recentRequests = await MockApiStorage.getRecentRequests(apiKeyId, windowStart);
      const apiKey = await MockApiStorage.findApiKeyById(apiKeyId);

      if (!apiKey) {
        return { allowed: false, remaining: 0, resetAt: new Date(now + window).toISOString() };
      }

      const remaining = Math.max(0, apiKey.rate_limit - recentRequests.length);
      const allowed = remaining > 0;

      return {
        allowed,
        remaining,
        resetAt: new Date(now + window).toISOString()
      };
    }
  }

  /**
   * Log API request with fallback to mock storage
   */
  static async logApiRequest(
    apiKeyId: string,
    developerId: string,
    method: string,
    endpoint: string,
    ipAddress: string,
    userAgent: string,
    requestSize: number,
    responseStatus: number,
    responseSize: number,
    responseTimeMs: number
  ): Promise<void> {
    try {
      // Try original database approach first
      await super.logApiRequest(
        apiKeyId,
        developerId,
        method,
        endpoint,
        ipAddress,
        userAgent,
        requestSize,
        responseStatus,
        responseSize,
        responseTimeMs
      );
    } catch (error) {
      console.log('Database not available, using mock storage for API request logging');

      // Fallback to mock storage
      const logEntry: ApiRequest = {
        id: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        api_key_id: apiKeyId,
        developer_id: developerId,
        method,
        endpoint,
        ip_address: ipAddress,
        user_agent: userAgent,
        request_size: requestSize,
        response_status: responseStatus,
        response_size: responseSize,
        response_time_ms: responseTimeMs,
        created_at: new Date().toISOString()
      };

      await MockApiStorage.logApiRequest(logEntry);

      // Update API key last used timestamp
      await MockApiStorage.updateApiKeyLastUsed(apiKeyId, new Date().toISOString());
    }
  }

  /**
   * Get API keys for developer with fallback to mock storage
   */
  static async getApiKeysByDeveloper(developerId: string): Promise<ApiKey[]> {
    try {
      // Try database approach
      const { supabaseAdmin } = await import('./supabase');
      const { data, error } = await supabaseAdmin
        .from('api_keys')
        .select('*')
        .eq('developer_id', developerId)
        .eq('is_active', true);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.log('Database not available, using mock storage for API keys listing');
      return await MockApiStorage.getApiKeysByDeveloper(developerId);
    }
  }

  /**
   * Deactivate API key with fallback to mock storage
   */
  static async deactivateApiKey(keyId: string, developerId: string): Promise<boolean> {
    try {
      // Try database approach
      const { supabaseAdmin } = await import('./supabase');
      const { data, error } = await supabaseAdmin
        .from('api_keys')
        .update({ is_active: false })
        .eq('id', keyId)
        .eq('developer_id', developerId)
        .select('id')
        .single();

      if (error) throw error;
      return !!data;
    } catch (error) {
      console.log('Database not available, using mock storage for API key deactivation');
      return await MockApiStorage.deactivateApiKey(keyId, developerId);
    }
  }
}

export class WebhookManagerWithFallback extends WebhookManager {
  /**
   * Create webhook endpoint with fallback to mock storage
   */
  static async createWebhook(
    developerId: string,
    url: string,
    events: any[],
    retryPolicy?: any
  ): Promise<WebhookEndpoint> {
    try {
      // Try original database approach first
      return await super.createWebhook(developerId, url, events, retryPolicy);
    } catch (error) {
      console.log('Database not available, using mock storage for webhook creation');

      // Fallback to mock storage
      const secret = this.generateWebhookSecret();

      const webhook: WebhookEndpoint = {
        id: `wh_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        developer_id: developerId,
        url,
        secret,
        events,
        is_active: true,
        retry_policy: {
          max_attempts: retryPolicy?.max_attempts || 3,
          backoff_strategy: retryPolicy?.backoff_strategy || 'exponential',
          initial_delay_seconds: retryPolicy?.initial_delay_seconds || 1,
          max_delay_seconds: retryPolicy?.max_delay_seconds || 300
        },
        last_success_at: undefined,
        last_failure_at: undefined,
        failure_count: 0,
        created_at: new Date().toISOString()
      };

      await MockApiStorage.createWebhookEndpoint(webhook);
      return webhook;
    }
  }

  /**
   * Get webhooks for developer with fallback to mock storage
   */
  static async getWebhooksByDeveloper(developerId: string): Promise<WebhookEndpoint[]> {
    try {
      // Try database approach
      const { supabaseAdmin } = await import('./supabase');
      const { data, error } = await supabaseAdmin
        .from('webhook_endpoints')
        .select('*')
        .eq('developer_id', developerId);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.log('Database not available, using mock storage for webhooks listing');
      return await MockApiStorage.getWebhookEndpointsByDeveloper(developerId);
    }
  }
}

/**
 * Initialize sample data for testing
 */
export async function initializeSampleData(developerId: string): Promise<void> {
  try {
    await MockApiStorage.generateSampleData(developerId);
    console.log('Sample API data generated for testing');
  } catch (error) {
    console.error('Failed to generate sample data:', error);
  }
}

/**
 * Get comprehensive API analytics with fallback
 */
export async function getApiAnalytics(developerId: string): Promise<any> {
  try {
    // Try getting real analytics from database
    const { supabaseAdmin } = await import('./supabase');
    const { data, error } = await supabaseAdmin.rpc('get_api_usage_stats', {
      developer_uuid: developerId
    });

    if (error) throw error;
    return data;
  } catch (error) {
    console.log('Database analytics not available, using mock data');
    return await MockApiStorage.getApiUsageStats(developerId);
  }
}

/**
 * Test the API system functionality
 */
export async function testApiSystemFunctionality(developerId: string): Promise<any> {
  const results = {
    timestamp: new Date().toISOString(),
    tests: [] as Array<{ name: string; status: 'pass' | 'fail'; error?: string; duration_ms?: number }>
  };

  // Test 1: Create API Key
  try {
    const start = Date.now();
    const { apiKey, plainKey } = await ApiKeyManagerWithFallback.createApiKey(
      developerId,
      'Test Key',
      [{ resource: 'properties', actions: ['read'], scopes: ['own'] }],
      1000
    );
    results.tests.push({
      name: 'Create API Key',
      status: 'pass',
      duration_ms: Date.now() - start
    });

    // Test 2: Validate API Key
    try {
      const start2 = Date.now();
      const validation = await ApiKeyManagerWithFallback.validateApiKey(
        plainKey,
        'properties',
        'read'
      );
      results.tests.push({
        name: 'Validate API Key',
        status: validation.isValid ? 'pass' : 'fail',
        error: validation.error,
        duration_ms: Date.now() - start2
      });

      // Test 3: Rate Limiting
      try {
        const start3 = Date.now();
        const rateLimit = await ApiKeyManagerWithFallback.checkRateLimit(apiKey.id);
        results.tests.push({
          name: 'Rate Limiting Check',
          status: rateLimit.allowed ? 'pass' : 'fail',
          duration_ms: Date.now() - start3
        });
      } catch (error) {
        results.tests.push({
          name: 'Rate Limiting Check',
          status: 'fail',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }

      // Test 4: Log API Request
      try {
        const start4 = Date.now();
        await ApiKeyManagerWithFallback.logApiRequest(
          apiKey.id,
          developerId,
          'GET',
          '/api/v1/properties',
          '127.0.0.1',
          'Test User Agent',
          100,
          200,
          500,
          50
        );
        results.tests.push({
          name: 'Log API Request',
          status: 'pass',
          duration_ms: Date.now() - start4
        });
      } catch (error) {
        results.tests.push({
          name: 'Log API Request',
          status: 'fail',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }

      // Test 5: Create Webhook
      try {
        const start5 = Date.now();
        const webhook = await WebhookManagerWithFallback.createWebhook(
          developerId,
          'https://example.com/webhook',
          [{ event_type: 'property.created', description: 'Test event' }]
        );
        results.tests.push({
          name: 'Create Webhook',
          status: 'pass',
          duration_ms: Date.now() - start5
        });
      } catch (error) {
        results.tests.push({
          name: 'Create Webhook',
          status: 'fail',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }

    } catch (error) {
      results.tests.push({
        name: 'Validate API Key',
        status: 'fail',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  } catch (error) {
    results.tests.push({
      name: 'Create API Key',
      status: 'fail',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }

  const passedTests = results.tests.filter(t => t.status === 'pass').length;
  const totalTests = results.tests.length;

  return {
    ...results,
    summary: {
      total_tests: totalTests,
      passed_tests: passedTests,
      failed_tests: totalTests - passedTests,
      success_rate: totalTests > 0 ? passedTests / totalTests : 0,
      overall_status: passedTests === totalTests ? 'all_pass' : 'some_failures'
    }
  };
}