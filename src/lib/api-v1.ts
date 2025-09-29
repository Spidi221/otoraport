/**
 * DevReporter API v1 - Public API for external integrations
 * Comprehensive REST API with authentication, rate limiting, and webhooks
 */

export interface ApiKey {
  id: string;
  developer_id: string;
  name: string;
  key_hash: string;
  key_preview: string; // First 8 chars + "..."
  permissions: ApiPermission[];
  rate_limit: number; // requests per minute
  is_active: boolean;
  last_used_at?: string;
  created_at: string;
  expires_at?: string;
}

export interface ApiPermission {
  resource: string; // 'properties', 'reports', 'analytics', 'webhooks'
  actions: string[]; // ['read', 'write', 'delete']
  scopes?: string[]; // ['own', 'all'] - for future multi-tenant access
}

export interface ApiRequest {
  id: string;
  api_key_id: string;
  developer_id: string;
  method: string;
  endpoint: string;
  ip_address: string;
  user_agent: string;
  request_size: number;
  response_status: number;
  response_size: number;
  response_time_ms: number;
  created_at: string;
}

export interface WebhookEndpoint {
  id: string;
  developer_id: string;
  url: string;
  secret: string;
  events: WebhookEvent[];
  is_active: boolean;
  retry_policy: RetryPolicy;
  last_success_at?: string;
  last_failure_at?: string;
  failure_count: number;
  created_at: string;
}

export interface WebhookEvent {
  event_type: 'property.created' | 'property.updated' | 'property.deleted' |
             'report.generated' | 'report.failed' | 'subscription.updated' |
             'ministry.sync_success' | 'ministry.sync_failed';
  description: string;
}

export interface RetryPolicy {
  max_attempts: number;
  backoff_strategy: 'linear' | 'exponential';
  initial_delay_seconds: number;
  max_delay_seconds: number;
}

export interface WebhookDelivery {
  id: string;
  webhook_endpoint_id: string;
  event_type: string;
  payload: any;
  status: 'pending' | 'delivered' | 'failed' | 'abandoned';
  attempt_count: number;
  last_attempt_at: string;
  next_attempt_at?: string;
  response_status?: number;
  response_body?: string;
  created_at: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    has_more: boolean;
  };
  meta?: {
    version: string;
    timestamp: string;
    request_id: string;
    rate_limit?: {
      remaining: number;
      reset_at: string;
    };
  };
}

export interface PropertyApiModel {
  id: string;
  apartment_number: string;
  property_type: 'mieszkanie' | 'dom';
  price_per_m2: number;
  surface_area: number;
  total_price: number;
  location: {
    wojewodztwo: string;
    powiat: string;
    gmina: string;
    miejscowosc: string;
    ulica?: string;
  };
  features: {
    rooms_count?: number;
    floor?: number;
    balcony_area?: number;
    parking_spaces?: string[];
    storage_rooms?: string[];
  };
  status: 'available' | 'reserved' | 'sold';
  created_at: string;
  updated_at: string;
}

export interface ReportApiModel {
  id: string;
  type: 'ministry_xml' | 'analytics' | 'custom';
  status: 'generating' | 'completed' | 'failed';
  file_url?: string;
  md5_hash?: string;
  properties_count: number;
  generated_at?: string;
  expires_at?: string;
  metadata: {
    format: string;
    size_bytes: number;
    ministry_compliant: boolean;
  };
}

