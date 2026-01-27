'use client'

import { useEffect, useState } from 'react'
import { useDriverOrders, useNotificationPermission } from '@/hooks/use-pusher'

interface DriverNotificationProps {
  onOrderReady: () => void
}

interface OrderReadyData {
  orderId?: string
  orderNumber?: number
  storeName?: string
  storeAddress?: string
}

export function DriverNotification({ onOrderReady }: DriverNotificationProps) {
  const [localNotification, setLocalNotification] = useState<OrderReadyData | null>(null)
  const { permission } = useNotificationPermission()

  // Usar el hook actualizado
  const notification = useDriverOrders(onOrderReady)

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [])

  // Actualizar notificación local cuando llega una del hook
  useEffect(() => {
    if (notification?.show && notification.order) {
      setLocalNotification(notification.order as OrderReadyData)
    } else {
      setLocalNotification(null)
    }
  }, [notification])

  if (!localNotification) return null

  return (
    <div className="fixed top-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50">
      <div className="bg-gradient-to-r from-purple-600 to-pink-500 text-white p-4 rounded-xl shadow-2xl">
        <div className="flex items-start gap-3">
          <span className="text-3xl">🍽️</span>
          <div className="flex-1">
            <p className="font-bold">¡Pedido listo para recoger!</p>
            <p className="text-sm opacity-90">Pedido #{localNotification.orderNumber || ''}</p>
            <p className="text-sm opacity-90">{localNotification.storeName || ''}</p>
            <p className="text-xs opacity-75 mt-1">{localNotification.storeAddress || ''}</p>
          </div>
          <button
            onClick={() => setLocalNotification(null)}
            className="text-white/70 hover:text-white"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  )
}
