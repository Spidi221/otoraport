import { NextRequest, NextResponse } from 'next/server'

// GUS API integration dla NIP lookup
// API publiczne: https://api.stat.gov.pl/Home/RegonApi

interface GUSResponse {
  Nazwa?: string;
  Nip?: string;
  Regon?: string;
  Wojewodztwo?: string;
  Powiat?: string;
  Gmina?: string;
  Miejscowosc?: string;
  KodPocztowy?: string;
  Ulica?: string;
  NrNieruchomosci?: string;
  NrLokalu?: string;
  Telefon?: string;
  Email?: string;
  WWW?: string;
}

export async function POST(request: NextRequest) {
  try {
    const { nip } = await request.json()

    if (!nip) {
      return NextResponse.json(
        { error: 'NIP is required' },
        { status: 400 }
      )
    }

    // Walidacja NIP (10 cyfr)
    const cleanNip = nip.replace(/\D/g, '')
    if (cleanNip.length !== 10) {
      return NextResponse.json(
        { error: 'Invalid NIP format. Must be 10 digits.' },
        { status: 400 }
      )
    }

    // Sprawdzenie sumy kontrolnej NIP
    if (!validateNIP(cleanNip)) {
      return NextResponse.json(
        { error: 'Invalid NIP checksum' },
        { status: 400 }
      )
    }

    // **PRZEWAGA NAD KONKURENCJĄ**: Używamy wielu źródeł
    let companyData = null

    try {
      // 1. Spróbuj GUS API (najlepsze źródło)
      companyData = await fetchFromGUS(cleanNip)
    } catch (error) {
      console.log('GUS API failed, trying alternative sources')
    }

    if (!companyData) {
      try {
        // 2. Fallback: KRS API lub inne źródło
        companyData = await fetchFromKRS(cleanNip)
      } catch (error) {
        console.log('KRS API failed, using NIP validation service')
      }
    }

    if (!companyData) {
      try {
        // 3. Fallback: NIP24 lub inne komercyjne API
        companyData = await fetchFromNIP24(cleanNip)
      } catch (error) {
        console.log('All lookup services failed')
      }
    }

    // Jeśli wszystko zawiedzie, zwróć przynajmniej walidację
    if (!companyData) {
      return NextResponse.json({
        success: true,
        data: {
          nip: cleanNip,
          valid: true,
          name: null,
          address: null,
          message: 'NIP is valid but company data could not be retrieved'
        }
      })
    }

    return NextResponse.json({
      success: true,
      data: {
        nip: cleanNip,
        valid: true,
        name: companyData.Nazwa || null,
        address: formatAddress(companyData),
        phone: companyData.Telefon || null,
        email: companyData.Email || null,
        website: companyData.WWW || null,
        regon: companyData.Regon || null,
        raw: companyData
      }
    })

  } catch (error) {
    console.error('NIP lookup error:', error)
    return NextResponse.json(
      { error: 'Internal server error during NIP lookup' },
      { status: 500 }
    )
  }
}

// Walidacja NIP (suma kontrolna)
function validateNIP(nip: string): boolean {
  const weights = [6, 5, 7, 2, 3, 4, 5, 6, 7]
  let sum = 0
  
  for (let i = 0; i < 9; i++) {
    sum += parseInt(nip[i]) * weights[i]
  }
  
  const checksum = sum % 11
  const lastDigit = parseInt(nip[9])
  
  return checksum === 10 ? lastDigit === 0 : checksum === lastDigit
}

// GUS API (najlepsze źródło danych)
async function fetchFromGUS(nip: string): Promise<GUSResponse | null> {
  try {
    // Note: GUS API wymaga klucza i konfiguracji
    // Tu implementacja zapytania do GUS REGON
    // https://api.stat.gov.pl/Home/RegonApi
    
    // Mock implementacja - zastąpić prawdziwym API
    const mockResponse = await mockGUSResponse(nip)
    return mockResponse
  } catch (error) {
    console.error('GUS API error:', error)
    return null
  }
}

// KRS API (fallback)
async function fetchFromKRS(nip: string): Promise<GUSResponse | null> {
  try {
    // KRS API integration lub web scraping
    console.log('Trying KRS lookup for NIP:', nip)
    return null // Not implemented yet
  } catch (error) {
    console.error('KRS API error:', error)
    return null
  }
}

// NIP24 API (komercyjne, fallback)
async function fetchFromNIP24(nip: string): Promise<GUSResponse | null> {
  try {
    // NIP24.pl API integration
    console.log('Trying NIP24 lookup for NIP:', nip)
    return null // Not implemented yet
  } catch (error) {
    console.error('NIP24 API error:', error)
    return null
  }
}

// Mock GUS response dla testowania
async function mockGUSResponse(nip: string): Promise<GUSResponse | null> {
  // Symulacja opóźnienia API
  await new Promise(resolve => setTimeout(resolve, 500))
  
  // Mock data dla popularnych deweloperów (do testowania)
  const mockData: Record<string, GUSResponse> = {
    '1234567890': {
      Nazwa: 'EXAMPLE DEVELOPMENT SP. Z O.O.',
      Nip: '1234567890',
      Regon: '123456789',
      Wojewodztwo: 'MAZOWIECKIE',
      Powiat: 'M. ST. WARSZAWA',
      Gmina: 'WARSZAWA',
      Miejscowosc: 'WARSZAWA',
      KodPocztowy: '00-001',
      Ulica: 'MARSZAŁKOWSKA',
      NrNieruchomosci: '1',
      Telefon: '+48123456789',
      Email: 'kontakt@example-dev.pl',
      WWW: 'https://example-dev.pl'
    },
    '9876543210': {
      Nazwa: 'KOWALSKI DEVELOPMENT SP. Z O.O.',
      Nip: '9876543210',
      Regon: '987654321',
      Wojewodztwo: 'MAZOWIECKIE',
      Miejscowosc: 'WARSZAWA',
      KodPocztowy: '02-123',
      Ulica: 'MOKOTOWSKA',
      NrNieruchomosci: '15'
    }
  }

  return mockData[nip] || null
}

// Formatowanie adresu
function formatAddress(data: GUSResponse): string | null {
  if (!data.Miejscowosc) return null
  
  const parts = []
  
  if (data.Ulica && data.NrNieruchomosci) {
    let street = data.Ulica
    if (data.NrNieruchomosci) street += ` ${data.NrNieruchomosci}`
    if (data.NrLokalu) street += `/${data.NrLokalu}`
    parts.push(street)
  }
  
  if (data.KodPocztowy && data.Miejscowosc) {
    parts.push(`${data.KodPocztowy} ${data.Miejscowosc}`)
  } else if (data.Miejscowosc) {
    parts.push(data.Miejscowosc)
  }
  
  return parts.join(', ') || null
}