export class ApiKeyManager {
  /**
   * Generate new API key with specified permissions
   */
  static async createApiKey(
    developerId: string,
    name: string,
    permissions: ApiPermission[],
    rateLimitPerMinute: number = 1000,
    expiresInDays?: number
  ): Promise<{ apiKey: ApiKey; plainKey: string }> {
    try {
      const { createAdminClient } = await import('./supabase');

      const plainKey = this.generateSecureKey();
      const keyHash = await this.hashKey(plainKey);
      const keyPreview = `${plainKey.substring(0, 8)}...`;

      const apiKeyData = {
        id: `ak_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        developer_id: developerId,
        name,
        key_hash: keyHash,
        key_preview: keyPreview,
        permissions: permissions,
        rate_limit: rateLimitPerMinute,
        is_active: true,
        expires_at: expiresInDays ?
          new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000).toISOString() :
          null
      };

      const { data, error } = await createAdminClient()
        .from('api_keys')
        .insert(apiKeyData)
        .select()
        .single();

      if (error) {
        console.error('Error creating API key:', error);
        throw new Error(`Failed to create API key: ${error.message}`);
      }

      const apiKey: ApiKey = {
        id: data.id,
        developer_id: data.developer_id,
        name: data.name,
        key_hash: data.key_hash,
        key_preview: data.key_preview,
        permissions: data.permissions,
        rate_limit: data.rate_limit,
        is_active: data.is_active,
        last_used_at: data.last_used_at,
        created_at: data.created_at,
        expires_at: data.expires_at
      };

      return { apiKey, plainKey };
    } catch (error) {
      console.error('Database error in createApiKey:', error);
      throw error;
    }
  }

  /**
   * Validate API key and check permissions
   */
  static async validateApiKey(
    key: string,
    requiredResource: string,
    requiredAction: string
  ): Promise<{ isValid: boolean; apiKey?: ApiKey; error?: string }> {
    try {
      const keyHash = await this.hashKey(key);

      // In production, query database
      // For now, simulate validation
      const apiKey = await this.findApiKeyByHash(keyHash);

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

    } catch (error) {
      return { isValid: false, error: 'Key validation failed' };
    }
  }

  /**
   * Check rate limiting for API key
   */
  static async checkRateLimit(apiKeyId: string): Promise<{ allowed: boolean; remaining: number; resetAt: string }> {
    const window = 60000; // 1 minute window
    const now = Date.now();
    const windowStart = now - window;

    // In production, use Redis or database
    // For now, simulate rate limiting
    const recentRequests = await this.getRecentRequests(apiKeyId, windowStart);
    const apiKey = await this.findApiKeyById(apiKeyId);

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

  /**
   * Log API request for analytics and rate limiting
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
      const { createAdminClient } = await import('./supabase');

      const logEntry = {
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
        response_time_ms: responseTimeMs
      };

      const { error } = await createAdminClient()
        .from('api_requests')
        .insert(logEntry);

      if (error) {
        console.error('Error logging API request:', error);
        // Don't throw - logging failures shouldn't break API requests
      }
    } catch (error) {
      console.error('Database error in logApiRequest:', error);
      // Don't throw - logging failures shouldn't break API requests
    }
  }

  private static generateSecureKey(): string {
    // Generate cryptographically secure API key
    const prefix = 'ot_'; // otoraport prefix
    const entropy = Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map(b => b.toString(36))
      .join('')
      .substring(0, 32);

    return `${prefix}${entropy}`;
  }

  private static async hashKey(key: string): Promise<string> {
    // Check if we're in Node.js environment
    if (typeof window === 'undefined' && typeof require !== 'undefined') {
      // Node.js environment - use crypto module
      const crypto = require('crypto');
      return crypto.createHash('sha256').update(key).digest('hex');
    } else {
      // Browser environment - use Web Crypto API
      const encoder = new TextEncoder();
      const data = encoder.encode(key);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }
  }

  private static async findApiKeyByHash(hash: string): Promise<ApiKey | null> {
    try {
      const { createAdminClient } = await import('./supabase');

      const { data, error } = await createAdminClient()
        .from('api_keys')
        .select('*')
        .eq('key_hash', hash)
        .eq('is_active', true)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No rows found - not an error
          return null;
        }
        console.error('Error finding API key by hash:', error);
        return null;
      }

      if (!data) return null;

      // Check if expired
      if (data.expires_at && new Date(data.expires_at) < new Date()) {
        return null;
      }

      return {
        id: data.id,
        developer_id: data.developer_id,
        name: data.name,
        key_hash: data.key_hash,
        key_preview: data.key_preview,
        permissions: Array.isArray(data.permissions) ? data.permissions : [],
        rate_limit: data.rate_limit,
        is_active: data.is_active,
        last_used_at: data.last_used_at,
        created_at: data.created_at,
        expires_at: data.expires_at
      };
    } catch (error) {
      console.error('Database error in findApiKeyByHash:', error);
      return null;
    }
  }

  private static async findApiKeyById(id: string): Promise<ApiKey | null> {
    try {
      const { createAdminClient } = await import('./supabase');

      const { data, error } = await createAdminClient()
        .from('api_keys')
        .select('*')
        .eq('id', id)
        .eq('is_active', true)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        console.error('Error finding API key by ID:', error);
        return null;
      }

      if (!data) return null;

      return {
        id: data.id,
        developer_id: data.developer_id,
        name: data.name,
        key_hash: data.key_hash,
        key_preview: data.key_preview,
        permissions: Array.isArray(data.permissions) ? data.permissions : [],
        rate_limit: data.rate_limit,
        is_active: data.is_active,
        last_used_at: data.last_used_at,
        created_at: data.created_at,
        expires_at: data.expires_at
      };
    } catch (error) {
      console.error('Database error in findApiKeyById:', error);
      return null;
    }
  }

  private static async getRecentRequests(apiKeyId: string, since: number): Promise<ApiRequest[]> {
    try {
      const { createAdminClient } = await import('./supabase');

      const sinceDate = new Date(since).toISOString();

      const { data, error } = await createAdminClient()
        .from('api_requests')
        .select('*')
        .eq('api_key_id', apiKeyId)
        .gte('created_at', sinceDate)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error getting recent requests:', error);
        return [];
      }

      return data.map(row => ({
        id: row.id,
        api_key_id: row.api_key_id,
        developer_id: row.developer_id,
        method: row.method,
        endpoint: row.endpoint,
        ip_address: row.ip_address || '',
        user_agent: row.user_agent || '',
        request_size: row.request_size,
        response_status: row.response_status,
        response_size: row.response_size,
        response_time_ms: row.response_time_ms,
        created_at: row.created_at
      }));
    } catch (error) {
      console.error('Database error in getRecentRequests:', error);
      return [];
    }
  }
}

export class WebhookManager {
  /**
   * Create new webhook endpoint
   */
  static async createWebhook(
    developerId: string,
    url: string,
    events: WebhookEvent[],
    retryPolicy?: Partial<RetryPolicy>
  ): Promise<WebhookEndpoint> {
    try {
      const { createAdminClient } = await import('./supabase');

      const secret = this.generateWebhookSecret();

      const webhookData = {
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
        failure_count: 0
      };

      const { data, error } = await createAdminClient()
        .from('webhook_endpoints')
        .insert(webhookData)
        .select()
        .single();

      if (error) {
        console.error('Error creating webhook:', error);
        throw new Error(`Failed to create webhook: ${error.message}`);
      }

      return {
        id: data.id,
        developer_id: data.developer_id,
        url: data.url,
        secret: data.secret,
        events: data.events,
        is_active: data.is_active,
        retry_policy: data.retry_policy,
        last_success_at: data.last_success_at,
        last_failure_at: data.last_failure_at,
        failure_count: data.failure_count,
        created_at: data.created_at
      };
    } catch (error) {
      console.error('Database error in createWebhook:', error);
      throw error;
    }
  }

  /**
   * Send webhook event
   */
  static async sendWebhook(
    webhookEndpoint: WebhookEndpoint,
    eventType: string,
    payload: any
  ): Promise<WebhookDelivery> {
    try {
      const { createAdminClient } = await import('./supabase');

      const deliveryData = {
        id: `whd_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        webhook_endpoint_id: webhookEndpoint.id,
        event_type: eventType,
        payload,
        status: 'pending',
        attempt_count: 0,
        last_attempt_at: new Date().toISOString()
      };

      const { data, error } = await createAdminClient()
        .from('webhook_deliveries')
        .insert(deliveryData)
        .select()
        .single();

      if (error) {
        console.error('Error creating webhook delivery:', error);
        throw new Error(`Failed to create webhook delivery: ${error.message}`);
      }

      const delivery: WebhookDelivery = {
        id: data.id,
        webhook_endpoint_id: data.webhook_endpoint_id,
        event_type: data.event_type,
        payload: data.payload,
        status: data.status,
        attempt_count: data.attempt_count,
        last_attempt_at: data.last_attempt_at,
        next_attempt_at: data.next_attempt_at,
        response_status: data.response_status,
        response_body: data.response_body,
        created_at: data.created_at
      };

      // Attempt delivery
      await this.attemptDelivery(delivery, webhookEndpoint);

      return delivery;
    } catch (error) {
      console.error('Database error in sendWebhook:', error);
      throw error;
    }
  }

