'use client'

let googleMapsLoading = false
let googleMapsLoadPromise: Promise<void> | null = null
let leafletLoading = false
let leafletLoadPromise: Promise<void> | null = null

function getGoogleMapsApiKey(): string {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
  if (!apiKey || apiKey === 'tu_api_key') {
    throw new Error('Google Maps API key no configurada')
  }
  return apiKey
}

export function loadGoogleMaps(): Promise<void> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Google Maps solo está disponible en el navegador'))
  }

  if (window.google?.maps) {
    return Promise.resolve()
  }

  if (googleMapsLoading && googleMapsLoadPromise) {
    return googleMapsLoadPromise
  }

  const existingScript = document.querySelector('script[src*="maps.googleapis.com/maps/api/js"]')
  if (existingScript) {
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
      setTimeout(() => {
        if (!window.google?.maps) {
          googleMapsLoading = false
          reject(new Error('Timeout cargando Google Maps'))
        }
      }, 10000)
    })
    return googleMapsLoadPromise
  }

  let apiKey: string
  try {
    apiKey = getGoogleMapsApiKey()
  } catch (error) {
    return Promise.reject(error)
  }

  googleMapsLoading = true
  googleMapsLoadPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script') as HTMLScriptElement
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

export function loadLeaflet(): Promise<void> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Leaflet solo está disponible en el navegador'))
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if ((window as any).L) {
    return Promise.resolve()
  }

  if (leafletLoading && leafletLoadPromise) {
    return leafletLoadPromise
  }

  leafletLoading = true
  leafletLoadPromise = new Promise((resolve, reject) => {
    try {
      const link = document.createElement('link')
      link.rel = 'stylesheet'
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
      document.head.appendChild(link)

      const script = document.createElement('script') as HTMLScriptElement
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
      script.async = true
      script.onload = () => {
        leafletLoading = false
        resolve()
      }
      script.onerror = () => {
        leafletLoading = false
        leafletLoadPromise = null
        reject(new Error('Error cargando Leaflet'))
      }
      document.head.appendChild(script)
    } catch (error) {
      leafletLoading = false
      leafletLoadPromise = null
      reject(error)
    }
  })

  return leafletLoadPromise
}
