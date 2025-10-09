'use client'

import { useEffect, useState } from 'react'
import { Header } from '@/components/dashboard/header'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Bell, Check, Trash2, AlertCircle } from 'lucide-react'
import { Notification } from '@/hooks/use-notifications'
import { formatDistanceToNow } from 'date-fns'
import { pl } from 'date-fns/locale'
import { toast } from 'sonner'

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchNotifications = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch('/api/notifications')

      if (!response.ok) {
        throw new Error('Failed to fetch notifications')
      }

      const data = await response.json()
      setNotifications(data.notifications || [])
    } catch (err) {
      console.error('Error fetching notifications:', err)
      setError('Nie udało się pobrać powiadomień')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchNotifications()
  }, [])

  const markAsRead = async (id: string, currentReadStatus: boolean) => {
    try {
      const response = await fetch(`/api/notifications/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ read: !currentReadStatus })
      })

      if (!response.ok) {
        throw new Error('Failed to update notification')
      }

      // Update local state
      setNotifications(prev =>
        prev.map(notif =>
          notif.id === id ? { ...notif, read: !currentReadStatus } : notif
        )
      )

      toast.success(
        !currentReadStatus ? 'Oznaczono jako przeczytane' : 'Oznaczono jako nieprzeczytane'
      )
    } catch (err) {
      console.error('Error updating notification:', err)
      toast.error('Nie udało się zaktualizować powiadomienia')
    }
  }

  const deleteNotification = async (id: string) => {
    try {
      const response = await fetch(`/api/notifications/${id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Failed to delete notification')
      }

      // Update local state
      setNotifications(prev => prev.filter(notif => notif.id !== id))
      toast.success('Powiadomienie usunięte')
    } catch (err) {
      console.error('Error deleting notification:', err)
      toast.error('Nie udało się usunąć powiadomienia')
    }
  }

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'upload_complete':
        return '✅'
      case 'upload_error':
        return '❌'
      case 'ministry_sync':
        return '🔄'
      case 'system_announcement':
        return '📢'
      default:
        return '🔔'
    }
  }

  const getNotificationColor = (type: Notification['type']) => {
    switch (type) {
      case 'upload_complete':
        return 'bg-green-500'
      case 'upload_error':
        return 'bg-red-500'
      case 'ministry_sync':
        return 'bg-blue-500'
      case 'system_announcement':
        return 'bg-yellow-500'
      default:
        return 'bg-gray-500'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header showUserMenu={true} />

      <main className="flex-1 mx-auto max-w-4xl w-full px-4 py-8 lg:px-6">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
            <Bell className="h-8 w-8" />
            Powiadomienia
          </h1>
          <p className="text-muted-foreground">
            Wszystkie powiadomienia dotyczące Twoich raportów i systemu
          </p>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <Card className="p-6 border-red-200 bg-red-50">
            <div className="flex items-center gap-3 text-red-800">
              <AlertCircle className="h-5 w-5" />
              <p>{error}</p>
            </div>
          </Card>
        )}

        {/* Empty State */}
        {!isLoading && !error && notifications.length === 0 && (
          <Card className="p-12 text-center">
            <div className="flex flex-col items-center gap-4">
              <div className="rounded-full bg-gray-100 p-6">
                <Bell className="h-12 w-12 text-gray-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-1">Brak powiadomień</h3>
                <p className="text-muted-foreground">
                  Nie masz jeszcze żadnych powiadomień
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Notifications List */}
        {!isLoading && !error && notifications.length > 0 && (
          <div className="space-y-3">
            {notifications.map(notification => (
              <Card
                key={notification.id}
                className={`p-4 transition-all hover:shadow-md ${
                  !notification.read ? 'bg-blue-50 border-blue-200' : ''
                }`}
              >
                <div className="flex gap-4">
                  {/* Icon */}
                  <div className="flex-shrink-0">
                    <div
                      className={`w-10 h-10 rounded-full ${getNotificationColor(
                        notification.type
                      )} flex items-center justify-center text-white text-xl`}
                    >
                      {getNotificationIcon(notification.type)}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-1">
                      <h3 className="font-semibold text-lg">
                        {notification.title}
                      </h3>
                      {!notification.read && (
                        <Badge variant="default" className="bg-blue-600">
                          Nowe
                        </Badge>
                      )}
                    </div>
                    <p className="text-gray-700 mb-2">{notification.message}</p>
                    <p className="text-xs text-gray-500">
                      {formatDistanceToNow(new Date(notification.created_at), {
                        addSuffix: true,
                        locale: pl
                      })}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => markAsRead(notification.id, notification.read)}
                      title={
                        notification.read
                          ? 'Oznacz jako nieprzeczytane'
                          : 'Oznacz jako przeczytane'
                      }
                    >
                      <Check
                        className={`h-4 w-4 ${
                          notification.read ? 'text-green-600' : 'text-gray-400'
                        }`}
                      />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteNotification(notification.id)}
                      title="Usuń powiadomienie"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
