'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatPrice } from '@/lib/utils'
import Link from 'next/link'

interface AdminStats {
  id: string
  name: string
  email: string
  zoneName: string | null
  registeredAt: string | null
  totalStores: number
  totalDrivers: number
  totalOrders: number
  completedOrders: number
  totalDeliveryRevenue: number
  amountDue: number
  billingStatus: string
}

interface DashboardStats {
  totalAdmins: number
  totalZones: number
  totalStores: number
  totalOrders: number
  totalRevenue: number
  pendingBilling: number
  admins: AdminStats[]
}

export default function SuperAdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/superadmin/stats')
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-gray-200 rounded-xl" />
          ))}
        </div>
        <div className="h-96 bg-gray-200 rounded-xl" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Dashboard General</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
          <CardContent className="pt-6">
            <p className="text-4xl font-bold">{stats?.totalAdmins || 0}</p>
            <p className="text-purple-200 mt-1">Administradores</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <CardContent className="pt-6">
            <p className="text-4xl font-bold">{stats?.totalZones || 0}</p>
            <p className="text-blue-200 mt-1">Zonas Activas</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
          <CardContent className="pt-6">
            <p className="text-4xl font-bold">{stats?.totalStores || 0}</p>
            <p className="text-green-200 mt-1">Tiendas Totales</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white">
          <CardContent className="pt-6">
            <p className="text-4xl font-bold">{formatPrice(stats?.totalRevenue || 0)}</p>
            <p className="text-orange-200 mt-1">Ingresos Envíos</p>
          </CardContent>
        </Card>
      </div>

      {/* Billing Summary */}
      <Card className="border-2 border-yellow-200 bg-yellow-50">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-yellow-800">💰 Facturación Pendiente</h3>
              <p className="text-yellow-600">Total a cobrar este mes</p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-yellow-700">
                {formatPrice(stats?.pendingBilling || 0)}
              </p>
              <Link href="/superadmin/billing" className="text-sm text-yellow-600 hover:underline">
                Ver detalles →
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Admins Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">👥 Administradores por Zona</h2>
            <Link
              href="/superadmin/admins"
              className="text-purple-600 hover:text-purple-700 text-sm font-medium"
            >
              Ver todos →
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {stats?.admins && stats.admins.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Admin</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Zona</th>
                    <th className="text-center py-3 px-4 text-sm font-medium text-gray-600">Tiendas</th>
                    <th className="text-center py-3 px-4 text-sm font-medium text-gray-600">Pedidos</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">Envíos</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">A Cobrar</th>
                    <th className="text-center py-3 px-4 text-sm font-medium text-gray-600">Estado</th>
                    <th className="text-center py-3 px-4 text-sm font-medium text-gray-600">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.admins.map((admin) => (
                    <tr key={admin.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-medium text-gray-900">{admin.name}</p>
                          <p className="text-sm text-gray-500">{admin.email}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm text-gray-700">
                          {admin.zoneName || 'Sin zona'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="font-medium">{admin.totalStores}</span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="font-medium">{admin.completedOrders}</span>
                        <span className="text-gray-400 text-sm">/{admin.totalOrders}</span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className="font-medium text-green-600">
                          {formatPrice(admin.totalDeliveryRevenue)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className="font-bold text-purple-600">
                          {formatPrice(admin.amountDue)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Badge
                          className={
                            admin.billingStatus === 'PAID'
                              ? 'bg-green-100 text-green-700'
                              : admin.billingStatus === 'OVERDUE'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-yellow-100 text-yellow-700'
                          }
                        >
                          {admin.billingStatus === 'PAID'
                            ? 'Pagado'
                            : admin.billingStatus === 'OVERDUE'
                            ? 'Vencido'
                            : 'Pendiente'}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Link
                          href={`/superadmin/messages?adminId=${admin.id}`}
                          className="text-purple-600 hover:text-purple-700"
                        >
                          💬
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <p className="text-4xl mb-4">👥</p>
              <p>No hay administradores registrados</p>
              <Link
                href="/superadmin/admins"
                className="text-purple-600 hover:underline mt-2 inline-block"
              >
                Crear primer administrador
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
