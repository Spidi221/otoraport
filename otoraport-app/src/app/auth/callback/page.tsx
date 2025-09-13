'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function AuthCallbackPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        console.log('OAuth callback started, processing URL params...')
        
        // Handle the OAuth callback with URL hash
        const { data, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Auth callback error:', error)
          setError('Błąd podczas logowania')
          return
        }

        console.log('Session data:', data)

        if (data.session?.user) {
          console.log('User logged in via OAuth:', data.session.user.email)
          
          // Create or update developer profile
          await createOrUpdateDeveloperProfile(data.session.user)
          
          // Redirect to dashboard with success
          router.push('/dashboard')
        } else {
          console.log('No session found, checking for hash params...')
          
          // Check if we're in the middle of OAuth flow
          if (window.location.hash) {
            console.log('Hash params found:', window.location.hash)
            // Give Supabase more time to process the OAuth
            setTimeout(() => {
              window.location.reload()
            }, 1000)
            return
          }
          
          console.log('No session and no hash, redirecting to signin')
          router.push('/auth/signin?error=oauth_failed')
        }
      } catch (err) {
        console.error('Callback handling error:', err)
        setError('Wystąpił błąd podczas uwierzytelniania')
      } finally {
        setLoading(false)
      }
    }

    // Process callback immediately
    handleAuthCallback()
  }, [router])

  const createOrUpdateDeveloperProfile = async (user: any) => {
    try {
      // Check if developer profile already exists
      const { data: existingDeveloper } = await supabase
        .from('developers')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (!existingDeveloper) {
        // Create new developer profile
        const clientId = user.email?.split('@')[0]?.toLowerCase().replace(/[^a-z0-9-]/g, '') || 'unnamed'
        
        const { error: insertError } = await supabase
          .from('developers')
          .insert({
            user_id: user.id,
            name: user.user_metadata?.full_name || user.email || 'Unnamed User',
            email: user.email,
            company_name: user.user_metadata?.full_name || 'Unnamed Company',
            client_id: clientId,
            xml_url: `${window.location.origin}/api/public/${clientId}/data.xml`,
            md5_url: `${window.location.origin}/api/public/${clientId}/data.md5`,
            status: 'trial',
            subscription_plan: 'basic',
            subscription_status: 'trial'
          })

        if (insertError) {
          console.error('Error creating developer profile:', insertError)
        }
      }
    } catch (err) {
      console.error('Error managing developer profile:', err)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900">Uwierzytelnianie...</h2>
          <p className="text-gray-600 mt-2">Proszę czekać</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
          <button 
            onClick={() => router.push('/auth/signin')}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Wróć do logowania
          </button>
        </div>
      </div>
    )
  }

  return null
}