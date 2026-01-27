'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatPrice, formatDate } from '@/lib/utils'
import Link from 'next/link'

interface BillingCycle {
  id: string
  startDate: string
  endDate: string
  totalOrders: number
  amountDue: number
  isPaid: boolean
  paidAt: string | null
  admin: {
    id: string
    name: string
    email: string
    zone?: {
      name: string
    } | null
  }
}

interface BillingSummary {
  totalPending: number
  totalPaid: number
  totalAdmins: number
  currentCycles: BillingCycle[]
  paidCycles: BillingCycle[]
}

export default function BillingPage() {
  const [summary, setSummary] = useState<BillingSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'pending' | 'paid'>('pending')

  useEffect(() => {
    fetchBilling()
  }, [])

  const fetchBilling = async () => {
    try {
      const response = await fetch('/api/superadmin/billing')
      if (response.ok) {
        const data = await response.json()
        setSummary(data)
      }
    } catch (error) {
      console.error('Error fetching billing:', error)
    } finally {
      setLoading(false)
    }
  }

  const markAsPaid = async (cycleId: string) => {
    if (!confirm('¿Marcar este ciclo como pagado?')) return

    try {
      const response = await fetch(`/api/superadmin/billing/${cycleId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPaid: true }),
      })

      if (response.ok) {
        fetchBilling()
        alert('✅ Ciclo marcado como pagado')
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Error al actualizar')
    }
  }

  if (loading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-gray-200 rounded-xl" />
          ))}
        </div>
        <div className="h-96 bg-gray-200 rounded-xl" />
      </div>
    )
  }

  const cycles = activeTab === 'pending' ? summary?.currentCycles : summary?.paidCycles

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">💰 Facturación</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-yellow-500 to-yellow-600 text-white">
          <CardContent className="pt-6">
            <p className="text-4xl font-bold">{formatPrice(summary?.totalPending || 0)}</p>
            <p className="text-yellow-200 mt-1">Pendiente de Cobro</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
          <CardContent className="pt-6">
            <p className="text-4xl font-bold">{formatPrice(summary?.totalPaid || 0)}</p>
            <p className="text-green-200 mt-1">Cobrado Este Mes</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
          <CardContent className="pt-6">
            <p className="text-4xl font-bold">{summary?.totalAdmins || 0}</p>
            <p className="text-purple-200 mt-1">Admins con Factura</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b">
        <button
          onClick={() => setActiveTab('pending')}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            activeTab === 'pending'
              ? 'border-yellow-500 text-yellow-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          ⏳ Pendientes ({summary?.currentCycles?.length || 0})
        </button>
        <button
          onClick={() => setActiveTab('paid')}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            activeTab === 'paid'
              ? 'border-green-500 text-green-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          ✅ Pagados ({summary?.paidCycles?.length || 0})
        </button>
      </div>

      {/* Billing Table */}
      <Card>
        <CardContent className="pt-6">
          {cycles && cycles.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Admin</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Zona</th>
                    <th className="text-center py-3 px-4 text-sm font-medium text-gray-600">Período</th>
                    <th className="text-center py-3 px-4 text-sm font-medium text-gray-600">Pedidos</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">Monto</th>
                    <th className="text-center py-3 px-4 text-sm font-medium text-gray-600">Estado</th>
                    <th className="text-center py-3 px-4 text-sm font-medium text-gray-600">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {cycles.map((cycle) => (
                    <tr key={cycle.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-medium text-gray-900">{cycle.admin.name}</p>
                          <p className="text-sm text-gray-500">{cycle.admin.email}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm text-gray-700">
                          {cycle.admin.zone?.name || 'Sin zona'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center text-sm">
                        <p>{formatDate(cycle.startDate)}</p>
                        <p className="text-gray-500">a {formatDate(cycle.endDate)}</p>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="font-medium">{cycle.totalOrders}</span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className="font-bold text-lg text-purple-600">
                          {formatPrice(cycle.amountDue)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Badge
                          className={
                            cycle.isPaid
                              ? 'bg-green-100 text-green-700'
                              : 'bg-yellow-100 text-yellow-700'
                          }
                        >
                          {cycle.isPaid ? '✅ Pagado' : '⏳ Pendiente'}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Link
                            href={`/superadmin/messages?adminId=${cycle.admin.id}`}
                            className="text-purple-600 hover:text-purple-700"
                            title="Enviar mensaje"
                          >
                            💬
                          </Link>
                          {!cycle.isPaid && (
                            <button
                              onClick={() => markAsPaid(cycle.id)}
                              className="text-green-600 hover:text-green-700"
                              title="Marcar como pagado"
                            >
                              ✅
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <p className="text-4xl mb-4">{activeTab === 'pending' ? '📭' : '📬'}</p>
              <p>
                {activeTab === 'pending'
                  ? 'No hay facturas pendientes'
                  : 'No hay facturas pagadas este mes'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info sobre tarifas */}
      <Card className="border-2 border-purple-200 bg-purple-50">
        <CardContent className="pt-6">
          <h3 className="font-bold text-purple-800 mb-3">📋 Estructura de Tarifas</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="bg-white p-3 rounded-lg">
              <p className="font-bold text-purple-700">$10/mes</p>
              <p className="text-gray-600">0 - 30 pedidos</p>
            </div>
            <div className="bg-white p-3 rounded-lg">
              <p className="font-bold text-purple-700">$20/mes</p>
              <p className="text-gray-600">31 - 50 pedidos</p>
            </div>
            <div className="bg-white p-3 rounded-lg">
              <p className="font-bold text-purple-700">$30/mes</p>
              <p className="text-gray-600">51 - 70 pedidos</p>
            </div>
            <div className="bg-white p-3 rounded-lg">
              <p className="font-bold text-purple-700">$100/mes máx</p>
              <p className="text-gray-600">hasta 300 pedidos</p>
            </div>
          </div>
          <p className="text-xs text-purple-600 mt-3">
            * Después de 1000 pedidos, el ciclo se reinicia a $110 y continúa escalando.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
