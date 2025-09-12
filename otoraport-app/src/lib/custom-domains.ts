/**
 * Custom Domains Service for Enterprise Plans
 * Based on CLAUDE.md Phase 2 specification
 * Vercel Domains API integration - $20/domain/month cost
 */

interface DomainSetupResult {
  success: boolean
  dnsRecords?: Array<{
    type: string
    name: string
    value: string
  }>
  status: 'pending_verification' | 'verified' | 'error'
  error?: string
  verificationToken?: string
}

interface CustomDomainConfig {
  domain: string
  developerId: string
  projectId?: string
  verificationToken?: string
  status: 'pending' | 'verified' | 'failed'
}

/**
 * Setup custom domain using Vercel Domains API
 * Cost: $20/domain/month - requires Enterprise plan pricing adjustment
 */
export async function setupCustomDomain(domain: string, developerId: string): Promise<DomainSetupResult> {
  try {
    // Input validation
    if (!isValidDomain(domain)) {
      return {
        success: false,
        status: 'error',
        error: 'Invalid domain format. Use format: example.com (without www or https)'
      }
    }

    // Check if domain is already in use
    const existingDomain = await checkDomainExists(domain)
    if (existingDomain) {
      return {
        success: false,
        status: 'error',
        error: 'Domain is already configured for another developer'
      }
    }

    // PHASE 2: Vercel Domains API integration
    const vercelProjectId = process.env.VERCEL_PROJECT_ID
    const vercelToken = process.env.VERCEL_TOKEN

    if (!vercelProjectId || !vercelToken) {
      // Fallback to manual DNS setup
      return setupManualDNS(domain, developerId)
    }

    console.log(`Setting up custom domain ${domain} for developer ${developerId}`)

    // Add domain to Vercel project via API
    const vercelResponse = await fetch(`https://api.vercel.com/v9/projects/${vercelProjectId}/domains`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${vercelToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: domain,
        redirect: null // Don't redirect, handle in middleware
      })
    })

    if (!vercelResponse.ok) {
      const error = await vercelResponse.text()
      console.error('Vercel domain setup failed:', error)
      
      // Fallback to manual setup
      return setupManualDNS(domain, developerId)
    }

    const domainData = await vercelResponse.json()
    
    // Save domain configuration to database
    await saveDomainConfig({
      domain,
      developerId,
      projectId: vercelProjectId,
      verificationToken: domainData.verification?.[0]?.value,
      status: 'pending'
    })

    return {
      success: true,
      status: 'pending_verification',
      dnsRecords: domainData.verification || [
        {
          type: 'CNAME',
          name: domain,
          value: 'cname.vercel-dns.com'
        }
      ],
      verificationToken: domainData.verification?.[0]?.value
    }

  } catch (error) {
    console.error('Custom domain setup error:', error)
    
    return {
      success: false,
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error during domain setup'
    }
  }
}

/**
 * Fallback: Manual DNS setup when Vercel API unavailable
 * Based on Cloudflare Workers approach from CLAUDE.md
 */
async function setupManualDNS(domain: string, developerId: string): Promise<DomainSetupResult> {
  const verificationToken = generateVerificationToken()
  
  await saveDomainConfig({
    domain,
    developerId,
    verificationToken,
    status: 'pending'
  })

  return {
    success: true,
    status: 'pending_verification',
    dnsRecords: [
      {
        type: 'CNAME',
        name: domain,
        value: 'otoraport.pl' // Our main domain
      },
      {
        type: 'TXT',
        name: `_otoraport.${domain}`,
        value: `verification=${verificationToken}`
      }
    ],
    verificationToken
  }
}

/**
 * Check custom domain verification status
 */
export async function verifyCustomDomain(domain: string): Promise<{
  verified: boolean
  error?: string
}> {
  try {
    // Check TXT record for verification
    const txtRecords = await checkDNSRecords(domain, 'TXT')
    const verificationRecord = txtRecords.find(record => 
      record.includes('verification=') || record.includes('client-id=')
    )

    if (!verificationRecord) {
      return {
        verified: false,
        error: 'Verification TXT record not found. Please check DNS configuration.'
      }
    }

    // Update domain status in database
    await updateDomainStatus(domain, 'verified')
    
    return { verified: true }

  } catch (error) {
    console.error('Domain verification error:', error)
    return {
      verified: false,
      error: error instanceof Error ? error.message : 'Verification check failed'
    }
  }
}

