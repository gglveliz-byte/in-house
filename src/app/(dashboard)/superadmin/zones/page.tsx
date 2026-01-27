'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'

interface Zone {
  id: string
  name: string
  description: string | null
  latitude: number
  longitude: number
  radius: number
  isActive: boolean
  createdAt: string
  _count?: {
    admins: number
    stores: number
    orders: number
  }
}

export default function ZonesPage() {
  const [zones, setZones] = useState<Zone[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingZone, setEditingZone] = useState<Zone | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    latitude: '',
    longitude: '',
    radius: '10',
  })

  useEffect(() => {
    fetchZones()
  }, [])

  const fetchZones = async () => {
    try {
      const response = await fetch('/api/superadmin/zones')
      if (response.ok) {
        const data = await response.json()
        setZones(data)
      }
    } catch (error) {
      console.error('Error fetching zones:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
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
        }),
      })

      if (response.ok) {
        fetchZones()
        resetForm()
        alert(editingZone ? '✅ Zona actualizada' : '✅ Zona creada')
      }
    } catch (error) {
      console.error('Error saving zone:', error)
      alert('Error al guardar la zona')
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
    })
    setShowForm(true)
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
      }
    } catch (error) {
      console.error('Error toggling zone:', error)
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
    })
  }

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-gray-200 rounded w-1/3" />
        <div className="h-64 bg-gray-200 rounded" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">🗺️ Gestión de Zonas</h1>
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancelar' : '+ Nueva Zona'}
        </Button>
      </div>

      {/* Form */}
      {showForm && (
        <Card className="border-2 border-purple-200">
          <CardHeader>
            <h2 className="text-lg font-bold">
              {editingZone ? 'Editar Zona' : 'Nueva Zona'}
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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              </div>
              <p className="text-sm text-gray-500">
                💡 Tip: Puedes obtener las coordenadas desde Google Maps haciendo clic derecho en el mapa.
              </p>
              <div className="flex gap-2">
                <Button type="submit">
                  {editingZone ? 'Actualizar' : 'Crear Zona'}
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
          <Card className="col-span-full text-center py-12">
            <p className="text-4xl mb-4">🗺️</p>
            <p className="text-gray-500">No hay zonas creadas</p>
            <Button onClick={() => setShowForm(true)} className="mt-4">
              Crear primera zona
            </Button>
          </Card>
        ) : (
          zones.map((zone) => (
            <Card key={zone.id} className={!zone.isActive ? 'opacity-60' : ''}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-bold text-lg text-gray-900">{zone.name}</h3>
                    {zone.description && (
                      <p className="text-sm text-gray-500">{zone.description}</p>
                    )}
                  </div>
                  <Badge className={zone.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}>
                    {zone.isActive ? 'Activa' : 'Inactiva'}
                  </Badge>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">📍 Coordenadas:</span>
                    <span className="font-mono text-xs">
                      {zone.latitude.toFixed(6)}, {zone.longitude.toFixed(6)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">📏 Radio:</span>
                    <span>{zone.radius} km</span>
                  </div>
                  {zone._count && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-gray-500">👥 Admins:</span>
                        <span className="font-medium">{zone._count.admins}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">🏪 Tiendas:</span>
                        <span className="font-medium">{zone._count.stores}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">📦 Pedidos:</span>
                        <span className="font-medium">{zone._count.orders}</span>
                      </div>
                    </>
                  )}
                </div>

                <div className="flex gap-2 mt-4 pt-4 border-t">
                  <Button size="sm" variant="secondary" onClick={() => handleEdit(zone)}>
                    ✏️ Editar
                  </Button>
                  <Button
                    size="sm"
                    variant={zone.isActive ? 'danger' : 'primary'}
                    onClick={() => handleToggleActive(zone)}
                  >
                    {zone.isActive ? '🚫 Desactivar' : '✅ Activar'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
