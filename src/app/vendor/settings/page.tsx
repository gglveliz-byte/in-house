'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ImageUpload } from '@/components/ui/image-upload'
import { LocationPicker } from '@/components/ui/location-picker'

interface Store {
  id: string
  name: string
  slug: string
  description: string | null
  logo: string | null
  banner: string | null
  whatsapp: string
  address: string
  latitude: number | null
  longitude: number | null
  isOpen: boolean
  minOrder: number
  deliveryFee: number
  paymentMethods: string | null
  businessHours: string | null
  ownerId: string
}

export default function VendorSettingsPage() {
  const { data: session, status } = useSession()
  const [store, setStore] = useState<Store | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  // Estados para notificaciones Push PWA
  const [pushSupported, setPushSupported] = useState(false)
  const [notificationPermission, setNotificationPermission] = useState('default')
  const [subscribing, setSubscribing] = useState(false)
  const [testingPush, setTestingPush] = useState(false)
  const [isSubscribed, setIsSubscribed] = useState(false)

  // Verificar compatibilidad y suscripción al montar
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window) {
      setPushSupported(true)
      setNotificationPermission(Notification.permission)
      
      navigator.serviceWorker.ready.then((reg) => {
        reg.pushManager.getSubscription().then((sub) => {
          setIsSubscribed(!!sub)
        })
      })
    }
  }, [])

  // Registrar suscripción Push en el navegador y el servidor
  const handleSubscribe = async () => {
    if (!pushSupported) return
    setSubscribing(true)
    try {
      const permission = await Notification.requestPermission()
      setNotificationPermission(permission)
      if (permission !== 'granted') {
        alert('Permiso de notificaciones denegado.')
        setSubscribing(false)
        return
      }

      const reg = await navigator.serviceWorker.ready
      
      // Obtener la clave pública VAPID del servidor
      const keyRes = await fetch('/api/push/register')
      const { publicKey } = await keyRes.json()

      if (!publicKey) {
        throw new Error('No se pudo recuperar la clave pública VAPID.')
      }

      // Convertir clave base64 a Uint8Array
      const padding = '='.repeat((4 - (publicKey.length % 4)) % 4)
      const base64 = (publicKey + padding).replace(/\-/g, '+').replace(/_/g, '/')
      const rawData = window.atob(base64)
      const outputArray = new Uint8Array(rawData.length)
      for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i)
      }

      // Suscribir dispositivo
      const subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: outputArray
      })

      // Guardar en base de datos local
      const registerRes = await fetch('/api/push/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscription,
          userId: session?.user?.id || null
        })
      })

      if (registerRes.ok) {
        setIsSubscribed(true)
        alert('¡Suscrito con éxito! Recibirás notificaciones push en segundo plano.')
      } else {
        alert('Error al registrar dispositivo en el servidor.')
      }
    } catch (err: unknown) {
      console.error('Error in push registration:', err)
      const msg = err instanceof Error ? err.message : String(err)
      alert(`Fallo en la suscripción: ${msg}`)
    } finally {
      setSubscribing(false)
    }
  }

  // Detonar una notificación de prueba en segundo plano
  const handleTestPush = async () => {
    setTestingPush(true)
    try {
      const res = await fetch('/api/push/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `In-House: ${formData.name || 'Mi Tienda'} 🔔`,
          body: '¡Excelente! Esta es una notificación push de alta fidelidad enviada en segundo plano.',
          link: '/vendor'
        })
      })
      const data = await res.json()
      if (data.success) {
        alert(data.summary)
      } else {
        alert(data.message || 'Error al enviar alerta.')
      }
    } catch (err) {
      console.error('Error testing push notification:', err)
      alert('Error de conexión al enviar prueba push.')
    } finally {
      setTestingPush(false)
    }
  }

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    logo: '',
    banner: '',
    whatsapp: '',
    address: '',
    latitude: null as number | null,
    longitude: null as number | null,
    minOrder: '',
    deliveryFee: '',
    paymentMethods: '',
    businessHours: '',
  })

  // Buscar la tienda del usuario por su ID
  const findUserStore = async (): Promise<Store | null> => {
    if (!session?.user?.id) return null

    try {
      const response = await fetch('/api/stores')
      const stores = await response.json()
      const userStore = stores.find((s: Store) => s.ownerId === session.user.id)
      return userStore || null
    } catch (error) {
      console.error('Error finding store:', error)
      return null
    }
  }

  const loadStoreData = (data: Store) => {
    setStore(data)
    setFormData({
      name: data.name,
      description: data.description || '',
      logo: data.logo || '',
      banner: data.banner || '',
      whatsapp: data.whatsapp,
      address: data.address,
      latitude: data.latitude,
      longitude: data.longitude,
      minOrder: data.minOrder.toString(),
      deliveryFee: data.deliveryFee.toString(),
      paymentMethods: data.paymentMethods || '',
      businessHours: data.businessHours || '',
    })
  }

  const fetchStore = async () => {
    if (status === 'loading') return

    try {
      let storeData: Store | null = null

      // Primero intentar con storeId de la sesión
      if (session?.user?.storeId) {
        const response = await fetch(`/api/stores/${session.user.storeId}`)
        if (response.ok) {
          storeData = await response.json()
        }
      }

      // Si no hay storeId en sesión, buscar por userId
      if (!storeData && session?.user?.id) {
        storeData = await findUserStore()
      }

      if (storeData) {
        loadStoreData(storeData)
      }
    } catch (error) {
      console.error('Error fetching store:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStore()
  }, [session, status])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!store) return

    setSaving(true)

    try {
      await fetch(`/api/stores/${store.slug}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description || null,
          logo: formData.logo || null,
          banner: formData.banner || null,
          whatsapp: formData.whatsapp,
          address: formData.address,
          latitude: formData.latitude,
          longitude: formData.longitude,
          minOrder: parseFloat(formData.minOrder) || 0,
          deliveryFee: parseFloat(formData.deliveryFee) || 0,
          paymentMethods: formData.paymentMethods || null,
          businessHours: formData.businessHours || null,
        }),
      })
      alert('Cambios guardados')
      fetchStore()
    } catch (error) {
      console.error('Error saving store:', error)
      alert('Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  const toggleOpen = async () => {
    if (!store) return

    try {
      await fetch(`/api/stores/${store.slug}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isOpen: !store.isOpen }),
      })
      fetchStore()
    } catch (error) {
      console.error('Error toggling store:', error)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3" />
          <div className="h-64 bg-gray-200 rounded" />
        </div>
      </div>
    )
  }

  if (!store) {
    return (
      <div className="max-w-md mx-auto text-center py-12">
        <Card className="p-8">
          <span className="text-6xl block mb-4">🏪</span>
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            No tienes una tienda asignada
          </h2>
          <p className="text-gray-600">
            Contacta al administrador para que te asigne una tienda.
          </p>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Mi Tienda</h1>
        <div className="flex items-center gap-4">
          <Badge variant={store.isOpen ? 'success' : 'danger'}>
            {store.isOpen ? 'Abierto' : 'Cerrado'}
          </Badge>
          <Button variant="secondary" size="sm" onClick={toggleOpen}>
            {store.isOpen ? 'Cerrar tienda' : 'Abrir tienda'}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <p className="text-sm text-gray-500">
            URL: /tienda/{store.slug}
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Nombre de la tienda"
              id="name"
              required
              value={formData.name}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, name: e.target.value }))
              }
              placeholder="Mi Restaurante"
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descripción
              </label>
              <textarea
                className="input"
                rows={3}
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, description: e.target.value }))
                }
                placeholder="Describe tu negocio..."
              />
            </div>

            <Input
              label="Horario de atención"
              id="businessHours"
              value={formData.businessHours}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, businessHours: e.target.value }))
              }
              placeholder="Ej: Lunes a Viernes 08:00 a 22:00"
            />

            <Input
              label="WhatsApp (con código de país)"
              id="whatsapp"
              required
              value={formData.whatsapp}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, whatsapp: e.target.value }))
              }
              placeholder="521234567890"
            />

            <LocationPicker
              label="Ubicación de la tienda"
              address={formData.address}
              latitude={formData.latitude}
              longitude={formData.longitude}
              onAddressChange={(address) =>
                setFormData((prev) => ({ ...prev, address }))
              }
              onLocationChange={(lat, lng, address) =>
                setFormData((prev) => ({
                  ...prev,
                  latitude: lat,
                  longitude: lng,
                  address,
                }))
              }
              required
            />

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Pedido mínimo ($)"
                id="minOrder"
                type="number"
                step="0.01"
                value={formData.minOrder}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, minOrder: e.target.value }))
                }
                placeholder="0"
              />

              <Input
                label="Costo de envío ($)"
                id="deliveryFee"
                type="number"
                step="0.01"
                value={formData.deliveryFee}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, deliveryFee: e.target.value }))
                }
                placeholder="0"
              />
            </div>

            <div className="border-t pt-4 mt-4">
              <h3 className="font-medium text-gray-700 mb-3 flex items-center gap-2">
                💳 Métodos de pago
              </h3>
              <p className="text-sm text-gray-500 mb-2">
                Ingresa tus cuentas bancarias o métodos de pago. Esta información se mostrará automáticamente al cliente en el chat.
              </p>
              <textarea
                className="input min-h-[120px]"
                rows={5}
                value={formData.paymentMethods}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, paymentMethods: e.target.value }))
                }
                placeholder="Ejemplo:
