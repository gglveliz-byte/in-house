'use client'

import { useState, useEffect } from 'react'
import { StoreCard } from '@/components/store/store-card'
import { setActiveCurrency } from '@/lib/utils'

interface Zone {
  id: string
  name: string
  description: string | null
  currency: string
}

interface Store {
  id: string
  name: string
  slug: string
  description: string | null
  logo: string | null
  banner: string | null
  address: string
  isOpen: boolean
  minOrder: number
  deliveryFee: number
  minDeliveryFee: number
  maxDeliveryFee: number
  zoneId: string | null
}

const CURRENCY_LABELS: Record<string, string> = {
  USD: '💵 Dólar (USD)',
  MXN: '🇲🇽 Peso mexicano (MXN)',
  COP: '🇨🇴 Peso colombiano (COP)',
  ARS: '🇦🇷 Peso argentino (ARS)',
  PEN: '🇵🇪 Sol peruano (PEN)',
  CLP: '🇨🇱 Peso chileno (CLP)',
  BRL: '🇧🇷 Real brasileño (BRL)',
  EUR: '🇪🇺 Euro (EUR)',
  VES: '🇻🇪 Bolívar (VES)',
  BOB: '🇧🇴 Boliviano (BOB)',
  UYU: '🇺🇾 Peso uruguayo (UYU)',
  PYG: '🇵🇾 Guaraní (PYG)',
  GTQ: '🇬🇹 Quetzal (GTQ)',
  HNL: '🇭🇳 Lempira (HNL)',
  NIO: '🇳🇮 Córdoba (NIO)',
  CRC: '🇨🇷 Colón (CRC)',
  PAB: '🇵🇦 Balboa (PAB)',
  DOP: '🇩🇴 Peso dominicano (DOP)',
  CUP: '🇨🇺 Peso cubano (CUP)',
}

