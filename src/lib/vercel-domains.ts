/**
 * Vercel Domains API Integration
 *
 * Handles adding custom domains to Vercel project via API.
 * Requires VERCEL_API_TOKEN and VERCEL_PROJECT_ID environment variables.
 *
 * API Documentation: https://vercel.com/docs/rest-api/endpoints#domains
 *
 * Manual Setup Required:
 * 1. Create Vercel API Token: https://vercel.com/account/tokens
 * 2. Get Project ID from: Project Settings -> General
 * 3. Add to .env:
 *    VERCEL_API_TOKEN=your_token_here
 *    VERCEL_PROJECT_ID=prj_xxxxxxxxxxxxx
 *    VERCEL_TEAM_ID=team_xxxxxxxxxxxxx (optional)
 */

import { z } from 'zod';

// Environment variable validation
const vercelConfigSchema = z.object({
  VERCEL_API_TOKEN: z.string().min(1, 'VERCEL_API_TOKEN is required'),
  VERCEL_PROJECT_ID: z.string().min(1, 'VERCEL_PROJECT_ID is required'),
  VERCEL_TEAM_ID: z.string().optional(),
});

type VercelConfig = z.infer<typeof vercelConfigSchema>;

/**
 * Get and validate Vercel configuration from environment
 */
function getVercelConfig(): VercelConfig {
  const config = {
    VERCEL_API_TOKEN: process.env.VERCEL_API_TOKEN,
    VERCEL_PROJECT_ID: process.env.VERCEL_PROJECT_ID,
    VERCEL_TEAM_ID: process.env.VERCEL_TEAM_ID,
  };

  return vercelConfigSchema.parse(config);
}

/**
 * Check if Vercel API is configured
 */
export function isVercelConfigured(): boolean {
  try {
    getVercelConfig();
    return true;
  } catch {
    return false;
  }
}

/**
 * Vercel API response types
 */
interface VercelDomainResponse {
  name: string;
  apexName: string;
  projectId: string;
  verified: boolean;
  verification?: Array<{
    type: string;
    domain: string;
    value: string;
    reason: string;
  }>;
  createdAt: number;
  updatedAt?: number;
}

interface VercelErrorResponse {
  error: {
    code: string;
    message: string;
  };
}

/**
 * Domain configuration result
 */
export interface DomainConfigResult {
  success: boolean;
  domain?: string;
  verification?: {
    type: 'A' | 'CNAME';
    name: string;
    value: string;
  };
  error?: string;
  errorCode?: string;
}

/**
 * Add domain to Vercel project
 *
 * @param domain - The domain to add (e.g., "ceny.firma.pl")
 * @returns Configuration instructions for DNS
 */
