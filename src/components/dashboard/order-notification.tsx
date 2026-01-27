'use client'

import { useEffect } from 'react'
import { useStoreOrders, useNotificationPermission } from '@/hooks/use-pusher'

interface OrderNotificationProps {
  storeId: string
  onNewOrder: () => void
  onOrderUpdate?: () => void
}

export function OrderNotification({ storeId, onNewOrder, onOrderUpdate }: OrderNotificationProps) {
  const { permission } = useNotificationPermission()
  
  // Usar el hook actualizado con 3 argumentos
  const notification = useStoreOrders(storeId, onNewOrder, onOrderUpdate || onNewOrder)

  useEffect(() => {
    // Solicitar permiso de notificación al montar
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [])

  if (!notification?.show) return null

  return (
    <div className="fixed top-4 right-4 z-50 animate-bounce">
      <div className={`px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 ${
        notification.type === 'new' 
          ? 'bg-gradient-to-r from-green-600 to-orange-500 text-white' 
          : 'bg-blue-600 text-white'
      }`}>
        <span className="text-3xl">{notification.type === 'new' ? '🔔' : '📦'}</span>
        <div>
          <p className="font-bold">{notification.type === 'new' ? '¡Nuevo pedido!' : 'Pedido actualizado'}</p>
          <p className="text-sm opacity-90">{notification.message}</p>
        </div>
      </div>
    </div>
  )
}
