'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { ImageUpload } from '@/components/ui/image-upload'
import { LocationPicker } from '@/components/ui/location-picker'
import { formatPrice } from '@/lib/utils'

interface Store {
  id: string
  name: string
  slug: string
  address: string
  latitude?: number | null
  longitude?: number | null
  whatsapp: string
  isOpen: boolean
  deliveryFee: number
  minOrder: number
  owner?: {
    id: string
    name: string
    email: string
  }
  _count?: {
    products: number
    orders: number
  }
}

interface Vendor {
  id: string
  name: string
  email: string
  stores: { id: string; name: string }[]
}

export default function AdminStoresPage() {
  const [stores, setStores] = useState<Store[]>([])
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editingStoreId, setEditingStoreId] = useState<string | null>(null)
  const [ownerMode, setOwnerMode] = useState<'existing' | 'new'>('existing')
  const [selectedVendorId, setSelectedVendorId] = useState('')
  const [formData, setFormData] = useState({
    // Datos de la tienda
    storeName: '',
    slug: '',
    address: '',
    latitude: null as number | null,
    longitude: null as number | null,
    whatsapp: '',
    minOrder: '0',
    deliveryFee: '0',
    minDeliveryFee: '0',
    maxDeliveryFee: '0',
    logo: '',
    banner: '',
    // Datos del vendedor nuevo
    ownerName: '',
    ownerEmail: '',
    ownerPassword: '',
  })

  const fetchStores = async () => {
    try {
      const response = await fetch('/api/stores')
      const data = await response.json()
      setStores(data)
    } catch (error) {
      console.error('Error fetching stores:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchVendors = async () => {
    try {
      const response = await fetch('/api/users?role=VENDOR')
      const data = await response.json()
      setVendors(data)
    } catch (error) {
      console.error('Error fetching vendors:', error)
    }
  }

  useEffect(() => {
    fetchStores()
    fetchVendors()
  }, [])

  // Ahora todos los vendedores están disponibles (pueden tener múltiples tiendas)

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
  }

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value
    setFormData((prev) => ({
      ...prev,
      storeName: name,
      slug: generateSlug(name),
    }))
  }

  const resetForm = () => {
    setFormData({
      storeName: '',
      slug: '',
      address: '',
      latitude: null,
      longitude: null,
      whatsapp: '',
      minOrder: '0',
      deliveryFee: '0',
      minDeliveryFee: '0',
      maxDeliveryFee: '0',
      logo: '',
      banner: '',
      ownerName: '',
      ownerEmail: '',
      ownerPassword: '',
    })
    setSelectedVendorId('')
    setOwnerMode('existing')
    setEditingStoreId(null)
  }

  const loadStoreForEdit = async (storeSlug: string) => {
    try {
      const response = await fetch(`/api/stores/${storeSlug}`)
      if (!response.ok) throw new Error('Error al cargar tienda')
      const store = await response.json()
      
      setFormData({
        storeName: store.name,
        slug: store.slug,
        address: store.address,
        latitude: store.latitude,
        longitude: store.longitude,
        whatsapp: store.whatsapp,
        minOrder: store.minOrder?.toString() || '0',
        deliveryFee: store.deliveryFee?.toString() || '0',
        minDeliveryFee: (store as any).minDeliveryFee?.toString() || '0',
        maxDeliveryFee: (store as any).maxDeliveryFee?.toString() || '0',
        logo: store.logo || '',
        banner: store.banner || '',
        ownerName: '',
        ownerEmail: '',
        ownerPassword: '',
      })
      setSelectedVendorId(store.ownerId)
      setOwnerMode('existing')
      setEditingStoreId(store.id)
      setShowModal(true)
    } catch (error) {
      console.error('Error loading store:', error)
      alert('Error al cargar la tienda')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      // Si estamos editando, solo actualizar la tienda
      if (editingStoreId) {
        const store = stores.find(s => s.id === editingStoreId)
        if (!store) throw new Error('Tienda no encontrada')

        const storeResponse = await fetch(`/api/stores/${store.slug}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: formData.storeName,
            slug: formData.slug,
            address: formData.address,
            latitude: formData.latitude,
            longitude: formData.longitude,
            whatsapp: formData.whatsapp,
            minOrder: parseFloat(formData.minOrder) || 0,
            deliveryFee: parseFloat(formData.deliveryFee) || 0,
            minDeliveryFee: parseFloat(formData.minDeliveryFee) || 0,
            maxDeliveryFee: parseFloat(formData.maxDeliveryFee) || 0,
            logo: formData.logo || null,
            banner: formData.banner || null,
          }),
        })

        if (!storeResponse.ok) {
          const error = await storeResponse.json()
          throw new Error(error.error || 'Error al actualizar tienda')
        }

        alert('Tienda actualizada correctamente')
        setShowModal(false)
        resetForm()
        fetchStores()
        return
      }

      // Si estamos creando, seguir el flujo normal
      let ownerId: string

      if (ownerMode === 'new') {
        // Crear nuevo vendedor
        const userResponse = await fetch('/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: formData.ownerName,
            email: formData.ownerEmail,
            password: formData.ownerPassword,
            role: 'VENDOR',
          }),
        })

        if (!userResponse.ok) {
          const error = await userResponse.json()
          throw new Error(error.error || 'Error al crear usuario')
        }

        const user = await userResponse.json()
        ownerId = user.id
      } else {
        // Usar vendedor existente
        if (!selectedVendorId) {
          throw new Error('Selecciona un vendedor')
        }
        ownerId = selectedVendorId
      }

      // Crear la tienda
      const storeResponse = await fetch('/api/stores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: formData.storeName,
            slug: formData.slug,
            address: formData.address,
            latitude: formData.latitude,
            longitude: formData.longitude,
            whatsapp: formData.whatsapp,
            minOrder: parseFloat(formData.minOrder) || 0,
            deliveryFee: parseFloat(formData.deliveryFee) || 0,
            minDeliveryFee: parseFloat(formData.minDeliveryFee) || 0,
            maxDeliveryFee: parseFloat(formData.maxDeliveryFee) || 0,
            logo: formData.logo || null,
            banner: formData.banner || null,
            ownerId,
          }),
      })

      if (!storeResponse.ok) {
        const error = await storeResponse.json()
        throw new Error(error.error || 'Error al crear tienda')
      }

      alert('Tienda creada correctamente')
      setShowModal(false)
      resetForm()
      fetchStores()
      fetchVendors()
    } catch (error) {
      console.error('Error:', error)
      alert(error instanceof Error ? error.message : 'Error al procesar tienda')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3" />
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-48 bg-gray-200 rounded" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Tiendas</h1>
        <Button onClick={() => setShowModal(true)}>+ Nueva tienda</Button>
      </div>

      {stores.length === 0 ? (
        <Card className="text-center py-12">
          <p className="text-gray-500">No hay tiendas registradas</p>
          <Button className="mt-4" onClick={() => setShowModal(true)}>
            Crear primera tienda
          </Button>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {stores.map((store) => (
            <Card key={store.id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-lg">{store.name}</h3>
                    <p className="text-sm text-gray-500">{store.address}</p>
                  </div>
                  <Badge variant={store.isOpen ? 'success' : 'danger'}>
                    {store.isOpen ? 'Abierto' : 'Cerrado'}
                  </Badge>
                </div>

                <div className="text-sm text-gray-600 mb-2">
                  <p>WhatsApp: {store.whatsapp}</p>
                  <p>Pedido mín: {formatPrice(store.minOrder)}</p>
                  <p>Envío: {formatPrice(store.deliveryFee)}</p>
                </div>

                {store.owner && (
                  <p className="text-xs text-gray-400 mb-4">
                    Dueño: {store.owner.name} ({store.owner.email})
                  </p>
                )}

                <div className="flex gap-2">
                  <Link href={`/tienda/${store.slug}`} className="flex-1">
                    <Button variant="secondary" size="sm" className="w-full">
                      Ver tienda
                    </Button>
                  </Link>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => loadStoreForEdit(store.slug)}
                  >
                    Editar
                  </Button>
                  <Button
                    variant={store.isOpen ? "secondary" : "primary"}
                    size="sm"
                    onClick={async () => {
                      if (!confirm(store.isOpen ? '¿Cerrar esta tienda?' : '¿Abrir esta tienda?')) return
                      try {
                        const response = await fetch(`/api/stores/${store.slug}`, {
                          method: 'PATCH',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ isOpen: !store.isOpen }),
                        })
                        if (response.ok) {
                          fetchStores()
                        } else {
                          const error = await response.json()
                          alert(error.error || 'Error al actualizar estado')
                        }
                      } catch (error) {
                        console.error('Error:', error)
                        alert('Error al actualizar estado')
                      }
                    }}
                    title={store.isOpen ? 'Cerrar tienda' : 'Abrir tienda'}
                  >
                    {store.isOpen ? '🔒 Cerrar' : '🔓 Abrir'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modal de crear tienda */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">
                  {editingStoreId ? 'Editar Tienda' : 'Nueva Tienda'}
                </h2>
                <button
                  onClick={() => {
                    setShowModal(false)
                    resetForm()
                  }}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  &times;
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Sección: Datos de la tienda */}
                <div className="border-b pb-4 mb-4">
                  <h3 className="font-medium text-gray-700 mb-3">Datos de la Tienda</h3>

                  <Input
                    label="Nombre de la tienda"
                    id="storeName"
                    required
                    value={formData.storeName}
                    onChange={handleNameChange}
                    placeholder="Ej: Tacos El Güero"
                  />

                  {!editingStoreId && (
                    <div className="mt-3">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        URL (slug)
                      </label>
                      <div className="flex items-center">
                        <span className="text-sm text-gray-500 mr-1">/tienda/</span>
                        <input
                          type="text"
                          className="input flex-1"
                          value={formData.slug}
                          onChange={(e) =>
                            setFormData((prev) => ({ ...prev, slug: e.target.value }))
                          }
                          placeholder="tacos-el-guero"
                          required
                        />
                      </div>
                    </div>
                  )}
                  {editingStoreId && (
                    <div className="mt-3">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        URL (slug)
                      </label>
                      <div className="flex items-center">
                        <span className="text-sm text-gray-500 mr-1">/tienda/</span>
                        <input
                          type="text"
                          className="input flex-1 bg-gray-100"
                          value={formData.slug}
                          disabled
                          readOnly
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        El slug no se puede modificar después de crear la tienda
                      </p>
                    </div>
                  )}

                  <div className="mt-3">
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
                  </div>

                  <Input
                    label="WhatsApp (con código de país)"
                    id="whatsapp"
                    required
                    value={formData.whatsapp}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, whatsapp: e.target.value }))
                    }
                    placeholder="521234567890"
                    className="mt-3"
                  />

                  <div className="grid grid-cols-2 gap-3 mt-3">
                    <Input
                      label="Pedido mínimo ($)"
                      id="minOrder"
                      type="number"
                      step="0.01"
                      value={formData.minOrder}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, minOrder: e.target.value }))
                      }
                    />
                    <Input
                      label="Costo de envío fijo ($)"
                      id="deliveryFee"
                      type="number"
                      step="0.01"
                      value={formData.deliveryFee}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, deliveryFee: e.target.value }))
                      }
                      placeholder="Si hay rango, dejar en 0"
                    />
                  </div>

                  <div className="mt-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-sm font-medium text-blue-900 mb-3">
                      💰 Rango de envío (el repartidor cobrará según la distancia)
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      <Input
                        label="Precio mínimo de envío ($)"
                        id="minDeliveryFee"
                        type="number"
                        step="0.01"
                        value={formData.minDeliveryFee}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, minDeliveryFee: e.target.value }))
                        }
                        placeholder="Ej: 2.00"
                      />
                      <Input
                        label="Precio máximo de envío ($)"
                        id="maxDeliveryFee"
                        type="number"
                        step="0.01"
                        value={formData.maxDeliveryFee}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, maxDeliveryFee: e.target.value }))
                        }
                        placeholder="Ej: 5.00"
                      />
                    </div>
                    <p className="text-xs text-blue-600 mt-2">
                      Si configuras un rango, el cliente verá "El envío vale entre $X y $Y" y pagará al repartidor al entregar.
                    </p>
                  </div>

                  <div className="mt-4 space-y-4">
                    <ImageUpload
                      id="admin-store-logo-upload"
                      label="Logo de la tienda"
                      value={formData.logo}
                      onChange={(url) => setFormData((prev) => ({ ...prev, logo: url }))}
                      folder="stores"
                      placeholder="https://ejemplo.com/logo.png"
                    />
                    <ImageUpload
                      id="admin-store-banner-upload"
                      label="Banner de la tienda"
                      value={formData.banner}
                      onChange={(url) => setFormData((prev) => ({ ...prev, banner: url }))}
                      folder="stores"
                      placeholder="https://ejemplo.com/banner.png"
                    />
                  </div>
                </div>

                {/* Sección: Asignar vendedor - Solo al crear */}
                {!editingStoreId && (
                <div>
                  <h3 className="font-medium text-gray-700 mb-3">Asignar Vendedor (Dueño)</h3>

                  {/* Toggle entre existente y nuevo */}
                  <div className="flex gap-2 mb-4">
                    <button
                      type="button"
                      onClick={() => setOwnerMode('existing')}
                      className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                        ownerMode === 'existing'
                          ? 'bg-primary-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      Vendedor existente
                    </button>
                    <button
                      type="button"
                      onClick={() => setOwnerMode('new')}
                      className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                        ownerMode === 'new'
                          ? 'bg-primary-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      Crear nuevo
                    </button>
                  </div>

                  {ownerMode === 'existing' ? (
                    <div>
                      {vendors.length === 0 ? (
                        <div className="text-center py-4 bg-gray-50 rounded-lg">
                          <p className="text-sm text-gray-500 mb-2">
                            No hay vendedores registrados
                          </p>
                          <button
                            type="button"
                            onClick={() => setOwnerMode('new')}
                            className="text-sm text-primary-600 hover:underline"
                          >
                            Crear nuevo vendedor
                          </button>
                        </div>
                      ) : (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Seleccionar vendedor
                          </label>
                          <select
                            className="input"
                            value={selectedVendorId}
                            onChange={(e) => setSelectedVendorId(e.target.value)}
                            required={ownerMode === 'existing'}
                          >
                            <option value="">-- Selecciona un vendedor --</option>
                            {vendors.map((vendor: Vendor) => (
                              <option key={vendor.id} value={vendor.id}>
                                {vendor.name} ({vendor.email}) {vendor.stores.length > 0 ? `- ${vendor.stores.length} tienda(s)` : ''}
                              </option>
                            ))}
                          </select>
                          <p className="text-xs text-gray-500 mt-1">
                            Un vendedor puede tener múltiples tiendas
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <Input
                        label="Nombre completo"
                        id="ownerName"
                        required={ownerMode === 'new'}
                        value={formData.ownerName}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, ownerName: e.target.value }))
                        }
                        placeholder="Juan Pérez"
                      />

                      <Input
                        label="Email (para login)"
                        id="ownerEmail"
                        type="email"
                        required={ownerMode === 'new'}
                        value={formData.ownerEmail}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, ownerEmail: e.target.value }))
                        }
                        placeholder="juan@ejemplo.com"
                      />

                      <Input
                        label="Contraseña"
                        id="ownerPassword"
                        type="password"
                        required={ownerMode === 'new'}
                        minLength={6}
                        value={formData.ownerPassword}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, ownerPassword: e.target.value }))
                        }
                        placeholder="Mínimo 6 caracteres"
                      />
                    </div>
                  )}
                </div>
                )}

                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="secondary"
                    className="flex-1"
                    onClick={() => {
                      setShowModal(false)
                      resetForm()
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1"
                    loading={saving}
                    disabled={!editingStoreId && ownerMode === 'existing' && vendors.length === 0}
                  >
                    {editingStoreId ? 'Guardar Cambios' : 'Crear Tienda'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
