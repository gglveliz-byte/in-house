'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatPrice, formatDate, getOrderStatusLabel, getOrderStatusColor } from '@/lib/utils'
import { usePusherChannel } from '@/hooks/use-pusher'
import { CHANNELS, EVENTS } from '@/lib/pusher'
import type { Order, DeliveryPaymentStatus } from '@/types'

interface OrderWithStore extends Omit<Order, 'deliveryPaymentStatus' | 'deliveryPaymentProof' | 'actualDeliveryFee'> {
  store: {
    name: string
    address: string
    whatsapp: string
    minDeliveryFee: number
    maxDeliveryFee: number
  }
  actualDeliveryFee: number | null
  deliveryPaymentStatus: DeliveryPaymentStatus | null
  deliveryPaymentProof: string | null
}

export default function DriverActivePage() {
  const { data: session } = useSession()
  const [orders, setOrders] = useState<OrderWithStore[]>([])
  const [loading, setLoading] = useState(true)
  const [collectingDelivery, setCollectingDelivery] = useState<string | null>(null)
  const [deliveryFee, setDeliveryFee] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'TRANSFER' | null>(null)

  const fetchOrders = useCallback(async () => {
    if (!session?.user.id) return

    try {
      const response = await fetch(`/api/orders?driverId=${session.user.id}`)
      const json = await response.json()
      const data = json.data || json
      // Filtrar solo pedidos activos (no entregados ni cancelados)
      const activeOrders = data.filter(
        (o: Order) => o.status === 'PICKED_UP'
      )
      setOrders(activeOrders)
    } catch (error) {
      console.error('Error fetching orders:', error)
    } finally {
      setLoading(false)
    }
  }, [session?.user.id])

  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  // Escuchar actualizaciones de pedidos en tiempo real (cuando el cliente paga)
  usePusherChannel(
    session?.user.id ? CHANNELS.DRIVER : '',
    EVENTS.ORDER_UPDATED,
    (data: unknown) => {
      console.log('ORDER_UPDATED received in driver active:', data)
      // Refrescar la lista de pedidos cuando hay una actualización
      fetchOrders()
    },
    !!session?.user.id
  )

  // También escuchar cada pedido individualmente para actualizaciones de pago
  useEffect(() => {
    if (!orders.length) return
    
    // Este efecto se ejecuta cuando la lista de pedidos cambia
    // Los pedidos individuales escucharán sus propios canales
  }, [orders])

  const handleCollectDelivery = (order: OrderWithStore) => {
    setCollectingDelivery(order.id)
    setDeliveryFee('')
    setPaymentMethod(null)
  }

  const handleConfirmDeliveryFee = async (orderId: string) => {
    if (!deliveryFee) {
      alert('Por favor ingresa el valor del flete')
      return
    }

    const fee = parseFloat(deliveryFee)
    const order = orders.find(o => o.id === orderId)
    
    if (!order) return

    // Validar rango (solo si hay rango configurado)
    if (order.store.minDeliveryFee !== undefined && 
        order.store.maxDeliveryFee !== undefined &&
        order.store.minDeliveryFee >= 0 && 
        order.store.maxDeliveryFee >= 0 &&
        order.store.maxDeliveryFee >= order.store.minDeliveryFee) {
      if (fee < order.store.minDeliveryFee || fee > order.store.maxDeliveryFee) {
        alert(`El valor debe estar entre ${formatPrice(order.store.minDeliveryFee)} y ${formatPrice(order.store.maxDeliveryFee)}`)
        return
      }
    }

    try {
      // Solo registrar el valor del flete
      // El cliente será quien confirme el método de pago y suba el comprobante si es transferencia
      await fetch(`/api/orders/${orderId}/delivery-payment`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actualDeliveryFee: fee,
        }),
      })
      
      setCollectingDelivery(null)
      setDeliveryFee('')
      setPaymentMethod(null)
      fetchOrders()
      alert('✅ Valor del envío registrado. El cliente ahora puede confirmar el pago.')
    } catch (error) {
      console.error('Error setting delivery fee:', error)
      alert('Error al registrar el valor del envío')
    }
  }

  const handleConfirmDeliveryPayment = async (orderId: string) => {
    const order = orders.find(o => o.id === orderId)
    if (!order || !order.actualDeliveryFee) {
      alert('Primero debes registrar el valor del envío')
      return
    }

    // Verificar que el cliente haya pagado (si es transferencia, debe tener comprobante)
    if (order.deliveryPaymentStatus === 'PAID_TRANSFER' && !order.deliveryPaymentProof) {
      alert('Espera a que el cliente suba el comprobante de transferencia')
      return
    }

    try {
      // Marcar como entregado solo después de que el cliente confirme el pago
      await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'DELIVERED' }),
      })
      
      fetchOrders()
      alert('✅ Pedido marcado como entregado')
    } catch (error) {
      console.error('Error marking delivered:', error)
      alert('Error al marcar como entregado')
    }
  }

  const markDelivered = async (orderId: string) => {
    // Verificar si ya se cobró el envío (solo si hay rango configurado)
    const order = orders.find(o => o.id === orderId)
    if (order && 
        order.store.minDeliveryFee !== undefined && 
        order.store.maxDeliveryFee !== undefined &&
        order.store.minDeliveryFee >= 0 && 
        order.store.maxDeliveryFee >= 0 &&
        order.store.maxDeliveryFee >= order.store.minDeliveryFee) {
      if (!order.actualDeliveryFee || !order.deliveryPaymentStatus) {
        alert('Primero debes cobrar el envío usando el botón "💰 Cobrar envío"')
        return
      }
    }

    try {
      await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'DELIVERED' }),
      })
      fetchOrders()
    } catch (error) {
      console.error('Error marking delivered:', error)
    }
  }

  const openMaps = (order: OrderWithStore) => {
    const destination = order.customerLat && order.customerLng
      ? `${order.customerLat},${order.customerLng}`
      : encodeURIComponent(order.customerAddress)

    const url = `https://www.google.com/maps/dir/?api=1&destination=${destination}`
    window.open(url, '_blank')
  }

  const callCustomer = (phone: string) => {
    window.open(`tel:${phone}`, '_self')
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3" />
          <div className="h-48 bg-gray-200 rounded" />
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Entregas en Curso</h1>

      {orders.length === 0 ? (
        <Card className="text-center py-12">
          <span className="text-6xl block mb-4">🚗</span>
          <p className="text-gray-500 text-lg">No tienes entregas en curso</p>
          <p className="text-gray-400 text-sm mt-2">
            Acepta pedidos desde la pestaña "Disponibles"
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <Card key={order.id} className="border-l-4 border-l-orange-500">
              <CardHeader className="flex flex-row items-start justify-between">
                <div>
                  <h3 className="font-semibold">Pedido #{order.orderNumber}</h3>
                  <p className="text-sm text-gray-500">{order.store.name}</p>
                </div>
                <Badge className={getOrderStatusColor(order.status)}>
                  {getOrderStatusLabel(order.status)}
                </Badge>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Customer Info */}
                <div className="bg-orange-50 rounded-lg p-4">
                  <p className="font-medium text-lg">{order.customerName}</p>
                  <p className="text-gray-700">{order.customerAddress}</p>
                  {order.customerNotes && (
                    <p className="text-sm text-gray-600 mt-2 bg-white p-2 rounded">
                      📝 {order.customerNotes}
                    </p>
                  )}
                </div>

                {/* Order Summary */}
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Productos:</p>
                  {order.items.map((item) => (
                    <p key={item.id} className="text-sm text-gray-600">
                      {item.quantity}x {item.product.name}
                    </p>
                  ))}
                  <p className="font-semibold mt-2">
                    Total productos: {formatPrice(order.subtotal)}
                  </p>
                  
                  {/* Envío - mostrar siempre si hay rango configurado */}
                  {order.store.minDeliveryFee !== undefined && 
                   order.store.maxDeliveryFee !== undefined && 
                   order.store.minDeliveryFee >= 0 && 
                   order.store.maxDeliveryFee >= 0 &&
                   order.store.maxDeliveryFee >= order.store.minDeliveryFee && (
                    <div className="mt-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                      {order.actualDeliveryFee ? (
                        <div>
                          <p className="text-sm font-medium text-yellow-800">
                            Envío registrado: {formatPrice(order.actualDeliveryFee)}
                          </p>
                          {order.deliveryPaymentStatus ? (
                            <p className="text-xs text-green-600 mt-1">
                              ✅ Cliente confirmó pago: {order.deliveryPaymentStatus === 'PAID_CASH' ? '💰 Efectivo' : '💳 Transferencia'}
                            </p>
                          ) : (
                            <p className="text-xs text-yellow-600 mt-1">
                              ⏳ Esperando confirmación del cliente
                            </p>
                          )}
                        </div>
                      ) : (
                        <div>
                          <p className="text-sm font-medium text-yellow-800 mb-2">
                            Envío: {formatPrice(order.store.minDeliveryFee)} - {formatPrice(order.store.maxDeliveryFee)}
                          </p>
                          {!collectingDelivery || collectingDelivery !== order.id ? (
                            <Button
                              size="sm"
                              onClick={() => handleCollectDelivery(order)}
                              className="w-full bg-yellow-600 hover:bg-yellow-700"
                            >
                              💰 Cobrar envío
                            </Button>
                          ) : (
                            <div className="space-y-3 mt-2">
                              <div>
                                <label className="block text-xs font-medium text-yellow-800 mb-1">
                                  Ingresa el valor del flete
                                </label>
                                <input
                                  type="number"
                                  value={deliveryFee}
                                  onChange={(e) => setDeliveryFee(e.target.value)}
                                  placeholder={`Entre ${formatPrice(order.store.minDeliveryFee)} y ${formatPrice(order.store.maxDeliveryFee)}`}
                                  className="w-full px-3 py-2 border border-yellow-300 rounded-lg text-sm"
                                  min={order.store.minDeliveryFee}
                                  max={order.store.maxDeliveryFee}
                                  step="0.01"
                                />
                              </div>
                              
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  onClick={() => {
                                    setCollectingDelivery(null)
                                    setDeliveryFee('')
                                    setPaymentMethod(null)
                                  }}
                                  variant="secondary"
                                  className="flex-1"
                                >
                                  Cancelar
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() => handleConfirmDeliveryFee(order.id)}
                                  className="flex-1 bg-green-600 hover:bg-green-700"
                                  disabled={!deliveryFee}
                                >
                                  Registrar valor
                                </Button>
                              </div>
                              <p className="text-xs text-yellow-600 text-center mt-2">
                                El cliente confirmará el método de pago y subirá el comprobante si es transferencia
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="grid grid-cols-2 gap-2">
                  <Button onClick={() => openMaps(order)}>
                    📍 Navegar
                  </Button>
                  <Button variant="secondary" onClick={() => callCustomer(order.customerPhone)}>
                    📞 Llamar
                  </Button>
                </div>

                {/* Si hay rango de envío, mostrar estado del pago */}
                {order.store.minDeliveryFee !== undefined && 
                 order.store.maxDeliveryFee !== undefined &&
                 order.store.minDeliveryFee >= 0 && 
                 order.store.maxDeliveryFee >= 0 &&
                 order.store.maxDeliveryFee >= order.store.minDeliveryFee ? (
                  order.actualDeliveryFee ? (
                    order.deliveryPaymentStatus ? (
                      <Button
                        className="w-full"
                        variant="primary"
                        onClick={() => handleConfirmDeliveryPayment(order.id)}
                      >
                        ✓ Marcar como entregado
                      </Button>
                    ) : (
                      <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200 text-center">
                        <p className="text-sm font-medium text-yellow-800">
                          💰 Envío registrado: {formatPrice(order.actualDeliveryFee)}
                        </p>
                        <p className="text-xs text-yellow-600 mt-1">
                          Esperando que el cliente confirme el pago
                        </p>
                      </div>
                    )
                  ) : (
                    <p className="text-xs text-yellow-600 text-center p-2 bg-yellow-50 rounded-lg">
                      💰 Usa el botón "Cobrar envío" arriba para registrar el valor
                    </p>
                  )
                ) : (
                  <Button
                    className="w-full"
                    variant="primary"
                    onClick={() => markDelivered(order.id)}
                  >
                    ✓ Marcar como entregado
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
