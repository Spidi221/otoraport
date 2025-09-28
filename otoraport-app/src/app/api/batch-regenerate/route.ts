import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin, Database } from '@/lib/supabase'

type DeveloperSelect = {
  id: string
  name: string
  company_name: string | null
  email: string
  subscription_status: string
}

export async function POST(request: NextRequest) {
  try {
    const { adminKey, forceAll = false } = await request.json()

    // Prosta autoryzacja admin (w produkcji używaj JWT)
    if (adminKey !== process.env.ADMIN_SECRET_KEY) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    console.log('🚀 Starting batch regeneration...')

    // Pobierz wszystkich aktywnych deweloperów
    const { data: developers, error: devError } = await supabaseAdmin
      .from('developers')
      .select('id, name, company_name, email, subscription_status')
      .eq('subscription_status', 'active') as { data: DeveloperSelect[] | null, error: any }

    if (devError || !developers) {
      return NextResponse.json(
        { error: 'Failed to fetch developers' },
        { status: 500 }
      )
    }

    console.log(`📋 Found ${developers.length} active developers`)

    const results = {
      success: 0,
      failed: 0,
      skipped: 0,
      details: [] as any[]
    }

    // Przetwarzaj każdego dewelopera
    for (const developer of developers) {
      try {
        console.log(`Processing: ${developer.company_name}...`)

        // Wywołaj endpoint regeneracji dla każdego dewelopera
        const regenerateResponse = await fetch(`${process.env.NEXTAUTH_URL}/api/regenerate-files`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            developerId: developer.id,
            forceRegenerate: forceAll
          })
        })

        const regenerateResult = await regenerateResponse.json()

        if (regenerateResult.success) {
          if (regenerateResult.skipRegeneration) {
            results.skipped++
            results.details.push({
              developerId: developer.id,
              company: developer.company_name,
              status: 'skipped',
              reason: 'Files up to date'
            })
          } else {
            results.success++
            results.details.push({
              developerId: developer.id,
              company: developer.company_name,
              status: 'success',
              properties: regenerateResult.data?.statistics?.properties_count || 0
            })
          }
        } else {
          results.failed++
          results.details.push({
            developerId: developer.id,
            company: developer.company_name,
            status: 'failed',
            error: regenerateResult.error
          })
        }

        // Małe opóźnienie między requestami
        await new Promise(resolve => setTimeout(resolve, 100))

      } catch (error) {
        results.failed++
        results.details.push({
          developerId: developer.id,
          company: developer.company_name,
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    // Loguj wyniki batch operacji
    await (supabaseAdmin
      .from('activity_logs')
      .insert({
        action: 'batch_regeneration',
        details: {
          total_developers: developers.length,
          results: results,
          force_all: forceAll,
          completed_at: new Date().toISOString()
        }
      }) as Promise<any>)
      .catch((err: any) => console.error('Batch log failed:', err))

    console.log('✅ Batch regeneration completed:', results)

    return NextResponse.json({
      success: true,
      message: 'Batch regeneration completed',
      summary: {
        total_developers: developers.length,
        successful: results.success,
        failed: results.failed,
        skipped: results.skipped
      },
      details: results.details
    })

  } catch (error) {
    console.error('Batch regeneration error:', error)
    return NextResponse.json(
      { 
        error: 'Batch regeneration failed', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
}

// GET endpoint dla statusu batch operacji
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const adminKey = searchParams.get('adminKey')

    if (adminKey !== process.env.ADMIN_SECRET_KEY) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Sprawdź ostatnie batch operacje
    const { data: logs } = await supabaseAdmin
      .from('activity_logs')
      .select('*')
      .eq('action', 'batch_regeneration')
      .order('created_at', { ascending: false })
      .limit(5)

    // Sprawdź ogólny status systemu
    const { data: developers } = await supabaseAdmin
      .from('developers')
      .select('id, subscription_status')
      .eq('subscription_status', 'active')

    const { data: files } = await supabaseAdmin
      .from('generated_files')
      .select('developer_id, last_generated, properties_count')

    const stats = {
      total_active_developers: developers?.length || 0,
      developers_with_files: files?.length || 0,
      last_batch_operations: logs || []
    }

    return NextResponse.json({
      success: true,
      data: stats
    })

  } catch (error) {
    console.error('Batch status error:', error)
    return NextResponse.json(
      { error: 'Status check failed' },
      { status: 500 }
    )
  }
}