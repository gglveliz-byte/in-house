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

type ToastType = 'success' | 'error' | 'info'

export default function BillingPage() {
  const [summary, setSummary] = useState<BillingSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'pending' | 'paid'>('pending')
  const [markingPaid, setMarkingPaid] = useState<string | null>(null)
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null)

  useEffect(() => {
    fetchBilling()
  }, [])

  const showToast = (message: string, type: ToastType = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3500)
  }

  const fetchBilling = async () => {
    try {
      const response = await fetch('/api/superadmin/billing')
      if (response.ok) {
        const data = await response.json()
        setSummary(data)
      } else {
        showToast('Error al cargar facturación', 'error')
      }
    } catch {
      showToast('Error de conexión', 'error')
    } finally {
      setLoading(false)
    }
  }

  const markAsPaid = async (cycleId: string) => {
    if (cycleId.startsWith('temp-')) {
      showToast('No se puede marcar: ciclo sin registro en BD. Los pedidos se registrarán en el próximo ciclo.', 'info')
      return
    }
    setMarkingPaid(cycleId)
    try {
      const response = await fetch(`/api/superadmin/billing/${cycleId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPaid: true }),
      })

      if (response.ok) {
        fetchBilling()
        showToast('Ciclo marcado como pagado correctamente', 'success')
      } else {
        showToast('Error al actualizar', 'error')
      }
    } catch {
      showToast('Error de conexión', 'error')
    } finally {
      setMarkingPaid(null)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-gray-200 rounded w-36 animate-pulse" />
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 bg-gray-200 rounded-xl animate-pulse" />
          ))}
        </div>
        <div className="h-96 bg-gray-200 rounded-xl animate-pulse" />
      </div>
    )
  }

  const cycles = activeTab === 'pending' ? summary?.currentCycles : summary?.paidCycles

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-xl shadow-lg text-white text-sm font-medium flex items-center gap-2 max-w-sm ${
            toast.type === 'success' ? 'bg-emerald-600' :
            toast.type === 'error' ? 'bg-red-600' : 'bg-[#003f87]'
          }`}
        >
          {toast.type === 'success' ? '✓' : toast.type === 'error' ? '✕' : 'ℹ'} {toast.message}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">💰 Facturación</h1>
          <p className="text-sm text-gray-500 mt-0.5">Gestión de cobros a administradores</p>
        </div>
        <Button onClick={fetchBilling} variant="secondary" size="sm">
          🔄 Actualizar
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-amber-500 to-amber-600 text-white">
          <CardContent className="pt-5 pb-4">
            <p className="text-4xl font-bold">{formatPrice(summary?.totalPending || 0)}</p>
            <p className="text-amber-200 mt-1 text-sm">Pendiente de Cobro</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white">
          <CardContent className="pt-5 pb-4">
            <p className="text-4xl font-bold">{formatPrice(summary?.totalPaid || 0)}</p>
            <p className="text-emerald-200 mt-1 text-sm">Cobrado Este Mes</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-[#003f87] to-[#0056b3] text-white">
          <CardContent className="pt-5 pb-4">
            <p className="text-4xl font-bold">{summary?.totalAdmins || 0}</p>
            <p className="text-blue-200 mt-1 text-sm">Admins con Factura</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('pending')}
          className={`px-5 py-2.5 font-medium text-sm border-b-2 transition-colors ${
            activeTab === 'pending'
              ? 'border-amber-500 text-amber-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          ⏳ Pendientes ({summary?.currentCycles?.length || 0})
        </button>
        <button
          onClick={() => setActiveTab('paid')}
          className={`px-5 py-2.5 font-medium text-sm border-b-2 transition-colors ${
            activeTab === 'paid'
              ? 'border-emerald-500 text-emerald-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          ✅ Pagados ({summary?.paidCycles?.length || 0})
        </button>
      </div>

      {/* Billing Table */}
      <Card>
        <CardContent className="pt-4">
          {cycles && cycles.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Admin</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Zona</th>
                    <th className="text-center py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Período</th>
                    <th className="text-center py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Pedidos</th>
                    <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Monto</th>
                    <th className="text-center py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Estado</th>
                    <th className="text-center py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {cycles.map((cycle) => (
                    <tr key={cycle.id} className="border-b hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-4">
                        <p className="font-semibold text-gray-900 text-sm">{cycle.admin.name}</p>
                        <p className="text-xs text-gray-500">{cycle.admin.email}</p>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm text-gray-700">
                          {cycle.admin.zone?.name || <span className="text-gray-400 italic">Sin zona</span>}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <p className="text-sm">{formatDate(cycle.startDate)}</p>
                        <p className="text-xs text-gray-500">a {formatDate(cycle.endDate)}</p>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="font-semibold text-[#003f87]">{cycle.totalOrders}</span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className="font-bold text-lg text-[#003f87]">
                          {formatPrice(cycle.amountDue)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Badge
                          className={
                            cycle.isPaid
                              ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                              : 'bg-amber-100 text-amber-700 border border-amber-200'
                          }
                        >
                          {cycle.isPaid ? '✓ Pagado' : '⏳ Pendiente'}
                        </Badge>
                        {cycle.isPaid && cycle.paidAt && (
                          <p className="text-xs text-gray-400 mt-1">{formatDate(cycle.paidAt)}</p>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Link
                            href={`/superadmin/messages?adminId=${cycle.admin.id}`}
                            className="text-[#003f87] hover:text-[#002d6b] text-lg transition-colors"
                            title="Enviar mensaje"
                          >
                            💬
                          </Link>
                          {!cycle.isPaid && (
                            <Button
                              size="sm"
                              onClick={() => markAsPaid(cycle.id)}
                              loading={markingPaid === cycle.id}
                              className="bg-emerald-600 hover:bg-emerald-700 text-xs px-2"
                            >
                              ✓ Pagar
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-16 text-gray-400">
              <span className="text-5xl block mb-4">{activeTab === 'pending' ? '📭' : '📬'}</span>
              <p className="font-medium">
                {activeTab === 'pending' ? 'No hay facturas pendientes' : 'No hay facturas pagadas este mes'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tariff structure */}
      <Card className="border-2 border-[#003f87]/20 bg-blue-50">
        <CardContent className="pt-5">
          <h3 className="font-bold text-[#003f87] mb-3">📋 Estructura de Tarifas del Mes</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            {[
              { price: '$10/mes', range: '0 - 30 pedidos' },
              { price: '$20/mes', range: '31 - 50 pedidos' },
              { price: '$30/mes', range: '51 - 70 pedidos' },
              { price: '$100/mes máx', range: 'hasta 300 pedidos' },
            ].map((tier) => (
              <div key={tier.range} className="bg-white p-3 rounded-xl border border-[#003f87]/10">
                <p className="font-bold text-[#003f87]">{tier.price}</p>
                <p className="text-gray-600 text-xs mt-0.5">{tier.range}</p>
              </div>
            ))}
          </div>
          <p className="text-xs text-[#003f87]/70 mt-3">
            * Después de 1000 pedidos, el ciclo se reinicia a $110 y continúa escalando.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
