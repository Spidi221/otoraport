/**
 * API Integration Tests for Validation & Developer Endpoints
 * Task #101.5 - Comprehensive testing of Task #101 endpoints
 *
 * Tests cover:
 * - /api/validation/missing-fields (5 tests)
 * - /api/developers/update (5 tests)
 * - /api/developers/{id}/completion-status (5 tests)
 *
 * Total: 15+ integration tests
 *
 * NOTE: These are integration tests requiring Supabase connection.
 * Skipped in CI/CD - run manually with: npm run test:integration
 */

import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest'
import { createClient } from '@supabase/supabase-js'

// ============================================================================
// TEST SETUP
// ============================================================================

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'

let supabase: ReturnType<typeof createClient>
let testUserId: string
let testDeveloperId: string
let authToken: string

beforeAll(async () => {
  // Initialize Supabase client with service role key
  supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })

  // Create test user
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: `test-${Date.now()}@example.com`,
    password: 'TestPassword123!',
    email_confirm: true
  })

  if (authError || !authData.user) {
    throw new Error(`Failed to create test user: ${authError?.message}`)
  }

  testUserId = authData.user.id

  // Get auth token
  const { data: sessionData, error: sessionError } = await supabase.auth.signInWithPassword({
    email: authData.user.email!,
    password: 'TestPassword123!'
  })

  if (sessionError || !sessionData.session) {
    throw new Error(`Failed to get auth token: ${sessionError?.message}`)
  }

  authToken = sessionData.session.access_token

  // Create test developer
  const { data: developer, error: devError } = await supabase
    .from('developers')
    .insert({
      user_id: testUserId,
      email: authData.user.email!,
      company_name: 'Test Developer Company',
      nip: '1234567890',
      client_id: `test_${Date.now()}`
    })
    .select()
    .single()

  if (devError || !developer) {
    throw new Error(`Failed to create test developer: ${devError?.message}`)
  }

  testDeveloperId = developer.id

  console.log('✅ Test setup complete:', { testUserId, testDeveloperId })
})

afterAll(async () => {
  // Cleanup: Delete test developer and user
  if (testDeveloperId) {
    await supabase.from('developers').delete().eq('id', testDeveloperId)
  }
  if (testUserId) {
    await supabase.auth.admin.deleteUser(testUserId)
  }
  console.log('✅ Test cleanup complete')
})

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

async function fetchAPI(path: string, options: RequestInit = {}) {
  const response = await fetch(`${baseUrl}/api${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`,
      ...options.headers,
    },
  })

  const data = await response.json()
  return { response, data }
}

// Skip integration tests if env vars not set
const skipIntegrationTests = !process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY

// ============================================================================
// TEST SUITE 1: /api/validation/missing-fields (5 tests)
// ============================================================================

