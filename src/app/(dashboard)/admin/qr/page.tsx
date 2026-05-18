'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface Store {
  id: string
  name: string
  slug: string
  isOpen: boolean
}

type ToastType = 'success' | 'error'

export default function AdminQRPage() {
  const [stores, setStores] = useState<Store[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedStore, setSelectedStore] = useState<Store | null>(null)
  const [copied, setCopied] = useState<string | null>(null)
  const [showIframe, setShowIframe] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null)

  useEffect(() => {
    const fetchStores = async () => {
      try {
        const response = await fetch('/api/stores')
        if (response.ok) {
          const data = await response.json()
          setStores(data)
        }
      } catch (error) {
        console.error('Error fetching stores:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchStores()
  }, [])

  const showToast = (message: string, type: ToastType = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  const getStoreUrl = (slug: string) => {
    if (typeof window !== 'undefined') {
      return `${window.location.origin}/azul/restaurant/${slug}`
    }
    return `/azul/restaurant/${slug}`
  }

  const copyToClipboard = async (slug: string) => {
    const url = getStoreUrl(slug)
    try {
      await navigator.clipboard.writeText(url)
      setCopied(slug)
      showToast('Enlace copiado al portapapeles', 'success')
      setTimeout(() => setCopied(null), 2000)
    } catch {
      // Fallback
      const textArea = document.createElement('textarea')
      textArea.value = url
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      setCopied(slug)
      showToast('Enlace copiado', 'success')
      setTimeout(() => setCopied(null), 2000)
    }
  }

  const handleGenerateQR = (store: Store) => {
    setSelectedStore(store)
    setShowIframe(true)
  }

  if (loading) {
    return (
      <div className="space-y-4 max-w-4xl mx-auto">
        <div className="h-8 bg-gray-200 rounded w-56 animate-pulse" />
        <div className="h-24 bg-gray-200 rounded-xl animate-pulse" />
        {[1, 2].map((i) => <div key={i} className="h-20 bg-gray-200 rounded-xl animate-pulse" />)}
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-xl shadow-lg text-white text-sm font-medium flex items-center gap-2 ${
          toast.type === 'success' ? 'bg-emerald-600' : 'bg-red-600'
        }`}>
          {toast.type === 'success' ? '✓' : '✕'} {toast.message}
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">📱 Generar Código QR para Tiendas</h1>
        <p className="text-sm text-gray-500 mt-0.5">Crea códigos QR para que tus clientes accedan directamente a las tiendas</p>
      </div>

      {/* Instrucciones */}
      <Card className="border border-[#003f87]/20 bg-blue-50">
        <CardContent className="pt-4 pb-4">
          <div className="flex gap-3">
            <span className="text-2xl flex-shrink-0">ℹ️</span>
            <div>
              <p className="font-semibold text-[#003f87] mb-1">Instrucciones</p>
              <ol className="text-sm text-[#003f87]/80 space-y-1 list-decimal pl-4">
                <li>Copia el enlace de la tienda que deseas con el botón <strong>Copiar Link</strong></li>
                <li>Haz clic en <strong>Generar QR</strong> para abrir el generador</li>
                <li>Pega el enlace en el campo &quot;URL de la página&quot; del generador</li>
                <li>Configura el QR a tu gusto y descárgalo</li>
              </ol>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de tiendas */}
      <div className="space-y-3">
        {stores.length === 0 ? (
          <Card className="text-center py-16">
            <span className="text-5xl block mb-4">🏪</span>
            <p className="text-gray-500 font-medium">No hay tiendas registradas</p>
            <p className="text-gray-400 text-sm mt-1">Crea tiendas primero en la sección Tiendas</p>
          </Card>
        ) : (
          stores.map((store) => (
            <Card
              key={store.id}
              className={`transition-all duration-200 ${
                selectedStore?.id === store.id
                  ? 'border-2 border-[#003f87] ring-2 ring-[#003f87]/20'
                  : 'hover:shadow-sm'
              }`}
            >
              <CardContent className="pt-4 pb-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-gray-900">{store.name}</h3>
                      <span
                        className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
                          store.isOpen
                            ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                            : 'bg-red-100 text-red-700 border border-red-200'
                        }`}
                      >
                        {store.isOpen ? '● Abierta' : '○ Cerrada'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1 font-mono truncate max-w-md">
                      {getStoreUrl(store.slug)}
                    </p>
                  </div>

                  <div className="flex gap-2 flex-shrink-0">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => copyToClipboard(store.slug)}
                      className={
                        copied === store.slug
                          ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                          : ''
                      }
                    >
                      {copied === store.slug ? '✓ Copiado' : '📋 Copiar Link'}
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleGenerateQR(store)}
                      className={selectedStore?.id === store.id ? 'bg-[#002d6b]' : ''}
                    >
                      📱 Generar QR
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Iframe del generador QR */}
      {showIframe && selectedStore && (
        <Card className="border-2 border-[#003f87]/30">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-bold text-lg text-gray-900">Generador de Código QR</h2>
                <p className="text-sm text-gray-500 mt-0.5">
                  Tienda: <strong className="text-[#003f87]">{selectedStore.name}</strong>
                </p>
              </div>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => {
                  setShowIframe(false)
                  setSelectedStore(null)
                }}
              >
                ✕ Cerrar
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* Enlace para copiar */}
            <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl">
              <p className="text-xs font-semibold text-amber-800 mb-2 uppercase tracking-wider">
                📋 Copia este enlace y pégalo en el campo URL del generador:
              </p>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-sm bg-white px-3 py-2 rounded-lg border border-amber-300 truncate font-mono text-gray-800">
                  {getStoreUrl(selectedStore.slug)}
                </code>
                <Button
                  size="sm"
                  onClick={() => copyToClipboard(selectedStore.slug)}
                  className={
                    copied === selectedStore.slug
                      ? 'bg-emerald-600 hover:bg-emerald-700'
                      : 'bg-amber-600 hover:bg-amber-700'
                  }
                >
                  {copied === selectedStore.slug ? '✓' : '📋'}
                </Button>
              </div>
            </div>

            {/* Iframe */}
            <div className="rounded-xl overflow-hidden border border-gray-200 shadow-sm">
              <iframe
                src="https://www.qrgratis.es/"
                className="w-full border-0"
                style={{ height: '600px' }}
                title="Generador de Código QR"
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-downloads"
              />
            </div>

            <p className="text-xs text-gray-400 mt-3 text-center">
              Herramienta proporcionada por qrgratis.es
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