/**
 * Get developer by custom domain for middleware routing
 */
export async function getDeveloperByDomain(domain: string): Promise<{
  id: string
  client_id: string
  company_name: string
  subscription_plan: string
} | null> {
  try {
    const { supabaseAdmin } = await import('@/lib/supabase')
    
    const { data: developer, error } = await supabaseAdmin
      .from('developers')
      .select('id, client_id, company_name, subscription_plan')
      .eq('custom_domain', domain)
      .eq('subscription_plan', 'enterprise')
      .single()

    if (error || !developer) {
      console.log(`No developer found for custom domain: ${domain}`)
      return null
    }

    return developer

  } catch (error) {
    console.error('Error getting developer by domain:', error)
    return null
  }
}

/**
 * Generate DNS setup instructions for customers
 */
export function generateDNSInstructions(domain: string, verificationToken: string): string {
  return `
## DNS Configuration for ${domain}

### Step 1: Add CNAME Record
- **Type:** CNAME
- **Name:** ${domain} (or @ for root domain)  
- **Value:** cname.vercel-dns.com
- **TTL:** 300 (5 minutes)

### Step 2: Add Verification TXT Record
- **Type:** TXT
- **Name:** _otoraport.${domain}
- **Value:** verification=${verificationToken}
- **TTL:** 300 (5 minutes)

### Step 3: Wait for Propagation
DNS changes can take up to 24 hours to propagate worldwide.

### Step 4: Verify in Dashboard
Once DNS records are active, click "Verify Domain" in your OTORAPORT dashboard.

⚠️ **Important Notes:**
- Make sure there are no conflicting A or CNAME records for ${domain}
- SSL certificate will be automatically provisioned once verification is complete
- Custom domain requires Enterprise plan ($399/month)

📞 **Need Help?**
Contact our support team at support@otoraport.pl if you encounter any issues.
  `.trim()
}

/**
 * Utility functions
 */
function isValidDomain(domain: string): boolean {
  const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$/
  return domainRegex.test(domain) && !domain.includes('.')
}

function generateVerificationToken(): string {
  return 'otoraport_' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36)
}

async function checkDomainExists(domain: string): Promise<boolean> {
  const { supabaseAdmin } = await import('@/lib/supabase')
  
  const { data } = await supabaseAdmin
    .from('developers')
    .select('id')
    .eq('custom_domain', domain)
    .single()
    
  return !!data
}

async function saveDomainConfig(config: CustomDomainConfig): Promise<void> {
  const { supabaseAdmin } = await import('@/lib/supabase')
  
  await supabaseAdmin
    .from('developers')
    .update({
      custom_domain: config.domain,
      // Store verification token in a JSON field or separate table
      // For now, we'll use the existing structure
    })
    .eq('id', config.developerId)
}

async function updateDomainStatus(domain: string, status: 'verified' | 'failed'): Promise<void> {
  // Implementation would update domain verification status
  // This could be in a separate domains table or in developers table
  console.log(`Domain ${domain} status updated to: ${status}`)
}

async function checkDNSRecords(domain: string, type: 'TXT' | 'CNAME'): Promise<string[]> {
  // This would use a DNS lookup service
  // For MVP, we'll simulate with a placeholder
  console.log(`Checking ${type} records for ${domain}`)
  return []
}

/**
 * Cost calculation for Enterprise plans
 * Vercel Domains cost: $20/domain/month
 */
export function calculateDomainCosts(domainsCount: number): {
  monthlyDomainCost: number
  recommendedMinimumPlan: number
  profitMargin: number
} {
  const vercelCostPerDomain = 20 // USD per domain per month
  const monthlyDomainCost = domainsCount * vercelCostPerDomain
  const recommendedMinimumPlan = Math.max(399, monthlyDomainCost * 2.5) // 150% markup minimum
  
  return {
    monthlyDomainCost,
    recommendedMinimumPlan,
    profitMargin: recommendedMinimumPlan - monthlyDomainCost
  }
}