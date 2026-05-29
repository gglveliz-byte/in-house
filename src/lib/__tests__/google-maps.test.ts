/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { loadGoogleMaps, loadLeaflet } from '../google-maps'

type WindowWithGoogle = Window & { google?: unknown }
type CreateElementFn = (tagName: string) => HTMLElement
const originalCreateElement = document.createElement.bind(document) as CreateElementFn
const originalGoogle = (window as WindowWithGoogle).google

beforeEach(() => {
  delete process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
  ;(window as WindowWithGoogle).google = undefined
})

afterEach(() => {
  vi.restoreAllMocks()
  document.head.innerHTML = ''
  ;(window as WindowWithGoogle).google = originalGoogle
})

describe('google-maps loader', () => {
  it('rejects when the API key is not configured', async () => {
    await expect(loadGoogleMaps()).rejects.toThrow('Google Maps API key no configurada')
  })

  it('loads Google Maps by appending the script and resolving on onload', async () => {
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY = 'test-key'

    let createdScript: any = null
    const createElementSpy = vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
      const element = originalCreateElement(tagName)
      if (tagName.toLowerCase() === 'script') {
        createdScript = element as HTMLScriptElement
      }
      return element
    })

    const promise = loadGoogleMaps()
    expect(createElementSpy).toHaveBeenCalledWith('script')
    expect(createdScript).toBeTruthy()
    expect(createdScript?.src).toContain('maps.googleapis.com/maps/api/js')
    expect(createdScript?.src).toContain('key=test-key')

    createdScript?.dispatchEvent(new Event('load'))
    await expect(promise).resolves.toBeUndefined()
  })

  it('loads Leaflet by appending CSS and script resources', async () => {
    let createdLink: any = null
    let createdScript: any = null

    vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
      const element = originalCreateElement(tagName)
      if (tagName.toLowerCase() === 'link') {
        createdLink = element as HTMLLinkElement
      }
      if (tagName.toLowerCase() === 'script') {
        createdScript = element as HTMLScriptElement
      }
      return element
    })

    const promise = loadLeaflet()
    expect(createdLink).toBeTruthy()
    expect(createdLink?.href).toContain('unpkg.com/leaflet')
    expect(createdScript).toBeTruthy()
    expect(createdScript?.src).toContain('unpkg.com/leaflet')

    createdScript?.dispatchEvent(new Event('load'))
    await expect(promise).resolves.toBeUndefined()
  })
})
