import { NextRequest, NextResponse } from 'next/server';
import { validateApiSetup } from '@/lib/api-middleware';

export async function GET(request: NextRequest) {
  try {
    const validation = await validateApiSetup();

    return NextResponse.json({
      status: validation.isValid ? 'valid' : 'invalid',
      timestamp: new Date().toISOString(),
      validation
    }, {
      status: validation.isValid ? 200 : 500
    });
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}