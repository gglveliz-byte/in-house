'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'

const CURRENCY_OPTIONS = [
  { code: 'USD', label: 'USD - Dólar estadounidense' },
  { code: 'MXN', label: 'MXN - Peso mexicano' },
  { code: 'COP', label: 'COP - Peso colombiano' },
  { code: 'ARS', label: 'ARS - Peso argentino' },
  { code: 'PEN', label: 'PEN - Sol peruano' },
  { code: 'CLP', label: 'CLP - Peso chileno' },
  { code: 'BRL', label: 'BRL - Real brasileño' },
  { code: 'EUR', label: 'EUR - Euro' },
  { code: 'VES', label: 'VES - Bolívar venezolano' },
  { code: 'BOB', label: 'BOB - Boliviano' },
  { code: 'UYU', label: 'UYU - Peso uruguayo' },
  { code: 'PYG', label: 'PYG - Guaraní paraguayo' },
  { code: 'GTQ', label: 'GTQ - Quetzal guatemalteco' },
  { code: 'HNL', label: 'HNL - Lempira hondureño' },
  { code: 'NIO', label: 'NIO - Córdoba nicaragüense' },
  { code: 'CRC', label: 'CRC - Colón costarricense' },
  { code: 'PAB', label: 'PAB - Balboa panameño' },
  { code: 'DOP', label: 'DOP - Peso dominicano' },
  { code: 'CUP', label: 'CUP - Peso cubano' },
]

interface Zone {
  id: string
  name: string
  description: string | null
  latitude: number
  longitude: number
  radius: number
  currency: string
  isActive: boolean
  createdAt: string
  _count?: {
    admins: number
    stores: number
    orders: number
  }
}

type ToastType = 'success' | 'error' | 'info'

interface Toast {
  message: string
  type: ToastType
}

