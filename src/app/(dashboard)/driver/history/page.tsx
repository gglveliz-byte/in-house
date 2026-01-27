'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatPrice, formatDate, getOrderStatusLabel, getOrderStatusColor } from '@/lib/utils'
import type { Order } from '@/types'

interface OrderWithStore extends Order {
  store: {
    name: string
  }
  actualDeliveryFee: number | null
}

export default function DriverHistoryPage() {
  const { data: session } = useSession()
  const [orders, setOrders] = useState<OrderWithStore[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchOrders = async () => {
      if (!session?.user.id) return

      try {
        const response = await fetch(`/api/orders?driverId=${session.user.id}`)
        const data = await response.json()
        // Filtrar solo pedidos completados o cancelados
        const completedOrders = data.filter(
          (o: Order) => o.status === 'DELIVERED' || o.status === 'CANCELLED'
        )
        setOrders(completedOrders)
      } catch (error) {
        console.error('Error fetching orders:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchOrders()
  }, [session?.user.id])

  // Calcular estadísticas - usar actualDeliveryFee si existe, sino deliveryFee
  const deliveredOrders = orders.filter((o) => o.status === 'DELIVERED')
  const totalEarnings = deliveredOrders.reduce((sum, o) => sum + (o.actualDeliveryFee ?? o.deliveryFee ?? 0), 0)

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3" />
          <div className="h-32 bg-gray-200 rounded" />
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Historial de Entregas</h1>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <Card className="text-center p-4">
          <p className="text-3xl font-bold text-primary-600">{deliveredOrders.length}</p>
          <p className="text-sm text-gray-600">Entregas completadas</p>
        </Card>
        <Card className="text-center p-4">
          <p className="text-3xl font-bold text-green-600">{formatPrice(totalEarnings)}</p>
          <p className="text-sm text-gray-600">Ganado en envíos</p>
        </Card>
      </div>

      {/* Orders List */}
      {orders.length === 0 ? (
        <Card className="text-center py-12">
          <p className="text-gray-500">No tienes entregas en tu historial</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <Card key={order.id}>
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Pedido #{order.orderNumber}</p>
                    <p className="text-sm text-gray-500">{order.store.name}</p>
                    <p className="text-xs text-gray-400">
                      {formatDate(order.deliveredAt || order.createdAt)}
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge className={getOrderStatusColor(order.status)}>
                      {getOrderStatusLabel(order.status)}
                    </Badge>
                    <p className="text-sm font-medium mt-1 text-green-600">
                      +{formatPrice((order as OrderWithStore).actualDeliveryFee || order.deliveryFee || 0)}
                    </p>
                    {(order as OrderWithStore).actualDeliveryFee && (
                      <p className="text-xs text-gray-500 mt-1">
                        Envío cobrado
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
