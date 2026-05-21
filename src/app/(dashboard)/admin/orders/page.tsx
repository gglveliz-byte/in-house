'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
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

const STATUS_FILTERS = [
  { value: 'all', label: 'Todos' },
  { value: 'PENDING', label: 'Pendientes' },
  { value: 'CONFIRMED', label: 'Confirmados' },
  { value: 'READY', label: 'Listos' },
  { value: 'PICKED_UP', label: 'En camino' },
  { value: 'DELIVERED', label: 'Entregados' },
  { value: 'CANCELLED', label: 'Cancelados' },
]

export default function AdminOrdersPage() {
  const searchParams = useSearchParams()
  const initialFilter = searchParams.get('filter') || 'all'

  const [orders, setOrders] = useState<OrderWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>(initialFilter)
  const [searchQuery, setSearchQuery] = useState('')

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

  const notification = useAdminOrders(fetchOrders, fetchOrders)
  const [dismissed, setDismissed] = useState(false)
 
  useEffect(() => {
    if (notification?.show) {
      setDismissed(false)
    }
  }, [notification])
 
  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])
 
  const filteredOrders = orders.filter((order) => {
    const matchesFilter = filter === 'all' || order.status === filter
    const matchesSearch =
      searchQuery === '' ||
      order.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.orderNumber.toString().includes(searchQuery) ||
      order.store.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (order.driver?.name || '').toLowerCase().includes(searchQuery.toLowerCase())
    return matchesFilter && matchesSearch
  })
 
  // Count per status
  const statusCounts = orders.reduce<Record<string, number>>((acc, order) => {
    acc[order.status] = (acc[order.status] || 0) + 1
    return acc
  }, {})
 
  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-gray-200 rounded w-40 animate-pulse" />
        <div className="h-12 bg-gray-200 rounded animate-pulse" />
        <div className="h-96 bg-gray-200 rounded-xl animate-pulse" />
      </div>
    )
  }
 
  return (
    <div className="space-y-5">
      {/* Floating notification */}
      {notification?.show && !dismissed && (
        <div className="fixed top-4 right-4 z-[9999] animate-bounce">
          <div className={`px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 relative pr-10 ${
            notification.type === 'new'
              ? 'bg-gradient-to-r from-[#003f87] to-[#0056b3] text-white'
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
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">📦 Todos los Pedidos</h1>
          <p className="text-sm text-gray-500 mt-0.5">{orders.length} pedido{orders.length !== 1 ? 's' : ''} en total</p>
        </div>
        <div className="flex items-center gap-2">
          {permission === 'default' && (
            <Button onClick={requestPermission} variant="secondary" size="sm">
              🔔 Activar notificaciones
            </Button>
          )}
          {permission === 'granted' && (
            <span className="text-xs text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200 font-medium">
              🔔 Notificaciones activas
            </span>
          )}
          <Button onClick={fetchOrders} variant="secondary" size="sm">
            🔄 Actualizar
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <input
          type="text"
          placeholder="Buscar por #pedido, cliente, tienda o repartidor..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#003f87] focus:border-[#003f87] text-sm"
        />
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
        {searchQuery && (
          <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">✕</button>
        )}
      </div>

      {/* Filter Pills */}
      <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
        {STATUS_FILTERS.map((f) => {
          const count = f.value === 'all' ? orders.length : (statusCounts[f.value] || 0)
          return (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all flex items-center gap-1.5 ${
                filter === f.value
                  ? 'bg-[#003f87] text-white shadow-sm'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {f.label}
              {count > 0 && (
                <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${
                  filter === f.value ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-600'
                }`}>
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Orders Table */}
      <Card>
        <CardContent className="p-0 overflow-x-auto">
          {filteredOrders.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <span className="text-5xl block mb-3">📭</span>
              <p className="font-medium">
                {searchQuery
                  ? 'Sin resultados para tu búsqueda'
                  : `No hay pedidos ${filter !== 'all' ? 'en este estado' : ''}`}
              </p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">#</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Tienda</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Cliente</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Total</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Estado</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Repartidor</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Fecha</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <span className="font-bold text-[#003f87]">#{order.orderNumber}</span>
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-800">{order.store.name}</td>
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-gray-900">{order.customerName}</p>
                      <p className="text-xs text-gray-500">{order.customerPhone}</p>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="font-bold text-gray-900">{formatPrice(order.total)}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Badge className={getOrderStatusColor(order.status)}>
                        {getOrderStatusLabel(order.status)}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {order.driver?.name || <span className="text-gray-400 italic">Sin asignar</span>}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">
                      {formatDate(order.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      {/* Summary footer */}
      {filteredOrders.length > 0 && (
        <div className="flex items-center justify-between text-sm text-gray-500 px-1">
          <span>Mostrando {filteredOrders.length} de {orders.length} pedidos</span>
          <span className="font-medium text-gray-700">
            Total: {formatPrice(filteredOrders.reduce((sum, o) => sum + o.total, 0))}
          </span>
        </div>
      )}
    </div>
  )
}
