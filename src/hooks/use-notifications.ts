/**
 * Notifications hook - fetch and manage notifications with real-time updates
 */

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export interface Notification {
  id: string
  developer_id: string
  type: 'upload_complete' | 'upload_error' | 'ministry_sync' | 'system_announcement'
  title: string
  message: string
  read: boolean
  created_at: string
  updated_at: string
}

export function useNotifications() {
  const [unreadCount, setUnreadCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()

    const fetchUnreadCount = async () => {
      try {
        // Get current user
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          setUnreadCount(0)
          setIsLoading(false)
          return
        }

        // Get developer profile
        const { data: developer } = await supabase
          .from('developers')
          .select('id')
          .eq('user_id', user.id)
          .single()

        if (!developer) {
          setUnreadCount(0)
          setIsLoading(false)
          return
        }

        // Count unread notifications
        const { count, error } = await supabase
          .from('notifications')
          .select('*', { count: 'exact', head: true })
          .eq('developer_id', developer.id)
          .eq('read', false)

        if (!error) {
          setUnreadCount(count || 0)
        }
        setIsLoading(false)
      } catch (error) {
        console.error('Error fetching unread count:', error)
        setIsLoading(false)
      }
    }

    fetchUnreadCount()

    // Set up real-time subscription for notifications updates
    const setupRealtimeSubscription = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: developer } = await supabase
        .from('developers')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (!developer) return

      // Subscribe to INSERT, UPDATE, DELETE on notifications table
      const channel = supabase
        .channel('notifications-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'notifications',
            filter: `developer_id=eq.${developer.id}`
          },
          () => {
            // Refetch count when any notification changes
            fetchUnreadCount()
          }
        )
        .subscribe()

      return () => {
        supabase.removeChannel(channel)
      }
    }

    setupRealtimeSubscription()
  }, [])

  return { unreadCount, isLoading }
}
