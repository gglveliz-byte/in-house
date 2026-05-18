'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
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
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      setError(null)
      const response = await fetch('/api/superadmin/stats')
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      } else {
        setError('Error al cargar estadísticas')
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
        <div className="h-64 bg-gray-200 rounded-xl animate-pulse" />
        <div className="h-96 bg-gray-200 rounded-xl animate-pulse" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <span className="text-5xl">⚠️</span>
        <p className="text-gray-600 font-medium">{error}</p>
        <Button onClick={fetchStats} variant="secondary">
          Reintentar
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard General</h1>
          <p className="text-sm text-gray-500 mt-0.5">Vista general de la plataforma</p>
        </div>
        <Button onClick={fetchStats} variant="secondary" size="sm">
          🔄 Actualizar
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Link href="/superadmin/admins">
          <Card className="bg-gradient-to-br from-[#003f87] to-[#0056b3] text-white hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="pt-5 pb-4">
              <p className="text-4xl font-bold">{stats?.totalAdmins || 0}</p>
              <p className="text-blue-200 mt-1 text-sm">Administradores</p>
              <p className="text-blue-300 text-xs mt-2">Ver todos →</p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/superadmin/zones">
          <Card className="bg-gradient-to-br from-teal-500 to-teal-600 text-white hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="pt-5 pb-4">
              <p className="text-4xl font-bold">{stats?.totalZones || 0}</p>
              <p className="text-teal-200 mt-1 text-sm">Zonas Activas</p>
              <p className="text-teal-300 text-xs mt-2">Gestionar →</p>
            </CardContent>
          </Card>
        </Link>
        <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white">
          <CardContent className="pt-5 pb-4">
            <p className="text-4xl font-bold">{stats?.totalStores || 0}</p>
            <p className="text-emerald-200 mt-1 text-sm">Tiendas Totales</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-amber-500 to-amber-600 text-white">
          <CardContent className="pt-5 pb-4">
            <p className="text-3xl font-bold">{formatPrice(stats?.totalRevenue || 0)}</p>
            <p className="text-amber-200 mt-1 text-sm">Ingresos Envíos</p>
          </CardContent>
        </Card>
      </div>

      {/* Billing Summary */}
      <Link href="/superadmin/billing">
        <Card className="border-2 border-amber-200 bg-amber-50 hover:shadow-md transition-shadow cursor-pointer">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-amber-800">💰 Facturación Pendiente</h3>
                <p className="text-amber-600 text-sm">Total a cobrar este mes</p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-amber-700">
                  {formatPrice(stats?.pendingBilling || 0)}
                </p>
                <p className="text-sm text-amber-600 mt-1">Ver detalles →</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </Link>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { href: '/superadmin/zones', label: 'Nueva Zona', icon: '🗺️', desc: 'Crear zona geográfica' },
          { href: '/superadmin/admins', label: 'Nuevo Admin', icon: '👤', desc: 'Agregar administrador' },
          { href: '/superadmin/billing', label: 'Facturación', icon: '💰', desc: 'Gestionar cobros' },
          { href: '/superadmin/messages', label: 'Mensajes', icon: '💬', desc: 'Comunicación interna' },
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

      {/* Admins Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900">👥 Administradores por Zona</h2>
            <Link
              href="/superadmin/admins"
              className="text-[#003f87] hover:text-[#002d6b] text-sm font-medium"
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
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Admin</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Zona</th>
                    <th className="text-center py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Tiendas</th>
                    <th className="text-center py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Pedidos</th>
                    <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Envíos</th>
                    <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">A Cobrar</th>
                    <th className="text-center py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Estado</th>
                    <th className="text-center py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.admins.map((admin) => (
                    <tr key={admin.id} className="border-b hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-semibold text-gray-900 text-sm">{admin.name}</p>
                          <p className="text-xs text-gray-500">{admin.email}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm text-gray-700">
                          {admin.zoneName || <span className="text-gray-400 italic">Sin zona</span>}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="font-semibold text-[#003f87]">{admin.totalStores}</span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="font-semibold">{admin.completedOrders}</span>
                        <span className="text-gray-400 text-xs">/{admin.totalOrders}</span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className="font-semibold text-emerald-600 text-sm">
                          {formatPrice(admin.totalDeliveryRevenue)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className="font-bold text-[#003f87] text-sm">
                          {formatPrice(admin.amountDue)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Badge
                          className={
                            admin.billingStatus === 'PAID'
                              ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                              : admin.billingStatus === 'OVERDUE'
                              ? 'bg-red-100 text-red-700 border border-red-200'
                              : 'bg-amber-100 text-amber-700 border border-amber-200'
                          }
                        >
                          {admin.billingStatus === 'PAID'
                            ? '✓ Pagado'
                            : admin.billingStatus === 'OVERDUE'
                            ? '⚠ Vencido'
                            : '⏳ Pendiente'}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Link
                            href={`/superadmin/messages?adminId=${admin.id}`}
                            className="text-[#003f87] hover:text-[#002d6b] text-lg transition-colors"
                            title="Enviar mensaje"
                          >
                            💬
                          </Link>
                          <Link
                            href="/superadmin/billing"
                            className="text-amber-600 hover:text-amber-700 text-lg transition-colors"
                            title="Ver facturación"
                          >
                            💰
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-16 text-gray-400">
              <span className="text-5xl block mb-4">👥</span>
              <p className="font-medium">No hay administradores registrados</p>
              <Link
                href="/superadmin/admins"
                className="text-[#003f87] hover:underline mt-3 inline-block text-sm font-medium"
              >
                Crear primer administrador →
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
