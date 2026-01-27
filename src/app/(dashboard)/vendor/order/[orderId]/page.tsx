'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { usePusherChannel } from '@/hooks/use-pusher'
import { CHANNELS, EVENTS } from '@/lib/pusher'
import { formatPrice, getOrderStatusLabel, getOrderStatusColor } from '@/lib/utils'

interface OrderItem {
  id: string
  quantity: number
  totalPrice: number
  notes: string | null
  product: {
    name: string
  }
}

interface Order {
  id: string
  orderNumber: number
  status: string
  paymentStatus: string
  customerName: string
  customerPhone: string
  customerAddress: string
  customerLat: number | null
  customerLng: number | null
  customerNotes: string | null
  subtotal: number
  deliveryFee: number
  total: number
  createdAt: string
  items: OrderItem[]
  store: {
    id: string
    name: string
    minDeliveryFee?: number
    maxDeliveryFee?: number
  }
  actualDeliveryFee?: number | null
}

export default function VendorOrderPage({
  params,
}: {
  params: Promise<{ orderId: string }>
}) {
  const { data: session } = useSession()
  const router = useRouter()
  const [order, setOrder] = useState<Order | null>(null)
  const [orderId, setOrderId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)

  // Obtener orderId de params
  useEffect(() => {
    params.then(({ orderId }) => setOrderId(orderId))
  }, [params])

  // Función para obtener el pedido
  const fetchOrder = useCallback(async () => {
    if (!orderId) return
    try {
      const response = await fetch(`/api/orders/${orderId}`)
      if (response.ok) {
        const data = await response.json()
        setOrder(data)
      }
    } catch (error) {
      console.error('Error fetching order:', error)
    } finally {
      setLoading(false)
    }
  }, [orderId])

  // Cargar pedido al inicio
  useEffect(() => {
    if (orderId) {
      fetchOrder()
    }
  }, [orderId, fetchOrder])

  // Escuchar actualizaciones
  usePusherChannel(
    orderId ? CHANNELS.ORDER(orderId) : '',
    EVENTS.ORDER_UPDATED,
    () => fetchOrder(),
    !!orderId
  )

  // Marcar como listo para enviar
  const handleMarkReady = async () => {
    if (!orderId) return
    setUpdating(true)
    try {
      await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'READY' }),
      })

      // Enviar mensaje de sistema al cliente
      await fetch(`/api/orders/${orderId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: '🍽️ Tu pedido está listo. Un repartidor lo recogerá pronto.',
          senderType: 'SYSTEM',
          senderName: 'Sistema',
        }),
      })

      // Redirigir al panel principal
      router.push('/vendor')
    } catch (error) {
      console.error('Error marking ready:', error)
      alert('Error al marcar como listo')
    } finally {
      setUpdating(false)
    }
  }

  // Abrir Google Maps
  const openMaps = () => {
    if (!order) return
    const destination = order.customerLat && order.customerLng
      ? `${order.customerLat},${order.customerLng}`
      : encodeURIComponent(order.customerAddress)
    const url = `https://www.google.com/maps/dir/?api=1&destination=${destination}`
    window.open(url, '_blank')
  }

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-pulse text-gray-500">Cargando...</div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <span className="text-6xl block mb-4">❌</span>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Pedido no encontrado</h1>
          <Link href="/vendor">
            <Button>Volver a pedidos</Button>
          </Link>
        </div>
      </div>
    )
  }

  const isConfirmed = order.status === 'CONFIRMED'
  const paymentVerified = order.paymentStatus === 'VERIFIED'
  const canMarkReady = isConfirmed && paymentVerified

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <Link href="/vendor" className="text-gray-500 hover:text-gray-700">
            ← Volver
          </Link>
          <Badge className={getOrderStatusColor(order.status)}>
            {getOrderStatusLabel(order.status)}
          </Badge>
        </div>

        {/* Tarjeta principal */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {/* Encabezado del pedido */}
          <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white p-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-bold">Pedido #{order.orderNumber}</h1>
                <p className="text-sm text-green-100">
                  {new Date(order.createdAt).toLocaleString('es-EC')}
                </p>
              </div>
              <span className="text-3xl">📦</span>
            </div>
          </div>

          {/* Estado del pago */}
          <div className={`p-3 text-center ${paymentVerified ? 'bg-green-50' : 'bg-yellow-50'}`}>
            <span className="text-sm font-medium">
              {paymentVerified ? '✅ Pago verificado' : '⏳ Pago pendiente'}
            </span>
          </div>

          {/* Info del cliente */}
          <div className="p-4 border-b">
            <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
              <span>👤</span> Cliente
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Nombre:</span>
                <span className="font-medium">{order.customerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Teléfono:</span>
                <a href={`tel:${order.customerPhone}`} className="font-medium text-green-600">
                  {order.customerPhone}
                </a>
              </div>
              <div className="flex justify-between items-start">
                <span className="text-gray-600">Dirección:</span>
                <div className="text-right">
                  <span className="font-medium">{order.customerAddress}</span>
                  {(order.customerLat || order.customerLng) && (
                    <button
                      onClick={openMaps}
                      className="block mt-1 text-blue-600 text-xs"
                    >
                      🗺️ Ver en mapa
                    </button>
                  )}
                </div>
              </div>
              {order.customerNotes && (
                <div className="bg-yellow-50 p-2 rounded-lg mt-2">
                  <span className="text-gray-600">📝 Notas:</span>
                  <p className="font-medium">{order.customerNotes}</p>
                </div>
              )}
            </div>
          </div>

          {/* Productos */}
          <div className="p-4 border-b">
            <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
              <span>🛒</span> Productos
            </h3>
            <div className="space-y-2">
              {order.items.map((item) => (
                <div key={item.id} className="flex justify-between text-sm bg-gray-50 p-2 rounded-lg">
                  <div>
                    <span className="font-medium">{item.quantity}x {item.product.name}</span>
                    {item.notes && (
                      <p className="text-xs text-gray-500">📝 {item.notes}</p>
                    )}
                  </div>
                  <span className="font-medium">{formatPrice(item.totalPrice)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Totales */}
          <div className="p-4 bg-gray-50">
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal</span>
                <span>{formatPrice(order.subtotal)}</span>
              </div>
              {order.store.minDeliveryFee !== undefined && 
               order.store.maxDeliveryFee !== undefined &&
               order.store.maxDeliveryFee >= order.store.minDeliveryFee ? (
                order.actualDeliveryFee ? (
                  <div className="flex justify-between">
                    <span className="text-gray-600">🚚 Envío</span>
                    <span className="font-bold text-yellow-700">{formatPrice(order.actualDeliveryFee)}</span>
                  </div>
                ) : (
                  <div className="flex justify-between bg-yellow-50 p-2 rounded-lg">
                    <span className="text-gray-700">🚚 Envío aproximado</span>
                    <span className="text-yellow-700">{formatPrice(order.store.minDeliveryFee)} - {formatPrice(order.store.maxDeliveryFee)}</span>
                  </div>
                )
              ) : (
                <div className="flex justify-between">
                  <span className="text-gray-600">🚚 Envío</span>
                  <span>{formatPrice(order.deliveryFee)}</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-bold pt-2 border-t mt-2">
                <span>Total</span>
                <span className="text-green-600">{formatPrice(order.total)}</span>
              </div>
            </div>
          </div>

          {/* Acción principal */}
          {canMarkReady && (
            <div className="p-4">
              <Button
                onClick={handleMarkReady}
                disabled={updating}
                className="w-full bg-purple-600 hover:bg-purple-700 text-lg py-6"
              >
                {updating ? (
                  <>⏳ Procesando...</>
                ) : (
                  <>🍽️ Listo para enviar</>
                )}
              </Button>
              <p className="text-xs text-center text-gray-500 mt-2">
                Al marcar como listo, se notificará al repartidor
              </p>
            </div>
          )}

          {/* Si ya está listo */}
          {order.status === 'READY' && (
            <div className="p-4 bg-purple-50 text-center">
              <span className="text-2xl block mb-2">🍽️</span>
              <p className="font-bold text-purple-800">Pedido listo</p>
              <p className="text-sm text-purple-600">Esperando que el repartidor lo recoja</p>
            </div>
          )}

          {/* Si está en camino */}
          {order.status === 'PICKED_UP' && (
            <div className="p-4 bg-blue-50 text-center">
              <span className="text-2xl block mb-2">🏍️</span>
              <p className="font-bold text-blue-800">En camino</p>
              <p className="text-sm text-blue-600">El repartidor está llevando el pedido</p>
            </div>
          )}

          {/* Si está entregado */}
          {order.status === 'DELIVERED' && (
            <div className="p-4 bg-green-50 text-center">
              <span className="text-2xl block mb-2">🎉</span>
              <p className="font-bold text-green-800">¡Entregado!</p>
              <p className="text-sm text-green-600">El pedido fue entregado exitosamente</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
