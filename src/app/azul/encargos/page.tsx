'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useCartStore } from '@/stores/cart-store'

const ERAND_CATEGORIES = [
  { id: 'medicina', label: 'Medicina / Farmacia', icon: 'medical_services', color: 'text-emerald-500 bg-emerald-50' },
  { id: 'licores', label: 'Licores / Bebidas', icon: 'liquor', color: 'text-amber-600 bg-amber-50' },
  { id: 'documentos', label: 'Llaves / Documentos', icon: 'description', color: 'text-blue-500 bg-blue-50' },
  { id: 'otro', label: 'Otro Mandado Especial', icon: 'shopping_basket', color: 'text-purple-500 bg-purple-50' },
]

function EncargosContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const setActiveOrderId = useCartStore((state) => state.setActiveOrderId)

  const [selectedZone, setSelectedZone] = useState<string>('')
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  
  const initialCategory = searchParams.get('category') || 'medicina'
  const [category, setCategory] = useState(initialCategory)
  
  const [pickupAddress, setPickupAddress] = useState('') // Punto de recogida
  const [deliveryAddress, setDeliveryAddress] = useState('') // Destino
  const [details, setDetails] = useState('') // Qué hay que hacer / comprar

  // Sincronizar el estado del selector con los query params
  useEffect(() => {
    const cat = searchParams.get('category')
    if (cat) {
      setCategory(cat)
    }
  }, [searchParams])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    const savedZone = localStorage.getItem('selectedZone')
    if (savedZone) {
      setSelectedZone(savedZone)
    } else {
      setError('Por favor, selecciona primero una zona de entrega en la pantalla de inicio.')
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedZone) {
      setError('Debes seleccionar una zona de servicio.')
      return
    }
    if (!customerName || !customerPhone || !pickupAddress || !deliveryAddress || !details) {
      setError('Por favor completa todos los campos obligatorios.')
      return
    }

    setLoading(true)
    setError(null)

    const categoryLabel = ERAND_CATEGORIES.find(c => c.id === category)?.label || 'Mandado'

    try {
      const response = await fetch('/api/services/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          zoneId: selectedZone,
          serviceType: 'ENCARGO',
          customerName,
          customerPhone,
          customerAddress: pickupAddress,
          deliveryAddress,
          details: `Categoría de Encargo: ${categoryLabel}. Instrucciones: ${details}`,
          price: 4.00 // Tarifa fija estándar para encargos
        })
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess(true)
        if (data.id) {
          setActiveOrderId(data.id)
          setTimeout(() => {
            router.push(`/azul/tracking?orderId=${data.id}`)
          }, 2000)
        }
      } else {
        setError(data.error || 'Error al solicitar el encargo.')
      }
    } catch {
      setError('Error de red. Intenta nuevamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background text-on-surface antialiased font-sans flex flex-col">
      {/* Top Header */}
      <header className="h-16 bg-surface-container-lowest border-b border-surface-container-high px-margin-mobile flex items-center gap-4 fixed top-0 left-0 right-0 z-50">
        <Link href="/azul" className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-container-high transition-colors">
          <span className="material-symbols-outlined text-secondary">arrow_back</span>
        </Link>
        <div>
          <h1 className="font-headline-sm text-headline-sm text-on-surface leading-none font-bold">Encargos y Mandados</h1>
          <p className="text-[11px] text-on-surface-variant font-medium mt-0.5">Recogidas, farmacia, licores y compras</p>
        </div>
      </header>

      {/* Main Content Form */}
      <main className="flex-1 pt-20 pb-10 w-full max-w-md mx-auto px-margin-mobile flex flex-col justify-center">
        {success ? (
          <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-8 text-center shadow-lg space-y-4 my-auto animate-in zoom-in-95 duration-300">
            <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
              <span className="material-symbols-outlined text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
            </div>
            <h2 className="font-headline-md text-headline-md text-on-surface font-bold">¡Encargo Solicitado!</h2>
            <p className="text-body-md text-on-surface-variant max-w-[280px] mx-auto leading-relaxed">
              Tu mandado especial ha sido publicado de forma exitosa. Redirigiéndote al rastreo en vivo de tu repartidor...
            </p>
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mt-6"></div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 shadow-[0px_4px_16px_rgba(0,0,0,0.04)] space-y-5">
            <div className="flex items-center gap-3 border-b border-surface-container-high pb-4">
              <span className="material-symbols-outlined text-primary text-3xl">medical_services</span>
              <div>
                <h3 className="font-semibold text-sm text-on-surface">Solicitar Mandado Especial</h3>
                <p className="text-xs text-on-surface-variant">Compramos o recogemos lo que necesites al instante</p>
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-3 bg-error-container text-on-error-container p-4 rounded-xl text-xs font-semibold">
                <span className="material-symbols-outlined text-[18px] shrink-0">error</span>
                <p>{error}</p>
              </div>
            )}

            {/* Category Grid */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-secondary">¿Qué mandado necesitas hoy?</label>
              <div className="grid grid-cols-2 gap-2">
                {ERAND_CATEGORIES.map((cat) => {
                  const isSelected = category === cat.id
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setCategory(cat.id)}
                      className={`p-3 rounded-xl border text-left transition-all flex items-center gap-2.5 cursor-pointer hover:scale-[1.01] active:scale-[0.99] ${
                        isSelected
                          ? 'border-primary bg-primary/5 text-primary font-bold shadow-sm'
                          : 'border-outline-variant bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${isSelected ? 'bg-primary/10 text-primary' : cat.color}`}>
                        <span className="material-symbols-outlined text-[18px]">{cat.icon}</span>
                      </div>
                      <span className="text-[11px] leading-tight font-semibold">{cat.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Remitente Info */}
            <div className="space-y-4 pt-1">
              <h4 className="text-xs font-bold text-primary uppercase tracking-wider">Datos del Cliente</h4>
              
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-secondary" htmlFor="name">Nombre</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-outline text-[18px]">person</span>
                  <input
                    id="name"
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Ej. Juan Pérez"
                    className="w-full pl-10 pr-4 py-3 bg-surface-container-low border border-outline-variant rounded-xl text-body-md placeholder:text-outline outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-secondary" htmlFor="phone">Celular</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-outline text-[18px]">phone</span>
                  <input
                    id="phone"
                    type="tel"
                    required
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="Ej. 0991234567"
                    className="w-full pl-10 pr-4 py-3 bg-surface-container-low border border-outline-variant rounded-xl text-body-md placeholder:text-outline outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Ruta Info */}
            <div className="space-y-4 pt-1">
              <h4 className="text-xs font-bold text-primary uppercase tracking-wider">Detalles de Ruta</h4>

              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-secondary" htmlFor="origin">📍 Dónde comprar/recoger (Origen)</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3.5 top-3.5 text-primary text-[18px]">store</span>
                  <textarea
                    id="origin"
                    required
                    rows={2}
                    value={pickupAddress}
                    onChange={(e) => setPickupAddress(e.target.value)}
                    placeholder="Escribe el nombre de la Farmacia, Tienda de Licores o dirección donde el repartidor debe recoger el pedido..."
                    className="w-full pl-10 pr-4 py-3 bg-surface-container-low border border-outline-variant rounded-xl text-body-md placeholder:text-outline outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all resize-none"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-secondary" htmlFor="destination">🏁 Dónde entregar (Tu ubicación / Destino)</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3.5 top-3.5 text-emerald-500 text-[18px]">my_location</span>
                  <textarea
                    id="destination"
                    required
                    rows={2}
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    placeholder="Tu calle principal, número de casa, departamento o indicaciones detalladas para recibir el pedido..."
                    className="w-full pl-10 pr-4 py-3 bg-surface-container-low border border-outline-variant rounded-xl text-body-md placeholder:text-outline outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Mandado Detalles */}
            <div className="space-y-3 pt-1">
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-secondary" htmlFor="details">📝 Describe lo que debemos comprar o recoger</label>
                <textarea
                  id="details"
                  required
                  rows={3}
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  placeholder="Detalla de forma exacta los licores, medicinas o artículos que necesitas. Escribe marcas, tamaños, miligramos, etc. para evitar equivocaciones..."
                  className="w-full px-4 py-3 bg-surface-container-low border border-outline-variant rounded-xl text-body-md placeholder:text-outline outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all resize-none"
                />
              </div>
            </div>

            {/* Costo Fijo Card */}
            <div className="bg-surface-container-low border border-outline-variant rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[20px]">payments</span>
                <div>
                  <p className="text-[11px] font-bold text-on-surface">Costo por Mandado Especial</p>
                  <p className="text-[10px] text-on-surface-variant">Tarifa fija por gestión y transporte</p>
                </div>
              </div>
              <p className="font-extrabold text-sm text-primary">$4.00 USD</p>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !selectedZone}
              className="w-full bg-primary text-on-primary font-bold py-4 rounded-xl hover:brightness-110 active:scale-[0.98] transition-all flex justify-center items-center gap-2 shadow-[0px_4px_12px_rgba(0,63,135,0.2)] disabled:opacity-50 disabled:cursor-not-allowed mt-4"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin"></div>
                  <span>Enviando Encargo...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined">two_wheeler</span>
                  <span>Confirmar Solicitud — $4.00 USD</span>
                </>
              )}
            </button>
          </form>
        )}
      </main>
    </div>
  )
}

export default function EncargosPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    }>
      <EncargosContent />
    </Suspense>
  )
}
