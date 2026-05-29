'use client'

import { useState, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { formatDate } from '@/lib/utils'

interface Notification {
  id: string
  title: string
  message: string
  type: string
  isRead: boolean
  link: string | null
  createdAt: string
}

export function NotificationBell() {
  const { data: session } = useSession()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [showDropdown, setShowDropdown] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (session?.user.id) {
      fetchNotifications()
      // Poll cada 30 segundos
      const interval = setInterval(fetchNotifications, 30000)
      return () => clearInterval(interval)
    }
  }, [session?.user.id])

  useEffect(() => {
    // Cerrar dropdown al hacer clic fuera
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const fetchNotifications = async () => {
    try {
      const response = await fetch('/api/notifications')
      if (response.ok) {
        const data = await response.json()
        setNotifications(data)
        setUnreadCount(data.filter((n: Notification) => !n.isRead).length)
      }
    } catch (error) {
      console.error('Error fetching notifications:', error)
    }
  }

  const markAsRead = async (id: string) => {
    try {
      await fetch(`/api/notifications/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isRead: true }),
      })
      fetchNotifications()
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  const markAllAsRead = async () => {
    try {
      await fetch('/api/notifications/read-all', { method: 'POST' })
      fetchNotifications()
    } catch (error) {
      console.error('Error marking all as read:', error)
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'BILLING': return 'payments'
      case 'ORDER': return 'inventory_2'
      case 'WARNING': return 'warning'
      case 'SYSTEM': return 'build'
      default: return 'notifications'
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'BILLING': return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      case 'ORDER': return 'text-green-600 bg-green-50 border-green-200'
      case 'WARNING': return 'text-red-600 bg-red-50 border-red-200'
      case 'SYSTEM': return 'text-blue-600 bg-blue-50 border-blue-200'
      default: return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="relative p-2 text-[#003f87] hover:text-[#003f87]/80 hover:bg-gray-100 rounded-full transition-colors flex items-center justify-center"
      >
        <span className="material-symbols-outlined text-2xl">notifications</span>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {showDropdown && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b">
            <h3 className="font-bold text-gray-900">Notificaciones</h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-xs text-[#003f87] hover:text-[#003f87]/80 font-medium"
              >
                Marcar todas como leídas
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="py-8 text-center text-gray-400 flex flex-col items-center justify-center">
                <span className="material-symbols-outlined text-4xl mb-2 text-gray-300">notifications_off</span>
                <p className="text-sm">No tienes notificaciones</p>
              </div>
            ) : (
              notifications.slice(0, 10).map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 border-b hover:bg-gray-50 transition-colors ${
                    !notification.isRead ? 'bg-blue-50/50' : ''
                  }`}
                >
                  {notification.link ? (
                    <Link
                      href={notification.link}
                      onClick={() => {
                        markAsRead(notification.id)
                        setShowDropdown(false)
                      }}
                      className="block"
                    >
                      <NotificationContent notification={notification} getTypeIcon={getTypeIcon} getTypeColor={getTypeColor} />
                    </Link>
                  ) : (
                    <div onClick={() => markAsRead(notification.id)} className="cursor-pointer">
                      <NotificationContent notification={notification} getTypeIcon={getTypeIcon} getTypeColor={getTypeColor} />
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {notifications.length > 0 && (
            <div className="p-3 bg-gray-50 border-t text-center">
              <Link
                href="/admin/notifications"
                className="text-sm text-[#003f87] hover:text-[#003f87]/80 font-medium"
                onClick={() => setShowDropdown(false)}
              >
                Ver todas las notificaciones
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

interface NotificationContentProps {
  notification: Notification
  getTypeIcon: (type: string) => string
  getTypeColor: (type: string) => string
}

function NotificationContent({ 
  notification, 
  getTypeIcon, 
  getTypeColor 
}: NotificationContentProps) {
  return (
    <div className="flex gap-3">
      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getTypeColor(notification.type)} border flex-shrink-0`}>
        <span className="material-symbols-outlined text-lg">{getTypeIcon(notification.type)}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium text-gray-900 ${!notification.isRead ? 'font-bold' : ''}`}>
          {notification.title}
        </p>
        <p className="text-sm text-gray-600 line-clamp-2 mt-0.5">{notification.message}</p>
        <p className="text-xs text-gray-400 mt-1">{formatDate(notification.createdAt)}</p>
      </div>
      {!notification.isRead && (
        <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-2"></div>
      )}
    </div>
  )
}
