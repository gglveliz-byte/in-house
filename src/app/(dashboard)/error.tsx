'use client'

import { useEffect, useState } from 'react'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const [isOnline, setIsOnline] = useState(true)

  useEffect(() => {
    setIsOnline(navigator.onLine)
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    console.error('Dashboard error:', error)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [error])

  return (
    <div className="flex items-center justify-center min-h-[60vh] p-4">
      <div className="max-w-md w-full bg-white border-2 border-red-100 rounded-2xl p-8 text-center shadow-lg">
        <div className="text-5xl mb-4">
          {!isOnline ? '📡' : '⚠️'}
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          {!isOnline ? 'Sin conexión' : 'Error en el panel'}
        </h2>
        <p className="text-gray-600 mb-6 text-sm">
          {!isOnline
            ? 'Verifica tu conexión a internet e intenta de nuevo.'
            : 'Ocurrió un error inesperado. Intenta recargar la sección.'}
        </p>
        <div className="space-y-3">
          <button
            onClick={reset}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-xl transition-colors"
          >
            Reintentar
          </button>
          <a
            href="/dashboard"
            className="block w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 px-6 rounded-xl transition-colors"
          >
            Ir al dashboard
          </a>
        </div>
      </div>
    </div>
  )
}
