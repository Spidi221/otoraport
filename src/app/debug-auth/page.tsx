'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase-single'

export default function DebugAuthPage() {
  const [debugInfo, setDebugInfo] = useState<any>({})

  useEffect(() => {
    async function runDiagnostics() {
      const debug: any = {
        timestamp: new Date().toISOString(),
        url: window.location.href,
        cookies: document.cookie,
        localStorage_keys: Object.keys(localStorage),
        sessionStorage_keys: Object.keys(sessionStorage)
      }

      // Check Supabase session
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        debug.supabase_session = {
          has_session: !!session,
          user_email: session?.user?.email,
          access_token_exists: !!session?.access_token,
          error: error?.message
        }
      } catch (error) {
        debug.supabase_session = { error: error?.message }
      }

      // Check auth state
      try {
        const { data: { user }, error } = await supabase.auth.getUser()
        debug.supabase_user = {
          has_user: !!user,
          user_email: user?.email,
          error: error?.message
        }
      } catch (error) {
        debug.supabase_user = { error: error?.message }
      }

      // Check localStorage for auth data
      debug.localStorage_auth = {}
      Object.keys(localStorage).forEach(key => {
        if (key.includes('supabase') || key.includes('sb-') || key.includes('auth')) {
          debug.localStorage_auth[key] = localStorage.getItem(key)?.substring(0, 100) + '...'
        }
      })

      // Check all cookies
      debug.parsed_cookies = {}
      document.cookie.split(';').forEach(cookie => {
        const [name, value] = cookie.trim().split('=')
        if (name && (name.includes('sb-') || name.includes('supabase') || name.includes('auth'))) {
          debug.parsed_cookies[name] = value?.substring(0, 50) + '...'
        }
      })

      setDebugInfo(debug)
    }

    runDiagnostics()
  }, [])

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center">🔍 LIVE AUTH DIAGNOSTIC</h1>

        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h2 className="text-xl font-semibold mb-4">🧪 Real-time Authentication Debug</h2>
          <pre className="bg-gray-900 text-green-400 p-4 rounded overflow-auto text-sm">
            {JSON.stringify(debugInfo, null, 2)}
          </pre>
        </div>

        <div className="mt-8 bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <h3 className="font-bold text-yellow-800">📋 Instrukcje:</h3>
          <ol className="list-decimal list-inside text-yellow-700 mt-2 space-y-1">
            <li>Skopiuj te dane i wyślij Claude</li>
            <li>Sprawdź czy cookies/localStorage mają dane auth</li>
            <li>Sprawdź czy Supabase session działa</li>
            <li>To pokaże dokładnie gdzie jest problem</li>
          </ol>
        </div>

        <div className="mt-6 text-center">
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600"
          >
            🔄 Refresh Debug
          </button>
        </div>
      </div>
    </div>
  )
}