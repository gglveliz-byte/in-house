'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useCartStore } from '@/stores/cart-store'

export default function EnviosPage() {
  const router = useRouter()
  const setActiveOrderId = useCartStore((state) => state.setActiveOrderId)

  const [selectedZone, setSelectedZone] = useState<string>('')
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [customerAddress, setCustomerAddress] = useState('') // Origen
  const [deliveryAddress, setDeliveryAddress] = useState('') // Destino
  const [details, setDetails] = useState('')
  const [deliverySpeed, setDeliverySpeed] = useState<'standard' | 'express'>('standard')
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

  const calculatePrice = () => {
    return deliverySpeed === 'express' ? 4.50 : 2.50
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedZone) {
      setError('Debes seleccionar una zona de servicio.')
      return
    }
    if (!customerName || !customerPhone || !customerAddress || !deliveryAddress) {
      setError('Por favor completa todos los campos obligatorios.')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/services/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          zoneId: selectedZone,
          serviceType: 'ENVIO',
          customerName,
          customerPhone,
          customerAddress,
          deliveryAddress,
          details: `Tipo de envío: ${deliverySpeed === 'express' ? 'Express (Prioritario)' : 'Estándar'}. ${details}`,
          price: calculatePrice()
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
        setError(data.error || 'Error al solicitar el envío.')
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
          <h1 className="font-headline-sm text-headline-sm text-on-surface leading-none font-bold">Solicitar Envío</h1>
          <p className="text-[11px] text-on-surface-variant font-medium mt-0.5">Encomiendas y mensajería urbana</p>
        </div>
      </header>

      {/* Main Content Form */}
      <main className="flex-1 pt-20 pb-10 w-full max-w-md mx-auto px-margin-mobile flex flex-col justify-center">
        {success ? (
          <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-8 text-center shadow-lg space-y-4 my-auto animate-in zoom-in-95 duration-300">
            <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
              <span className="material-symbols-outlined text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
            </div>
            <h2 className="font-headline-md text-headline-md text-on-surface font-bold">¡Solicitud Creada!</h2>
            <p className="text-body-md text-on-surface-variant max-w-[280px] mx-auto leading-relaxed">
              Tu solicitud de encomienda ha sido asignada. Redirigiéndote al rastreo en vivo de tu repartidor...
            </p>
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mt-6"></div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 shadow-[0px_4px_16px_rgba(0,0,0,0.04)] space-y-5">
            <div className="flex items-center gap-3 border-b border-surface-container-high pb-4">
              <span className="material-symbols-outlined text-primary text-3xl">local_post_office</span>
              <div>
                <h3 className="font-semibold text-sm text-on-surface">Enviar un Paquete</h3>
                <p className="text-xs text-on-surface-variant">Llevamos tus pertenencias de forma express y segura</p>
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-3 bg-error-container text-on-error-container p-4 rounded-xl text-xs font-semibold">
                <span className="material-symbols-outlined text-[18px] shrink-0">error</span>
                <p>{error}</p>
              </div>
            )}

            {/* Remitente Info */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-primary uppercase tracking-wider">Datos de Contacto</h4>
              
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-secondary" htmlFor="name">Nombre de contacto</label>
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
                <label className="text-[11px] font-bold text-secondary" htmlFor="phone">Teléfono de contacto</label>
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
            <div className="space-y-4 pt-2">
              <h4 className="text-xs font-bold text-primary uppercase tracking-wider">Direcciones de la Entrega</h4>

              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-secondary" htmlFor="origin">📍 Dirección de recogida (Origen)</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3.5 top-3.5 text-primary text-[18px]">my_location</span>
                  <textarea
                    id="origin"
                    required
                    rows={2}
                    value={customerAddress}
                    onChange={(e) => setCustomerAddress(e.target.value)}
                    placeholder="Calle, Edificio, Oficina o indicaciones para recoger el paquete..."
                    className="w-full pl-10 pr-4 py-3 bg-surface-container-low border border-outline-variant rounded-xl text-body-md placeholder:text-outline outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all resize-none"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-secondary" htmlFor="destination">🏁 Dirección de entrega (Destino)</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3.5 top-3.5 text-emerald-500 text-[18px]">sports_score</span>
                  <textarea
                    id="destination"
                    required
                    rows={2}
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    placeholder="Calle, Número, Edificio, Número de departamento o indicaciones detalladas..."
                    className="w-full pl-10 pr-4 py-3 bg-surface-container-low border border-outline-variant rounded-xl text-body-md placeholder:text-outline outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Detalles Info */}
            <div className="space-y-3 pt-2">
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-secondary" htmlFor="details">📦 Contenido o especificaciones del paquete</label>
                <input
                  id="details"
                  type="text"
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  placeholder="Ej. Llaves de auto, laptop en mochila, documentos..."
                  className="w-full px-4 py-3 bg-surface-container-low border border-outline-variant rounded-xl text-body-md placeholder:text-outline outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all"
                />
              </div>
            </div>

            {/* Velocidad / Precio Selector */}
            <div className="space-y-3 pt-2">
              <label className="text-[11px] font-bold text-secondary">Tipo de Servicio de Envío</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setDeliverySpeed('standard')}
                  className={`p-3.5 rounded-xl border text-center transition-all flex flex-col items-center gap-1 cursor-pointer ${
                    deliverySpeed === 'standard'
                      ? 'border-primary bg-primary/5 text-primary font-bold'
                      : 'border-outline-variant bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high'
                  }`}
                >
                  <span className="material-symbols-outlined text-[20px]">schedule</span>
                  <span className="text-xs">Estándar</span>
                  <span className="text-[10px] font-medium opacity-85">$2.50 USD</span>
                </button>

                <button
                  type="button"
                  onClick={() => setDeliverySpeed('express')}
                  className={`p-3.5 rounded-xl border text-center transition-all flex flex-col items-center gap-1 cursor-pointer ${
                    deliverySpeed === 'express'
                      ? 'border-primary bg-primary/5 text-primary font-bold'
                      : 'border-outline-variant bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high'
                  }`}
                >
                  <span className="material-symbols-outlined text-[20px]">bolt</span>
                  <span className="text-xs">Express Prioritario</span>
                  <span className="text-[10px] font-medium opacity-85">$4.50 USD</span>
                </button>
              </div>
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
                  <span>Procesando Envío...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined">two_wheeler</span>
                  <span>Confirmar Solicitud — ${calculatePrice().toFixed(2)} USD</span>
                </>
              )}
            </button>
          </form>
        )}
      </main>
    </div>
  )
}
