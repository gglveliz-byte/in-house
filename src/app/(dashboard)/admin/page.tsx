'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { formatPrice } from '@/lib/utils'

interface Stats {
  totalOrders: number
  todayOrders: number
  totalRevenue: number
  todayRevenue: number
  ordersByStatus: Record<string, number>
  totalStores: number
  totalProducts: number
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/stats')
        const data = await response.json()
        setStats(data)
      } catch (error) {
        console.error('Error fetching stats:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3" />
          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="max-w-6xl mx-auto text-center py-12">
        <p className="text-gray-500">Error al cargar estadísticas</p>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>

      {/* Main Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card className="p-4">
          <p className="text-sm text-gray-500">Ingresos Totales</p>
          <p className="text-2xl font-bold text-green-600">
            {formatPrice(stats.totalRevenue)}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-500">Ingresos Hoy</p>
          <p className="text-2xl font-bold text-green-600">
            {formatPrice(stats.todayRevenue)}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-500">Pedidos Totales</p>
          <p className="text-2xl font-bold text-blue-600">{stats.totalOrders}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-500">Pedidos Hoy</p>
          <p className="text-2xl font-bold text-blue-600">{stats.todayOrders}</p>
        </Card>
      </div>

      {/* Secondary Stats */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Orders by Status */}
        <Card>
          <CardHeader>
            <h2 className="font-semibold">Pedidos por Estado</h2>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { key: 'PENDING', label: 'Pendientes', color: 'bg-yellow-500' },
                { key: 'CONFIRMED', label: 'Confirmados', color: 'bg-blue-500' },
                { key: 'READY', label: 'Listos', color: 'bg-purple-500' },
                { key: 'PICKED_UP', label: 'En camino', color: 'bg-orange-500' },
                { key: 'DELIVERED', label: 'Entregados', color: 'bg-green-500' },
                { key: 'CANCELLED', label: 'Cancelados', color: 'bg-red-500' },
              ].map((status) => (
                <div key={status.key} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${status.color}`} />
                    <span className="text-sm text-gray-700">{status.label}</span>
                  </div>
                  <span className="font-medium">
                    {stats.ordersByStatus[status.key] || 0}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Platform Stats */}
        <Card>
          <CardHeader>
            <h2 className="font-semibold">Plataforma</h2>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-3xl font-bold text-primary-600">{stats.totalStores}</p>
                <p className="text-sm text-gray-600">Tiendas</p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-3xl font-bold text-primary-600">{stats.totalProducts}</p>
                <p className="text-sm text-gray-600">Productos</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
