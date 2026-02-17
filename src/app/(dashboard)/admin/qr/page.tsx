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

export default function AdminQRPage() {
  const [stores, setStores] = useState<Store[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedStore, setSelectedStore] = useState<Store | null>(null)
  const [copied, setCopied] = useState<string | null>(null)
  const [showIframe, setShowIframe] = useState(false)

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

  const getStoreUrl = (slug: string) => {
    if (typeof window !== 'undefined') {
      return `${window.location.origin}/tienda/${slug}`
    }
    return `/tienda/${slug}`
  }

  const copyToClipboard = async (slug: string) => {
    const url = getStoreUrl(slug)
    try {
      await navigator.clipboard.writeText(url)
      setCopied(slug)
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
      setTimeout(() => setCopied(null), 2000)
    }
  }

  const handleGenerateQR = (store: Store) => {
    setSelectedStore(store)
    setShowIframe(true)
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3" />
          <div className="h-48 bg-gray-200 rounded" />
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        📱 Generar Codigo QR para Tiendas
      </h1>

      {/* Instrucciones */}
      <Card className="mb-6 border-blue-200 bg-blue-50">
        <CardContent className="pt-4">
          <p className="text-sm text-blue-800">
            <strong>Instrucciones:</strong> Copia el enlace de la tienda, luego haz clic en
            &quot;Generar QR&quot; para abrir la herramienta. Pega el enlace en el generador
            para crear el codigo QR de la tienda.
          </p>
        </CardContent>
      </Card>

      {/* Lista de tiendas */}
      <div className="space-y-3 mb-6">
        {stores.length === 0 ? (
          <Card className="text-center py-12">
            <p className="text-4xl mb-4">🏪</p>
            <p className="text-gray-500">No hay tiendas registradas</p>
          </Card>
        ) : (
          stores.map((store) => (
            <Card
              key={store.id}
              className={`transition-all ${
                selectedStore?.id === store.id
                  ? 'border-2 border-green-500 ring-2 ring-green-200'
                  : ''
              }`}
            >
              <CardContent className="pt-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900">{store.name}</h3>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          store.isOpen
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {store.isOpen ? 'Abierta' : 'Cerrada'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1 truncate">
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
                          ? 'bg-green-100 text-green-700'
                          : ''
                      }
                    >
                      {copied === store.slug ? '✓ Copiado' : '📋 Copiar Link'}
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleGenerateQR(store)}
                      className="bg-purple-600 hover:bg-purple-700 text-white"
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
      {showIframe && (
        <Card className="border-2 border-purple-300">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-bold text-lg">
                  Generador de Codigo QR
                </h2>
                {selectedStore && (
                  <p className="text-sm text-gray-500 mt-1">
                    Tienda: <strong>{selectedStore.name}</strong>
                  </p>
                )}
              </div>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => {
                  setShowIframe(false)
                  setSelectedStore(null)
                }}
              >
                Cerrar
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* Link para copiar */}
            {selectedStore && (
              <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-xs font-medium text-yellow-800 mb-2">
                  Copia este enlace y pegalo en el generador de abajo:
                </p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-sm bg-white px-3 py-2 rounded border border-yellow-300 truncate">
                    {getStoreUrl(selectedStore.slug)}
                  </code>
                  <Button
                    size="sm"
                    onClick={() => copyToClipboard(selectedStore.slug)}
                    className={
                      copied === selectedStore.slug
                        ? 'bg-green-600 text-white'
                        : 'bg-yellow-600 hover:bg-yellow-700 text-white'
                    }
                  >
                    {copied === selectedStore.slug ? '✓' : '📋'}
                  </Button>
                </div>
              </div>
            )}

            {/* Iframe */}
            <div className="rounded-lg overflow-hidden border border-gray-200">
              <iframe
                src="https://www.qrgratis.es/"
                className="w-full border-0"
                style={{ height: '600px' }}
                title="Generador de Codigo QR"
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-downloads"
              />
            </div>

            <p className="text-xs text-gray-400 mt-2 text-center">
              Herramienta proporcionada por qrgratis.es
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
