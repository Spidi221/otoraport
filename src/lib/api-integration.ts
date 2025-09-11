// External API integration system for OTORAPORT partners
import { supabaseAdmin } from './supabase'
import { analyticsService } from './analytics'
import { projectManagementService } from './project-management'
import crypto from 'crypto'

export interface APIKey {
  id: string
  developerId: string
  keyName: string
  apiKey: string
  hashedKey: string
  permissions: APIPermission[]
  rateLimit: number
  isActive: boolean
  expiresAt: string | null
  lastUsedAt: string | null
  usageCount: number
  createdAt: string
}

export type APIPermission = 
  | 'read:properties'
  | 'write:properties'
  | 'read:projects'
  | 'write:projects'
  | 'read:analytics'
  | 'read:reports'
  | 'write:bulk_operations'
  | 'read:compliance'

export interface APIRequest {
  timestamp: string
  developerId: string
  endpoint: string
  method: string
  apiKeyId: string
  ipAddress: string
  userAgent: string
  responseStatus: number
  responseTime: number
  rateLimitRemaining: number
}

export interface WebhookEndpoint {
  id: string
  developerId: string
  url: string
  events: WebhookEvent[]
  secret: string
  isActive: boolean
  failureCount: number
  lastSuccessAt: string | null
  lastFailureAt: string | null
  createdAt: string
}

export type WebhookEvent = 
  | 'property.created'
  | 'property.updated'
  | 'property.deleted'
  | 'project.created'
  | 'project.updated'
  | 'report.generated'
  | 'compliance.checked'

export interface IntegrationPartner {
  id: string
  name: string
  description: string
  website: string
  category: 'crm' | 'marketing' | 'analytics' | 'compliance' | 'finance'
  logoUrl: string
  isOfficial: boolean
  documentationUrl: string
  supportContact: string
}

export class APIIntegrationService {
  private rateLimitStore: Map<string, { count: number, resetAt: number }> = new Map()

