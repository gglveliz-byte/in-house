'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { OrderChat } from '@/components/chat/order-chat'
import { usePusherChannel } from '@/hooks/use-pusher'
import { CHANNELS, EVENTS } from '@/lib/pusher'
import { formatPrice, getOrderStatusLabel, getOrderStatusColor } from '@/lib/utils'

interface OrderItem {
  id: string
  quantity: number
  totalPrice: number
  product: {
    name: string
  }
}

interface Order {
  id: string
  orderNumber: number
  status: string
  paymentStatus: string
  paymentProof: string | null
  customerName: string
  customerPhone: string
  customerAddress: string
  customerLat: number | null
  customerLng: number | null
  subtotal: number
  deliveryFee: number
  total: number
  createdAt: string
  items: OrderItem[]
  store: {
    id: string
    name: string
  }
}

export default function VendorChatPage({
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
  const [viewingImage, setViewingImage] = useState<string | null>(null)

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

  // Escuchar actualizaciones del pedido
  usePusherChannel(
    orderId ? CHANNELS.ORDER(orderId) : '',
    EVENTS.ORDER_UPDATED,
    () => fetchOrder(),
    !!orderId
  )

  // Escuchar cuando el cliente sube comprobante (viene del canal de la tienda)
  usePusherChannel(
    order?.store?.id ? CHANNELS.STORE(order.store.id) : '',
    EVENTS.NEW_MESSAGE,
    (data: unknown) => {
      const msgData = data as { orderId?: string }
      // Solo actualizar si es para este pedido
      if (msgData.orderId === orderId) {
        fetchOrder()
      }
    },
    !!order?.store?.id
  )

  // Verificar pago
  const handleVerifyPayment = async () => {
    if (!orderId) return
    setUpdating(true)
    try {
      // Actualizar estado del pago
      await fetch(`/api/orders/${orderId}/payment`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentStatus: 'VERIFIED' }),
      })

      // Confirmar el pedido
      await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'CONFIRMED' }),
      })

      // Enviar mensaje de sistema
      await fetch(`/api/orders/${orderId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: '✅ Pago verificado. Tu pedido está siendo preparado. ¡Espera en casa!',
          senderType: 'SYSTEM',
          senderName: 'Sistema',
        }),
      })

      // Redirigir a la página del pedido para marcar como listo
      router.push(`/vendor/order/${orderId}`)
    } catch (error) {
      console.error('Error verifying payment:', error)
      alert('Error al verificar el pago')
    } finally {
      setUpdating(false)
    }
  }

  // Marcar como listo
  const handleMarkReady = async () => {
    if (!orderId) return
    setUpdating(true)
    try {
      await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'READY' }),
      })

      // Enviar mensaje de sistema
      await fetch(`/api/orders/${orderId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: '🍽️ Tu pedido está listo. Un repartidor lo recogerá pronto.',
          senderType: 'SYSTEM',
          senderName: 'Sistema',
        }),
      })

      fetchOrder()
    } catch (error) {
      console.error('Error marking ready:', error)
      alert('Error al marcar como listo')
    } finally {
      setUpdating(false)
    }
  }

  // Cancelar pedido
  const handleCancel = async () => {
    if (!orderId) return
    if (!confirm('¿Estás seguro de cancelar este pedido?')) return

    setUpdating(true)
    try {
      // Enviar mensaje de sistema
      await fetch(`/api/orders/${orderId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: '❌ Pedido cancelado por la tienda.',
          senderType: 'SYSTEM',
          senderName: 'Sistema',
        }),
      })

      await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'CANCELLED' }),
      })

      router.push('/vendor')
    } catch (error) {
      console.error('Error cancelling order:', error)
      alert('Error al cancelar el pedido')
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
      <div className="h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="animate-pulse text-gray-500">Cargando...</div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="h-[calc(100vh-4rem)] flex items-center justify-center">
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

  const paymentVerified = order.paymentStatus === 'VERIFIED'
  const paymentUploaded = order.paymentStatus === 'UPLOADED'
  const isConfirmed = order.status === 'CONFIRMED'
  const isPending = order.status === 'PENDING'
  const isReady = order.status === 'READY'
  const isPickedUp = order.status === 'PICKED_UP'
  const isDelivered = order.status === 'DELIVERED'
  const isCancelled = order.status === 'CANCELLED'

  return (
    <div className="h-screen md:h-[calc(100vh-4rem)] flex flex-col">
      {/* Visor de imagen en pantalla completa */}
      {viewingImage && (
        <div 
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setViewingImage(null)}
        >
          <button
            onClick={() => setViewingImage(null)}
            className="absolute top-4 right-4 w-12 h-12 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center text-white text-2xl transition-colors z-10"
          >
            ✕
          </button>
          <img
            src={viewingImage}
            alt="Comprobante de pago"
            className="max-w-full max-h-full object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {/* Header compacto para móvil */}
      <div className="bg-white border-b shadow-sm">
        {/* Título y estado */}
        <div className="flex items-center justify-between p-3 border-b">
          <div className="flex items-center gap-2">
            <Link href="/vendor" className="text-gray-500 hover:text-gray-700 text-sm">
              ← 
            </Link>
            <div>
              <h1 className="font-bold text-base">Pedido #{order.orderNumber}</h1>
              <p className="text-xs text-gray-600">{order.customerName}</p>
            </div>
          </div>
          <Badge className={`text-xs ${getOrderStatusColor(order.status)}`}>
            {getOrderStatusLabel(order.status)}
          </Badge>
        </div>

        {/* Info del cliente - compacta */}
        <div className="p-3 space-y-2">
          <div className="flex items-center justify-between bg-gray-50 rounded-lg p-2">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <span className="text-lg">👤</span>
              <div className="truncate">
                <p className="text-sm font-medium truncate">{order.customerName}</p>
                <a href={`tel:${order.customerPhone}`} className="text-xs text-green-600">
                  📞 {order.customerPhone}
                </a>
              </div>
            </div>
            {(order.customerLat || order.customerLng) && (
              <button
                onClick={openMaps}
                className="ml-2 bg-blue-500 text-white text-xs px-3 py-1 rounded-full flex-shrink-0"
              >
                🗺️ Mapa
              </button>
            )}
          </div>

          {/* Resumen del pedido - expandible */}
          <details className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
            <summary className="flex items-center justify-between p-2 cursor-pointer hover:bg-green-100 rounded-lg">
              <div className="text-xs text-gray-600 flex items-center gap-1">
                <span>🛒</span> {order.items.length} productos
                <span className="text-gray-400">(click para ver)</span>
              </div>
              <div className="font-bold text-green-600">{formatPrice(order.total)}</div>
            </summary>
            <div className="px-3 pb-3 pt-1 border-t border-green-200 space-y-1">
              {order.items.map((item) => (
                <div key={item.id} className="flex justify-between text-xs">
                  <span className="text-gray-700">{item.quantity}x {item.product.name}</span>
                  <span className="text-gray-600">{formatPrice(item.totalPrice)}</span>
                </div>
              ))}
            </div>
          </details>

          {/* Estado del pago - compacto */}
          <div className={`flex items-center justify-between rounded-lg p-2 ${
            paymentVerified 
              ? 'bg-green-50 border border-green-200' 
              : paymentUploaded 
              ? 'bg-yellow-50 border border-yellow-200'
              : 'bg-gray-50 border border-gray-200'
          }`}>
            <span className="text-xs font-medium">
              {paymentVerified 
                ? '✅ Pago verificado' 
                : paymentUploaded 
                ? '⏳ Verificar pago'
                : '💳 Esperando pago'}
            </span>
            {order.paymentProof && (
              <button
                onClick={() => setViewingImage(order.paymentProof)}
                className="text-xs text-blue-600 font-medium hover:underline"
              >
                Ver 📎
              </button>
            )}
          </div>

          {/* Acciones del vendedor - compactas */}
          <div className="flex gap-2">
            {paymentUploaded && !paymentVerified && (
              <Button
                onClick={handleVerifyPayment}
                disabled={updating}
                size="sm"
                className="flex-1 bg-green-600 hover:bg-green-700 text-sm"
              >
                {updating ? '⏳' : '✅ Verificar pago'}
              </Button>
            )}

            {paymentVerified && isConfirmed && (
              <Button
                onClick={handleMarkReady}
                disabled={updating}
                size="sm"
                className="flex-1 bg-purple-600 hover:bg-purple-700 text-sm"
              >
                {updating ? '⏳' : '🍽️ Listo para enviar'}
              </Button>
            )}

            {(isPending || isConfirmed) && !isCancelled && (
              <Button
                onClick={handleCancel}
                disabled={updating}
                variant="danger"
                size="sm"
                className="px-4"
              >
                ✕
              </Button>
            )}
          </div>

          {/* Estados informativos */}
          {isReady && (
            <div className="bg-purple-50 text-purple-800 text-xs p-2 rounded-lg text-center">
              🍽️ Listo. Esperando repartidor.
            </div>
          )}

          {isPickedUp && (
            <div className="bg-blue-50 text-blue-800 text-xs p-2 rounded-lg text-center">
              🏍️ En camino con el repartidor.
            </div>
          )}

          {isDelivered && (
            <div className="bg-green-50 text-green-800 text-xs p-2 rounded-lg text-center">
              🎉 Entregado exitosamente.
            </div>
          )}

          {isCancelled && (
            <div className="bg-red-50 text-red-800 text-xs p-2 rounded-lg text-center">
              ❌ Pedido cancelado.
            </div>
          )}
        </div>
      </div>

      {/* Chat */}
      <div className="flex-1 overflow-hidden">
        <OrderChat
          orderId={order.id}
          orderNumber={order.orderNumber}
          userType="VENDOR"
          userName={session?.user?.name || order.store.name}
        />
      </div>
    </div>
  )
}
