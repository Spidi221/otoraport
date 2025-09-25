import { NextResponse } from 'next/server'
import { testMinistryCompliance, generateComplianceReport } from '@/lib/ministry-compliance-test'

export async function GET() {
  try {
    const result = testMinistryCompliance()
    const report = generateComplianceReport()
    
    return NextResponse.json({
      success: true,
      compliance: result,
      report,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Compliance test error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}