'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { notFound, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatPrice, formatDate, getOrderStatusLabel, getOrderStatusColor } from '@/lib/utils'
import { useOrderUpdates, useNotificationPermission, usePusherChannel, usePusherAvailable } from '@/hooks/use-pusher'
import { CHANNELS, EVENTS, ORDER_STATUS_NOTIFICATIONS } from '@/lib/pusher'
import { useActiveOrderStore, ActiveOrderStatus } from '@/stores/active-order-store'
import { AnimatedTrackingMap } from '@/components/store/animated-tracking-map'

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
  customerNotes: string | null
  subtotal: number
  deliveryFee: number
  actualDeliveryFee: number | null
  total: number
  deliveryPaymentStatus: string | null
  deliveryPaymentProof: string | null
  createdAt: string
  pickedUpAt: string | null
  items: OrderItem[]
  store: {
    name: string
    address: string
    whatsapp: string
    minDeliveryFee: number
    maxDeliveryFee: number
  }
  driver: {
    name: string
    phone: string
  } | null
}

// Timeline steps
const STATUS_STEPS = [
  { status: 'PENDING', label: 'Recibido', icon: '📝' },
  { status: 'CONFIRMED', label: 'Confirmado', icon: '✅' },
  { status: 'READY', label: 'Listo', icon: '🍽️' },
  { status: 'PICKED_UP', label: 'En camino', icon: '🏍️' },
  { status: 'DELIVERED', label: 'Entregado', icon: '🎉' },
]

function getStatusIndex(status: string): number {
  const index = STATUS_STEPS.findIndex(s => s.status === status)
  return index === -1 ? 0 : index
}

