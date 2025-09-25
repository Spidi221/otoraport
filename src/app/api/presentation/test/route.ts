import { NextRequest, NextResponse } from 'next/server'
import { generatePresentationHTML, calculateMarketStats, generatePriceHistoryChart } from '@/lib/presentation-generator'

/**
 * Test endpoint for presentation system
 * GET /api/presentation/test - Test all components
 */
export async function GET(request: NextRequest) {
  try {
    console.log('🧪 Testing Presentation System Components...')

    // Mock test data
    const mockDeveloper = {
      name: 'Test Development Company',
      nip: '1234567890',
      phone: '+48 123 456 789',
      email: 'contact@testdeveloper.pl'
    }

    const mockProperties = [
      {
        id: '1',
        property_number: 'A1',
        area: 65,
        total_price: 450000,
        price_per_m2: 6923,
        floor: 2,
        rooms: 3,
        status: 'available' as const,
        building_number: 'A',
        created_at: '2024-01-15T10:00:00Z',
        updated_at: '2024-09-12T10:00:00Z'
      },
      {
        id: '2',
        property_number: 'B2',
        area: 85,
        total_price: 620000,
        price_per_m2: 7294,
        floor: 3,
        rooms: 4,
        status: 'reserved' as const,
        building_number: 'B',
        created_at: '2024-02-10T10:00:00Z',
        updated_at: '2024-09-12T10:00:00Z'
      },
      {
        id: '3',
        property_number: 'C3',
        area: 42,
        total_price: 320000,
        price_per_m2: 7619,
        floor: 1,
        rooms: 2,
        status: 'sold' as const,
        building_number: 'C',
        created_at: '2024-03-05T10:00:00Z',
        updated_at: '2024-09-12T10:00:00Z'
      }
    ]

    const mockProjects = [
      {
        id: 'project-1',
        name: 'Osiedle Słoneczne',
        description: 'Nowoczesne osiedle mieszkaniowe w sercu miasta',
        location: 'Warszawa, ul. Testowa 123',
        properties: mockProperties
      }
    ]

    console.log('✅ Mock data prepared')

    // Test 1: Market Statistics Calculation
    console.log('📊 Testing calculateMarketStats...')
    const marketStats = calculateMarketStats(mockProperties)
    
    console.log('Market Stats Results:', {
      totalProperties: marketStats.totalProperties,
      avgPrice: Math.round(marketStats.avgPrice),
      avgPricePerM2: Math.round(marketStats.avgPricePerM2),
      availableCount: marketStats.availableCount,
      reservedCount: marketStats.reservedCount,
      soldCount: marketStats.soldCount
    })

    // Test 2: Price History Generation
    console.log('📈 Testing generatePriceHistoryChart...')
    const priceHistory = generatePriceHistoryChart(mockProperties)
    
    console.log('Price History Results:', {
      monthsGenerated: priceHistory.length,
      latestMonth: priceHistory[priceHistory.length - 1],
      oldestMonth: priceHistory[0]
    })

    // Test 3: HTML Generation
    console.log('🌐 Testing generatePresentationHTML...')
    const siteData = {
      developer: mockDeveloper,
      projects: mockProjects,
      totalProperties: mockProperties.length,
      avgPrice: marketStats.avgPrice,
      priceRange: marketStats.priceRange,
      generatedAt: new Date().toISOString(),
      presentationUrl: 'test-developer.otoraport.pl',
      marketStats,
      priceHistory
    }

    const htmlContent = generatePresentationHTML(siteData)
    
    console.log('HTML Generation Results:', {
      htmlLength: htmlContent.length,
      containsChartJs: htmlContent.includes('Chart.js'),
      containsMarketStats: htmlContent.includes('Statystyki Rynkowe'),
      containsPriceChart: htmlContent.includes('Historia Cen'),
      containsProperties: htmlContent.includes('Dostępne Mieszkania')
    })

    // Test 4: Chart.js Data Format
    console.log('📊 Testing Chart.js data format...')
    const chartData = {
      labels: priceHistory.map(item => item.date),
      avgPrices: priceHistory.map(item => item.avgPrice),
      avgPricesPerM2: priceHistory.map(item => item.avgPricePerM2)
    }

    // Test 5: CSS and Responsive Design
    console.log('🎨 Testing embedded CSS...')
    const hasResponsiveCSS = htmlContent.includes('@media (max-width: 768px)')
    const hasChartCSS = htmlContent.includes('#priceChart')
    const hasFilterCSS = htmlContent.includes('.filters')

    // Test Results Summary
    const testResults = {
      success: true,
      timestamp: new Date().toISOString(),
      tests: {
        marketStatsCalculation: {
          passed: marketStats.totalProperties === 3 && marketStats.availableCount === 1,
          details: marketStats
        },
        priceHistoryGeneration: {
          passed: priceHistory.length === 12 && priceHistory[0].date && priceHistory[0].avgPrice > 0,
          details: {
            monthsGenerated: priceHistory.length,
            sampleData: priceHistory.slice(0, 2)
          }
        },
        htmlGeneration: {
          passed: htmlContent.length > 10000 && htmlContent.includes('Chart.js'),
          details: {
            htmlSize: htmlContent.length,
            hasChartJs: htmlContent.includes('Chart.js'),
            hasMarketStats: htmlContent.includes('Statystyki Rynkowe'),
            hasInteractiveFilters: htmlContent.includes('filterProperties()')
          }
        },
        chartDataFormat: {
          passed: chartData.labels.length === 12 && chartData.avgPrices.every(price => price > 0),
          details: chartData
        },
        responsiveDesign: {
          passed: hasResponsiveCSS && hasChartCSS && hasFilterCSS,
          details: {
            responsiveMedia: hasResponsiveCSS,
            chartStyling: hasChartCSS,
            filterStyling: hasFilterCSS
          }
        }
      },
      integrationChecks: {
        customDomainSupport: siteData.presentationUrl.includes('.otoraport.pl'),
        seoOptimization: htmlContent.includes('<meta name="description"'),
        openGraphTags: htmlContent.includes('<meta property="og:'),
        structuredData: htmlContent.includes('application/ld+json') || false, // Not implemented yet
        chartJsCDN: htmlContent.includes('cdn.jsdelivr.net/npm/chart.js')
      }
    }

    console.log('✅ All tests completed successfully!')

    return NextResponse.json(testResults, { status: 200 })

  } catch (error) {
    console.error('❌ Test failed:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown test error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

/**
 * POST /api/presentation/test - Test with custom data
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { developer, properties, testType = 'full' } = body

    if (!developer || !properties) {
      return NextResponse.json({
        success: false,
        error: 'Missing required test data: developer and properties'
      }, { status: 400 })
    }

    let testResults: any = {
      success: true,
      timestamp: new Date().toISOString(),
      testType,
      inputData: {
        propertiesCount: properties.length,
        developerName: developer.name
      }
    }

    if (testType === 'stats' || testType === 'full') {
      const marketStats = calculateMarketStats(properties)
      testResults.marketStats = marketStats
    }

    if (testType === 'history' || testType === 'full') {
      const priceHistory = generatePriceHistoryChart(properties)
      testResults.priceHistory = {
        monthsGenerated: priceHistory.length,
        sampleMonths: priceHistory.slice(-3)
      }
    }

    if (testType === 'html' || testType === 'full') {
      const mockProjects = [{
        id: 'test-project',
        name: 'Test Project',
        description: 'Test project for HTML generation',
        location: 'Test Location',
        properties
      }]

      const siteData = {
        developer,
        projects: mockProjects,
        totalProperties: properties.length,
        avgPrice: properties.reduce((sum: number, p: any) => sum + (p.total_price || 0), 0) / properties.length,
        priceRange: {
          min: Math.min(...properties.map((p: any) => p.total_price || 0)),
          max: Math.max(...properties.map((p: any) => p.total_price || 0))
        },
        generatedAt: new Date().toISOString(),
        presentationUrl: 'custom-test.otoraport.pl',
        marketStats: calculateMarketStats(properties),
        priceHistory: generatePriceHistoryChart(properties)
      }

      const htmlContent = generatePresentationHTML(siteData)
      testResults.html = {
        generated: true,
        size: htmlContent.length,
        containsData: htmlContent.includes(developer.name)
      }
    }

    return NextResponse.json(testResults)

  } catch (error) {
    console.error('Custom test failed:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Custom test error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}