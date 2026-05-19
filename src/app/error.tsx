'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const [isOnline, setIsOnline] = useState(true)

  useEffect(() => {
    // Verificar conexión a internet
    setIsOnline(navigator.onLine)

    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Log del error para debugging
    console.error('Error capturado:', error)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [error])

  // Determinar el tipo de error
  const getErrorInfo = () => {
    if (!isOnline) {
      return {
        icon: '📡',
        title: 'Sin conexión a internet',
        message: 'Parece que no tienes conexión a internet. Verifica tu conexión e intenta nuevamente.',
        color: 'text-yellow-500',
        bgColor: 'bg-yellow-50',
        borderColor: 'border-yellow-200',
      }
    }

    if (error.message?.includes('fetch') || error.message?.includes('network')) {
      return {
        icon: '🌐',
        title: 'Error de conexión',
        message: 'No pudimos conectar con el servidor. Esto puede ser un problema temporal.',
        color: 'text-orange-500',
        bgColor: 'bg-orange-50',
        borderColor: 'border-orange-200',
      }
    }

    if (error.message?.includes('timeout') || error.message?.includes('Timeout')) {
      return {
        icon: '⏱️',
        title: 'Tiempo de espera agotado',
        message: 'El servidor está tardando mucho en responder. Por favor, intenta de nuevo.',
        color: 'text-blue-500',
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-200',
      }
    }

    if (error.message?.includes('401') || error.message?.includes('403')) {
      return {
        icon: '🔒',
        title: 'Acceso denegado',
        message: 'No tienes permiso para acceder a esta sección. Inicia sesión o contacta al administrador.',
        color: 'text-red-500',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
      }
    }

    // Error genérico
    return {
      icon: '🔧',
      title: '¡Ups! Algo salió mal',
      message: 'Estamos teniendo problemas técnicos. Nuestro equipo ya fue notificado.',
      color: 'text-gray-600',
      bgColor: 'bg-gray-50',
      borderColor: 'border-gray-200',
    }
  }

  const errorInfo = getErrorInfo()

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className={`max-w-md w-full ${errorInfo.bgColor} ${errorInfo.borderColor} border-2 rounded-2xl p-8 text-center shadow-lg`}>
        {/* Icono animado */}
        <div className="text-7xl mb-6 animate-bounce">
          {errorInfo.icon}
        </div>

        {/* Título */}
        <h1 className={`text-2xl font-bold ${errorInfo.color} mb-3`}>
          {errorInfo.title}
        </h1>

        {/* Mensaje */}
        <p className="text-gray-600 mb-8 leading-relaxed">
          {errorInfo.message}
        </p>

        {/* Botones */}
        <div className="space-y-3">
          <button
            onClick={() => reset()}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] shadow-md"
          >
            Intentar de nuevo
          </button>

          <Link
            href="/"
            className="block w-full bg-white hover:bg-gray-50 text-gray-700 font-semibold py-3 px-6 rounded-xl border-2 border-gray-200 transition-all duration-200"
          >
            Volver al inicio
          </Link>
        </div>

        {/* Mensaje de ayuda */}
        <p className="mt-6 text-sm text-gray-400">
          Si el problema persiste, regresa más tarde.
          <br />
          Lo resolveremos pronto.
        </p>

        {/* Indicador de conexión */}
        <div className="mt-4 flex items-center justify-center gap-2 text-xs">
          <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'} animate-pulse`}></span>
          <span className="text-gray-400">
            {isOnline ? 'Conectado' : 'Sin conexión'}
          </span>
        </div>
      </div>
    </div>
  )
}
