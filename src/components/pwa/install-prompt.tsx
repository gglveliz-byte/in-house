'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { usePwaStore } from '@/stores/pwa-store'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function InstallPrompt() {
  const pathname = usePathname()
  const { deferredPrompt, setDeferredPrompt, isInstalled, setIsInstalled } = usePwaStore()
  const [showPrompt, setShowPrompt] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    // Verificar que estamos en el cliente
    if (typeof window === 'undefined') return

    // Verificar si ya está instalado
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true)
      return
    }

    // Verificar si es móvil
    const mobileCheck = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
    setIsMobile(mobileCheck)
    
    // Verificar si está en iOS
    const iosCheck = /iPad|iPhone|iPod/.test(navigator.userAgent)
    setIsIOS(iosCheck)
    const isInStandaloneMode = ('standalone' in window.navigator) && (window.navigator as Navigator & { standalone?: boolean }).standalone

    // Escuchar el evento beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as unknown as BeforeInstallPromptEvent)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    // SIEMPRE mostrar el prompt en móviles después de 3 segundos
    const showTimer = setTimeout(() => {
      if (mobileCheck && !isInstalled) {
        setShowPrompt(true)
      }
    }, 3000)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      clearTimeout(showTimer)
    }
  }, [isInstalled, setDeferredPrompt, setIsInstalled])

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      // iOS - mostrar instrucciones
      return
    }

    // Mostrar el prompt de instalación
    await deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice

    if (outcome === 'accepted') {
      setShowPrompt(false)
      setIsInstalled(true)
    }

    setDeferredPrompt(null)
  }

  const handleDismiss = () => {
    setShowPrompt(false)
    // Mostrar de nuevo después de 30 segundos (muy agresivo)
    setTimeout(() => {
      if (!isInstalled) {
        setShowPrompt(true)
      }
    }, 30000) // 30 segundos
  }

  // Solo ocultar si está instalado, pero SIEMPRE mostrar si no está instalado
  if (isInstalled) {
    return null
  }

  // Ocultar si estamos en la página de descarga dedicada
  if (pathname === '/descargar') {
    return null
  }

  // Si no es móvil o no debe mostrarse, no renderizar
  if (!showPrompt || (!isMobile && !isInstalled)) {
    return null
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50 animate-bounce">
      <div className="bg-white rounded-xl shadow-2xl border border-gray-200 p-4">
        <div className="flex items-start gap-3">
          <div className="text-3xl">📱</div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 mb-1">
              Para mayor experiencia, instala la app
            </h3>
            {isIOS ? (
              <div className="text-sm text-gray-600 space-y-2">
                <p>Para instalar en iOS:</p>
                <ol className="list-decimal list-inside space-y-1 text-xs">
                  <li>Toca el botón de compartir <span className="inline-block">📤</span></li>
                  <li>Selecciona &quot;Agregar a pantalla de inicio&quot;</li>
                  <li>Confirma la instalación</li>
                </ol>
              </div>
            ) : (
              <p className="text-sm text-gray-600">
                Instala la app para una experiencia más rápida y acceso directo desde tu pantalla principal.
              </p>
            )}
          </div>
          <button
            onClick={handleDismiss}
            className="text-gray-400 hover:text-gray-600 text-xl"
            aria-label="Cerrar"
          >
            ×
          </button>
        </div>
        <div className="flex gap-2 mt-4">
          {!isIOS && deferredPrompt && (
            <Button
              onClick={handleInstallClick}
              className="flex-1"
              size="sm"
            >
              Instalar ahora
            </Button>
          )}
          <Button
            onClick={handleDismiss}
            variant="secondary"
            size="sm"
            className={isIOS || !deferredPrompt ? 'w-full' : ''}
          >
            {isIOS ? 'Entendido' : 'Ahora no'}
          </Button>
        </div>
      </div>
    </div>
  )
}
