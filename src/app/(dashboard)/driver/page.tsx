'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatPrice, formatDate } from '@/lib/utils'
import { useDriverOrders, useNotificationPermission } from '@/hooks/use-pusher'
import type { Order } from '@/types'

interface OrderWithStore extends Order {
  store: { name: string; address: string; whatsapp: string; latitude: number | null; longitude: number | null }
}

export default function DriverAvailablePage() {
  const { data: session } = useSession()
  const [orders, setOrders] = useState<OrderWithStore[]>([])
  const [loading, setLoading] = useState(true)
  const [accepting, setAccepting] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  const { permission, requestPermission } = useNotificationPermission()

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000) }

  const fetchOrders = useCallback(async () => {
    try {
      const data = await (await fetch('/api/orders/ready')).json()
      setOrders(data)
    } catch { /* silent */ } finally { setLoading(false) }
  }, [])

  useDriverOrders(fetchOrders)

  useEffect(() => { fetchOrders() }, [fetchOrders])

  const acceptOrder = async (orderId: string) => {
    setAccepting(orderId)
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'PICKED_UP', driverId: session?.user.id }),
      })
      if (res.ok) { fetchOrders(); showToast('✓ Pedido aceptado — ¡Buen viaje!') }
      else showToast('Error al aceptar pedido')
    } catch { showToast('Error de conexión') } finally { setAccepting(null) }
  }

  const openMaps = (order: OrderWithStore) => {
    const dest = order.store.latitude && order.store.longitude
      ? `${order.store.latitude},${order.store.longitude}`
      : encodeURIComponent(order.store.address)
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${dest}`, '_blank')
  }

  if (loading) return (
    <div className="max-w-2xl mx-auto space-y-4">
      {[1, 2].map(i => <div key={i} className="h-52 bg-gray-100 rounded-xl animate-pulse" />)}
    </div>
  )

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-emerald-600 text-white px-5 py-3 rounded-xl shadow-lg text-sm font-semibold">
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">🚗 Pedidos Disponibles</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {orders.length === 0 ? 'Sin pedidos pendientes' : `${orders.length} pedido${orders.length !== 1 ? 's' : ''} listo${orders.length !== 1 ? 's' : ''} para recoger`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {permission === 'default' && (
            <Button onClick={requestPermission} variant="secondary" size="sm">🔔 Activar notificaciones</Button>
          )}
          {permission === 'granted' && (
            <span className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1.5 rounded-full font-medium">🔔 Activas</span>
          )}
          <Button onClick={fetchOrders} variant="secondary" size="sm">🔄 Actualizar</Button>
        </div>
      </div>

      {/* Empty state */}
      {orders.length === 0 ? (
        <Card className="text-center py-16">
          <span className="text-6xl block mb-4">📦</span>
          <p className="text-gray-600 font-semibold text-lg">No hay pedidos disponibles</p>
          <p className="text-gray-400 text-sm mt-1">Aquí aparecerán los pedidos listos para recoger</p>
          <Button onClick={fetchOrders} variant="secondary" className="mt-5">🔄 Verificar de nuevo</Button>
        </Card>
      ) : (
        <div className="space-y-4">
          {orders.map(order => (
            <Card key={order.id} className="border-l-4 border-l-[#003f87] hover:shadow-md transition-all">
              <CardHeader className="flex flex-row items-start justify-between pb-2">
                <div>
                  <h3 className="font-bold text-[#003f87] text-lg">Pedido #{order.orderNumber}</h3>
                  <p className="text-xs text-gray-400">{formatDate(order.createdAt)}</p>
                </div>
                <Badge className="bg-blue-100 text-[#003f87] border border-blue-200">🍽️ Listo</Badge>
              </CardHeader>
              <CardContent className="pt-0 space-y-3">
                {/* Recoger en */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-[#003f87]/5 border border-[#003f87]/20 rounded-xl p-3">
                    <p className="text-xs font-semibold text-[#003f87] uppercase tracking-wider mb-1.5">📍 Recoger en</p>
                    <p className="font-semibold text-gray-900 text-sm">{order.store.name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{order.store.address}</p>
                  </div>
                  {/* Entregar a */}
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-3">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">🏠 Entregar a</p>
                    <p className="font-semibold text-gray-900 text-sm">{order.customerName}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{order.customerAddress}</p>
                    <p className="text-xs text-gray-500">{order.customerPhone}</p>
                  </div>
                </div>

                {order.customerNotes && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                    <p className="text-xs text-amber-800">📝 <strong>Nota:</strong> {order.customerNotes}</p>
                  </div>
                )}

                {/* Resumen */}
                <div className="flex items-center justify-between text-sm text-gray-600 bg-gray-50 rounded-xl px-3 py-2">
                  <span>{order.items.length} producto{order.items.length !== 1 ? 's' : ''}</span>
                  <span className="font-bold text-[#003f87]">{formatPrice(order.total)}</span>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-1">
                  <Button
                    className="flex-1"
                    onClick={() => acceptOrder(order.id)}
                    loading={accepting === order.id}
                    disabled={!!accepting}
                  >
                    🚗 Aceptar pedido
                  </Button>
                  <Button variant="secondary" onClick={() => openMaps(order)} title="Ver ruta en Google Maps">
                    🗺️ Ruta
                  </Button>
                  {order.store.whatsapp && (
                    <Button variant="secondary" onClick={() => window.open(`tel:${order.store.whatsapp}`, '_self')} title="Llamar a la tienda">
                      📞
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
