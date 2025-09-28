// BACKUP SOLUTION: Native Supabase Auth instead of NextAuth
// Use this if NextAuth Adapter keeps failing

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function signInWithGoogle() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`
    }
  })
  return { data, error }
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  return { error }
}

export async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser()
  return { user, error }
}

export async function createDeveloperProfile(user: any) {
  // Create developer record in our developers table
  const { data, error } = await supabase
    .from('developers')
    .insert({
      user_id: user.id,
      name: user.user_metadata?.full_name || user.email,
      email: user.email,
      company_name: user.user_metadata?.full_name || 'Unnamed Company',
      client_id: user.email?.split('@')[0] || 'unnamed',
      xml_url: `${process.env.NEXTAUTH_URL}/api/public/${user.email?.split('@')[0] || 'unnamed'}/data.xml`,
      md5_url: `${process.env.NEXTAUTH_URL}/api/public/${user.email?.split('@')[0] || 'unnamed'}/data.md5`
    })
    .select()
    .single()
    
  return { data, error }
}

export { supabase }