📱 Banco Pichincha: 2200123456 (Juan Pérez)
📱 Banco Guayaquil: 1234567890 (Juan Pérez)
💵 También acepto efectivo"
              />
            </div>

            <div className="border-t pt-4 mt-4">
              <h3 className="font-medium text-gray-700 mb-3">Imágenes de la tienda</h3>

              <div className="space-y-4">
                <ImageUpload
                  id="store-logo-upload"
                  label="Logo de la tienda"
                  value={formData.logo}
                  onChange={(url) => setFormData((prev) => ({ ...prev, logo: url }))}
                  folder="stores"
                  placeholder="https://ejemplo.com/logo.png"
                />

                <ImageUpload
                  id="store-banner-upload"
                  label="Banner de la tienda"
                  value={formData.banner}
                  onChange={(url) => setFormData((prev) => ({ ...prev, banner: url }))}
                  folder="stores"
                  placeholder="https://ejemplo.com/banner.png"
                />
              </div>
            </div>

            <Button type="submit" className="w-full" loading={saving}>
              Guardar cambios
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* PWA Web Push Notification Settings */}
      <Card className="mt-6 border border-outline-variant hover:shadow-lg transition-shadow">
        <CardHeader>
          <div className="flex items-center gap-2 text-primary font-headline-sm">
            <span className="material-symbols-outlined text-2xl">notifications_active</span>
            <h2 className="text-lg font-bold text-on-surface">Notificaciones en Segundo Plano (PWA)</h2>
          </div>
          <p className="text-body-sm text-on-surface-variant mt-1">
            Recibe alertas instantáneas en tu dispositivo sobre nuevos pedidos en tiempo real, incluso si la pestaña de la aplicación está cerrada.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-xl border border-outline-variant bg-surface-container-lowest">
            <div>
              <p className="text-label-md font-bold text-on-surface">Soporte del Navegador</p>
              <p className="text-body-sm text-on-surface-variant">
                {pushSupported 
                  ? '✅ Tu navegador es compatible con notificaciones push.' 
                  : '❌ Tu navegador o el protocolo de conexión no soporta Web Push.'}
              </p>
            </div>
            {pushSupported && (
              <Badge variant={isSubscribed ? 'success' : 'default'}>
                {isSubscribed ? 'Suscrito' : 'No Suscrito'}
              </Badge>
            )}
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-xl border border-outline-variant bg-surface-container-lowest">
            <div>
              <p className="text-label-md font-bold text-on-surface">Estado de Permisos</p>
              <p className="text-body-sm text-on-surface-variant">
                {notificationPermission === 'granted' && '✅ Permiso de notificaciones autorizado.'}
                {notificationPermission === 'denied' && '❌ Permiso denegado. Habilita los permisos desde la barra de direcciones de tu navegador.'}
                {notificationPermission === 'default' && 'ℹ️ Aún no has concedido permisos de notificaciones.'}
              </p>
            </div>
            {pushSupported && notificationPermission !== 'granted' && (
              <Button onClick={handleSubscribe} loading={subscribing} variant="secondary" size="sm">
                Otorgar Permiso
              </Button>
            )}
          </div>

          {pushSupported && (
            <div className="flex flex-col md:flex-row gap-3 pt-2">
              <Button 
                onClick={handleSubscribe} 
                loading={subscribing} 
                className="flex-1 font-bold active:scale-95 transition-transform" 
                variant={isSubscribed ? 'secondary' : 'primary'}
              >
                {isSubscribed ? '🔄 Sincronizar Dispositivo' : '🔔 Activar Notificaciones'}
              </Button>
              {isSubscribed && (
                <Button 
                  onClick={handleTestPush} 
                  loading={testingPush} 
                  className="flex-1 font-bold active:scale-95 transition-transform bg-green-600 hover:bg-green-700 text-white"
                >
                  <span className="material-symbols-outlined text-[18px] mr-1.5">notifications_active</span>
                  Enviar Prueba Push
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
