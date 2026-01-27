'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { LocationPicker } from '@/components/ui/location-picker'
import { useCartStore } from '@/stores/cart-store'
import { useActiveOrderStore } from '@/stores/active-order-store'
import { formatPrice } from '@/lib/utils'

export default function CheckoutPage() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [storeInfo, setStoreInfo] = useState<{ 
    minDeliveryFee: number
    maxDeliveryFee: number
    zoneLatitude?: number
    zoneLongitude?: number
  } | null>(null)

  const { items, storeName, storeId, deliveryFee, getSubtotal, getTotal, clearCart, updateQuantity, removeItem } = useCartStore()
  const { activeOrder, isOrderInProgress, setActiveOrder } = useActiveOrderStore()

  // Obtener información de la tienda para el rango de envío y ubicación de la zona
  useEffect(() => {
    if (storeId && mounted) {
      fetch(`/api/stores/${storeId}`)
        .then(res => res.json())
        .then(data => {
          // Siempre establecer los valores, incluso si son 0 o null
          setStoreInfo({ 
            minDeliveryFee: data.minDeliveryFee ?? 0, 
            maxDeliveryFee: data.maxDeliveryFee ?? 0,
            // Usar ubicación de la zona si existe, sino de la tienda
            zoneLatitude: data.zone?.latitude || data.latitude,
            zoneLongitude: data.zone?.longitude || data.longitude,
          })
        })
        .catch(err => console.error('Error fetching store info:', err))
    }
  }, [storeId, mounted])

  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    customerAddress: '',
    customerNotes: '',
    customerLat: null as number | null,
    customerLng: null as number | null,
  })

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (items.length === 0) {
      alert('Tu carrito está vacío')
      return
    }

    setLoading(true)

    try {
      // Crear el pedido en la base de datos
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeId: storeId || items[0].product.storeId,
          customerName: formData.customerName,
          customerPhone: formData.customerPhone,
          customerAddress: formData.customerAddress,
          customerLat: formData.customerLat,
          customerLng: formData.customerLng,
          customerNotes: formData.customerNotes,
          items: items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
          })),
        }),
      })

      if (!response.ok) {
        throw new Error('Error al crear el pedido')
      }

      const order = await response.json()

      // Crear resumen de productos para el mensaje
      const productsSummary = items
        .map((item) => `• ${item.quantity}x ${item.product.name} - ${formatPrice(item.product.price * item.quantity)}`)
        .join('\n')
      
      // Si hay rango de envío configurado, solo mostrar subtotal; si no, mostrar total con envío
      const hasDeliveryRange = storeInfo && 
        storeInfo.minDeliveryFee !== undefined && 
        storeInfo.maxDeliveryFee !== undefined && 
        storeInfo.maxDeliveryFee >= storeInfo.minDeliveryFee
      
      const finalTotal = hasDeliveryRange ? getSubtotal() : getTotal()
      
      const totalMessage = `📋 *Mi pedido #${order.orderNumber}:*\n\n${productsSummary}\n\n💰 Total productos: ${formatPrice(finalTotal)}${hasDeliveryRange ? `\n🚚 Envío: Entre ${formatPrice(storeInfo.minDeliveryFee)} y ${formatPrice(storeInfo.maxDeliveryFee)} (se pagará al repartidor)` : ''}\n\n¡Hola! Soy ${formData.customerName}. ¿Podrían confirmar disponibilidad y forma de pago?`

      // Enviar mensaje inicial con detalle del pedido al chat
      await fetch(`/api/orders/${order.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: totalMessage,
          senderType: 'CUSTOMER',
          senderName: formData.customerName,
        }),
      })
      
      // Guardar como pedido activo
      setActiveOrder({
        id: order.id,
        orderNumber: order.orderNumber,
        status: 'PENDING',
        storeName: storeName || 'Tienda',
        total: order.total,
        createdAt: order.createdAt,
      })
      
      // Limpiar carrito
      clearCart()
      
      // Redirigir al chat del pedido
      router.push(`/pedido/${order.id}/chat`)
    } catch (error) {
      console.error('Error submitting order:', error)
      alert('Hubo un error al procesar tu pedido. Por favor intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  if (!mounted) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3" />
          <div className="h-64 bg-gray-200 rounded" />
        </div>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <span className="text-6xl block mb-4">🛒</span>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Tu carrito está vacío</h1>
        <p className="text-gray-600 mb-6">Agrega productos para continuar con tu pedido</p>
        <Button onClick={() => router.push('/')}>Ver restaurantes</Button>
      </div>
    )
  }

  // Bloquear si hay pedido activo en progreso
  if (isOrderInProgress() && activeOrder) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-yellow-50 py-8">
        <div className="max-w-md mx-auto px-4">
          <Card className="border-2 border-orange-300 shadow-xl">
            <CardContent className="pt-8 text-center">
              <span className="text-6xl block mb-4 animate-bounce">🛵</span>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Ya tienes un pedido activo
              </h1>
              <p className="text-gray-600 mb-6">
                Debes esperar a que tu pedido actual sea entregado antes de hacer otro.
              </p>
              
              <div className="bg-gradient-to-r from-orange-100 to-yellow-100 rounded-xl p-4 mb-6 border border-orange-200">
                <p className="text-sm text-gray-600">Pedido #{activeOrder.orderNumber}</p>
                <p className="font-bold text-lg text-orange-600">{activeOrder.storeName}</p>
                <p className="text-xl font-extrabold text-gray-900 mt-1">
                  {formatPrice(activeOrder.total)}
                </p>
              </div>

              <div className="space-y-3">
                <Link href={`/pedido/${activeOrder.id}`}>
                  <Button className="w-full bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600">
                    📦 Ver mi pedido actual
                  </Button>
                </Link>
                <Link href="/">
                  <Button variant="secondary" className="w-full">
                    🏠 Volver al inicio
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-orange-50 py-8">
      <div className="max-w-5xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-block mb-4">
            <div className="bg-white rounded-2xl shadow-lg p-4 inline-block">
              <span className="text-5xl">🛒</span>
            </div>
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-2 bg-gradient-to-r from-green-600 to-orange-500 bg-clip-text text-transparent">
            Finalizar pedido
          </h1>
          <p className="text-lg text-gray-600">
            Pedido de <span className="font-bold text-green-600">{storeName}</span>
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 md:gap-8">
          {/* Cart Items */}
          <Card className="border-2 border-green-100 shadow-xl">
          <CardHeader className="bg-gradient-to-r from-green-50 to-orange-50 border-b-2 border-green-100">
            <h2 className="font-bold text-xl text-gray-900 flex items-center gap-2">
              🛒 Tu pedido
            </h2>
          </CardHeader>
          <CardContent className="space-y-4 p-6">
            {items.map((item) => (
              <div key={item.productId} className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                <div className="flex-1">
                  <p className="font-bold text-gray-900">{item.product.name}</p>
                  <p className="text-sm text-gray-600 mt-1">
                    {formatPrice(item.product.price)} c/u
                  </p>
                </div>
                <div className="flex items-center gap-2 bg-white rounded-full p-1 border-2 border-gray-200">
                  <button
                    type="button"
                    onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                    className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center font-bold text-gray-700 transition-colors"
                  >
                    −
                  </button>
                  <span className="w-10 text-center font-bold text-gray-900">{item.quantity}</span>
                  <button
                    type="button"
                    onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                    className="w-8 h-8 rounded-full bg-green-100 hover:bg-green-200 flex items-center justify-center font-bold text-green-700 transition-colors"
                  >
                    +
                  </button>
                </div>
                <div className="text-right min-w-[100px]">
                  <p className="font-bold text-lg text-gray-900">
                    {formatPrice(item.product.price * item.quantity)}
                  </p>
                  <button
                    type="button"
                    onClick={() => removeItem(item.productId)}
                    className="text-xs text-red-600 hover:text-red-700 font-medium hover:underline mt-1"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            ))}

            <div className="border-t-2 border-gray-200 pt-4 space-y-3 mt-6">
              <div className="flex justify-between text-gray-700">
                <span className="font-medium">Subtotal</span>
                <span className="font-semibold">{formatPrice(getSubtotal())}</span>
              </div>
              {storeInfo && storeInfo.minDeliveryFee !== undefined && storeInfo.maxDeliveryFee !== undefined && storeInfo.maxDeliveryFee >= storeInfo.minDeliveryFee ? (
                <div className="flex justify-between items-center text-gray-700 bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                  <div>
                    <span className="font-medium block">🚚 Envío aproximado</span>
                    <span className="text-xs text-gray-600 mt-1 block">
                      Según la distancia de tu casa al lugar del pedido
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="font-semibold text-yellow-700">
                      {formatPrice(storeInfo.minDeliveryFee)} - {formatPrice(storeInfo.maxDeliveryFee)}
                    </span>
                    <p className="text-xs text-gray-600 mt-1">
                      Prepara efectivo o transferencia
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex justify-between text-gray-700">
                  <span className="font-medium">🚚 Envío</span>
                  <span className="font-semibold">{formatPrice(deliveryFee || 0)}</span>
                </div>
              )}
              <div className="flex justify-between text-2xl font-extrabold pt-3 border-t-2 border-green-200 bg-gradient-to-r from-green-50 to-orange-50 -mx-6 px-6 py-3 rounded-lg">
                <span className="text-gray-900">Total productos</span>
                <span className="text-green-600">{formatPrice(getSubtotal())}</span>
              </div>
              {storeInfo && storeInfo.minDeliveryFee !== undefined && storeInfo.maxDeliveryFee !== undefined && storeInfo.maxDeliveryFee >= storeInfo.minDeliveryFee && (
                <div className="text-xs text-yellow-700 bg-yellow-50 p-2 rounded-lg -mx-6 px-6">
                  ⚠️ El envío se pagará al repartidor al momento de la entrega
                </div>
              )}
            </div>
          </CardContent>
          </Card>

          {/* Customer Form */}
          <Card className="border-2 border-orange-100 shadow-xl">
          <CardHeader className="bg-gradient-to-r from-orange-50 to-green-50 border-b-2 border-orange-100">
            <h2 className="font-bold text-xl text-gray-900 flex items-center gap-2">
              👤 Tus datos
            </h2>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-5">
              <Input
                label="Nombre completo"
                id="customerName"
                required
                value={formData.customerName}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, customerName: e.target.value }))
                }
                placeholder="Tu nombre"
              />

              <Input
                label="Teléfono"
                id="customerPhone"
                type="tel"
                required
                value={formData.customerPhone}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, customerPhone: e.target.value }))
                }
                placeholder="52 123 456 7890"
              />

              <LocationPicker
                label="Dirección de entrega"
                address={formData.customerAddress}
                latitude={formData.customerLat}
                longitude={formData.customerLng}
                defaultLatitude={storeInfo?.zoneLatitude}
                defaultLongitude={storeInfo?.zoneLongitude}
                onAddressChange={(address) =>
                  setFormData((prev) => ({ ...prev, customerAddress: address }))
                }
                onLocationChange={(lat, lng, address) =>
                  setFormData((prev) => ({
                    ...prev,
                    customerLat: lat,
                    customerLng: lng,
                    customerAddress: address,
                  }))
                }
                required
              />

              <div>
                <label
                  htmlFor="customerNotes"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Notas adicionales (opcional)
                </label>
                <textarea
                  id="customerNotes"
                  rows={3}
                  className="input"
                  value={formData.customerNotes}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, customerNotes: e.target.value }))
                  }
                  placeholder="Instrucciones especiales, referencias, etc."
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-green-600 to-orange-500 hover:from-green-700 hover:to-orange-600 text-white font-bold py-4 text-lg rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]"
                size="lg"
                loading={loading}
                disabled={loading}
              >
                💬 Realizar pedido
              </Button>

              <p className="text-xs text-gray-500 text-center bg-gray-50 p-3 rounded-lg border border-gray-200">
                Al hacer tu pedido, se abrirá un chat directo con la tienda para coordinar
                el pago y la entrega de forma rápida y segura.
              </p>
            </form>
          </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