export default function HomePage() {
  const [zones, setZones] = useState<Zone[]>([])
  const [stores, setStores] = useState<Store[]>([])
  const [selectedZone, setSelectedZone] = useState<string>('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Cargar zonas
    fetch('/api/zones')
      .then(res => res.json())
      .then(data => {
        setZones(data)
        // Si hay una zona guardada en localStorage, usarla
        const savedZone = localStorage.getItem('selectedZone')
        if (savedZone && data.some((z: Zone) => z.id === savedZone)) {
          setSelectedZone(savedZone)
          const zone = data.find((z: Zone) => z.id === savedZone)
          if (zone?.currency) {
            setActiveCurrency(zone.currency)
            localStorage.setItem('zoneCurrency', zone.currency)
          }
        }
      })
      .catch(err => console.error('Error loading zones:', err))
  }, [])

  useEffect(() => {
    // Solo cargar tiendas si hay una zona seleccionada
    if (!selectedZone) {
      setStores([])
      setLoading(false)
      return
    }
    
    setLoading(true)
    fetch(`/api/stores?zoneId=${selectedZone}`)
      .then(res => res.json())
      .then(data => {
        setStores(data)
        setLoading(false)
      })
      .catch(err => {
        console.error('Error loading stores:', err)
        setLoading(false)
      })
  }, [selectedZone])

  const handleZoneChange = (zoneId: string) => {
    setSelectedZone(zoneId)
    if (zoneId) {
      localStorage.setItem('selectedZone', zoneId)
      const zone = zones.find(z => z.id === zoneId)
      if (zone?.currency) {
        setActiveCurrency(zone.currency)
        localStorage.setItem('zoneCurrency', zone.currency)
      }
    } else {
      localStorage.removeItem('selectedZone')
      localStorage.removeItem('zoneCurrency')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-orange-50">
      <div className="max-w-7xl mx-auto px-4 py-8 md:py-12">
        {/* Hero Section */}
        <section className="text-center mb-8 md:mb-12">
          <div className="inline-block mb-6">
            <div className="bg-white rounded-2xl shadow-lg p-4 inline-block">
              <span className="text-6xl">🏠</span>
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4 bg-gradient-to-r from-green-600 to-orange-500 bg-clip-text text-transparent">
            Tu comida favorita, en tu puerta
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 max-w-2xl mx-auto font-medium">
            Ordena de los mejores restaurantes locales y recibe tu pedido en minutos
          </p>
        </section>

        {/* Zone Selector - OBLIGATORIO */}
        {zones.length > 0 && (
          <section className="mb-8">
            <div className={`bg-white rounded-2xl shadow-lg p-6 border-2 ${!selectedZone ? 'border-orange-300 ring-2 ring-orange-200' : 'border-green-100'}`}>
              <div className="flex flex-col md:flex-row items-center gap-4">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">📍</span>
                  <div>
                    <h3 className="font-bold text-gray-900">
                      {!selectedZone ? '¡Primero selecciona tu zona!' : 'Tu zona seleccionada'}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {!selectedZone ? 'Para ver los restaurantes disponibles' : 'Cambia tu zona si lo deseas'}
                    </p>
                  </div>
                </div>
                <div className="flex-1 w-full md:w-auto">
                  <select
                    value={selectedZone}
                    onChange={(e) => handleZoneChange(e.target.value)}
                    aria-label="Selecciona tu zona de entrega"
                    className={`w-full px-4 py-3 text-lg border-2 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 font-medium ${
                      !selectedZone
                        ? 'border-orange-300 bg-orange-50 animate-pulse'
                        : 'border-green-200 bg-green-50'
                    }`}
                  >
                    <option value="">-- Selecciona tu localidad --</option>
                    {(() => {
                      const grouped: Record<string, Zone[]> = {}
                      zones.forEach((zone) => {
                        const cur = zone.currency || 'USD'
                        if (!grouped[cur]) grouped[cur] = []
                        grouped[cur].push(zone)
                      })
                      const currencies = Object.keys(grouped)
                      // Si solo hay una moneda, no agrupar
                      if (currencies.length <= 1) {
                        return zones.map((zone) => (
                          <option key={zone.id} value={zone.id}>
                            📍 {zone.name}
                          </option>
                        ))
                      }
                      return currencies.map((cur) => (
                        <optgroup key={cur} label={CURRENCY_LABELS[cur] || cur}>
                          {grouped[cur].map((zone) => (
                            <option key={zone.id} value={zone.id}>
                              📍 {zone.name}
                            </option>
                          ))}
                        </optgroup>
                      ))
                    })()}
                  </select>
                </div>
              </div>
              {selectedZone && (
                <div className="mt-3 text-center">
                  <span className="text-sm text-green-600 font-medium">
                    ✓ Mostrando restaurantes en: {zones.find(z => z.id === selectedZone)?.name}
                  </span>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Stores Grid */}
        <section>
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
              🍽️ Restaurantes disponibles
              {selectedZone && zones.find(z => z.id === selectedZone) && (
                <span className="block text-lg font-normal text-gray-500 mt-1">
                  en {zones.find(z => z.id === selectedZone)?.name}
                </span>
              )}
            </h2>
            <div className="hidden md:flex items-center gap-2 text-sm text-gray-500">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              <span>{stores.length} {stores.length === 1 ? 'restaurante' : 'restaurantes'}</span>
            </div>
          </div>

          {!selectedZone ? (
            <div className="text-center py-16 bg-gradient-to-br from-orange-50 to-yellow-50 rounded-2xl shadow-sm border-2 border-dashed border-orange-200">
              <div className="text-6xl mb-4">👆</div>
              <p className="text-orange-600 text-xl font-bold mb-2">
                Selecciona tu zona arriba
              </p>
              <p className="text-gray-500 text-lg">
                Para ver los restaurantes disponibles en tu localidad
              </p>
            </div>
          ) : loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-64 bg-gray-200 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : stores.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl shadow-sm border-2 border-dashed border-gray-200">
              <div className="text-6xl mb-4">😔</div>
              <p className="text-gray-500 text-lg font-medium">
                No hay restaurantes disponibles en esta zona todavía.
              </p>
              <p className="text-sm text-gray-400 mt-2">
                Pronto habrá más opciones disponibles
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {stores.map((store) => (
                <StoreCard key={store.id} store={store} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
