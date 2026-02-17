'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { OrderChat } from '@/components/chat/order-chat'
import { usePusherChannel } from '@/hooks/use-pusher'
import { CHANNELS, EVENTS, ORDER_STATUS_NOTIFICATIONS } from '@/lib/pusher'
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
  subtotal: number
  deliveryFee: number
  total: number
  createdAt: string
  items: OrderItem[]
  store: {
    name: string
    whatsapp: string
    paymentMethods: string | null
    minDeliveryFee?: number
    maxDeliveryFee?: number
  }
  actualDeliveryFee?: number | null
}

export default function CustomerChatPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const router = useRouter()
  const [order, setOrder] = useState<Order | null>(null)
  const [orderId, setOrderId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [showOrderDetails, setShowOrderDetails] = useState(false)
  const [notification, setNotification] = useState<{
    show: boolean
    title: string
    message: string
    icon: string
  } | null>(null)

  // Obtener orderId de params
  useEffect(() => {
    params.then(({ id }) => setOrderId(id))
  }, [params])

  // Variable para evitar recargas múltiples y rastrear estado previo
  const reloadingRef = useRef(false)
  const previousStatusRef = useRef<string | null>(null)
  const previousPaymentStatusRef = useRef<string | null>(null)

  const fetchInFlightRef = useRef(false)
  const fetchOrder = useCallback(async () => {
    if (!orderId || reloadingRef.current || fetchInFlightRef.current) return
    fetchInFlightRef.current = true
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
      fetchInFlightRef.current = false
    }
  }, [orderId])

  // Efecto para detectar cambios de estado y redirigir (separado del fetch)
  useEffect(() => {
    if (!order || reloadingRef.current) return

    const currentStatus = order.status
    const currentPaymentStatus = order.paymentStatus
    const prevStatus = previousStatusRef.current
    const prevPaymentStatus = previousPaymentStatusRef.current

    // Actualizar refs para la próxima comparación
    previousStatusRef.current = currentStatus
    previousPaymentStatusRef.current = currentPaymentStatus

    // Solo verificar si hay un cambio real desde un estado previo conocido
    if (prevStatus === null) return // Primera carga, no hacer nada

    // Verificar si el estado realmente cambió
    const statusChanged = prevStatus !== currentStatus
    const paymentStatusChanged = prevPaymentStatus !== currentPaymentStatus

    // Redirigir si el pago fue verificado Y el estado cambió a CONFIRMED
    if (statusChanged && currentPaymentStatus === 'VERIFIED' && currentStatus === 'CONFIRMED') {
      console.log('Payment verified and order confirmed, redirecting...')
      reloadingRef.current = true
      router.push(`/pedido/${orderId}`)
      return
    }

    // Redirigir si el pedido fue cancelado
    if (statusChanged && currentStatus === 'CANCELLED') {
      console.log('Order cancelled, redirecting...')
      reloadingRef.current = true
      router.push(`/pedido/${orderId}`)
      return
    }
  }, [order, orderId, router])

  // Cargar pedido al inicio
  useEffect(() => {
    if (orderId) {
      fetchOrder()
    }
  }, [orderId, fetchOrder])

  // Función para redirigir a la página de pedido
  const handleRedirect = useCallback(() => {
    if (reloadingRef.current || !orderId) return
    reloadingRef.current = true
    router.push(`/pedido/${orderId}`)
  }, [orderId, router])

  // Escuchar actualizaciones del pedido
  usePusherChannel(
    orderId ? CHANNELS.ORDER(orderId) : '',
    EVENTS.ORDER_UPDATED,
    (data: unknown) => {
      if (reloadingRef.current) return // Evitar procesar si ya se está redirigiendo
      
      console.log('ORDER_UPDATED received:', data)
      const orderData = data as { status?: string; paymentStatus?: string }
      
      // Si el pago fue verificado Y el estado es CONFIRMED, redirigir
      if (orderData.status === 'CONFIRMED' && orderData.paymentStatus === 'VERIFIED') {
        console.log('Payment verified and order confirmed, redirecting...')
        setNotification({
          show: true,
          title: 'Pago verificado',
          message: 'Tu pago ha sido verificado. Tu pedido está siendo preparado.',
          icon: '✅',
        })
        setTimeout(handleRedirect, 1500)
        return
      }
      
      // Si el pedido fue cancelado, redirigir
      if (orderData.status === 'CANCELLED') {
        console.log('Order cancelled, redirecting...')
        setNotification({
          show: true,
          title: 'Pedido cancelado',
          message: 'Tu pedido ha sido cancelado por la tienda.',
          icon: '❌',
        })
        setTimeout(handleRedirect, 1500)
        return
      }
      
      // Solo actualizar datos si no se está redirigiendo
      if (!reloadingRef.current) {
        fetchOrder()
      }
      
      // Mostrar notificación si hay nuevo estado
      if (orderData.status) {
        const statusInfo = ORDER_STATUS_NOTIFICATIONS[orderData.status]
        if (statusInfo) {
          setNotification({
            show: true,
            ...statusInfo,
          })
          setTimeout(() => setNotification(null), 5000)
        }
      }
    },
    !!orderId
  )

  // Escuchar pago verificado - redirigir a página de pedido
  usePusherChannel(
    orderId ? CHANNELS.ORDER(orderId) : '',
    EVENTS.PAYMENT_VERIFIED,
    () => {
      if (reloadingRef.current) return
      console.log('PAYMENT_VERIFIED received, redirecting...')
      setNotification({
        show: true,
        title: 'Pago verificado',
        message: 'Tu pago ha sido verificado. Tu pedido está siendo preparado.',
        icon: '✅',
      })
      setTimeout(handleRedirect, 1500)
    },
    !!orderId
  )

  // Escuchar cancelación del pedido
  usePusherChannel(
    orderId ? CHANNELS.ORDER(orderId) : '',
    EVENTS.ORDER_CANCELLED,
    () => {
      if (reloadingRef.current) return
      console.log('ORDER_CANCELLED received, redirecting...')
      setNotification({
        show: true,
        title: 'Pedido cancelado',
        message: 'Tu pedido ha sido cancelado por la tienda.',
        icon: '❌',
      })
      setTimeout(handleRedirect, 1500)
    },
    !!orderId
  )

  // Callback cuando se sube una imagen desde el chat (comprobante)
  const handlePaymentUpload = async (imageUrl: string) => {
    if (!orderId) return
    try {
      // Actualizar el estado del pago
      await fetch(`/api/orders/${orderId}/payment`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentStatus: 'UPLOADED',
          paymentProof: imageUrl,
        }),
      })
      fetchOrder()
    } catch (error) {
      console.error('Error updating payment status:', error)
    }
  }

  // Redirigir automáticamente cuando el pedido esté completado o cancelado
  // IMPORTANTE: Este useEffect debe estar ANTES de los early returns
  useEffect(() => {
    if (!orderId || !order || reloadingRef.current) return
    
    const isReady = ['READY', 'PICKED_UP', 'DELIVERED'].includes(order.status)
    const isConfirmedAndPaid = order.status === 'CONFIRMED' && order.paymentStatus === 'VERIFIED'
    const isCompleted = isReady || isConfirmedAndPaid
    const isCancelled = order.status === 'CANCELLED'
    
    if (isCompleted || isCancelled) {
      console.log('Order completed or cancelled, redirecting to order page...')
      reloadingRef.current = true
      // Pequeño delay para mostrar notificación antes de redirigir
      const timer = setTimeout(() => {
        router.push(`/pedido/${orderId}`)
      }, 1500)
      return () => clearTimeout(timer)
    }
  }, [order, orderId, router])

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-pulse text-gray-500">Cargando...</div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <span className="text-6xl block mb-4">❌</span>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Pedido no encontrado</h1>
          <Link href="/">
            <Button>Volver al inicio</Button>
          </Link>
        </div>
      </div>
    )
  }

  // Estados finales
  const isReady = ['READY', 'PICKED_UP', 'DELIVERED'].includes(order.status)
  const isConfirmedAndPaid = order.status === 'CONFIRMED' && order.paymentStatus === 'VERIFIED'
  const isCompleted = isReady || isConfirmedAndPaid
  const isCancelled = order.status === 'CANCELLED'
  const paymentVerified = order.paymentStatus === 'VERIFIED'

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Notificación */}
      {notification?.show && (
        <div className="fixed top-2 left-2 right-2 z-50 animate-bounce">
          <div className="bg-gradient-to-r from-green-600 to-orange-500 text-white px-3 py-2 rounded-xl shadow-2xl flex items-center gap-2">
            <span className="text-xl">{notification.icon}</span>
            <div>
              <p className="font-bold text-xs">{notification.title}</p>
              <p className="text-[10px] opacity-90">{notification.message}</p>
            </div>
          </div>
        </div>
      )}

      {/* Si el pedido está confirmado con pago verificado o listo/entregado - redirigir */}
      {isCompleted && (
        <div className="h-full flex flex-col items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-lg p-4 max-w-sm w-full text-center">
            <span className="text-3xl block mb-2 animate-bounce">
              {order.status === 'DELIVERED' ? '🎉' : order.status === 'PICKED_UP' ? '🏍️' : order.status === 'READY' ? '✅' : '🎊'}
            </span>
            <h1 className="text-xl font-bold text-gray-900 mb-2">
              {order.status === 'DELIVERED'
                ? '¡Pedido entregado!'
                : order.status === 'PICKED_UP'
                ? 'Tu pedido va en camino'
                : order.status === 'READY'
                ? '¡Pedido listo!'
                : '¡Pago verificado!'}
            </h1>
            <p className="text-gray-600 mb-4 text-sm">
              Redirigiendo al estado de tu pedido...
            </p>
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
            </div>
          </div>
        </div>
      )}

      {/* Si el pedido está cancelado - redirigir */}
      {isCancelled && (
        <div className="h-full flex flex-col items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-lg p-4 max-w-sm w-full text-center">
            <span className="text-3xl block mb-2">❌</span>
            <h1 className="text-lg font-bold text-gray-900 mb-1">Pedido cancelado</h1>
            <p className="text-gray-600 mb-4">
              Redirigiendo...
            </p>
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
            </div>
          </div>
        </div>
      )}

      {/* Chat activo */}
      {!isCompleted && !isCancelled && (
        <>
          {/* Barra superior compacta para móvil */}
          <div className="bg-white border-b shadow-sm">
            <div className="flex items-center justify-between p-2">
              <button
                onClick={() => setShowOrderDetails(!showOrderDetails)}
                className="flex items-center gap-1 text-xs text-gray-600 hover:text-gray-900 px-2 py-1 bg-gray-100 rounded-full"
              >
                <span>📋</span>
                <span>#{order.orderNumber}</span>
                <span>{showOrderDetails ? '▲' : '▼'}</span>
              </button>
              
              {/* Estado del pago */}
              <span
                className={`text-xs px-2 py-1 rounded-full ${
                  paymentVerified
                    ? 'bg-green-100 text-green-800'
                    : order.paymentStatus === 'UPLOADED'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                {paymentVerified
                  ? '✅ Verificado'
                  : order.paymentStatus === 'UPLOADED'
                  ? '⏳ Verificando'
                  : '💳 Pendiente'}
              </span>
            </div>

            {/* Detalles del pedido expandible */}
            {showOrderDetails && (
              <div className="border-t p-3 bg-gray-50">
                <div className="max-h-40 overflow-y-auto">
                  <h4 className="font-medium text-xs text-gray-700 mb-2">
                    Pedido #{order.orderNumber}
                  </h4>
                  {order.items.map((item) => (
                    <div key={item.id} className="flex justify-between text-xs py-1">
                      <span className="truncate flex-1 mr-2">
                        {item.quantity}x {item.product.name}
                      </span>
                      <span className="flex-shrink-0">{formatPrice(item.totalPrice)}</span>
                    </div>
                  ))}
                  <div className="border-t mt-2 pt-2 text-xs">
                    <div className="flex justify-between">
                      <span>Subtotal</span>
                      <span>{formatPrice(order.subtotal)}</span>
                    </div>
                    {order.store.minDeliveryFee !== undefined && 
                     order.store.maxDeliveryFee !== undefined &&
                     order.store.maxDeliveryFee >= order.store.minDeliveryFee ? (
                      order.actualDeliveryFee ? (
                        <div className="flex justify-between">
                          <span>🚚 Envío</span>
                          <span className="font-bold text-yellow-700">{formatPrice(order.actualDeliveryFee)}</span>
                        </div>
                      ) : (
                        <div className="flex justify-between bg-yellow-50 p-2 rounded-lg">
                          <span>🚚 Envío aproximado</span>
                          <span className="text-yellow-700">{formatPrice(order.store.minDeliveryFee)} - {formatPrice(order.store.maxDeliveryFee)}</span>
                        </div>
                      )
                    ) : (
                      <div className="flex justify-between">
                        <span>🚚 Envío</span>
                        <span>{formatPrice(order.deliveryFee)}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold text-sm mt-1">
                      <span>Total</span>
                      <span className="text-green-600">{formatPrice(order.total)}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Chat */}
          <div className="flex-1 overflow-hidden">
            <OrderChat
              orderId={order.id}
              orderNumber={order.orderNumber}
              userType="CUSTOMER"
              userName={order.customerName}
              storeName={order.store.name}
              paymentMethods={paymentVerified ? undefined : order.store.paymentMethods}
              onPaymentUpload={handlePaymentUpload}
              disabled={paymentVerified}
              disabledMessage="Pago verificado - Tu pedido está siendo preparado"
            />
          </div>
        </>
      )}
    </div>
  )
}
