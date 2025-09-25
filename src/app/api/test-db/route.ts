import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  try {
    // Test connection
    const { data, error } = await supabaseAdmin
      .from('developers')
      .select('count(*)', { count: 'exact', head: true })

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ 
      status: 'success', 
      message: 'Database connection successful',
      developersCount: data || 0
    })
  } catch (err) {
    console.error('Connection error:', err)
    return NextResponse.json({ 
      error: 'Failed to connect to database' 
    }, { status: 500 })
  }
}