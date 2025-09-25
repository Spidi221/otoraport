import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST() {
  try {
    console.log('Testing database connection and creating test table...')

    // Try to check if tables exist by querying them
    const { data: developersCheck, error: developersCheckError } = await supabaseAdmin
      .from('developers')
      .select('id')
      .limit(1)

    console.log('Developers table check:', { data: developersCheck, error: developersCheckError })

    // If table doesn't exist, we need to create it through Supabase Dashboard
    // For now, let's just test if we can insert into existing tables
    const { data, error } = await supabaseAdmin
      .from('developers')
      .insert({
        email: 'test@example.com',
        name: 'Test User'
      })
      .select()

    if (error) {
      console.error('Insert test error:', error)
      return NextResponse.json({ 
        status: 'error',
        message: 'Tables may not exist. Please create them in Supabase Dashboard first.',
        error: error.message,
        instructions: 'Go to your Supabase Dashboard > SQL Editor and run the migration SQL file'
      })
    }

    // Clean up test data
    if (data && data[0]) {
      await supabaseAdmin
        .from('developers')
        .delete()
        .eq('id', data[0].id)
    }

    return NextResponse.json({ 
      status: 'success',
      message: 'Database connection successful and tables exist',
      testInsertId: data?.[0]?.id
    })

  } catch (err) {
    console.error('Database test error:', err)
    return NextResponse.json({ 
      error: 'Failed to test database',
      details: String(err),
      message: 'Please create the database tables manually in Supabase Dashboard'
    }, { status: 500 })
  }
}