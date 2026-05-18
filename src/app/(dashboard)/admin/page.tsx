'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatPrice } from '@/lib/utils'
import Link from 'next/link'

interface DashboardData {
  store: {
    name: string
    isOpen: boolean
    totalProducts: number
  } | null
  revenue: {
    today: number
    total: number
  }
  orders: {
    total: number
    pending: number
    confirmed: number
    ready: number
    delivered: number
    cancelled: number
  }
  drivers: {
    total: number
  }
  topStores: {
    id: string
    name: string
    totalOrders: number
    totalRevenue: number
  }[]
  recentOrders: {
    id: string
    orderNumber: number
    customerName: string
    total: number
    status: string
    createdAt: string
  }[]
}

const statusMap: Record<string, { label: string; className: string }> = {
  PENDING: { label: 'Pendiente', className: 'bg-yellow-100 text-yellow-700 border border-yellow-200' },
  CONFIRMED: { label: 'Confirmado', className: 'bg-blue-100 text-[#003f87] border border-blue-200' },
  READY: { label: 'Listo', className: 'bg-purple-100 text-purple-700 border border-purple-200' },
  PICKED_UP: { label: 'En camino', className: 'bg-orange-100 text-orange-700 border border-orange-200' },
  DELIVERED: { label: 'Entregado', className: 'bg-emerald-100 text-emerald-700 border border-emerald-200' },
  CANCELLED: { label: 'Cancelado', className: 'bg-red-100 text-red-700 border border-red-200' },
}

