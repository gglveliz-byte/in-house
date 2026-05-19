'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from './button'

// Declarar el tipo global para Google Maps
declare global {
  interface Window {
    google?: typeof google
    initGoogleMaps?: () => void
  }
}

interface LocationPickerProps {
  address: string
  latitude: number | null
  longitude: number | null
  onAddressChange: (address: string) => void
  onLocationChange: (lat: number, lng: number, address: string) => void
  label?: string
  required?: boolean
  defaultLatitude?: number  // Ubicación predeterminada de la zona
  defaultLongitude?: number // Ubicación predeterminada de la zona
}

// Variable global para rastrear si el script ya se está cargando
let googleMapsLoading = false
let googleMapsLoadPromise: Promise<void> | null = null

// Función para cargar Google Maps de forma global (solo una vez)
function loadGoogleMaps(): Promise<void> {
  // Si ya está cargado, retornar promesa resuelta
  if (typeof window !== 'undefined' && window.google?.maps) {
    return Promise.resolve()
  }

  // Si ya se está cargando, retornar la promesa existente
  if (googleMapsLoading && googleMapsLoadPromise) {
    return googleMapsLoadPromise
  }

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

  if (!apiKey) {
    return Promise.reject(new Error('Google Maps API key no configurada'))
  }

  // Verificar si ya existe el script en el DOM
  const existingScript = document.querySelector(
    `script[src*="maps.googleapis.com/maps/api/js"]`
  )

  if (existingScript) {
    // Si el script existe, esperar a que cargue
    googleMapsLoading = true
    googleMapsLoadPromise = new Promise((resolve, reject) => {
      const checkLoaded = () => {
        if (window.google?.maps) {
          googleMapsLoading = false
          resolve()
        } else {
          setTimeout(checkLoaded, 100)
        }
      }
      checkLoaded()
      // Timeout después de 10 segundos
      setTimeout(() => {
        if (!window.google?.maps) {
          googleMapsLoading = false
          reject(new Error('Timeout cargando Google Maps'))
        }
      }, 10000)
    })
    return googleMapsLoadPromise
  }

  // Crear nuevo script
  googleMapsLoading = true
  googleMapsLoadPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`
    script.async = true
    script.defer = true
    script.id = 'google-maps-script'

    script.onload = () => {
      googleMapsLoading = false
      resolve()
    }

    script.onerror = () => {
      googleMapsLoading = false
      googleMapsLoadPromise = null
      reject(new Error('Error cargando Google Maps'))
    }

    document.head.appendChild(script)
  })

  return googleMapsLoadPromise
}

export function LocationPicker({
  address,
  latitude,
  longitude,
  onAddressChange,
  onLocationChange,
  label = 'Ubicación',
  required = false,
  defaultLatitude,
  defaultLongitude,
}: LocationPickerProps) {
  const [mapLoaded, setMapLoaded] = useState(false)
  const [mapError, setMapError] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [gettingCurrentLocation, setGettingCurrentLocation] = useState(false)
  const [showLocationPermissionRequest, setShowLocationPermissionRequest] = useState(false)
  const [locationPermissionDenied, setLocationPermissionDenied] = useState(false)
  const [mapMode, setMapMode] = useState<'map' | 'manual'>('map')
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<google.maps.Map | null>(null)
  const markerRef = useRef<google.maps.Marker | null>(null)
  const geocoderRef = useRef<google.maps.Geocoder | null>(null)

  // Cargar Google Maps
  useEffect(() => {
    if (typeof window === 'undefined') return

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

    // Si no hay API key, usar modo manual silenciosamente
    if (!apiKey || apiKey === 'tu_api_key') {
      setMapError(true)
      setMapMode('manual')
      return
    }

    // Verificar si ya está cargado
    if (window.google?.maps) {
      setMapLoaded(true)
      return
    }

    // Cargar Google Maps usando la función global
    loadGoogleMaps()
      .then(() => {
        setMapLoaded(true)
        setMapError(false)
      })
      .catch(() => {
        setMapError(true)
        setMapMode('manual')
      })
  }, [])

  // Función para inicializar el mapa
  const initializeMap = () => {
    if (!mapRef.current || !window.google?.maps) return

    // Si el mapa ya existe, solo actualizar el centro si hay coordenadas
    if (mapInstanceRef.current) {
      if (latitude && longitude) {
        mapInstanceRef.current.setCenter({ lat: latitude, lng: longitude })
        mapInstanceRef.current.setZoom(15)
        
        if (markerRef.current) {
          markerRef.current.setPosition({ lat: latitude, lng: longitude })
        }
      }
      return
    }

    try {
      // Ubicación predeterminada: usar props si existen, sino Ecuador por defecto
      const defaultCenter = latitude && longitude
        ? { lat: latitude, lng: longitude }
        : defaultLatitude && defaultLongitude
        ? { lat: defaultLatitude, lng: defaultLongitude }
        : { lat: -2.182874, lng: -79.518009 } // Ecuador por defecto

      const map = new google.maps.Map(mapRef.current, {
        center: defaultCenter,
        zoom: latitude && longitude ? 15 : 10,
        mapTypeControl: true,
        streetViewControl: true,
      })

      // Verificar errores después de un breve delay
      setTimeout(() => {
        // Si el mapa no se renderizó correctamente, puede ser un error de API
        if (mapRef.current && mapRef.current.children.length === 0) {
          setMapError(true)
          setMapMode('manual')
        }
      }, 2000)

      mapInstanceRef.current = map
      geocoderRef.current = new google.maps.Geocoder()

      // Si hay coordenadas existentes, colocar marcador
      if (latitude && longitude) {
        const marker = new google.maps.Marker({
          position: { lat: latitude, lng: longitude },
          map: map,
          draggable: true,
        })
        markerRef.current = marker

        // Actualizar dirección cuando se mueve el marcador
        marker.addListener('dragend', () => {
          const position = marker.getPosition()
          if (position) {
            reverseGeocode(position.lat(), position.lng())
          }
        })
      }

      // Agregar marcador al hacer clic en el mapa
      map.addListener('click', (e: google.maps.MapMouseEvent) => {
        if (e.latLng) {
          const lat = e.latLng.lat()
          const lng = e.latLng.lng()
          
          if (markerRef.current) {
            markerRef.current.setPosition({ lat, lng })
          } else {
            const marker = new google.maps.Marker({
              position: { lat, lng },
              map: map,
              draggable: true,
            })
            markerRef.current = marker

            marker.addListener('dragend', () => {
              const position = marker.getPosition()
              if (position) {
                reverseGeocode(position.lat(), position.lng())
              }
            })
          }

          reverseGeocode(lat, lng)
        }
      })
    } catch (error) {
      console.error('Error initializing map:', error)
      setMapError(true)
      setMapMode('manual')
    }
  }

  // Inicializar mapa cuando esté cargado
  useEffect(() => {
    if (!mapLoaded || mapError) return
    if (mapMode !== 'map') return // Solo inicializar si estamos en modo mapa

    // Verificar que Google Maps esté realmente disponible
    if (!window.google?.maps) {
      setMapError(true)
      setMapMode('manual')
      return
    }

    // Pequeño delay para asegurar que el DOM esté listo
    const timer = setTimeout(() => {
      if (mapRef.current) {
        initializeMap()
      }
    }, 100)

    return () => clearTimeout(timer)
  }, [mapLoaded, mapMode, mapError])

  // Reinicializar mapa cuando cambia a modo mapa
  useEffect(() => {
    if (mapMode === 'map' && mapLoaded && !mapError && window.google?.maps) {
      const timer = setTimeout(() => {
        if (mapRef.current) {
          initializeMap()
        }
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [mapMode])

  const reverseGeocode = (lat: number, lng: number) => {
    if (!geocoderRef.current) return

    geocoderRef.current.geocode(
      { location: { lat, lng } },
      (results, status) => {
        if (status === 'OK' && results && results[0]) {
          const address = results[0].formatted_address
          onLocationChange(lat, lng, address)
        }
      }
    )
  }

  // Verificar estado de permisos al cargar
  useEffect(() => {
    if (typeof navigator === 'undefined') return
    let permResult: PermissionStatus | null = null

    if (navigator.permissions) {
      navigator.permissions.query({ name: 'geolocation' as PermissionName }).then((result) => {
        permResult = result
        if (result.state === 'denied') {
          setLocationPermissionDenied(true)
        }
        result.onchange = () => {
          if (result.state === 'denied') {
            setLocationPermissionDenied(true)
          } else if (result.state === 'granted') {
            setLocationPermissionDenied(false)
          }
        }
      }).catch(() => {})
    }

    return () => {
      if (permResult) permResult.onchange = null
    }
  }, [])

  const requestLocationPermission = () => {
    // Verificar si el navegador bloquea los permisos
    if (typeof navigator !== 'undefined' && navigator.permissions) {
      navigator.permissions.query({ name: 'geolocation' as PermissionName }).then((result) => {
        if (result.state === 'denied') {
          // El permiso ya fue bloqueado permanentemente
          setShowLocationPermissionRequest(true)
          return
        }
        // Si no está bloqueado, mostrar el modal y luego solicitar
        setShowLocationPermissionRequest(true)
      }).catch(() => {
        // Si no soporta Permissions API, mostrar modal de todas formas
        setShowLocationPermissionRequest(true)
      })
    } else {
      // Si no soporta Permissions API, mostrar modal de todas formas
      setShowLocationPermissionRequest(true)
    }
  }

  const handleAcceptLocationPermission = () => {
    setShowLocationPermissionRequest(false)
    getCurrentLocation()
  }

  const handleDenyLocationPermission = () => {
    setShowLocationPermissionRequest(false)
    setLocationPermissionDenied(true)
  }

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Tu navegador no soporta geolocalización. Por favor selecciona la ubicación en el mapa.')
      return
    }

    setGettingCurrentLocation(true)
    setLocationPermissionDenied(false)

    // Timeout para detectar si el navegador no muestra el diálogo
    let permissionTimeout: NodeJS.Timeout
    let permissionShown = false

    // Detectar si el navegador muestra el diálogo
    const checkPermissionDialog = () => {
      permissionTimeout = setTimeout(() => {
        if (!permissionShown) {
          // El navegador no mostró el diálogo, probablemente está bloqueado
          setGettingCurrentLocation(false)
          setLocationPermissionDenied(true)
          setShowLocationPermissionRequest(true)
        }
      }, 500) // Esperar 500ms para ver si aparece el diálogo
    }

    checkPermissionDialog()

    navigator.geolocation.getCurrentPosition(
      (position) => {
        clearTimeout(permissionTimeout)
        permissionShown = true
        const lat = position.coords.latitude
        const lng = position.coords.longitude

        // Mover mapa a la ubicación actual
        if (mapInstanceRef.current) {
          mapInstanceRef.current.setCenter({ lat, lng })
          mapInstanceRef.current.setZoom(15)

          // Colocar o mover marcador
          if (markerRef.current) {
            markerRef.current.setPosition({ lat, lng })
          } else {
            const marker = new google.maps.Marker({
              position: { lat, lng },
              map: mapInstanceRef.current,
              draggable: true,
            })
            markerRef.current = marker

            marker.addListener('dragend', () => {
              const position = marker.getPosition()
              if (position) {
                reverseGeocode(position.lat(), position.lng())
              }
            })
          }

          reverseGeocode(lat, lng)
        } else {
          // Si el mapa no está listo, solo actualizar coordenadas
          onLocationChange(lat, lng, address || '')
        }

        setGettingCurrentLocation(false)
      },
      (error) => {
        clearTimeout(permissionTimeout)
        permissionShown = true
        setGettingCurrentLocation(false)

        switch (error.code) {
          case error.PERMISSION_DENIED:
            setLocationPermissionDenied(true)
            // Mostrar instrucciones si el permiso fue bloqueado
            setShowLocationPermissionRequest(true)
            break
          case error.POSITION_UNAVAILABLE:
            alert('No pudimos obtener tu ubicación. Por favor selecciona la ubicación en el mapa.')
            break
          case error.TIMEOUT:
            alert('Tiempo de espera agotado. Por favor intenta de nuevo o selecciona en el mapa.')
            break
          default:
            // Solo loggear, no mostrar alert molesto
            console.warn('Error getting location:', {
              code: error.code,
              message: error.message,
            })
            break
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000, // 10 segundos
        maximumAge: 0, // No usar caché
      }
    )
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>

      {/* Toggle entre mapa y manual */}
      {!mapError && (
        <div className="flex gap-2 mb-2">
          <button
            type="button"
            onClick={() => setMapMode('map')}
            aria-pressed={mapMode === 'map'}
            aria-label="Seleccionar ubicación en mapa"
            className={`flex-1 py-1.5 px-3 rounded text-sm font-medium transition-colors ${
              mapMode === 'map'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            📍 Seleccionar en mapa
          </button>
          <button
            type="button"
            onClick={() => setMapMode('manual')}
            aria-pressed={mapMode === 'manual'}
            aria-label="Escribir dirección manualmente"
            className={`flex-1 py-1.5 px-3 rounded text-sm font-medium transition-colors ${
              mapMode === 'manual'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            ✏️ Escribir dirección
          </button>
        </div>
      )}

      {/* Modo Mapa */}
      {mapMode === 'map' && !mapError && (
        <div className="space-y-2">
          <div className="relative">
            <div
              ref={mapRef}
              className="w-full h-64 rounded-lg border border-gray-300"
            />
            {!mapLoaded && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-100 rounded-lg animate-pulse">
                <div className="w-12 h-12 bg-gray-300 rounded-full mb-3" />
                <p className="text-sm text-gray-500">Cargando mapa...</p>
                <div className="mt-2 w-32 h-2 bg-gray-300 rounded" />
              </div>
            )}
          </div>

          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={requestLocationPermission}
            disabled={gettingCurrentLocation || !mapLoaded}
            className="w-full"
          >
            {gettingCurrentLocation ? 'Obteniendo ubicación...' : '📍 Usar mi ubicación actual'}
          </Button>
          
          {locationPermissionDenied && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-2">
              <p className="text-xs text-yellow-800">
                ⚠️ No se pudo obtener tu ubicación. Por favor selecciona en el mapa o escribe la dirección manualmente.
              </p>
            </div>
          )}

          {latitude && longitude && (
            <p className="text-xs text-green-600">
              ✓ Ubicación seleccionada: {latitude.toFixed(6)}, {longitude.toFixed(6)}
            </p>
          )}

          <p className="text-xs text-gray-500">
            Haz clic en el mapa para seleccionar la ubicación exacta de la tienda
          </p>

          {/* Modal de solicitud de permiso */}
          {showLocationPermissionRequest && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" role="dialog" aria-modal="true" aria-labelledby="location-permission-title">
              <div className="bg-white rounded-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
                <div className="text-center mb-4">
                  <div className="text-4xl mb-3">📍</div>
                  <h3 id="location-permission-title" className="text-lg font-semibold text-gray-900 mb-2">
                    {locationPermissionDenied ? 'Permisos de ubicación bloqueados' : 'Acceso a tu ubicación'}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {locationPermissionDenied 
                      ? 'Tu navegador ha bloqueado el acceso a tu ubicación.'
                      : 'Denos acceso a tu ubicación para poder llevar de forma precisa tu pedido.'}
                  </p>
                  {locationPermissionDenied ? (
                    <div className="mt-4 space-y-3">
                      {/* Instrucciones para habilitar manualmente */}
                      <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 text-left">
                        <p className="text-sm text-orange-800 font-medium mb-2">
                          🔧 Para habilitar tu ubicación:
                        </p>
                        <ol className="text-xs text-orange-700 space-y-1 list-decimal list-inside">
                          <li>Haz clic en el icono de candado 🔒 en la barra de direcciones</li>
                          <li>Busca "Ubicación" o "Location"</li>
                          <li>Cambia a "Permitir" o "Allow"</li>
                          <li>Recarga la página</li>
                        </ol>
                      </div>
                      
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left">
                        <p className="text-sm text-blue-800 font-medium mb-2">
                          ✅ Mientras tanto, puedes:
                        </p>
                        <ul className="text-sm text-blue-700 space-y-1">
                          <li>• Hacer clic en el mapa para seleccionar tu ubicación exacta</li>
                          <li>• Arrastrar el marcador para ajustar la posición</li>
                          <li>• Escribir la dirección manualmente si prefieres</li>
                        </ul>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-gray-500 mt-2">
                      Tu ubicación nos ayuda a calcular la ruta exacta y asegurar que el repartidor llegue correctamente.
                    </p>
                  )}
                </div>
                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="secondary"
                    className="flex-1"
                    onClick={handleDenyLocationPermission}
                  >
                    {locationPermissionDenied ? 'Usar mapa' : 'Cancelar'}
                  </Button>
                  {locationPermissionDenied ? (
                    <Button
                      type="button"
                      className="flex-1"
                      onClick={() => {
                        setLocationPermissionDenied(false)
                        setShowLocationPermissionRequest(false)
                        getCurrentLocation()
                      }}
                    >
                      🔄 Reintentar
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      className="flex-1"
                      onClick={handleAcceptLocationPermission}
                    >
                      Permitir ubicación
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}

        </div>
      )}

      {/* Modo Manual o Fallback */}
      {(mapMode === 'manual' || mapError) && (
        <div className="space-y-4">
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary-fixed/50 flex items-center justify-center text-primary">
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>location_on</span>
              </div>
              <div>
                <h4 className="font-headline-sm text-headline-sm text-on-surface">Dirección de entrega</h4>
                <p className="font-body-sm text-body-sm text-on-surface-variant">Ingresa los detalles de tu ubicación</p>
              </div>
            </div>
            
            <div className="mt-2">
              <input
                type="text"
                className="w-full bg-surface-container border border-outline-variant rounded-xl px-4 py-3 font-body-md text-on-surface outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-outline"
                value={address}
                onChange={(e) => onAddressChange(e.target.value)}
                placeholder="Ej. Calle Principal 123, Apartamento 4B..."
                required={required}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