  /**
   * Attempt webhook delivery with retry logic
   */
  static async attemptDelivery(
    delivery: WebhookDelivery,
    webhook: WebhookEndpoint
  ): Promise<void> {
    delivery.attempt_count++;
    delivery.last_attempt_at = new Date().toISOString();

    try {
      const signature = await this.generateSignature(
        JSON.stringify(delivery.payload),
        webhook.secret
      );

      // Create AbortController for timeout compatibility
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

      const response = await fetch(webhook.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-DevReporter-Signature': signature,
          'X-DevReporter-Event': delivery.event_type,
          'X-DevReporter-Delivery': delivery.id,
          'User-Agent': 'DevReporter-Webhook/1.0'
        },
        body: JSON.stringify({
          event: delivery.event_type,
          data: delivery.payload,
          timestamp: delivery.created_at,
          delivery_id: delivery.id
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      delivery.response_status = response.status;
      delivery.response_body = await response.text().catch(() => '');

      if (response.ok) {
        delivery.status = 'delivered';
        webhook.last_success_at = new Date().toISOString();
        webhook.failure_count = 0;

        // Update webhook success in database
        await this.updateWebhookSuccess(webhook);
      } else {
        throw new Error(`HTTP ${response.status}: ${delivery.response_body}`);
      }

      // Update delivery status in database
      await this.updateDeliveryStatus(delivery);

    } catch (error) {
      console.error(`Webhook delivery failed: ${error.message}`);

      webhook.failure_count++;
      webhook.last_failure_at = new Date().toISOString();

      if (delivery.attempt_count >= webhook.retry_policy.max_attempts) {
        delivery.status = 'abandoned';
      } else {
        delivery.status = 'failed';

        // Schedule retry
        const delay = this.calculateRetryDelay(
          delivery.attempt_count,
          webhook.retry_policy
        );

        delivery.next_attempt_at = new Date(
          Date.now() + delay * 1000
        ).toISOString();
      }

      // Update webhook failure and delivery status in database
      await this.updateWebhookFailure(webhook);
      await this.updateDeliveryStatus(delivery);
    }
  }

  /**
   * Generate webhook signature for verification
   */
  static async generateSignature(payload: string, secret: string): Promise<string> {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(payload));
    const hashArray = Array.from(new Uint8Array(signature));
    return `sha256=${hashArray.map(b => b.toString(16).padStart(2, '0')).join('')}`;
  }

  /**
   * Verify webhook signature
   */
  static async verifySignature(
    payload: string,
    signature: string,
    secret: string
  ): Promise<boolean> {
    const expectedSignature = await this.generateSignature(payload, secret);
    return signature === expectedSignature;
  }

  private static generateWebhookSecret(): string {
    return Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  private static async updateWebhookSuccess(webhook: WebhookEndpoint): Promise<void> {
    try {
      const { createAdminClient } = await import('./supabase');

      await createAdminClient()
        .from('webhook_endpoints')
        .update({
          last_success_at: webhook.last_success_at,
          failure_count: 0
        })
        .eq('id', webhook.id);
    } catch (error) {
      console.error('Error updating webhook success:', error);
    }
  }

  private static async updateWebhookFailure(webhook: WebhookEndpoint): Promise<void> {
    try {
      const { createAdminClient } = await import('./supabase');

      await createAdminClient()
        .from('webhook_endpoints')
        .update({
          last_failure_at: webhook.last_failure_at,
          failure_count: webhook.failure_count
        })
        .eq('id', webhook.id);
    } catch (error) {
      console.error('Error updating webhook failure:', error);
    }
  }

  private static async updateDeliveryStatus(delivery: WebhookDelivery): Promise<void> {
    try {
      const { createAdminClient } = await import('./supabase');

      await createAdminClient()
        .from('webhook_deliveries')
        .update({
          status: delivery.status,
          attempt_count: delivery.attempt_count,
          last_attempt_at: delivery.last_attempt_at,
          next_attempt_at: delivery.next_attempt_at,
          response_status: delivery.response_status,
          response_body: delivery.response_body
        })
        .eq('id', delivery.id);
    } catch (error) {
      console.error('Error updating delivery status:', error);
    }
  }

  private static calculateRetryDelay(
    attemptCount: number,
    retryPolicy: RetryPolicy
  ): number {
    let delay: number;

    if (retryPolicy.backoff_strategy === 'exponential') {
      delay = retryPolicy.initial_delay_seconds * Math.pow(2, attemptCount - 1);
    } else {
      delay = retryPolicy.initial_delay_seconds * attemptCount;
    }

    return Math.min(delay, retryPolicy.max_delay_seconds);
  }
}

export class ApiResponseBuilder {
  /**
   * Build successful API response
   */
  static success<T>(
    data: T,
    message?: string,
    pagination?: any,
    requestId?: string
  ): ApiResponse<T> {
    return {
      success: true,
      data,
      message,
      pagination,
      meta: {
        version: '1.0',
        timestamp: new Date().toISOString(),
        request_id: requestId || `req_${Date.now()}`
      }
    };
  }

  /**
   * Build error API response
   */
  static error(
    error: string,
    statusCode?: number,
    requestId?: string
  ): ApiResponse {
    return {
      success: false,
      error,
      meta: {
        version: '1.0',
        timestamp: new Date().toISOString(),
        request_id: requestId || `req_${Date.now()}`
      }
    };
  }

  /**
   * Build rate limited response
   */
  static rateLimited(
    remaining: number,
    resetAt: string,
    requestId?: string
  ): ApiResponse {
    return {
      success: false,
      error: 'Rate limit exceeded',
      meta: {
        version: '1.0',
        timestamp: new Date().toISOString(),
        request_id: requestId || `req_${Date.now()}`,
        rate_limit: {
          remaining,
          reset_at: resetAt
        }
      }
    };
  }
}

// Available webhook events
export const WEBHOOK_EVENTS: WebhookEvent[] = [
  {
    event_type: 'property.created',
    description: 'Fired when a new property is added'
  },
  {
    event_type: 'property.updated',
    description: 'Fired when property data is modified'
  },
  {
    event_type: 'property.deleted',
    description: 'Fired when a property is removed'
  },
  {
    event_type: 'report.generated',
    description: 'Fired when a ministry report is successfully generated'
  },
  {
    event_type: 'report.failed',
    description: 'Fired when report generation fails'
  },
  {
    event_type: 'ministry.sync_success',
    description: 'Fired when ministry harvester successfully fetches data'
  },
  {
    event_type: 'ministry.sync_failed',
    description: 'Fired when ministry sync encounters errors'
  },
  {
    event_type: 'subscription.updated',
    description: 'Fired when subscription plan changes'
  }
];

// Default API permissions templates
export const API_PERMISSION_TEMPLATES = {
  read_only: [
    { resource: 'properties', actions: ['read'], scopes: ['own'] },
    { resource: 'reports', actions: ['read'], scopes: ['own'] }
  ],
  full_access: [
    { resource: 'properties', actions: ['read', 'write', 'delete'], scopes: ['own'] },
    { resource: 'reports', actions: ['read', 'write'], scopes: ['own'] },
    { resource: 'analytics', actions: ['read'], scopes: ['own'] },
    { resource: 'webhooks', actions: ['read', 'write', 'delete'], scopes: ['own'] }
  ],
  webhook_only: [
    { resource: 'webhooks', actions: ['read', 'write'], scopes: ['own'] }
  ]
};