export async function addDomainToVercel(domain: string): Promise<DomainConfigResult> {
  try {
    const config = getVercelConfig();

    // Validate domain format
    const domainRegex = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)+$/;
    if (!domainRegex.test(domain.toLowerCase())) {
      return {
        success: false,
        error: 'Nieprawidłowy format domeny',
        errorCode: 'invalid_domain_format',
      };
    }

    // Build API URL with team ID if provided
    const baseUrl = `https://api.vercel.com/v9/projects/${config.VERCEL_PROJECT_ID}/domains`;
    const url = config.VERCEL_TEAM_ID
      ? `${baseUrl}?teamId=${config.VERCEL_TEAM_ID}`
      : baseUrl;

    console.log('🌐 VERCEL API: Adding domain to project:', domain);

    // Make API request
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.VERCEL_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: domain.toLowerCase(),
      }),
    });

    const data = await response.json();

    // Handle success
    if (response.ok) {
      const domainData = data as VercelDomainResponse;

      console.log('✅ VERCEL API: Domain added successfully:', domainData.name);

      // Determine DNS configuration type
      const isSubdomain = domain.split('.').length > 2;
      const verification = isSubdomain
        ? {
            type: 'CNAME' as const,
            name: domain,
            value: 'cname.vercel-dns.com',
          }
        : {
            type: 'A' as const,
            name: domain,
            value: '76.76.21.21',
          };

      return {
        success: true,
        domain: domainData.name,
        verification,
      };
    }

    // Handle errors
    const errorData = data as VercelErrorResponse;
    console.error('❌ VERCEL API: Error adding domain:', errorData);

    // Map common error codes to user-friendly messages
    let errorMessage = errorData.error?.message || 'Nieznany błąd';
    let errorCode = errorData.error?.code || 'unknown_error';

    switch (errorData.error?.code) {
      case 'domain_already_in_use':
        errorMessage = 'Domena jest już używana w innym projekcie Vercel';
        break;
      case 'invalid_domain':
        errorMessage = 'Nieprawidłowa domena';
        break;
      case 'forbidden':
        errorMessage = 'Brak uprawnień do dodania domeny. Sprawdź token API.';
        break;
      case 'not_found':
        errorMessage = 'Nie znaleziono projektu Vercel. Sprawdź VERCEL_PROJECT_ID.';
        break;
      case 'rate_limit_exceeded':
        errorMessage = 'Przekroczono limit requestów. Spróbuj ponownie za chwilę.';
        break;
    }

    return {
      success: false,
      error: errorMessage,
      errorCode,
    };

  } catch (error) {
    console.error('💥 VERCEL API: Unexpected error:', error);

    // Check if it's a configuration error
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: 'Vercel API nie jest skonfigurowane. Skontaktuj się z administratorem.',
        errorCode: 'config_missing',
      };
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Nieoczekiwany błąd',
      errorCode: 'unexpected_error',
    };
  }
}

/**
 * Remove domain from Vercel project
 *
 * @param domain - The domain to remove
 */
export async function removeDomainFromVercel(domain: string): Promise<DomainConfigResult> {
  try {
    const config = getVercelConfig();

    const baseUrl = `https://api.vercel.com/v9/projects/${config.VERCEL_PROJECT_ID}/domains/${domain.toLowerCase()}`;
    const url = config.VERCEL_TEAM_ID
      ? `${baseUrl}?teamId=${config.VERCEL_TEAM_ID}`
      : baseUrl;

    console.log('🗑️ VERCEL API: Removing domain from project:', domain);

    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${config.VERCEL_API_TOKEN}`,
      },
    });

    if (response.ok) {
      console.log('✅ VERCEL API: Domain removed successfully');
      return {
        success: true,
        domain,
      };
    }

    const errorData = await response.json() as VercelErrorResponse;
    console.error('❌ VERCEL API: Error removing domain:', errorData);

    return {
      success: false,
      error: errorData.error?.message || 'Błąd usuwania domeny',
      errorCode: errorData.error?.code || 'unknown_error',
    };

  } catch (error) {
    console.error('💥 VERCEL API: Unexpected error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Nieoczekiwany błąd',
      errorCode: 'unexpected_error',
    };
  }
}

/**
 * Get domain configuration from Vercel
 *
 * @param domain - The domain to check
 */
export async function getDomainConfig(domain: string): Promise<DomainConfigResult & { verified?: boolean }> {
  try {
    const config = getVercelConfig();

    const baseUrl = `https://api.vercel.com/v9/projects/${config.VERCEL_PROJECT_ID}/domains/${domain.toLowerCase()}`;
    const url = config.VERCEL_TEAM_ID
      ? `${baseUrl}?teamId=${config.VERCEL_TEAM_ID}`
      : baseUrl;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${config.VERCEL_API_TOKEN}`,
      },
    });

    if (response.ok) {
      const domainData = await response.json() as VercelDomainResponse;

      return {
        success: true,
        domain: domainData.name,
        verified: domainData.verified,
      };
    }

    return {
      success: false,
      error: 'Nie znaleziono domeny w projekcie Vercel',
      errorCode: 'not_found',
    };

  } catch (error) {
    console.error('💥 VERCEL API: Error getting domain config:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Nieoczekiwany błąd',
      errorCode: 'unexpected_error',
    };
  }
}