export default function OrderPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const router = useRouter()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [orderId, setOrderId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  
  // Hook para escuchar actualizaciones en tiempo real
  const { orderStatus, notification } = useOrderUpdates(orderId)
  
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const [toastType, setToastType] = useState<'success' | 'error'>('success')

  const triggerToast = useCallback((msg: string, type: 'success' | 'error' = 'success') => {
    setToastMessage(msg)
    setToastType(type)
    setTimeout(() => {
      setToastMessage(null)
    }, 4000)
  }, [])
  
  // Hook para permisos de notificación
  const { permission, requestPermission } = useNotificationPermission()
  const pusherAvailable = usePusherAvailable()
  
  // Store para el pedido activo
  const { activeOrder, updateStatus: updateActiveOrderStatus, clearActiveOrder } = useActiveOrderStore()

  // Obtener el orderId de los params
  useEffect(() => {
    params.then(({ id }) => setOrderId(id))
  }, [params])

  // Debounce fetchOrder to avoid duplicate requests from polling + Pusher
  const fetchInFlightRef = useRef(false)
  const fetchOrder = useCallback(async () => {
    if (!orderId || fetchInFlightRef.current) return
    fetchInFlightRef.current = true

    try {
      const response = await fetch(`/api/orders/${orderId}`)
      if (!response.ok) {
        if (response.status === 404) {
          setError('not_found')
        } else {
          setError('error')
        }
        return
      }
      const data = await response.json()
      setOrder(data)
    } catch (err) {
      console.error('Error fetching order:', err)
      setError('error')
    } finally {
      setLoading(false)
      fetchInFlightRef.current = false
    }
  }, [orderId])

  // Cargar el pedido inicial
  useEffect(() => {
    if (orderId) {
      fetchOrder()
    }
  }, [orderId, fetchOrder])

  // Actualizar cuando hay cambios en tiempo real (estado o valor de envío)
  useEffect(() => {
    if (orderStatus && order && orderStatus !== order.status) {
      // Refrescar los datos del pedido cuando cambia el estado
      fetchOrder()
    }
  }, [orderStatus, order, fetchOrder])
  
  // Sincronizar estado del pedido activo
  useEffect(() => {
    if (!order || !activeOrder) return
    
    // Solo actualizar si es el mismo pedido Y el estado realmente cambió
    if (activeOrder.id === order.id && activeOrder.status !== order.status) {
      const newStatus = order.status as ActiveOrderStatus
      
      // Si el pedido terminó, limpiar después de un momento
      if (newStatus === 'DELIVERED' || newStatus === 'CANCELLED') {
        // Actualizar estado primero
        updateActiveOrderStatus(newStatus)
        // Limpiar después de 5 segundos
        const timer = setTimeout(() => {
          clearActiveOrder()
        }, 5000)
        return () => clearTimeout(timer)
      } else {
        // Solo actualizar el estado si cambió
        updateActiveOrderStatus(newStatus)
      }
    }
  }, [order?.status, activeOrder?.id, activeOrder?.status, updateActiveOrderStatus, clearActiveOrder])
  
  // Escuchar el evento personalizado cuando se actualiza el delivery fee
  useEffect(() => {
    const handleDeliveryFeeUpdate = (event: CustomEvent) => {
        // Refrescar los datos del pedido inmediatamente
      fetchOrder()
    }
    
    window.addEventListener('order-delivery-fee-updated', handleDeliveryFeeUpdate as EventListener)
    
    return () => {
      window.removeEventListener('order-delivery-fee-updated', handleDeliveryFeeUpdate as EventListener)
    }
  }, [fetchOrder])
  
  // Escuchar actualizaciones de delivery fee directamente desde Pusher
  usePusherChannel(
    orderId ? CHANNELS.ORDER(orderId) : '',
    EVENTS.ORDER_UPDATED,
    (data: unknown) => {
      const orderData = data as { 
        actualDeliveryFee?: number | null
        deliveryPaymentStatus?: string | null
        status?: string
      }
      
      // Si se actualizó el valor del envío, refrescar inmediatamente
      if (orderData.actualDeliveryFee !== undefined && orderData.actualDeliveryFee !== null) {
        fetchOrder()
        return
      }
      
      // Si cambió el estado de pago de delivery, refrescar
      if (orderData.deliveryPaymentStatus !== undefined) {
        fetchOrder()
        return
      }
      
      // Si cambió el estado del pedido, también refrescar
      if (orderData.status && orderData.status !== order?.status) {
        fetchOrder()
      }
    },
    !!orderId
  )
  
  // Polling fallback: when Pusher is not configured, poll for all active states
  // When Pusher IS configured, only poll during PICKED_UP for delivery fee updates
  useEffect(() => {
    if (!orderId || !order) return
    const isFinished = order.status === 'DELIVERED' || order.status === 'CANCELLED'
    if (isFinished) return

    const needsDeliveryPolling = order.status === 'PICKED_UP' &&
      (!order.actualDeliveryFee || (order.actualDeliveryFee && !order.deliveryPaymentStatus))

    const shouldPoll = !pusherAvailable || needsDeliveryPolling

    if (shouldPoll) {
      const interval = setInterval(fetchOrder, pusherAvailable ? 5000 : 8000)
      return () => clearInterval(interval)
    }
  }, [orderId, order?.status, order?.actualDeliveryFee, order?.deliveryPaymentStatus, fetchOrder, pusherAvailable])

  // Manejar redirección pendiente de WhatsApp
  useEffect(() => {
    const pendingRedirect = sessionStorage.getItem('pendingOrderRedirect')
    if (pendingRedirect) {
      sessionStorage.removeItem('pendingOrderRedirect')
    }
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-orange-50 py-8">
        <div className="max-w-2xl mx-auto px-4">
          <div className="animate-pulse space-y-4">
            <div className="h-32 bg-gray-200 rounded-2xl" />
            <div className="h-64 bg-gray-200 rounded-2xl" />
            <div className="h-48 bg-gray-200 rounded-2xl" />
          </div>
        </div>
      </div>
    )
  }

  if (error === 'not_found' || !order) {
    notFound()
  }

  if (error === 'error') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 py-8">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <span className="text-6xl block mb-4">❌</span>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Error al cargar el pedido</h1>
          <p className="text-gray-600 mb-6">Hubo un problema al obtener los detalles de tu pedido.</p>
          <Button onClick={fetchOrder}>Reintentar</Button>
        </div>
      </div>
    )
  }

  const currentStatusIndex = getStatusIndex(order.status)
  const isCancelled = order.status === 'CANCELLED'
  const statusInfo = ORDER_STATUS_NOTIFICATIONS[order.status]

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-orange-50 py-4 md:py-8">
      <div className="max-w-2xl mx-auto px-3 md:px-4">
        {/* Floating Toast Notification */}
        {toastMessage && (
          <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 text-white text-body-md px-6 py-3 rounded-full shadow-[0px_4px_12px_rgba(0,0,0,0.15)] flex items-center gap-2 animate-[fadeIn_0.2s_ease-out] ${
            toastType === 'success' ? 'bg-green-600' : 'bg-red-600'
          }`}>
            <span className="material-symbols-outlined text-[20px]">
              {toastType === 'success' ? 'check_circle' : 'error'}
            </span>
            <span className="font-medium text-sm">{toastMessage}</span>
          </div>
        )}

        {/* Notificación en tiempo real */}
        {notification?.show && (
          <div className="fixed top-2 left-2 right-2 md:left-1/2 md:right-auto md:transform md:-translate-x-1/2 z-50 animate-bounce">
            <div className="bg-gradient-to-r from-green-600 to-orange-500 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2">
              <span className="text-2xl">{notification.icon}</span>
              <div>
                <p className="font-bold text-sm">{notification.title}</p>
                <p className="text-xs opacity-90">{notification.message}</p>
              </div>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="text-center mb-4 md:mb-8">
          <div className="inline-block mb-2">
            <div className="bg-white rounded-xl shadow-md p-2 md:p-4 inline-block">
              <span className="text-3xl md:text-5xl">{statusInfo?.icon || '📦'}</span>
            </div>
          </div>
          <h1 className="text-lg md:text-3xl font-extrabold text-gray-900 mb-1">
            {isCancelled ? 'Pedido cancelado' : statusInfo?.title || 'Estado del pedido'}
          </h1>
          <p className="text-sm md:text-base text-gray-600">
            Pedido <span className="font-bold text-green-600">#{order.orderNumber}</span> de {order.store.name}
          </p>

          {permission === 'default' && (
            <button
              onClick={requestPermission}
              className="mt-2 text-xs md:text-sm text-green-600 hover:text-green-700 underline"
            >
              🔔 Activar notificaciones
            </button>
          )}
        </div>

        {/* Panel de pago pendiente - mostrar si el pago no está verificado */}
        {order.status === 'PENDING' && order.paymentStatus !== 'VERIFIED' && (
          <Card className="mb-4 md:mb-6 border-2 border-orange-300 shadow-lg bg-gradient-to-br from-orange-50 to-yellow-50">
            <CardContent className="pt-4 md:pt-6">
              <div className="text-center">
                <span className="text-3xl md:text-5xl block mb-2 animate-bounce">💳</span>
                <h3 className="text-base md:text-xl font-bold text-gray-900 mb-1">
                  {order.paymentStatus === 'UPLOADED'
                    ? '¡Comprobante enviado!'
                    : '¡Completa tu pago!'}
                </h3>
                <p className="text-sm text-gray-600 mb-3">
                  {order.paymentStatus === 'UPLOADED'
                    ? 'Tu comprobante está siendo verificado.'
                    : 'Envía tu comprobante en el chat.'}
                </p>

                {order.paymentStatus === 'UPLOADED' ? (
                  <div className="bg-yellow-100 text-yellow-800 px-3 py-2 rounded-lg inline-flex items-center gap-2 text-sm">
                    <span className="animate-spin">⏳</span>
                    <span className="font-medium">Esperando verificación...</span>
                  </div>
                ) : (
                  <Link href={`/pedido/${order.id}/chat`}>
                    <Button className="bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white font-bold px-6 py-2 text-sm md:text-base shadow-lg">
                      💬 Ir al chat para pagar
                    </Button>
                  </Link>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Mapa de Seguimiento Animado */}
        {!isCancelled && (
          <div className="mb-4 md:mb-6">
            <AnimatedTrackingMap 
              status={order.status}
              pickedUpAt={order.pickedUpAt}
              storeName={order.store.name}
              customerAddress={order.customerAddress}
            />
          </div>
        )}

        {/* Timeline de estado */}
        {!isCancelled && (
          <Card className="mb-4 md:mb-6 border-2 border-green-100 shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-green-50 to-orange-50 px-3 py-2 md:p-4 border-b-2 border-green-100">
              <h2 className="font-bold text-sm md:text-base text-gray-900 flex items-center gap-2">
                📍 Seguimiento del pedido
              </h2>
            </div>
            <CardContent className="pt-4 md:pt-6 px-3 md:px-6">
              <div className="relative">
                <div className="absolute top-4 md:top-5 left-4 md:left-5 right-4 md:right-5 h-1 bg-gray-200 rounded-full" />
                <div
                  className="absolute top-4 md:top-5 left-4 md:left-5 h-1 bg-gradient-to-r from-green-500 to-orange-500 rounded-full transition-all duration-500"
                  style={{ width: `${(currentStatusIndex / (STATUS_STEPS.length - 1)) * 100}%`, maxWidth: 'calc(100% - 32px)' }}
                />
                <div className="relative flex justify-between">
                  {STATUS_STEPS.map((step, index) => {
                    const isCompleted = index <= currentStatusIndex
                    const isCurrent = index === currentStatusIndex
                    return (
                      <div key={step.status} className="flex flex-col items-center">
                        <div
                          className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center text-sm md:text-lg font-medium transition-all duration-300 ${
                            isCompleted
                              ? 'bg-gradient-to-r from-green-500 to-orange-500 text-white shadow-md'
                              : 'bg-gray-200 text-gray-400'
                          } ${isCurrent ? 'ring-2 md:ring-4 ring-green-200 scale-110' : ''}`}
                        >
                          {step.icon}
                        </div>
                        <span className={`text-[10px] md:text-xs mt-1 font-medium text-center leading-tight ${
                          isCompleted ? 'text-gray-900' : 'text-gray-400'
                        }`}>
                          {step.label}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
              <div className="mt-4 text-center bg-gray-50 rounded-lg p-2 md:p-4">
                <p className="text-sm text-gray-700">{statusInfo?.message}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Estado cancelado */}
        {isCancelled && (
          <Card className="mb-4 md:mb-6 border-2 border-red-200 shadow-lg">
            <CardContent className="pt-4 text-center">
              <span className="text-3xl block mb-2">❌</span>
              <p className="text-sm text-red-600 font-medium">Este pedido ha sido cancelado</p>
            </CardContent>
          </Card>
        )}

        {/* Detalles del pedido */}
        <Card className="mb-4 md:mb-6 border-2 border-green-100 shadow-lg">
          <CardContent className="pt-4 md:pt-6 px-3 md:px-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs md:text-sm text-gray-500">Estado actual</span>
              <Badge className={getOrderStatusColor(order.status)}>
                {getOrderStatusLabel(order.status)}
              </Badge>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Pedido #</span>
                <span className="font-medium">{order.orderNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Restaurante</span>
                <span className="font-medium">{order.store.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Fecha</span>
                <span className="font-medium">{formatDate(order.createdAt)}</span>
              </div>
              {order.driver && (
                <div className="flex justify-between items-center bg-green-50 -mx-3 md:-mx-6 px-3 md:px-6 py-2 rounded-lg">
                  <span className="text-gray-600 flex items-center gap-1">
                    🏍️ Repartidor
                  </span>
                  <div className="text-right">
                    <span className="font-medium block text-sm">{order.driver.name}</span>
                    <a href={`tel:${order.driver.phone}`} className="text-xs text-green-600 hover:underline">
                      {order.driver.phone}
                    </a>
                  </div>
                </div>
              )}
            </div>

            <div className="border-t mt-3 pt-3">
              <h3 className="font-medium text-sm mb-2 flex items-center gap-1">🛒 Productos</h3>
              <div className="space-y-1">
                {order.items.map((item) => (
                  <div key={item.id} className="flex justify-between text-xs md:text-sm bg-gray-50 p-2 rounded-lg">
                    <span>
                      <span className="font-medium">{item.quantity}x</span> {item.product.name}
                    </span>
                    <span className="font-medium ml-2 whitespace-nowrap">{formatPrice(item.totalPrice)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t mt-3 pt-3 space-y-2 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span>{formatPrice(order.subtotal)}</span>
              </div>
              {order.store.minDeliveryFee !== undefined && 
               order.store.maxDeliveryFee !== undefined &&
               order.store.maxDeliveryFee >= order.store.minDeliveryFee ? (
                order.actualDeliveryFee ? (
                  <div className="flex justify-between items-center bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                    <span className="text-gray-700 font-medium">🚚 Envío</span>
                    <span className="font-bold text-yellow-700">{formatPrice(order.actualDeliveryFee)}</span>
                  </div>
                ) : (
                  <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                    <p className="text-sm text-yellow-800">
                      🚚 El envío vale entre {formatPrice(order.store.minDeliveryFee)} y {formatPrice(order.store.maxDeliveryFee)} según la distancia
                    </p>
                    <p className="text-xs text-yellow-600 mt-1">
                      Prepara efectivo o transferencia para pagarle al repartidor
                    </p>
                  </div>
                )
              ) : (
                <div className="flex justify-between text-gray-600">
                  <span>🚚 Envío</span>
                  <span>{formatPrice(order.deliveryFee)}</span>
                </div>
              )}
              <div className="flex justify-between text-base md:text-xl font-extrabold pt-2 border-t bg-gradient-to-r from-green-50 to-orange-50 -mx-3 md:-mx-6 px-3 md:px-6 py-2 md:py-3 rounded-lg">
                <span>Total productos</span>
                <span className="text-green-600">{formatPrice(order.subtotal)}</span>
              </div>
              {order.actualDeliveryFee && (
                <div className="flex justify-between text-base md:text-xl font-extrabold pt-2 border-t bg-gradient-to-r from-yellow-50 to-orange-50 -mx-3 md:-mx-6 px-3 md:px-6 py-2 md:py-3 rounded-lg">
                  <span>Total con envío</span>
                  <span className="text-orange-600">{formatPrice(order.subtotal + order.actualDeliveryFee)}</span>
                </div>
              )}
            </div>

            <div className="border-t mt-4 pt-4">
              <h3 className="font-medium mb-2 flex items-center gap-2">📍 Dirección de entrega</h3>
              <p className="text-gray-600">{order.customerAddress}</p>
              {order.customerNotes && (
                <p className="text-sm text-gray-500 mt-1 bg-yellow-50 p-2 rounded-lg">
                  📝 Notas: {order.customerNotes}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Panel de pago del envío - se muestra cuando el repartidor ya registró el monto */}
        {order.status === 'PICKED_UP' && 
         order.actualDeliveryFee && 
         order.actualDeliveryFee > 0 &&
         !order.deliveryPaymentStatus && (
          <Card className="mb-4 md:mb-6 border-2 border-yellow-300 shadow-lg bg-gradient-to-br from-yellow-50 to-orange-50">
            <CardContent className="pt-4 md:pt-6 px-3 md:px-6">
              <div className="text-center mb-3">
                <span className="text-3xl block mb-1">💰</span>
                <h3 className="text-base md:text-xl font-bold text-gray-900 mb-1">
                  Pagar envío al repartidor
                </h3>
                <p className="text-sm md:text-lg font-extrabold text-yellow-700">
                  El viaje cuesta: {formatPrice(order.actualDeliveryFee)}
                </p>
                {order.store.minDeliveryFee !== undefined && order.store.maxDeliveryFee !== undefined && (
                  <p className="text-sm text-gray-600">
                    (Entre {formatPrice(order.store.minDeliveryFee)} y {formatPrice(order.store.maxDeliveryFee)})
                  </p>
                )}
              </div>

              <div className="space-y-3 mt-4">
                <p className="text-sm font-medium text-gray-700 text-center">
                  ¿Cómo pagarás?
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={async () => {
                      try {
                        await fetch(`/api/orders/${order.id}/delivery-payment`, {
                          method: 'PATCH',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            deliveryPaymentStatus: 'PAID_CASH',
                          }),
                        })
                        fetchOrder()
                        triggerToast('Pago en efectivo registrado. El repartidor lo validará al entregar.', 'success')
                      } catch (error) {
                        console.error('Error:', error)
                        triggerToast('Error al registrar el pago.', 'error')
                      }
                    }}
                    className="px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-medium transition-colors"
                  >
                    💵 Efectivo
                  </button>
                  <button
                    onClick={async () => {
                      // Abrir input para subir comprobante
                      const input = document.createElement('input')
                      input.type = 'file'
                      input.accept = 'image/*'
                      input.onchange = async (e) => {
                        const file = (e.target as HTMLInputElement).files?.[0]
                        if (!file) return

                        try {
                          const formData = new FormData()
                          formData.append('file', file)

                          const uploadRes = await fetch('/api/upload', {
                            method: 'POST',
                            body: formData,
                          })

                          if (!uploadRes.ok) throw new Error('Error al subir')

                          const { url } = await uploadRes.json()

                          await fetch(`/api/orders/${order.id}/delivery-payment`, {
                            method: 'PATCH',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              deliveryPaymentStatus: 'PAID_TRANSFER',
                              deliveryPaymentProof: url,
                            }),
                          })
                          fetchOrder()
                          triggerToast('Comprobante de transferencia subido correctamente.', 'success')
                        } catch (error) {
                          console.error('Error:', error)
                          triggerToast('Error al subir el comprobante de transferencia.', 'error')
                        }
                      }
                      input.click()
                    }}
                    className="px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors"
                  >
                    💳 Transferencia
                  </button>
                </div>
                <p className="text-xs text-center text-gray-500 mt-2">
                  El repartidor validará el pago antes de entregar
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Acciones */}
        <div className="text-center space-y-3">
          <p className="text-xs text-gray-500 bg-white p-2 rounded-lg shadow">
            {pusherAvailable
              ? '🔔 Se actualiza en tiempo real'
              : '🔄 Se actualiza automáticamente'}
          </p>
          <div className="flex gap-2 justify-center flex-wrap">
            {/* Botón al chat si el pago está pendiente o subido */}
            {order.status === 'PENDING' && order.paymentStatus !== 'VERIFIED' && (
              <Link href={`/pedido/${order.id}/chat`}>
                <Button className="bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600">
                  💬 Ir al chat
                </Button>
              </Link>
            )}
            {order.store.whatsapp && (
              <a
                href={`https://wa.me/${order.store.whatsapp.replace(/\D/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variant="secondary">
                  📱 WhatsApp tienda
                </Button>
              </a>
            )}
            <Link href="/">
              <Button variant="secondary">🏠 Volver al inicio</Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