  /**
   * Generate new API key for developer
   */
  async generateAPIKey(developerId: string, keyName: string, permissions: APIPermission[], rateLimit: number = 1000): Promise<APIKey> {
    // Generate secure API key
    const apiKey = this.generateSecureKey()
    const hashedKey = this.hashAPIKey(apiKey)

    const { data: keyRecord, error } = await supabaseAdmin
      .from('api_keys')
      .insert({
        developer_id: developerId,
        key_name: keyName,
        api_key: apiKey.substring(0, 8) + '...' + apiKey.substring(-4), // Store truncated for display
        hashed_key: hashedKey,
        permissions: permissions,
        rate_limit: rateLimit,
        is_active: true,
        expires_at: null, // Never expires by default
        usage_count: 0
      })
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create API key: ${error.message}`)
    }

    console.log(`Generated API key "${keyName}" for developer ${developerId}`)

    return {
      id: keyRecord.id,
      developerId,
      keyName,
      apiKey, // Return full key only once
      hashedKey,
      permissions,
      rateLimit,
      isActive: true,
      expiresAt: null,
      lastUsedAt: null,
      usageCount: 0,
      createdAt: keyRecord.created_at
    }
  }

  /**
   * Validate API key and check permissions
   */
  async validateAPIKey(apiKey: string, requiredPermission: APIPermission): Promise<{ isValid: boolean, developerId?: string, keyId?: string }> {
    const hashedKey = this.hashAPIKey(apiKey)

    const { data: keyRecord } = await supabaseAdmin
      .from('api_keys')
      .select('*')
      .eq('hashed_key', hashedKey)
      .eq('is_active', true)
      .single()

    if (!keyRecord) {
      return { isValid: false }
    }

    // Check expiration
    if (keyRecord.expires_at && new Date(keyRecord.expires_at) < new Date()) {
      return { isValid: false }
    }

    // Check permissions
    if (!keyRecord.permissions.includes(requiredPermission)) {
      return { isValid: false }
    }

    // Check rate limit
    const rateLimitKey = `${keyRecord.id}:${Math.floor(Date.now() / 60000)}` // Per minute
    const rateLimitInfo = this.rateLimitStore.get(rateLimitKey)
    
    if (rateLimitInfo && rateLimitInfo.count >= keyRecord.rate_limit) {
      return { isValid: false }
    }

    // Update rate limit counter
    this.rateLimitStore.set(rateLimitKey, {
      count: (rateLimitInfo?.count || 0) + 1,
      resetAt: Date.now() + 60000
    })

    // Update last used
    await supabaseAdmin
      .from('api_keys')
      .update({
        last_used_at: new Date().toISOString(),
        usage_count: keyRecord.usage_count + 1
      })
      .eq('id', keyRecord.id)

    return {
      isValid: true,
      developerId: keyRecord.developer_id,
      keyId: keyRecord.id
    }
  }

  /**
   * Get API usage statistics
   */
  async getAPIUsage(developerId: string, timeframe: '1h' | '24h' | '7d' | '30d' = '24h') {
    const hoursBack = timeframe === '1h' ? 1 : timeframe === '24h' ? 24 : timeframe === '7d' ? 168 : 720
    const since = new Date(Date.now() - hoursBack * 60 * 60 * 1000).toISOString()

    const { data: requests } = await supabaseAdmin
      .from('api_requests')
      .select('*')
      .eq('developer_id', developerId)
      .gte('timestamp', since)
      .order('timestamp', { ascending: false })

    if (!requests || requests.length === 0) {
      return {
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        averageResponseTime: 0,
        topEndpoints: [],
        requestsOverTime: []
      }
    }

    const totalRequests = requests.length
    const successfulRequests = requests.filter(r => r.response_status < 400).length
    const failedRequests = totalRequests - successfulRequests
    const averageResponseTime = requests.reduce((sum, r) => sum + r.response_time, 0) / totalRequests

    // Top endpoints
    const endpointCounts = requests.reduce((acc: any, req) => {
      acc[req.endpoint] = (acc[req.endpoint] || 0) + 1
      return acc
    }, {})

    const topEndpoints = Object.entries(endpointCounts)
      .sort(([,a], [,b]) => (b as number) - (a as number))
      .slice(0, 10)
      .map(([endpoint, count]) => ({ endpoint, count }))

    // Requests over time (hourly buckets)
    const hourlyBuckets = requests.reduce((acc: any, req) => {
      const hour = new Date(req.timestamp).toISOString().substring(0, 13) + ':00:00.000Z'
      acc[hour] = (acc[hour] || 0) + 1
      return acc
    }, {})

    const requestsOverTime = Object.entries(hourlyBuckets)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([timestamp, count]) => ({ timestamp, count }))

    return {
      totalRequests,
      successfulRequests,
      failedRequests,
      averageResponseTime: Math.round(averageResponseTime),
      topEndpoints,
      requestsOverTime
    }
  }

  /**
   * Set up webhook endpoint
   */
  async createWebhook(developerId: string, url: string, events: WebhookEvent[]): Promise<WebhookEndpoint> {
    const secret = this.generateSecureKey(32)

    const { data: webhook, error } = await supabaseAdmin
      .from('webhooks')
      .insert({
        developer_id: developerId,
        url,
        events,
        secret,
        is_active: true,
        failure_count: 0
      })
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create webhook: ${error.message}`)
    }

    console.log(`Created webhook for developer ${developerId}: ${url}`)

    return {
      id: webhook.id,
      developerId,
      url,
      events,
      secret,
      isActive: true,
      failureCount: 0,
      lastSuccessAt: null,
      lastFailureAt: null,
      createdAt: webhook.created_at
    }
  }

  /**
   * Send webhook notification
   */
  async sendWebhookNotification(developerId: string, event: WebhookEvent, data: any) {
    const { data: webhooks } = await supabaseAdmin
      .from('webhooks')
      .select('*')
      .eq('developer_id', developerId)
      .eq('is_active', true)
      .contains('events', [event])

    if (!webhooks || webhooks.length === 0) {
      return
    }

    const payload = {
      event,
      data,
      timestamp: new Date().toISOString(),
      developerId
    }

    for (const webhook of webhooks) {
      try {
        const signature = this.generateWebhookSignature(payload, webhook.secret)
        
        const response = await fetch(webhook.url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-OTORAPORT-Signature': signature,
            'X-OTORAPORT-Event': event,
            'User-Agent': 'OTORAPORT-Webhooks/1.0'
          },
          body: JSON.stringify(payload)
        })

        if (response.ok) {
          await supabaseAdmin
            .from('webhooks')
            .update({
              last_success_at: new Date().toISOString(),
              failure_count: 0
            })
            .eq('id', webhook.id)
        } else {
          throw new Error(`HTTP ${response.status}`)
        }

      } catch (error) {
        console.error(`Webhook delivery failed for ${webhook.url}:`, error)
        
        await supabaseAdmin
          .from('webhooks')
          .update({
            last_failure_at: new Date().toISOString(),
            failure_count: webhook.failure_count + 1
          })
          .eq('id', webhook.id)

        // Disable webhook after 5 failures
        if (webhook.failure_count + 1 >= 5) {
          await supabaseAdmin
            .from('webhooks')
            .update({ is_active: false })
            .eq('id', webhook.id)
        }
      }
    }
  }

  /**
   * Get available integration partners
   */
  getIntegrationPartners(): IntegrationPartner[] {
    return [
      {
        id: 'salesforce',
        name: 'Salesforce',
        description: 'Integracja z CRM - automatyczna synchronizacja leadów i klientów',
        website: 'https://salesforce.com',
        category: 'crm',
        logoUrl: '/integrations/salesforce.svg',
        isOfficial: true,
        documentationUrl: 'https://docs.otoraport.pl/integrations/salesforce',
        supportContact: 'integrations@otoraport.pl'
      },
      {
        id: 'hubspot',
        name: 'HubSpot',
        description: 'Marketing automation i zarządzanie leadami',
        website: 'https://hubspot.com',
        category: 'marketing',
        logoUrl: '/integrations/hubspot.svg',
        isOfficial: true,
        documentationUrl: 'https://docs.otoraport.pl/integrations/hubspot',
        supportContact: 'integrations@otoraport.pl'
      },
      {
        id: 'google-analytics',
        name: 'Google Analytics',
        description: 'Śledzenie konwersji i analityka sprzedaży mieszkań',
        website: 'https://analytics.google.com',
        category: 'analytics',
        logoUrl: '/integrations/google-analytics.svg',
        isOfficial: true,
        documentationUrl: 'https://docs.otoraport.pl/integrations/google-analytics',
        supportContact: 'integrations@otoraport.pl'
      },
      {
        id: 'zapier',
        name: 'Zapier',
        description: 'Automatyzacja procesów z 5000+ aplikacjami',
        website: 'https://zapier.com',
        category: 'crm',
        logoUrl: '/integrations/zapier.svg',
        isOfficial: true,
        documentationUrl: 'https://docs.otoraport.pl/integrations/zapier',
        supportContact: 'integrations@otoraport.pl'
      },
      {
        id: 'slack',
        name: 'Slack',
        description: 'Powiadomienia o sprzedaży i raportach w kanałach zespołu',
        website: 'https://slack.com',
        category: 'marketing',
        logoUrl: '/integrations/slack.svg',
        isOfficial: true,
        documentationUrl: 'https://docs.otoraport.pl/integrations/slack',
        supportContact: 'integrations@otoraport.pl'
      },
      {
        id: 'quickbooks',
        name: 'QuickBooks',
        description: 'Integracja z księgowością i fakturowaniem',
        website: 'https://quickbooks.com',
        category: 'finance',
        logoUrl: '/integrations/quickbooks.svg',
        isOfficial: false,
        documentationUrl: 'https://docs.otoraport.pl/integrations/quickbooks',
        supportContact: 'community@otoraport.pl'
      }
    ]
  }

  /**
   * Generate REST API documentation
   */
  generateAPIDocumentation() {
    return {
      openapi: '3.0.0',
      info: {
        title: 'OTORAPORT API',
        version: '1.0.0',
        description: 'Comprehensive API for real estate price reporting and compliance automation',
        contact: {
          name: 'OTORAPORT Support',
          email: 'api@otoraport.pl',
          url: 'https://docs.otoraport.pl'
        }
      },
      servers: [
        {
          url: 'https://api.otoraport.pl/v1',
          description: 'Production server'
        },
        {
          url: 'https://api-staging.otoraport.pl/v1',
          description: 'Staging server'
        }
      ],
      paths: {
        '/properties': {
          get: {
            summary: 'List properties',
            description: 'Get all properties for the authenticated developer',
            security: [{ ApiKeyAuth: [] }],
            parameters: [
              {
                name: 'project_id',
                in: 'query',
                description: 'Filter by project ID',
                schema: { type: 'string' }
              },
              {
                name: 'status',
                in: 'query',
                description: 'Filter by property status',
                schema: { 
                  type: 'string',
                  enum: ['available', 'sold', 'reserved', 'withdrawn']
                }
              },
              {
                name: 'limit',
                in: 'query',
                description: 'Number of results to return (max 100)',
                schema: { type: 'integer', minimum: 1, maximum: 100, default: 20 }
              },
              {
                name: 'offset',
                in: 'query', 
                description: 'Number of results to skip',
                schema: { type: 'integer', minimum: 0, default: 0 }
              }
            ],
            responses: {
              200: {
                description: 'List of properties',
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                      properties: {
                        success: { type: 'boolean' },
                        data: {
                          type: 'array',
                          items: { $ref: '#/components/schemas/Property' }
                        },
                        pagination: { $ref: '#/components/schemas/Pagination' }
                      }
                    }
                  }
                }
              }
            }
          },
          post: {
            summary: 'Create property',
            description: 'Add a new property to a project',
            security: [{ ApiKeyAuth: [] }],
            requestBody: {
              required: true,
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/PropertyCreate' }
                }
              }
            },
            responses: {
              201: {
                description: 'Property created successfully',
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                      properties: {
                        success: { type: 'boolean' },
                        data: { $ref: '#/components/schemas/Property' }
                      }
                    }
                  }
                }
              }
            }
          }
        },
        '/analytics/overview': {
          get: {
            summary: 'Get analytics overview',
            description: 'Comprehensive analytics for developer portfolio',
            security: [{ ApiKeyAuth: [] }],
            parameters: [
              {
                name: 'timeframe',
                in: 'query',
                description: 'Analysis timeframe',
                schema: {
                  type: 'string',
                  enum: ['30d', '90d', '12m'],
                  default: '30d'
                }
              }
            ],
            responses: {
              200: {
                description: 'Analytics overview',
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                      properties: {
                        success: { type: 'boolean' },
                        data: { $ref: '#/components/schemas/AnalyticsOverview' }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },
      components: {
        securitySchemes: {
          ApiKeyAuth: {
            type: 'apiKey',
            in: 'header',
            name: 'X-API-Key'
          }
        },
        schemas: {
          Property: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              property_number: { type: 'string' },
              property_type: { type: 'string' },
              price_per_m2: { type: 'number' },
              total_price: { type: 'number' },
              area: { type: 'number' },
              status: { 
                type: 'string',
                enum: ['available', 'sold', 'reserved', 'withdrawn']
              },
              created_at: { type: 'string', format: 'date-time' },
              updated_at: { type: 'string', format: 'date-time' }
            }
          },
          PropertyCreate: {
            type: 'object',
            required: ['project_id', 'property_number', 'property_type', 'price_per_m2', 'area'],
            properties: {
              project_id: { type: 'string' },
              property_number: { type: 'string' },
              property_type: { type: 'string' },
              price_per_m2: { type: 'number', minimum: 0 },
              total_price: { type: 'number', minimum: 0 },
              area: { type: 'number', minimum: 0 },
              status: { 
                type: 'string',
                enum: ['available', 'sold', 'reserved', 'withdrawn'],
                default: 'available'
              }
            }
          },
          AnalyticsOverview: {
            type: 'object',
            properties: {
              averagePricePerM2: { type: 'number' },
              totalProperties: { type: 'integer' },
              soldProperties: { type: 'integer' },
              priceChange30Days: { type: 'number' },
              portfolioValue: { type: 'number' }
            }
          },
          Pagination: {
            type: 'object',
            properties: {
              total: { type: 'integer' },
              limit: { type: 'integer' },
              offset: { type: 'integer' },
              hasMore: { type: 'boolean' }
            }
          }
        }
      }
    }
  }

  /**
   * Helper methods
   */
  private generateSecureKey(length: number = 48): string {
    return crypto.randomBytes(length).toString('hex')
  }

  private hashAPIKey(apiKey: string): string {
    return crypto.createHash('sha256').update(apiKey).digest('hex')
  }

  private generateWebhookSignature(payload: any, secret: string): string {
    const payloadString = JSON.stringify(payload)
    return crypto.createHmac('sha256', secret).update(payloadString).digest('hex')
  }
}

export const apiIntegrationService = new APIIntegrationService()