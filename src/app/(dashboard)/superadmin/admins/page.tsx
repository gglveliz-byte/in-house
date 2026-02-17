'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { formatPrice, formatDate } from '@/lib/utils'
import Link from 'next/link'

interface Zone {
  id: string
  name: string
}

interface Admin {
  id: string
  name: string
  email: string
  phone: string | null
  registeredAt: string | null
  createdAt: string
  zone: Zone | null
  _count?: {
    stores: number
  }
  stats?: {
    totalOrders: number
    completedOrders: number
    totalDeliveryRevenue: number
    totalDrivers: number
  }
}

export default function AdminsPage() {
  const { data: session } = useSession()
  const [admins, setAdmins] = useState<Admin[]>([])
  const [zones, setZones] = useState<Zone[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingAdmin, setEditingAdmin] = useState<Admin | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    zoneId: '',
  })

  useEffect(() => {
    fetchAdmins()
    fetchZones()
  }, [])

  const fetchAdmins = async () => {
    try {
      const response = await fetch('/api/superadmin/admins')
      if (response.ok) {
        const data = await response.json()
        setAdmins(data)
      }
    } catch (error) {
      console.error('Error fetching admins:', error)
    } finally {
      setLoading(false)
    }
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
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const url = editingAdmin 
        ? `/api/superadmin/admins/${editingAdmin.id}`
        : '/api/superadmin/admins'
      
      const body: Record<string, unknown> = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone || null,
        zoneId: formData.zoneId || null,
        superAdminId: session?.user.id,
      }
      
      if (formData.password) {
        body.password = formData.password
      }

      const response = await fetch(url, {
        method: editingAdmin ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (response.ok) {
        fetchAdmins()
        resetForm()
        alert(editingAdmin ? '✅ Admin actualizado' : '✅ Admin creado')
      } else {
        const error = await response.json()
        alert(error.error || 'Error al guardar')
      }
    } catch (error) {
      console.error('Error saving admin:', error)
      alert('Error al guardar el administrador')
    }
  }

  const handleDelete = async (admin: Admin) => {
    const storeCount = admin._count?.stores || 0
    const orderCount = admin.stats?.totalOrders || 0
    const driverCount = admin.stats?.totalDrivers || 0

    const confirmMsg = `ADVERTENCIA: Vas a eliminar al administrador "${admin.name}" y TODO lo que creó:\n\n` +
      `- ${storeCount} tienda(s)\n` +
      `- ${driverCount} repartidor(es)\n` +
      `- ${orderCount} pedido(s)\n` +
      `- Su zona: ${admin.zone?.name || 'Sin zona'}\n` +
      `- Todos los productos, categorías, mensajes y datos asociados\n\n` +
      `Esta acción NO se puede deshacer. ¿Estás seguro?`

    if (!confirm(confirmMsg)) return

    // Segunda confirmación
    if (!confirm('¿REALMENTE estás seguro? Se perderán TODOS los datos permanentemente.')) return

    try {
      const response = await fetch(`/api/superadmin/admins/${admin.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        alert('Admin y todos sus datos eliminados correctamente')
        fetchAdmins()
      } else {
        const error = await response.json()
        alert(error.error || 'Error al eliminar')
      }
    } catch (error) {
      console.error('Error deleting admin:', error)
      alert('Error al eliminar el administrador')
    }
  }

  const handleEdit = (admin: Admin) => {
    setEditingAdmin(admin)
    setFormData({
      name: admin.name,
      email: admin.email,
      password: '',
      phone: admin.phone || '',
      zoneId: admin.zone?.id || '',
    })
    setShowForm(true)
  }

  const resetForm = () => {
    setShowForm(false)
    setEditingAdmin(null)
    setFormData({
      name: '',
      email: '',
      password: '',
      phone: '',
      zoneId: '',
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
        <h1 className="text-2xl font-bold text-gray-900">👥 Gestión de Administradores</h1>
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancelar' : '+ Nuevo Admin'}
        </Button>
      </div>

      {/* Form */}
      {showForm && (
        <Card className="border-2 border-purple-200">
          <CardHeader>
            <h2 className="text-lg font-bold">
              {editingAdmin ? 'Editar Administrador' : 'Nuevo Administrador'}
            </h2>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Nombre completo"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Nombre del administrador"
                  required
                />
                <Input
                  label="Email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="admin@ejemplo.com"
                  required
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label={editingAdmin ? "Nueva contraseña (dejar vacío para mantener)" : "Contraseña"}
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="********"
                  required={!editingAdmin}
                />
                <Input
                  label="Teléfono (opcional)"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+593 999 999 999"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Zona asignada
                </label>
                <select
                  value={formData.zoneId}
                  onChange={(e) => setFormData({ ...formData, zoneId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  required
                >
                  <option value="">Seleccionar zona...</option>
                  {zones.map((zone) => (
                    <option key={zone.id} value={zone.id}>
                      {zone.name}
                    </option>
                  ))}
                </select>
                {zones.length === 0 && (
                  <p className="text-sm text-red-500 mt-1">
                    ⚠️ Primero debes crear una zona
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={zones.length === 0}>
                  {editingAdmin ? 'Actualizar' : 'Crear Admin'}
                </Button>
                <Button type="button" variant="secondary" onClick={resetForm}>
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Admins List */}
      <div className="space-y-4">
        {admins.length === 0 ? (
          <Card className="text-center py-12">
            <p className="text-4xl mb-4">👥</p>
            <p className="text-gray-500">No hay administradores registrados</p>
            {zones.length === 0 ? (
              <Link href="/superadmin/zones" className="text-purple-600 hover:underline mt-2 inline-block">
                Primero crea una zona →
              </Link>
            ) : (
              <Button onClick={() => setShowForm(true)} className="mt-4">
                Crear primer administrador
              </Button>
            )}
          </Card>
        ) : (
          admins.map((admin) => (
            <Card key={admin.id}>
              <CardContent className="pt-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  {/* Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-bold text-lg text-gray-900">{admin.name}</h3>
                      {admin.zone && (
                        <Badge className="bg-purple-100 text-purple-700">
                          📍 {admin.zone.name}
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm text-gray-500 space-y-1">
                      <p>📧 {admin.email}</p>
                      {admin.phone && <p>📞 {admin.phone}</p>}
                      <p>📅 Registrado: {admin.registeredAt ? formatDate(admin.registeredAt) : formatDate(admin.createdAt)}</p>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                    <div className="bg-blue-50 px-4 py-2 rounded-lg">
                      <p className="text-2xl font-bold text-blue-600">{admin._count?.stores || 0}</p>
                      <p className="text-xs text-blue-500">Tiendas</p>
                    </div>
                    <div className="bg-green-50 px-4 py-2 rounded-lg">
                      <p className="text-2xl font-bold text-green-600">{admin.stats?.totalDrivers || 0}</p>
                      <p className="text-xs text-green-500">Repartidores</p>
                    </div>
                    <div className="bg-orange-50 px-4 py-2 rounded-lg">
                      <p className="text-2xl font-bold text-orange-600">{admin.stats?.completedOrders || 0}</p>
                      <p className="text-xs text-orange-500">Pedidos</p>
                    </div>
                    <div className="bg-purple-50 px-4 py-2 rounded-lg">
                      <p className="text-lg font-bold text-purple-600">
                        {formatPrice(admin.stats?.totalDeliveryRevenue || 0)}
                      </p>
                      <p className="text-xs text-purple-500">Envíos</p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button size="sm" variant="secondary" onClick={() => handleEdit(admin)}>
                      ✏️ Editar
                    </Button>
                    <Link href={`/superadmin/messages?adminId=${admin.id}`}>
                      <Button size="sm" variant="secondary">
                        💬 Chat
                      </Button>
                    </Link>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleDelete(admin)}
                      className="bg-red-50 text-red-600 hover:bg-red-100 border-red-200"
                    >
                      🗑️ Eliminar
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
