'use client'
 
import { useEffect, useState } from 'react'
import { useStoreOrders, useNotificationPermission } from '@/hooks/use-pusher'
 
interface OrderNotificationProps {
  storeId: string
  onNewOrder?: () => void
  onOrderUpdate?: () => void
}
 
export function OrderNotification({ storeId, onNewOrder, onOrderUpdate }: OrderNotificationProps) {
  const { permission } = useNotificationPermission()
  const [dismissed, setDismissed] = useState(false)
  
  // Usar el hook actualizado con callbacks opcionales
  const notification = useStoreOrders(
    storeId,
    () => { if (onNewOrder) onNewOrder() },
    () => { if (onOrderUpdate) onOrderUpdate() }
  )

  useEffect(() => {
    if (notification?.show) {
      setDismissed(false)
    }
  }, [notification])
 
  useEffect(() => {
    // Solicitar permiso de notificación al montar
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [])
 
  if (!notification?.show || dismissed) return null
 
  return (
    <div className="fixed top-4 right-4 z-[9999] animate-bounce">
      <div className={`px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 relative pr-10 ${
        notification.type === 'new' 
          ? 'bg-gradient-to-r from-green-600 to-orange-500 text-white' 
          : 'bg-blue-600 text-white'
      }`}>
        <span className="text-3xl">{notification.type === 'new' ? '🔔' : '📦'}</span>
        <div>
          <p className="font-bold">{notification.type === 'new' ? '¡Nuevo pedido!' : 'Pedido actualizado'}</p>
          <p className="text-sm opacity-90">{notification.message}</p>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="absolute top-2 right-2 text-white/70 hover:text-white transition-colors p-1 text-sm font-bold"
          aria-label="Cerrar notificación"
        >
          ✕
        </button>
      </div>
    </div>
  )
}
