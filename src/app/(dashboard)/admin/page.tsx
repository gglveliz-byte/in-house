'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { formatPrice } from '@/lib/utils'

interface StoreRevenue {
  storeId: string
  storeName: string
  totalOrders: number
  totalRevenue: number
  todayRevenue: number
  todayOrders: number
}

interface DriverRevenue {
  driverId: string
  driverName: string
  driverPhone: string
  totalDeliveries: number
  totalDeliveryFees: number
  todayDeliveryFees: number
  todayDeliveries: number
}

interface Stats {
  totalOrders: number
  todayOrders: number
  totalRevenue: number
  todayRevenue: number
  ordersByStatus: Record<string, number>
  totalStores: number
  totalProducts: number
  revenueByStore: StoreRevenue[]
  revenueByDriver: DriverRevenue[]
  currency: string
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

      {/* Revenue by Store */}
      {stats.revenueByStore && stats.revenueByStore.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <h2 className="font-semibold text-lg flex items-center gap-2">
              🏪 Ingresos por Tienda
            </h2>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-2 font-medium text-gray-500">Tienda</th>
                    <th className="text-right py-3 px-2 font-medium text-gray-500">Pedidos</th>
                    <th className="text-right py-3 px-2 font-medium text-gray-500">Ingresos</th>
                    <th className="text-right py-3 px-2 font-medium text-gray-500">Hoy</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.revenueByStore.map((store) => (
                    <tr key={store.storeId} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-2">
                        <p className="font-medium text-gray-900">{store.storeName}</p>
                      </td>
                      <td className="text-right py-3 px-2">
                        <span className="text-gray-700">{store.totalOrders}</span>
                        {store.todayOrders > 0 && (
                          <span className="text-xs text-green-600 ml-1">(+{store.todayOrders} hoy)</span>
                        )}
                      </td>
                      <td className="text-right py-3 px-2">
                        <span className="font-semibold text-green-600">{formatPrice(store.totalRevenue)}</span>
                      </td>
                      <td className="text-right py-3 px-2">
                        <span className={`font-medium ${store.todayRevenue > 0 ? 'text-green-600' : 'text-gray-400'}`}>
                          {formatPrice(store.todayRevenue)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-gray-300 bg-gray-50">
                    <td className="py-3 px-2 font-bold text-gray-900">Total</td>
                    <td className="text-right py-3 px-2 font-bold">
                      {stats.revenueByStore.reduce((sum, s) => sum + s.totalOrders, 0)}
                    </td>
                    <td className="text-right py-3 px-2 font-bold text-green-600">
                      {formatPrice(stats.revenueByStore.reduce((sum, s) => sum + s.totalRevenue, 0))}
                    </td>
                    <td className="text-right py-3 px-2 font-bold text-green-600">
                      {formatPrice(stats.revenueByStore.reduce((sum, s) => sum + s.todayRevenue, 0))}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Revenue by Driver */}
      {stats.revenueByDriver && stats.revenueByDriver.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <h2 className="font-semibold text-lg flex items-center gap-2">
              🛵 Ingresos por Repartidor
            </h2>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-2 font-medium text-gray-500">Repartidor</th>
                    <th className="text-right py-3 px-2 font-medium text-gray-500">Entregas</th>
                    <th className="text-right py-3 px-2 font-medium text-gray-500">Total Envíos</th>
                    <th className="text-right py-3 px-2 font-medium text-gray-500">Hoy</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.revenueByDriver.map((driver) => (
                    <tr key={driver.driverId} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-2">
                        <p className="font-medium text-gray-900">{driver.driverName}</p>
                        <p className="text-xs text-gray-500">{driver.driverPhone}</p>
                      </td>
                      <td className="text-right py-3 px-2">
                        <span className="text-gray-700">{driver.totalDeliveries}</span>
                        {driver.todayDeliveries > 0 && (
                          <span className="text-xs text-blue-600 ml-1">(+{driver.todayDeliveries} hoy)</span>
                        )}
                      </td>
                      <td className="text-right py-3 px-2">
                        <span className="font-semibold text-orange-600">{formatPrice(driver.totalDeliveryFees)}</span>
                      </td>
                      <td className="text-right py-3 px-2">
                        <span className={`font-medium ${driver.todayDeliveryFees > 0 ? 'text-orange-600' : 'text-gray-400'}`}>
                          {formatPrice(driver.todayDeliveryFees)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-gray-300 bg-gray-50">
                    <td className="py-3 px-2 font-bold text-gray-900">Total</td>
                    <td className="text-right py-3 px-2 font-bold">
                      {stats.revenueByDriver.reduce((sum, d) => sum + d.totalDeliveries, 0)}
                    </td>
                    <td className="text-right py-3 px-2 font-bold text-orange-600">
                      {formatPrice(stats.revenueByDriver.reduce((sum, d) => sum + d.totalDeliveryFees, 0))}
                    </td>
                    <td className="text-right py-3 px-2 font-bold text-orange-600">
                      {formatPrice(stats.revenueByDriver.reduce((sum, d) => sum + d.todayDeliveryFees, 0))}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

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