export default function AdminDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchDashboard()
  }, [])

  const fetchDashboard = async () => {
    try {
      setError(null)
      const response = await fetch('/api/admin/stats')
      if (response.ok) {
        const stats = await response.json()
        setData(stats)
      } else {
        setError('Error al cargar el dashboard')
      }
    } catch {
      setError('Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-gray-200 rounded-lg w-48 animate-pulse" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-gray-200 rounded-xl animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="h-64 bg-gray-200 rounded-xl animate-pulse" />
          <div className="h-64 bg-gray-200 rounded-xl animate-pulse" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <span className="text-5xl">⚠️</span>
        <p className="text-gray-600 font-medium">{error}</p>
        <Button onClick={fetchDashboard} variant="secondary">Reintentar</Button>
      </div>
    )
  }

  const orders = data?.orders

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Resumen operativo de tu zona
          </p>
        </div>
        <Button onClick={fetchDashboard} variant="secondary" size="sm">
          🔄 Actualizar
        </Button>
      </div>

      {/* Order Status Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Link href="/admin/orders?filter=PENDING">
          <Card className="bg-gradient-to-br from-amber-500 to-amber-600 text-white hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="pt-5 pb-4">
              <p className="text-4xl font-bold">{orders?.pending || 0}</p>
              <p className="text-amber-200 mt-1 text-sm">Pendientes</p>
              <p className="text-amber-300 text-xs mt-2">Ver →</p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/admin/orders?filter=CONFIRMED">
          <Card className="bg-gradient-to-br from-[#003f87] to-[#0056b3] text-white hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="pt-5 pb-4">
              <p className="text-4xl font-bold">{orders?.confirmed || 0}</p>
              <p className="text-blue-200 mt-1 text-sm">Confirmados</p>
              <p className="text-blue-300 text-xs mt-2">Ver →</p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/admin/orders?filter=DELIVERED">
          <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="pt-5 pb-4">
              <p className="text-4xl font-bold">{orders?.delivered || 0}</p>
              <p className="text-emerald-200 mt-1 text-sm">Entregados</p>
              <p className="text-emerald-300 text-xs mt-2">Total →</p>
            </CardContent>
          </Card>
        </Link>
        <Card className="bg-gradient-to-br from-teal-500 to-teal-600 text-white">
          <CardContent className="pt-5 pb-4">
            <p className="text-3xl font-bold">{formatPrice(data?.revenue.total || 0)}</p>
            <p className="text-teal-200 mt-1 text-sm">Ingresos Totales</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { href: '/admin/stores', icon: '🏪', label: 'Tiendas', desc: 'Gestionar tiendas' },
          { href: '/admin/users', icon: '👥', label: 'Usuarios', desc: 'Repartidores y más' },
          { href: '/admin/orders', icon: '📦', label: 'Pedidos', desc: 'Ver todos los pedidos' },
          { href: '/admin/messages', icon: '💬', label: 'Mensajes', desc: 'Chat con Super Admin' },
        ].map((action) => (
          <Link key={action.href} href={action.href}>
            <Card className="hover:shadow-md hover:border-[#003f87]/30 transition-all duration-200 cursor-pointer group">
              <CardContent className="pt-4 pb-4 text-center">
                <span className="text-3xl block mb-2">{action.icon}</span>
                <p className="font-semibold text-gray-900 text-sm group-hover:text-[#003f87]">{action.label}</p>
                <p className="text-xs text-gray-500 mt-0.5">{action.desc}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="text-center">
          <CardContent className="pt-5 pb-4">
            <p className="text-3xl font-bold text-[#003f87]">{data?.drivers.total || 0}</p>
            <p className="text-sm text-gray-500 mt-1">🚗 Repartidores</p>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="pt-5 pb-4">
            <p className="text-3xl font-bold text-[#003f87]">{orders?.total || 0}</p>
            <p className="text-sm text-gray-500 mt-1">📦 Total Pedidos</p>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="pt-5 pb-4">
            <p className="text-3xl font-bold text-red-500">{orders?.cancelled || 0}</p>
            <p className="text-sm text-gray-500 mt-1">❌ Cancelados</p>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="pt-5 pb-4">
            <p className="text-3xl font-bold text-amber-600">{formatPrice(data?.revenue.today || 0)}</p>
            <p className="text-sm text-gray-500 mt-1">💰 Hoy</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders + Top Stores */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-gray-900">📋 Pedidos Recientes</h2>
              <Link
                href="/admin/orders"
                className="text-[#003f87] hover:text-[#002d6b] text-sm font-medium"
              >
                Ver todos →
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {data?.recentOrders && data.recentOrders.length > 0 ? (
              <div className="space-y-3">
                {data.recentOrders.map((order) => {
                  const status = statusMap[order.status] || { label: order.status, className: 'bg-gray-100 text-gray-600' }
                  return (
                    <div key={order.id} className="flex items-center justify-between py-2 border-b last:border-0">
                      <div>
                        <p className="font-medium text-sm text-gray-900">#{order.orderNumber} - {order.customerName}</p>
                        <p className="text-xs text-gray-500">{formatPrice(order.total)}</p>
                      </div>
                      <Badge className={status.className}>
                        {status.label}
                      </Badge>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-10 text-gray-400">
                <span className="text-4xl block mb-2">📭</span>
                <p>No hay pedidos recientes</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Stores */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-gray-900">🏆 Tiendas Destacadas</h2>
              <Link
                href="/admin/stores"
                className="text-[#003f87] hover:text-[#002d6b] text-sm font-medium"
              >
                Ver todas →
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {data?.topStores && data.topStores.length > 0 ? (
              <div className="space-y-3">
                {data.topStores.slice(0, 5).map((store, index) => (
                  <div key={store.id} className="flex items-center gap-3 py-2 border-b last:border-0">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      index === 0 ? 'bg-amber-100 text-amber-700' :
                      index === 1 ? 'bg-gray-100 text-gray-600' :
                      index === 2 ? 'bg-orange-100 text-orange-600' :
                      'bg-blue-50 text-[#003f87]'
                    }`}>
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-sm text-gray-900">{store.name}</p>
                      <p className="text-xs text-gray-500">{store.totalOrders} pedidos</p>
                    </div>
                    <p className="font-bold text-[#003f87] text-sm">{formatPrice(store.totalRevenue)}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10 text-gray-400">
                <span className="text-4xl block mb-2">🏪</span>
                <p>No hay tiendas activas</p>
                <Link href="/admin/stores" className="text-[#003f87] hover:underline mt-2 inline-block text-sm font-medium">
                  Crear tienda →
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
