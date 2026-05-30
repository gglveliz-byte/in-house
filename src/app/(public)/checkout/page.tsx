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
import { formatPrice, generateWhatsAppLink } from '@/lib/utils'
import { useSession } from 'next-auth/react'
import { ConfettiCanvas } from '@/components/ui/confetti-canvas'

export default function CheckoutPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [showSuccessScreen, setShowSuccessScreen] = useState(false)
  const [createdOrderId, setCreatedOrderId] = useState<string | null>(null)
  const [storeInfo, setStoreInfo] = useState<{
    minDeliveryFee: number
    maxDeliveryFee: number
    zoneLatitude?: number
    zoneLongitude?: number
  } | null>(null)

  const { items, storeName, storeId, deliveryFee, getSubtotal, getTotal, clearCart, updateQuantity, removeItem, customerAddress, customerLat, customerLng, setDeliveryAddress } = useCartStore()
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

  const [storeNotes, setStoreNotes] = useState('')
  const [deliveryNotes, setDeliveryNotes] = useState('')

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted) {
      setFormData((prev) => ({
        ...prev,
        customerAddress: prev.customerAddress || customerAddress || '',
        customerLat: prev.customerLat !== null ? prev.customerLat : customerLat || null,
        customerLng: prev.customerLng !== null ? prev.customerLng : customerLng || null,
      }))
    }
  }, [mounted, customerAddress, customerLat, customerLng])

  useEffect(() => {
    if (session?.user && session.user.role === 'CUSTOMER') {
      setFormData((prev) => ({
        ...prev,
        customerName: prev.customerName || session.user.name || '',
        customerPhone: prev.customerPhone || (session.user as { phone?: string | null }).phone || '',
      }))
    }
  }, [session])

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {}

    if (!formData.customerName.trim()) {
      errors.customerName = 'El nombre es requerido'
    }

    const phone = formData.customerPhone.replace(/\D/g, '')
    if (!phone || phone.length < 7) {
      errors.customerPhone = 'Ingresa un teléfono válido (mínimo 7 dígitos)'
    }

    if (!formData.customerAddress.trim()) {
      errors.customerAddress = 'La dirección es requerida'
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitError(null)

    if (items.length === 0) {
      setSubmitError('Tu carrito está vacío')
      return
    }

    if (!validateForm()) return

    setLoading(true)

    const maxRetries = 2
    let lastError: Error | null = null

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        if (attempt > 0) {
          await new Promise(r => setTimeout(r, 1000 * attempt))
        }

        const response = await fetch('/api/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            storeId: storeId || items[0].product.storeId,
            customerName: formData.customerName.trim(),
            customerPhone: formData.customerPhone.trim(),
            customerAddress: formData.customerAddress.trim(),
            customerLat: formData.customerLat,
            customerLng: formData.customerLng,
            customerNotes: [
              storeNotes.trim() ? `🍳 Nota para el local: ${storeNotes.trim()}` : '',
              deliveryNotes.trim() ? `🛵 Instrucciones para el repartidor: ${deliveryNotes.trim()}` : ''
            ].filter(Boolean).join('\n'),
            items: items.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
            })),
          }),
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.error || 'Error al crear el pedido')
        }

        const order = await response.json()

        const productsSummary = items
          .map((item) => `• ${item.quantity}x ${item.product.name} - ${formatPrice(item.product.price * item.quantity)}`)
          .join('\n')

        const hasDeliveryRange = storeInfo &&
          storeInfo.minDeliveryFee !== undefined &&
          storeInfo.maxDeliveryFee !== undefined &&
          storeInfo.maxDeliveryFee >= storeInfo.minDeliveryFee

        const finalTotal = hasDeliveryRange ? getSubtotal() : getTotal()

        const totalMessage = `📋 *Mi pedido #${order.orderNumber}:*\n\n${productsSummary}\n\n💰 Total productos: ${formatPrice(finalTotal)}${hasDeliveryRange ? `\n🚚 Envío: Entre ${formatPrice(storeInfo.minDeliveryFee)} y ${formatPrice(storeInfo.maxDeliveryFee)} (se pagará al repartidor)` : ''}\n\n¡Hola! Soy ${formData.customerName}. ¿Podrían confirmar disponibilidad y forma de pago?`

        await fetch(`/api/orders/${order.id}/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: totalMessage,
            senderType: 'CUSTOMER',
            senderName: formData.customerName,
          }),
        })

        setActiveOrder({
          id: order.id,
          orderNumber: order.orderNumber,
          status: 'PENDING',
          storeName: storeName || 'Tienda',
          total: order.total,
          createdAt: order.createdAt,
        })

        // Generar enlace de WhatsApp para confirmación e inicio del chat con la tienda
        const storeWhatsapp = order.store?.whatsapp || ''
        const trackingLink = `${window.location.origin}/pedido/${order.id}`
        const whatsappMessage = `${totalMessage}\n\n📍 *Sigue tu pedido en vivo aquí:* ${trackingLink}`
        
        const waLink = generateWhatsAppLink(storeWhatsapp, whatsappMessage)
        if (waLink) {
          window.open(waLink, '_blank')
        }

        // Guardar ID y mostrar pantalla de éxito con confetti
        setCreatedOrderId(order.id)
        setShowSuccessScreen(true)
        setLoading(false)

        clearCart()

        // Temporizador de 2.2 segundos para mostrar el confetti premium antes de redireccionar
        setTimeout(() => {
          router.push(`/pedido/${order.id}/chat`)
        }, 2200)

        return
      } catch (error) {
        lastError = error as Error
        if (attempt < maxRetries) continue
      }
    }

    console.error('Error submitting order after retries:', lastError)
    setSubmitError(lastError?.message || 'Hubo un error al procesar tu pedido. Por favor intenta de nuevo.')
    setLoading(false)
  }

  if (!mounted) {
    return (
      <div className="min-h-screen bg-surface py-4 md:py-8 max-w-5xl mx-auto px-3 md:px-4">
        {/* Mock Header */}
        <div className="text-center mb-4 md:mb-8 space-y-3">
          <div className="w-16 h-16 rounded-xl bg-gray-200 mx-auto animate-shimmer" />
          <div className="h-8 bg-gray-200 rounded-lg w-1/4 mx-auto animate-shimmer" />
          <div className="h-4 bg-gray-200 rounded-lg w-1/6 mx-auto animate-shimmer" />
        </div>
        
        {/* Mock Columns */}
        <div className="grid md:grid-cols-2 gap-4 md:gap-8">
          {/* Mock Cart Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 md:p-6 space-y-6">
            <div className="h-6 bg-gray-200 rounded w-1/3 animate-shimmer" />
            <div className="space-y-4">
              {[1, 2].map((i) => (
                <div key={i} className="flex gap-4 p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-2/3 animate-shimmer" />
                    <div className="h-3 bg-gray-200 rounded w-1/3 animate-shimmer" />
                  </div>
                  <div className="w-16 h-6 bg-gray-200 rounded animate-shimmer" />
                </div>
              ))}
            </div>
            <div className="border-t border-gray-200 pt-4 space-y-3">
              <div className="flex justify-between">
                <div className="h-4 bg-gray-200 rounded w-1/5 animate-shimmer" />
                <div className="h-4 bg-gray-200 rounded w-1/6 animate-shimmer" />
              </div>
              <div className="flex justify-between">
                <div className="h-4 bg-gray-200 rounded w-1/4 animate-shimmer" />
                <div className="h-4 bg-gray-200 rounded w-1/6 animate-shimmer" />
              </div>
              <div className="h-10 bg-gray-200/50 rounded-lg w-full animate-shimmer mt-2" />
            </div>
          </div>

          {/* Mock Form Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 md:p-6 space-y-5">
            <div className="h-6 bg-gray-200 rounded w-1/3 animate-shimmer" />
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="space-y-2">
                  <div className="h-3 bg-gray-200 rounded w-1/4 animate-shimmer" />
                  <div className="h-10 bg-gray-100 border border-gray-200 rounded-lg w-full animate-shimmer" />
                </div>
              ))}
              <div className="h-12 bg-gray-200 rounded-xl w-full animate-shimmer mt-6" />
            </div>
          </div>
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
    <div className="min-h-screen bg-surface py-4 md:py-8 relative">
      {showSuccessScreen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-[9998] p-4 animate-page-entrance">
          <ConfettiCanvas />
          <div className="bg-white rounded-3xl p-8 md:p-12 max-w-md w-full shadow-2xl text-center space-y-6 border border-gray-100 relative z-[9999]">
            {/* SVG Checked Circle Drawer Badge */}
            <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto text-green-500 shadow-inner">
              <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path className="animate-checkmark-draw" strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            
            <div className="space-y-2">
              <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 tracking-tight">
                ¡Pedido Realizado!
              </h2>
              <p className="text-gray-600 text-sm md:text-base">
                Tu orden se ha generado correctamente.
              </p>
            </div>

            <div className="bg-green-50 border border-green-100 rounded-xl p-4 space-y-1 text-left">
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">ESTADO DE OPERACIÓN</p>
              <p className="text-xs md:text-sm font-semibold text-green-800 flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-ping"></span>
                Abriendo WhatsApp para confirmar pedido...
              </p>
            </div>

            <div className="text-xs text-gray-400">
              Cargando panel de seguimiento...
            </div>
          </div>
        </div>
      )}

      <div className="max-w-5xl mx-auto px-3 md:px-4">
        {/* Header */}
        <div className="text-center mb-4 md:mb-8">
          <div className="inline-block mb-2">
            <div className="bg-white rounded-xl shadow-md p-2 md:p-4 inline-block text-primary">
              <span className="text-3xl md:text-5xl">🛒</span>
            </div>
          </div>
          <h1 className="text-xl md:text-4xl font-extrabold text-gray-900 mb-1 tracking-tight">
            Finalizar pedido
          </h1>
          <p className="text-sm md:text-lg text-gray-600">
            Pedido de <span className="font-bold text-primary">{storeName}</span>
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-4 md:gap-8">
          {/* Cart Items */}
          <Card className="border-2 border-primary/10 shadow-lg">
          <CardHeader className="bg-surface-container-low border-b-2 border-primary/10 py-2 md:py-4">
            <h2 className="font-bold text-sm md:text-xl text-gray-900 flex items-center gap-2">
              🛒 Tu pedido
            </h2>
          </CardHeader>
          <CardContent className="space-y-3 p-3 md:p-6">
            {items.map((item) => (
              <div key={item.productId} className="flex items-center gap-2 md:gap-4 p-2 md:p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm text-gray-900 truncate">{item.product.name}</p>
                  <p className="text-xs text-gray-600">
                    {formatPrice(item.product.price)} c/u
                  </p>
                </div>
                <div className="flex items-center gap-1 bg-white rounded-full p-0.5 border border-gray-200">
                  <button
                    type="button"
                    onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                    aria-label={`Reducir cantidad de ${item.product.name}`}
                    className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center font-bold text-xs text-gray-700"
                  >
                    −
                  </button>
                  <span className="w-7 text-center font-bold text-sm text-gray-900">{item.quantity}</span>
                  <button
                    type="button"
                    onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                    aria-label={`Aumentar cantidad de ${item.product.name}`}
                    className="w-7 h-7 rounded-full bg-primary/10 hover:bg-primary/20 flex items-center justify-center font-bold text-xs text-primary"
                  >
                    +
                  </button>
                </div>
                <div className="text-right min-w-[70px] md:min-w-[100px]">
                  <p className="font-bold text-sm text-gray-900">
                    {formatPrice(item.product.price * item.quantity)}
                  </p>
                  <button
                    type="button"
                    onClick={() => removeItem(item.productId)}
                    className="text-[10px] text-red-600 hover:text-red-700 font-medium hover:underline"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            ))}

            <div className="border-t-2 border-gray-200 pt-3 space-y-2 mt-4 text-sm">
              <div className="flex justify-between text-gray-700">
                <span className="font-medium">Subtotal</span>
                <span className="font-semibold">{formatPrice(getSubtotal())}</span>
              </div>
              {storeInfo && storeInfo.minDeliveryFee !== undefined && storeInfo.maxDeliveryFee !== undefined && storeInfo.maxDeliveryFee >= storeInfo.minDeliveryFee ? (
                <div className="flex justify-between items-center text-gray-700 bg-yellow-50 p-2 rounded-lg border border-yellow-200">
                  <div>
                    <span className="font-medium text-xs block">🚚 Envío aprox.</span>
                    <span className="text-[10px] text-gray-600 block">
                      Según distancia
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="font-semibold text-yellow-700 text-xs">
                      {formatPrice(storeInfo.minDeliveryFee)} - {formatPrice(storeInfo.maxDeliveryFee)}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="flex justify-between text-gray-700">
                  <span className="font-medium">🚚 Envío</span>
                  <span className="font-semibold">{formatPrice(deliveryFee || 0)}</span>
                </div>
              )}
              <div className="flex justify-between text-base md:text-2xl font-extrabold pt-2 border-t-2 border-primary/20 bg-primary/5 -mx-3 md:-mx-6 px-3 md:px-6 py-2 md:py-3 rounded-lg">
                <span className="text-gray-900">Total</span>
                <span className="text-primary">{formatPrice(getSubtotal())}</span>
              </div>
              {storeInfo && storeInfo.minDeliveryFee !== undefined && storeInfo.maxDeliveryFee !== undefined && storeInfo.maxDeliveryFee >= storeInfo.minDeliveryFee && (
                <div className="text-[10px] md:text-xs text-yellow-700 bg-yellow-50 p-2 rounded-lg -mx-3 md:-mx-6 px-3 md:px-6">
                  ⚠️ El envío se paga al repartidor al entregar
                </div>
              )}
            </div>
          </CardContent>
          </Card>

          {/* Customer Form */}
          <Card className="border-2 border-gray-100 shadow-lg">
          <CardHeader className="bg-surface-container-low border-b-2 border-gray-100 py-2 md:py-4">
            <h2 className="font-bold text-sm md:text-xl text-gray-900 flex items-center gap-2">
              👤 Tus datos
            </h2>
          </CardHeader>
          <CardContent className="p-3 md:p-6">
            <form onSubmit={handleSubmit} className="space-y-3 md:space-y-5">
              {submitError && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
                  <span className="text-xl flex-shrink-0">⚠️</span>
                  <div>
                    <p className="text-sm font-medium text-red-800">{submitError}</p>
                    <button
                      type="button"
                      onClick={() => setSubmitError(null)}
                      className="text-xs text-red-600 underline mt-1"
                    >
                      Cerrar
                    </button>
                  </div>
                </div>
              )}

              <div>
                <Input
                  label="Nombre completo"
                  id="customerName"
                  required
                  value={formData.customerName}
                  onChange={(e) => {
                    setFormData((prev) => ({ ...prev, customerName: e.target.value }))
                    if (formErrors.customerName) setFormErrors(prev => ({ ...prev, customerName: '' }))
                  }}
                  placeholder="Tu nombre"
                />
                {formErrors.customerName && (
                  <p className="text-xs text-red-600 mt-1">{formErrors.customerName}</p>
                )}
              </div>

              <div>
                <Input
                  label="Teléfono"
                  id="customerPhone"
                  type="tel"
                  required
                  value={formData.customerPhone}
                  onChange={(e) => {
                    setFormData((prev) => ({ ...prev, customerPhone: e.target.value }))
                    if (formErrors.customerPhone) setFormErrors(prev => ({ ...prev, customerPhone: '' }))
                  }}
                  placeholder="52 123 456 7890"
                />
                {formErrors.customerPhone && (
                  <p className="text-xs text-red-600 mt-1">{formErrors.customerPhone}</p>
                )}
              </div>

              <div>
                <LocationPicker
                  label="Dirección de entrega"
                  address={formData.customerAddress}
                  latitude={formData.customerLat}
                  longitude={formData.customerLng}
                  defaultLatitude={storeInfo?.zoneLatitude}
                  defaultLongitude={storeInfo?.zoneLongitude}
                  onAddressChange={(address) => {
                    setFormData((prev) => ({ ...prev, customerAddress: address }))
                    setDeliveryAddress(address, formData.customerLat, formData.customerLng)
                    if (formErrors.customerAddress) setFormErrors(prev => ({ ...prev, customerAddress: '' }))
                  }}
                  onLocationChange={(lat, lng, address) => {
                    setFormData((prev) => ({
                      ...prev,
                      customerLat: lat,
                      customerLng: lng,
                      customerAddress: address,
                    }))
                    setDeliveryAddress(address, lat, lng)
                    if (formErrors.customerAddress) setFormErrors(prev => ({ ...prev, customerAddress: '' }))
                  }}
                  required
                />
                {formErrors.customerAddress && (
                  <p className="text-xs text-red-600 mt-1">{formErrors.customerAddress}</p>
                )}
              </div>

              <div>
                <label
                  htmlFor="storeNotes"
                  className="block text-sm font-medium text-primary font-bold flex items-center gap-1 mb-1"
                >
                  <span className="material-symbols-outlined text-[18px]">restaurant</span>
                  Nota o mensaje para el local / cocina (opcional)
                </label>
                <textarea
                  id="storeNotes"
                  rows={2}
                  className="w-full rounded-2xl border border-outline-variant bg-surface-container-lowest px-4 py-3 font-body-md text-body-md text-on-surface outline-none focus:border-primary focus:ring-1 focus:ring-primary transition resize-none"
                  value={storeNotes}
                  onChange={(e) => setStoreNotes(e.target.value)}
                  placeholder="Ej. sin cebolla, aderezo aparte, bien cocido, sin picante"
                />
              </div>

              <div className="mt-3">
                <label
                  htmlFor="deliveryNotes"
                  className="block text-sm font-medium text-gray-700 flex items-center gap-1 mb-1"
                >
                  <span className="material-symbols-outlined text-[18px]">two_wheeler</span>
                  Instrucciones para el repartidor (opcional)
                </label>
                <textarea
                  id="deliveryNotes"
                  rows={2}
                  className="w-full rounded-2xl border border-outline-variant bg-surface-container-lowest px-4 py-3 font-body-md text-body-md text-on-surface outline-none focus:border-primary focus:ring-1 focus:ring-primary transition resize-none"
                  value={deliveryNotes}
                  onChange={(e) => setDeliveryNotes(e.target.value)}
                  placeholder="Ej. portón negro, timbre dañado, dejar en recepción"
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3 text-sm md:text-lg rounded-xl shadow-lg"
                size="lg"
                loading={loading}
                disabled={loading}
              >
                💬 Realizar pedido
              </Button>

              <p className="text-[10px] md:text-xs text-gray-500 text-center bg-gray-50 p-2 rounded-lg border border-gray-200">
                Se abrirá un chat con la tienda para coordinar pago y entrega.
              </p>
            </form>
          </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
