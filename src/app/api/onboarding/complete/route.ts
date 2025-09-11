import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const session: any = await getServerSession(authOptions as any)

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Update developer record to mark onboarding as completed
    const { data, error } = await supabaseAdmin
      .from('developers')
      .update({
        onboarding_completed: true,
        onboarding_completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('email', session.user.email)
      .select()
      .single()

    if (error || !data) {
      return NextResponse.json(
        { error: 'Failed to complete onboarding' },
        { status: 500 }
      )
    }

    console.log(`Onboarding completed for user: ${session.user.email}`)

    return NextResponse.json({
      success: true,
      message: 'Onboarding completed successfully',
      data: {
        onboarding_completed: true,
        completed_at: data.onboarding_completed_at
      }
    })

  } catch (error) {
    console.error('Error completing onboarding:', error)
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}