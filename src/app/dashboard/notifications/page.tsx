'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase-single'
import { useRouter } from 'next/navigation'
import { Bell, CheckCircle, AlertCircle, Info, X } from 'lucide-react'

interface Notification {
  id: string
  title: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
  read: boolean
  created_at: string
}

export default function NotificationsPage() {
  const [loading, setLoading] = useState(true)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const router = useRouter()

  useEffect(() => {
    async function loadNotifications() {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser()

        if (userError || !user) {
          router.push('/auth/signin')
          return
        }

        // Mock notifications for now - in production would fetch from database
        setNotifications([
          {
            id: '1',
            title: 'Witamy w OTORAPORT!',
            message: 'Twoje konto zostało pomyślnie utworzone. Możesz teraz rozpocząć automatyczne raportowanie cen mieszkań.',
            type: 'success',
            read: false,
            created_at: new Date().toISOString()
          },
          {
            id: '2',
            title: 'Pliki XML wygenerowane',
            message: 'Twoje pliki XML dla ministerstwa zostały pomyślnie wygenerowane i są dostępne do pobrania.',
            type: 'info',
            read: false,
            created_at: new Date(Date.now() - 3600000).toISOString()
          }
        ])
      } catch (error) {
        console.error('Error loading notifications:', error)
      } finally {
        setLoading(false)
      }
    }

    loadNotifications()
  }, [router])

  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(notif =>
        notif.id === id ? { ...notif, read: true } : notif
      )
    )
  }

  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(notif => ({ ...notif, read: true }))
    )
  }

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id))
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-yellow-600" />
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-600" />
      default:
        return <Info className="h-5 w-5 text-blue-600" />
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))

    if (hours < 1) {
      return 'Przed chwilą'
    } else if (hours < 24) {
      return `${hours}h temu`
    } else {
      const days = Math.floor(hours / 24)
      return `${days} dni temu`
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Bell className="h-8 w-8" />
            Powiadomienia
          </h1>
          <p className="text-gray-600">
            {unreadCount > 0 ? `Masz ${unreadCount} nieprzeczytanych powiadomień` : 'Wszystkie powiadomienia przeczytane'}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" onClick={markAllAsRead}>
            Oznacz wszystkie jako przeczytane
          </Button>
        )}
      </div>

      <div className="space-y-4">
        {notifications.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Brak powiadomień</p>
            </CardContent>
          </Card>
        ) : (
          notifications.map(notification => (
            <Card
              key={notification.id}
              className={`transition-all ${!notification.read ? 'border-blue-500 bg-blue-50/50' : ''}`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    {getIcon(notification.type)}
                    <div className="flex-1">
                      <CardTitle className="text-lg flex items-center gap-2">
                        {notification.title}
                        {!notification.read && (
                          <Badge variant="default" className="ml-2">Nowe</Badge>
                        )}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        {formatDate(notification.created_at)}
                      </CardDescription>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteNotification(notification.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700">{notification.message}</p>
                {!notification.read && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-4"
                    onClick={() => markAsRead(notification.id)}
                  >
                    Oznacz jako przeczytane
                  </Button>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}