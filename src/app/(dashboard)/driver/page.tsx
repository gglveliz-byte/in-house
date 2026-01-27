'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatPrice, formatDate } from '@/lib/utils'
import { useDriverOrders, useNotificationPermission } from '@/hooks/use-pusher'
import type { Order } from '@/types'

interface OrderWithStore extends Order {
  store: {
    name: string
    address: string
    whatsapp: string
    latitude: number | null
    longitude: number | null
  }
}

export default function DriverAvailablePage() {
  const { data: session } = useSession()
  const [orders, setOrders] = useState<OrderWithStore[]>([])
  const [loading, setLoading] = useState(true)
  
  // Permisos de notificación
  const { permission, requestPermission } = useNotificationPermission()

  const fetchOrders = useCallback(async () => {
    try {
      const response = await fetch('/api/orders/ready')
      const data = await response.json()
      setOrders(data)
    } catch (error) {
      console.error('Error fetching orders:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  // Hook para notificaciones en tiempo real de pedidos listos
  const notification = useDriverOrders(fetchOrders)

  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  const acceptOrder = async (orderId: string) => {
    try {
      await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'PICKED_UP',
          driverId: session?.user.id,
        }),
      })
      fetchOrders()
    } catch (error) {
      console.error('Error accepting order:', error)
    }
  }

  // Navegar a la TIENDA para recoger el pedido
  const openMapsToStore = (order: OrderWithStore) => {
    const destination = order.store.latitude && order.store.longitude
      ? `${order.store.latitude},${order.store.longitude}`
      : encodeURIComponent(order.store.address)

    const url = `https://www.google.com/maps/dir/?api=1&destination=${destination}`
    window.open(url, '_blank')
  }

  // Llamar a la tienda
  const callStore = (phone: string) => {
    window.open(`tel:${phone}`, '_self')
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3" />
          <div className="h-48 bg-gray-200 rounded" />
        </div>
      </div>
    )
  }

  // Componente de notificación flotante
  const NotificationBanner = () => {
    if (!notification?.show) return null
    
    const orderData = notification.order as { orderNumber?: number; storeName?: string }
    
    return (
      <div className="fixed top-4 right-4 z-50 animate-bounce">
        <div className="bg-gradient-to-r from-purple-600 to-pink-500 text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3">
          <span className="text-3xl">🍽️</span>
          <div>
            <p className="font-bold">¡Pedido listo para recoger!</p>
            <p className="text-sm opacity-90">
              Pedido #{orderData?.orderNumber || ''} en {orderData?.storeName || ''}
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Notificación flotante */}
      <NotificationBanner />
      
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Pedidos Disponibles</h1>
        <div className="flex items-center gap-2">
          {permission === 'default' && (
            <Button onClick={requestPermission} variant="secondary" size="sm">
              🔔 Activar notificaciones
            </Button>
          )}
          {permission === 'granted' && (
            <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
              🔔 Activas
            </span>
          )}
          <Button onClick={fetchOrders} variant="secondary" size="sm">
            🔄 Actualizar
          </Button>
        </div>
      </div>

      {orders.length === 0 ? (
        <Card className="text-center py-12">
          <span className="text-6xl block mb-4">📦</span>
          <p className="text-gray-500 text-lg">No hay pedidos disponibles</p>
          <p className="text-gray-400 text-sm mt-2">
            Los pedidos aparecerán aquí cuando estén listos para recoger
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <Card key={order.id} className="border-l-4 border-l-purple-500">
              <CardHeader className="flex flex-row items-start justify-between">
                <div>
                  <h3 className="font-semibold">Pedido #{order.orderNumber}</h3>
                  <p className="text-sm text-gray-500">{formatDate(order.createdAt)}</p>
                </div>
                <Badge className="bg-purple-100 text-purple-800">Listo</Badge>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Pickup */}
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500 uppercase font-medium">Recoger en</p>
                  <p className="font-medium">{order.store.name}</p>
                  <p className="text-sm text-gray-600">{order.store.address}</p>
                </div>

                {/* Delivery */}
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500 uppercase font-medium">Entregar a</p>
                  <p className="font-medium">{order.customerName}</p>
                  <p className="text-sm text-gray-600">{order.customerAddress}</p>
                  <p className="text-sm text-gray-600">{order.customerPhone}</p>
                  {order.customerNotes && (
                    <p className="text-sm text-gray-500 mt-1">
                      Notas: {order.customerNotes}
                    </p>
                  )}
                </div>

                {/* Order Details */}
                <div>
                  <p className="text-sm text-gray-600">
                    {order.items.length} productos • Total: {formatPrice(order.total)}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Button className="flex-1" onClick={() => acceptOrder(order.id)}>
                    Aceptar pedido
                  </Button>
                  <Button variant="secondary" onClick={() => openMapsToStore(order)}>
                    🏪 Ir a tienda
                  </Button>
                  {order.store.whatsapp && (
                    <Button variant="secondary" onClick={() => callStore(order.store.whatsapp)}>
                      📞
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