describe.skipIf(skipIntegrationTests)('GET /api/validation/missing-fields', () => {
  it('should return validation data for authenticated user', async () => {
    const { response, data } = await fetchAPI('/validation/missing-fields')

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data).toHaveProperty('summary')
    expect(data.data).toHaveProperty('missingFieldsSummary')
    expect(data.data).toHaveProperty('properties')
    expect(data.data.summary).toHaveProperty('totalProperties')
    expect(data.data.summary).toHaveProperty('complianceScore')
  })

  it('should include section breakdown when requested', async () => {
    const { response, data } = await fetchAPI('/validation/missing-fields?includeSections=true')

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data).toHaveProperty('sectionBreakdown')
    expect(data.data.sectionBreakdown).toHaveProperty('developer')
    expect(data.data.sectionBreakdown).toHaveProperty('location')
    expect(data.data.sectionBreakdown).toHaveProperty('pricing')
    expect(data.data.sectionBreakdown).toHaveProperty('technical')

    // Check section structure
    expect(data.data.sectionBreakdown.developer).toHaveProperty('total')
    expect(data.data.sectionBreakdown.developer).toHaveProperty('valid')
    expect(data.data.sectionBreakdown.developer).toHaveProperty('percentage')

    // Should also include detailed missing fields
    expect(data.data).toHaveProperty('detailedMissingFields')
    expect(Array.isArray(data.data.detailedMissingFields)).toBe(true)
  })

  it('should handle invalid developer ID gracefully', async () => {
    const invalidId = '00000000-0000-0000-0000-000000000000'
    const { response, data } = await fetchAPI(`/validation/missing-fields?developerId=${invalidId}`)

    expect(response.status).toBe(404)
    expect(data.success).toBe(false)
    expect(data.error).toBeTruthy()
  })

  it('should require authentication', async () => {
    const response = await fetch(`${baseUrl}/api/validation/missing-fields`, {
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.success).toBe(false)
    expect(data.error).toBe('Unauthorized')
  })

  it('should return proper error for missing developer profile', async () => {
    // Create a user without developer profile
    const { data: tempUser } = await supabase.auth.admin.createUser({
      email: `temp-${Date.now()}@example.com`,
      password: 'TempPass123!',
      email_confirm: true
    })

    const { data: tempSession } = await supabase.auth.signInWithPassword({
      email: tempUser.user!.email!,
      password: 'TempPass123!'
    })

    const response = await fetch(`${baseUrl}/api/validation/missing-fields`, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tempSession.session!.access_token}`,
      },
    })

    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.success).toBe(false)
    expect(data.error).toContain('Developer profile not found')

    // Cleanup
    await supabase.auth.admin.deleteUser(tempUser.user!.id)
  })
})

// ============================================================================
// TEST SUITE 2: PATCH /api/developers/update (5 tests)
// ============================================================================

describe.skipIf(skipIntegrationTests)('PATCH /api/developers/update', () => {
  it('should successfully update developer profile', async () => {
    const updates = {
      company_name: 'Updated Test Company',
      phone: '+48 111 222 333',
      headquarters_city: 'Warszawa'
    }

    const { response, data } = await fetchAPI('/developers/update', {
      method: 'PATCH',
      body: JSON.stringify({ updates })
    })

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data).toHaveProperty('developer')
    expect(data.data).toHaveProperty('validationStatus')
    expect(data.data.developer.company_name).toBe('Updated Test Company')
    expect(data.data.developer.phone).toBe('+48 111 222 333')
    expect(data.data.validationStatus).toHaveProperty('complianceScore')
    expect(data.data.validationStatus).toHaveProperty('completionPercentage')
  })

  it('should validate NIP format', async () => {
    const updates = {
      nip: 'invalid-nip'
    }

    const { response, data } = await fetchAPI('/developers/update', {
      method: 'PATCH',
      body: JSON.stringify({ updates })
    })

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.error).toBe('Validation failed')
    expect(data.details).toBeTruthy()
    expect(Array.isArray(data.details)).toBe(true)
  })

  it('should reject invalid postal code format', async () => {
    const updates = {
      headquarters_postal_code: '12345' // Invalid format (should be XX-XXX)
    }

    const { response, data } = await fetchAPI('/developers/update', {
      method: 'PATCH',
      body: JSON.stringify({ updates })
    })

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.error).toBe('Validation failed')
  })

  it('should require authentication', async () => {
    const updates = { company_name: 'Test' }

    const response = await fetch(`${baseUrl}/api/developers/update`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ updates })
    })

    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.success).toBe(false)
    expect(data.error).toBe('Unauthorized')
  })

  it('should return updated validation status after update', async () => {
    const updates = {
      company_name: 'Full Company Name',
      nip: '9876543210',
      email: 'new-email@example.com',
      phone: '+48 999 888 777',
      regon: '123456789',
      legal_form: 'Spółka z o.o.',
      headquarters_city: 'Kraków',
      headquarters_postal_code: '30-001'
    }

    const { response, data } = await fetchAPI('/developers/update', {
      method: 'PATCH',
      body: JSON.stringify({ updates })
    })

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data.validationStatus.completionPercentage).toBeGreaterThan(0)
    expect(data.data.validationStatus.complianceScore).toBeGreaterThan(0)
    expect(Array.isArray(data.data.validationStatus.missingFields)).toBe(true)
  })
})

// ============================================================================
// TEST SUITE 3: GET /api/developers/{id}/completion-status (5 tests)
// ============================================================================

describe.skipIf(skipIntegrationTests)('GET /api/developers/{id}/completion-status', () => {
  it('should return completion status for developer', async () => {
    const { response, data } = await fetchAPI(`/developers/${testDeveloperId}/completion-status`)

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data).toHaveProperty('developerId')
    expect(data.data).toHaveProperty('companyName')
    expect(data.data).toHaveProperty('overallCompletion')
    expect(data.data).toHaveProperty('sectionCompletion')
    expect(data.data.developerId).toBe(testDeveloperId)
  })

  it('should calculate section completion correctly', async () => {
    const { response, data } = await fetchAPI(`/developers/${testDeveloperId}/completion-status`)

    expect(response.status).toBe(200)
    expect(data.data.sectionCompletion).toHaveProperty('basicInfo')
    expect(data.data.sectionCompletion).toHaveProperty('headquarters')
    expect(data.data.sectionCompletion).toHaveProperty('salesOffice')
    expect(data.data.sectionCompletion).toHaveProperty('contact')

    // Each section should have complete and percentage
    expect(data.data.sectionCompletion.basicInfo).toHaveProperty('complete')
    expect(data.data.sectionCompletion.basicInfo).toHaveProperty('percentage')
    expect(typeof data.data.sectionCompletion.basicInfo.complete).toBe('boolean')
    expect(typeof data.data.sectionCompletion.basicInfo.percentage).toBe('number')
  })

  it('should list missing critical and recommended fields', async () => {
    const { response, data } = await fetchAPI(`/developers/${testDeveloperId}/completion-status`)

    expect(response.status).toBe(200)
    expect(data.data).toHaveProperty('missingCriticalFields')
    expect(data.data).toHaveProperty('missingRecommendedFields')
    expect(Array.isArray(data.data.missingCriticalFields)).toBe(true)
    expect(Array.isArray(data.data.missingRecommendedFields)).toBe(true)
  })

  it('should provide actionable next steps', async () => {
    const { response, data } = await fetchAPI(`/developers/${testDeveloperId}/completion-status`)

    expect(response.status).toBe(200)
    expect(data.data).toHaveProperty('nextSteps')
    expect(Array.isArray(data.data.nextSteps)).toBe(true)
    expect(data.data.nextSteps.length).toBeGreaterThan(0)
  })

  it('should handle non-existent developer ID', async () => {
    const invalidId = '00000000-0000-0000-0000-000000000000'
    const { response, data } = await fetchAPI(`/developers/${invalidId}/completion-status`)

    expect(response.status).toBe(404)
    expect(data.success).toBe(false)
    expect(data.error).toBe('Developer not found')
  })
})

// ============================================================================
// ADDITIONAL EDGE CASE TESTS
// ============================================================================

describe.skipIf(skipIntegrationTests)('Edge Cases & Security', () => {
  it('should prevent access to other developers completion status', async () => {
    // Create another developer
    const { data: otherUser } = await supabase.auth.admin.createUser({
      email: `other-${Date.now()}@example.com`,
      password: 'OtherPass123!',
      email_confirm: true
    })

    const { data: otherDeveloper } = await supabase
      .from('developers')
      .insert({
        user_id: otherUser.user!.id,
        email: otherUser.user!.email!,
        company_name: 'Other Company',
        nip: '0987654321',
        client_id: `other_${Date.now()}`
      })
      .select()
      .single()

    // Try to access other developer's completion status with our auth token
    const { response, data } = await fetchAPI(`/developers/${otherDeveloper.id}/completion-status`)

    expect(response.status).toBe(403)
    expect(data.success).toBe(false)
    expect(data.error).toContain('Forbidden')

    // Cleanup
    await supabase.from('developers').delete().eq('id', otherDeveloper.id)
    await supabase.auth.admin.deleteUser(otherUser.user!.id)
  })

  it('should reject empty updates object', async () => {
    const { response, data } = await fetchAPI('/developers/update', {
      method: 'PATCH',
      body: JSON.stringify({ updates: {} })
    })

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.error).toBe('Validation failed')
  })

  it('should handle malformed request body', async () => {
    const { response, data } = await fetchAPI('/developers/update', {
      method: 'PATCH',
      body: 'invalid-json'
    })

    expect(response.status).toBe(500) // JSON parse error
    expect(data.success).toBe(false)
  })
})

console.log('✅ All API integration tests defined')