export default function ZonesPage() {
  const [zones, setZones] = useState<Zone[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingZone, setEditingZone] = useState<Zone | null>(null)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [toast, setToast] = useState<Toast | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    latitude: '',
    longitude: '',
    radius: '10',
    currency: 'USD',
  })

  useEffect(() => {
    fetchZones()
  }, [])

  const showToast = (message: string, type: ToastType = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3500)
  }

  const fetchZones = async () => {
    try {
      const response = await fetch('/api/superadmin/zones')
      if (response.ok) {
        const data = await response.json()
        setZones(data)
      }
    } catch (error) {
      console.error('Error fetching zones:', error)
      showToast('Error al cargar zonas', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const url = editingZone
        ? `/api/superadmin/zones/${editingZone.id}`
        : '/api/superadmin/zones'

      const response = await fetch(url, {
        method: editingZone ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description || null,
          latitude: parseFloat(formData.latitude),
          longitude: parseFloat(formData.longitude),
          radius: parseFloat(formData.radius),
          currency: formData.currency,
        }),
      })

      if (response.ok) {
        fetchZones()
        resetForm()
        showToast(editingZone ? 'Zona actualizada correctamente' : 'Zona creada correctamente', 'success')
      } else {
        const err = await response.json()
        showToast(err.error || 'Error al guardar zona', 'error')
      }
    } catch {
      showToast('Error de conexión', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (zone: Zone) => {
    setEditingZone(zone)
    setFormData({
      name: zone.name,
      description: zone.description || '',
      latitude: zone.latitude.toString(),
      longitude: zone.longitude.toString(),
      radius: zone.radius.toString(),
      currency: zone.currency || 'USD',
    })
    setShowForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleToggleActive = async (zone: Zone) => {
    try {
      const response = await fetch(`/api/superadmin/zones/${zone.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !zone.isActive }),
      })

      if (response.ok) {
        fetchZones()
        showToast(zone.isActive ? 'Zona desactivada' : 'Zona activada', 'info')
      }
    } catch {
      showToast('Error al actualizar zona', 'error')
    }
  }

  const handleDelete = async (zoneId: string) => {
    setDeletingId(zoneId)
    try {
      const response = await fetch(`/api/superadmin/zones/${zoneId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        fetchZones()
        setConfirmDeleteId(null)
        showToast('Zona eliminada correctamente', 'success')
      } else {
        const err = await response.json()
        showToast(err.error || 'No se puede eliminar esta zona', 'error')
        setConfirmDeleteId(null)
      }
    } catch {
      showToast('Error al eliminar zona', 'error')
      setConfirmDeleteId(null)
    } finally {
      setDeletingId(null)
    }
  }

  const resetForm = () => {
    setShowForm(false)
    setEditingZone(null)
    setFormData({
      name: '',
      description: '',
      latitude: '',
      longitude: '',
      radius: '10',
      currency: 'USD',
    })
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-gray-200 rounded w-48 animate-pulse" />
        <div className="h-48 bg-gray-200 rounded-xl animate-pulse" />
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-40 bg-gray-200 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-xl shadow-lg text-white text-sm font-medium flex items-center gap-2 animate-pulse ${
            toast.type === 'success' ? 'bg-emerald-600' :
            toast.type === 'error' ? 'bg-red-600' : 'bg-[#003f87]'
          }`}
        >
          {toast.type === 'success' ? '✓' : toast.type === 'error' ? '✕' : 'ℹ'} {toast.message}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">🗺️ Gestión de Zonas</h1>
          <p className="text-sm text-gray-500 mt-0.5">{zones.length} zona{zones.length !== 1 ? 's' : ''} registrada{zones.length !== 1 ? 's' : ''}</p>
        </div>
        <Button onClick={() => { resetForm(); setShowForm(!showForm) }}>
          {showForm ? 'Cancelar' : '+ Nueva Zona'}
        </Button>
      </div>

      {/* Form */}
      {showForm && (
        <Card className="border-2 border-[#003f87]/20 shadow-sm">
          <CardHeader>
            <h2 className="text-lg font-bold text-gray-900">
              {editingZone ? '✏️ Editar Zona' : '🆕 Nueva Zona'}
            </h2>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Nombre de la zona"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ej: Roberto Astudillo - Los Ríos"
                  required
                />
                <Input
                  label="Descripción (opcional)"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descripción de la zona"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Input
                  label="Latitud"
                  type="number"
                  step="any"
                  value={formData.latitude}
                  onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                  placeholder="-2.182874"
                  required
                />
                <Input
                  label="Longitud"
                  type="number"
                  step="any"
                  value={formData.longitude}
                  onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                  placeholder="-79.518009"
                  required
                />
                <Input
                  label="Radio (km)"
                  type="number"
                  value={formData.radius}
                  onChange={(e) => setFormData({ ...formData, radius: e.target.value })}
                  placeholder="10"
                />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Moneda</label>
                  <select
                    value={formData.currency}
                    onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-[#003f87] focus:outline-none focus:ring-1 focus:ring-[#003f87]"
                  >
                    {CURRENCY_OPTIONS.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <p className="text-sm text-gray-500 bg-blue-50 border border-blue-100 rounded-lg p-3">
                💡 <strong>Tip:</strong> Puedes obtener las coordenadas desde Google Maps haciendo clic derecho en el mapa y seleccionando &quot;¿Qué hay aquí?&quot;
              </p>
              <div className="flex gap-3">
                <Button type="submit" loading={saving}>
                  {editingZone ? 'Actualizar Zona' : 'Crear Zona'}
                </Button>
                <Button type="button" variant="secondary" onClick={resetForm}>
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Zones List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {zones.length === 0 ? (
          <div className="col-span-full">
            <Card className="text-center py-16">
              <span className="text-5xl block mb-4">🗺️</span>
              <p className="text-gray-500 font-medium">No hay zonas creadas</p>
              <p className="text-gray-400 text-sm mt-1">Crea tu primera zona para comenzar</p>
              <Button onClick={() => setShowForm(true)} className="mt-4">
                Crear primera zona
              </Button>
            </Card>
          </div>
        ) : (
          zones.map((zone) => (
            <Card key={zone.id} className={`transition-all duration-200 ${!zone.isActive ? 'opacity-60' : 'hover:shadow-md'}`}>
              <CardContent className="pt-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-bold text-gray-900">{zone.name}</h3>
                    {zone.description && (
                      <p className="text-sm text-gray-500 mt-0.5">{zone.description}</p>
                    )}
                  </div>
                  <Badge className={zone.isActive ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 'bg-gray-100 text-gray-600 border border-gray-200'}>
                    {zone.isActive ? '● Activa' : '○ Inactiva'}
                  </Badge>
                </div>

                <div className="space-y-1.5 text-sm mb-4">
                  <div className="flex justify-between">
                    <span className="text-gray-500">📍 Coordenadas:</span>
                    <span className="font-mono text-xs text-gray-700">
                      {zone.latitude.toFixed(4)}, {zone.longitude.toFixed(4)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">📏 Radio:</span>
                    <span className="font-medium">{zone.radius} km</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">💱 Moneda:</span>
                    <span className="font-semibold text-[#003f87]">{zone.currency || 'USD'}</span>
                  </div>
                  {zone._count && (
                    <>
                      <div className="border-t pt-1.5 mt-1.5">
                        <div className="flex justify-between">
                          <span className="text-gray-500">👥 Admins:</span>
                          <span className="font-semibold">{zone._count.admins}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">🏪 Tiendas:</span>
                          <span className="font-semibold">{zone._count.stores}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">📦 Pedidos:</span>
                          <span className="font-semibold">{zone._count.orders}</span>
                        </div>
                      </div>
                    </>
                  )}
                </div>

                <div className="flex gap-2 pt-3 border-t">
                  <Button size="sm" variant="secondary" onClick={() => handleEdit(zone)} className="flex-1">
                    ✏️ Editar
                  </Button>
                  <Button
                    size="sm"
                    variant={zone.isActive ? 'secondary' : 'primary'}
                    onClick={() => handleToggleActive(zone)}
                    className={zone.isActive ? 'text-amber-600 border-amber-200 hover:bg-amber-50' : ''}
                  >
                    {zone.isActive ? '🚫' : '✅'}
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => setConfirmDeleteId(zone.id)}
                    className="text-red-600 border-red-100 hover:bg-red-50"
                  >
                    🗑️
                  </Button>
                </div>

                {/* Inline delete confirmation */}
                {confirmDeleteId === zone.id && (
                  <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-800 font-medium mb-2">
                      ⚠️ ¿Eliminar zona &quot;{zone.name}&quot;?
                    </p>
                    <p className="text-xs text-red-600 mb-3">
                      Esta acción no se puede deshacer. Se desvinculará de todos los admins asociados.
                    </p>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="danger"
                        loading={deletingId === zone.id}
                        onClick={() => handleDelete(zone.id)}
                        className="flex-1"
                      >
                        Sí, eliminar
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => setConfirmDeleteId(null)}
                        className="flex-1"
                      >
                        Cancelar
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
