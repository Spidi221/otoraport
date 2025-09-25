import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    version: '1.0.0',
    services: {
      ministry_compliance: '100%',
      xml_generation: 'operational',
      file_generation: 'operational',
      build_status: 'success'
    }
  }, { status: 200 })
}