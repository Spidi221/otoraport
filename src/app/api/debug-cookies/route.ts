import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const cookieHeader = request.headers.get('cookie')
  const allCookies = request.cookies.getAll()

  console.log('=== COOKIE DEBUGGING ===')
  console.log('Cookie header:', cookieHeader)
  console.log('All cookies:', allCookies)

  const supabaseCookies = allCookies.filter(cookie =>
    cookie.name.includes('supabase') ||
    cookie.name.includes('sb-') ||
    cookie.name.includes('auth')
  )

  return NextResponse.json({
    cookieHeader,
    allCookies,
    supabaseCookies,
    timestamp: new Date().toISOString()
  })
}