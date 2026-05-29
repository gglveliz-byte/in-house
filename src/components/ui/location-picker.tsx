'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from './button'
import { loadGoogleMaps, loadLeaflet } from '@/lib/google-maps'

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

// Función para cargar Google Maps de forma global (solo una vez)
// y usar Leaflet como fallback premium.
// Las implementaciones reales están externalizadas para poder testearlas.

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
  const [locationPermissionDenied, setLocationPermissionDenied] = useState(false)
  const [mapMode, setMapMode] = useState<'map' | 'manual'>('map')
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<google.maps.Map | null>(null)
  const markerRef = useRef<google.maps.Marker | null>(null)
  const geocoderRef = useRef<google.maps.Geocoder | null>(null)

  const [usingLeaflet, setUsingLeaflet] = useState(false)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const leafletMapRef = useRef<any>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const leafletMarkerRef = useRef<any>(null)

  // Cargar Google Maps o usar Leaflet como fallback premium
  useEffect(() => {
    if (typeof window === 'undefined') return

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

    // Si no hay API key o es de plantilla, cargar Leaflet inmediatamente
    if (!apiKey || apiKey === 'tu_api_key') {
      setUsingLeaflet(true)
      loadLeaflet()
        .then(() => {
          setMapLoaded(true)
          setMapError(false)
        })
        .catch(() => {
          setMapError(true)
          setMapMode('manual')
        })
      return
    }

    // Intentar cargar Google Maps
    loadGoogleMaps()
      .then(() => {
        setMapLoaded(true)
        setMapError(false)
      })
      .catch(() => {
        // En caso de error, usar Leaflet como fallback
        setUsingLeaflet(true)
        loadLeaflet()
          .then(() => {
            setMapLoaded(true)
            setMapError(false)
          })
          .catch(() => {
            setMapError(true)
            setMapMode('manual')
          })
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

  // Geocodificación inversa gratuita con Nominatim (OpenStreetMap)
  const reverseGeocodeNominatim = async (lat: number, lng: number) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&accept-language=es`
      )
      if (response.ok) {
        const data = await response.json()
        const formatted = data.display_name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`
        onLocationChange(lat, lng, formatted)
      } else {
        onLocationChange(lat, lng, `${lat.toFixed(6)}, ${lng.toFixed(6)}`)
      }
    } catch (error) {
      console.error('Error reverse geocoding with Nominatim:', error)
      onLocationChange(lat, lng, `${lat.toFixed(6)}, ${lng.toFixed(6)}`)
    }
  }

  // Función para inicializar el mapa de Leaflet (OpenStreetMap)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const initializeLeafletMap = (L: any) => {
    if (!mapRef.current) return

    // Si el mapa ya existe, actualizar centro y marcador
    if (leafletMapRef.current) {
      const center = latitude && longitude
        ? [latitude, longitude]
        : defaultLatitude && defaultLongitude
        ? [defaultLatitude, defaultLongitude]
        : [-0.180653, -78.467834]
      leafletMapRef.current.setView(center, 15)
      if (leafletMarkerRef.current) {
        leafletMarkerRef.current.setLatLng(center)
      }
      return
    }

    try {
      const center = latitude && longitude
        ? [latitude, longitude]
        : defaultLatitude && defaultLongitude
        ? [defaultLatitude, defaultLongitude]
        : [-0.180653, -78.467834] // Quito por defecto

      // Inicializar mapa de Leaflet
      const map = L.map(mapRef.current, {
        zoomControl: true,
      }).setView(center, latitude && longitude ? 15 : 12)
      leafletMapRef.current = map

      // Agregar capa de OpenStreetMap
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
      }).addTo(map)

      // Diseñar un pin SVG premium de color esmeralda usando Material Icons
      const customPin = L.divIcon({
        html: `
          <div class="flex items-center justify-center w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500/40 animate-pulse absolute -top-4 -left-4"></div>
          <span class="material-symbols-outlined text-emerald-600 text-4xl filter drop-shadow absolute -top-8 -left-4" style="font-variation-settings: 'FILL' 1">location_on</span>
        `,
        className: 'custom-leaflet-icon',
        iconSize: [32, 32],
        iconAnchor: [0, 0]
      })

      // Agregar marcador arrastrable
      const marker = L.marker(center, {
        draggable: true,
        icon: customPin,
      }).addTo(map)
      leafletMarkerRef.current = marker

      // Escuchar arrastre del marcador
      marker.on('dragend', () => {
        const position = marker.getLatLng()
        if (position) {
          reverseGeocodeNominatim(position.lat, position.lng)
        }
      })

      // Escuchar clics en el mapa para mover el marcador
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      map.on('click', (e: any) => {
        if (e.latlng) {
          const lat = e.latlng.lat
          const lng = e.latlng.lng
          marker.setLatLng([lat, lng])
          reverseGeocodeNominatim(lat, lng)
        }
      })

      // Invalidar tamaño para renderizado correcto en contenedores dinámicos
      setTimeout(() => {
        map.invalidateSize()
      }, 200)

    } catch (error) {
      console.error('Error initializing Leaflet map:', error)
      setMapError(true)
      setMapMode('manual')
    }
  }

  // Inicializar mapa cuando esté cargado
  useEffect(() => {
    if (!mapLoaded || mapError) return
    if (mapMode !== 'map') return // Solo inicializar si estamos en modo mapa

    if (usingLeaflet) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (typeof window !== 'undefined' && (window as any).L) {
        const timer = setTimeout(() => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          initializeLeafletMap((window as any).L)
        }, 100)
        return () => clearTimeout(timer)
      }
    } else {
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
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapLoaded, mapMode, mapError, usingLeaflet])

  // Reinicializar mapa cuando cambia a modo mapa
  useEffect(() => {
    if (mapMode === 'map' && mapLoaded && !mapError) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (usingLeaflet && (window as any).L) {
        const timer = setTimeout(() => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          initializeLeafletMap((window as any).L)
        }, 100)
        return () => clearTimeout(timer)
      } else if (!usingLeaflet && window.google?.maps) {
        const timer = setTimeout(() => {
          if (mapRef.current) {
            initializeMap()
          }
        }, 100)
        return () => clearTimeout(timer)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapMode, mapLoaded, mapError, usingLeaflet])

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
    getCurrentLocation()
  }

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setErrorMessage('Tu navegador no soporta geolocalización. Por favor selecciona tu ubicación directamente en el mapa.')
      return
    }

    setGettingCurrentLocation(true)
    setLocationPermissionDenied(false)
    setErrorMessage(null)

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude
        const lng = position.coords.longitude

        // Mover mapa a la ubicación actual
        if (usingLeaflet && leafletMapRef.current) {
          leafletMapRef.current.setView([lat, lng], 15)
          if (leafletMarkerRef.current) {
            leafletMarkerRef.current.setLatLng([lat, lng])
          }
          reverseGeocodeNominatim(lat, lng)
        } else if (mapInstanceRef.current) {
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
          if (usingLeaflet) {
            reverseGeocodeNominatim(lat, lng)
          } else {
            onLocationChange(lat, lng, address || '')
          }
        }

        setGettingCurrentLocation(false)
      },
      (error) => {
        setGettingCurrentLocation(false)

        switch (error.code) {
          case error.PERMISSION_DENIED:
            setLocationPermissionDenied(true)
            break
          case error.POSITION_UNAVAILABLE:
            setErrorMessage('No pudimos determinar tu posición geográfica. Por favor selecciona en el mapa.')
            break
          case error.TIMEOUT:
            setErrorMessage('Tiempo de espera agotado. Por favor intenta de nuevo o selecciona en el mapa.')
            break
          default:
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
          
          {errorMessage && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-3 text-xs text-red-800 flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px]">error</span>
              <span>{errorMessage}</span>
            </div>
          )}

          {locationPermissionDenied && (
            <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4 text-left space-y-2">
              <div className="flex items-center gap-2 text-orange-800 font-semibold">
                <span className="material-symbols-outlined text-[20px]">location_disabled</span>
                <span className="text-sm">Permisos de ubicación desactivados</span>
              </div>
              <p className="text-xs text-orange-700">
                Tu navegador tiene bloqueado el acceso a tu ubicación. Mientras tanto, puedes:
              </p>
              <ul className="text-xs text-orange-700 list-disc list-inside pl-1 space-y-1">
                <li>Hacer clic o tocar en el mapa para marcar tu ubicación exacta.</li>
                <li>Arrastrar el pin esmeralda para ajustar la posición.</li>
                <li>Escribir tu dirección en el campo de texto de abajo.</li>
              </ul>
              <div className="pt-1.5 text-[11px] text-orange-600 border-t border-orange-200/60">
                🔧 **Cómo activarlo:** Haz clic en el icono del candado 🔒 en la barra de direcciones del navegador, cambia &quot;Ubicación&quot; a &quot;Permitir&quot; y recarga la página.
              </div>
            </div>
          )}

          {latitude && longitude && (
            <p className="text-xs text-green-600 font-medium">
              ✓ Ubicación seleccionada: {latitude.toFixed(6)}, {longitude.toFixed(6)}
            </p>
          )}

          <p className="text-xs text-gray-500">
            Toca el mapa o arrastra el pin para seleccionar la ubicación exacta de entrega
          </p>

        </div>
      )}

      {/* Entrada de dirección (Siempre visible y editable para que el usuario pueda completarla o escribirla) */}
      <div className="mt-2">
        <label className="block text-xs font-medium text-gray-500 mb-1">
          {mapMode === 'map' && !mapError 
            ? 'Dirección detectada (puedes completarla con departamento, edificio, etc.):' 
            : 'Escribe tu dirección exacta:'}
        </label>
        <input
          type="text"
          className="w-full rounded-2xl border border-outline-variant bg-surface-container-lowest px-4 py-3 font-body-md text-body-md text-on-surface outline-none focus:border-primary focus:ring-1 focus:ring-primary transition shadow-[0px_4px_12px_rgba(0,0,0,0.02)]"
          value={address}
          onChange={(e) => onAddressChange(e.target.value)}
          placeholder="Ej. Av. de los Shyris 123 y Av. Naciones Unidas, Edificio X, Dpto 4B"
          required={required}
        />
      </div>
    </div>
  )
}
