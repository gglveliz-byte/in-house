'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatPrice, formatDate, getOrderStatusLabel, getOrderStatusColor } from '@/lib/utils'
import { useAdminOrders, useNotificationPermission } from '@/hooks/use-pusher'
import type { Order } from '@/types'

interface OrderWithDetails extends Order {
  store: {
    name: string
  }
  driver: {
    name: string
  } | null
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<OrderWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')
  
  // Permisos de notificación
  const { permission, requestPermission } = useNotificationPermission()

  const fetchOrders = useCallback(async () => {
    try {
      const response = await fetch('/api/orders?limit=100')
      const json = await response.json()
      setOrders(json.data || json)
    } catch (error) {
      console.error('Error fetching orders:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  // Hook para notificaciones en tiempo real
  const notification = useAdminOrders(fetchOrders, fetchOrders)

  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  const filteredOrders = orders.filter((order) => {
    if (filter === 'all') return true
    return order.status === filter
  })

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3" />
          <div className="h-64 bg-gray-200 rounded" />
        </div>
      </div>
    )
  }

  // Componente de notificación flotante
  const NotificationBanner = () => {
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

  return (
    <div className="max-w-6xl mx-auto">
      {/* Notificación flotante */}
      <NotificationBanner />
      
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Todos los Pedidos</h1>
        <div className="flex items-center gap-2">
          {permission === 'default' && (
            <Button onClick={requestPermission} variant="secondary" size="sm">
              🔔 Activar notificaciones
            </Button>
          )}
          {permission === 'granted' && (
            <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
              🔔 Notificaciones activas
            </span>
          )}
          <Button onClick={fetchOrders} variant="secondary" size="sm">
            🔄 Actualizar
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {[
          { value: 'all', label: 'Todos' },
          { value: 'PENDING', label: 'Pendientes' },
          { value: 'CONFIRMED', label: 'Confirmados' },
          { value: 'READY', label: 'Listos' },
          { value: 'PICKED_UP', label: 'En camino' },
          { value: 'DELIVERED', label: 'Entregados' },
          { value: 'CANCELLED', label: 'Cancelados' },
        ].map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              filter === f.value
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Orders Table */}
      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">
                  #
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">
                  Tienda
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">
                  Cliente
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">
                  Total
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">
                  Estado
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">
                  Repartidor
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">
                  Fecha
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredOrders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">#{order.orderNumber}</td>
                  <td className="px-4 py-3 text-sm">{order.store.name}</td>
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium">{order.customerName}</p>
                    <p className="text-xs text-gray-500">{order.customerPhone}</p>
                  </td>
                  <td className="px-4 py-3 font-medium">
                    {formatPrice(order.total)}
                  </td>
                  <td className="px-4 py-3">
                    <Badge className={getOrderStatusColor(order.status)}>
                      {getOrderStatusLabel(order.status)}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {order.driver?.name || '-'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {formatDate(order.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredOrders.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">No hay pedidos {filter !== 'all' && 'en este estado'}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
