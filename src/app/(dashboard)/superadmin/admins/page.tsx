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

type ToastType = 'success' | 'error' | 'info'

export default function AdminsPage() {
  const { data: session } = useSession()
  const [admins, setAdmins] = useState<Admin[]>([])
  const [zones, setZones] = useState<Zone[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingAdmin, setEditingAdmin] = useState<Admin | null>(null)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null)
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

  const showToast = (message: string, type: ToastType = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3500)
  }

  const fetchAdmins = async () => {
    try {
      const response = await fetch('/api/superadmin/admins')
      if (response.ok) {
        const data = await response.json()
        setAdmins(data)
      }
    } catch {
      showToast('Error al cargar admins', 'error')
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
    } catch {
      console.error('Error fetching zones')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

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
        showToast(editingAdmin ? 'Admin actualizado correctamente' : 'Admin creado correctamente', 'success')
      } else {
        const error = await response.json()
        showToast(error.error || 'Error al guardar', 'error')
      }
    } catch {
      showToast('Error de conexión', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (adminId: string) => {
    setDeletingId(adminId)
    try {
      const response = await fetch(`/api/superadmin/admins/${adminId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        fetchAdmins()
        setConfirmDeleteId(null)
        showToast('Admin y todos sus datos eliminados', 'success')
      } else {
        const error = await response.json()
        showToast(error.error || 'Error al eliminar', 'error')
        setConfirmDeleteId(null)
      }
    } catch {
      showToast('Error al eliminar', 'error')
      setConfirmDeleteId(null)
    } finally {
      setDeletingId(null)
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
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const resetForm = () => {
    setShowForm(false)
    setEditingAdmin(null)
    setFormData({ name: '', email: '', password: '', phone: '', zoneId: '' })
  }

  const filteredAdmins = admins.filter(
    (a) =>
      a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (a.zone?.name || '').toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-gray-200 rounded w-48 animate-pulse" />
        <div className="h-48 bg-gray-200 rounded-xl animate-pulse" />
        {[1, 2].map((i) => (
          <div key={i} className="h-36 bg-gray-200 rounded-xl animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-xl shadow-lg text-white text-sm font-medium flex items-center gap-2 transition-all ${
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
          <h1 className="text-2xl font-bold text-gray-900">👥 Gestión de Administradores</h1>
          <p className="text-sm text-gray-500 mt-0.5">{admins.length} administrador{admins.length !== 1 ? 'es' : ''}</p>
        </div>
        <Button onClick={() => { resetForm(); setShowForm(!showForm) }}>
          {showForm ? 'Cancelar' : '+ Nuevo Admin'}
        </Button>
      </div>

      {/* Form */}
      {showForm && (
        <Card className="border-2 border-[#003f87]/20 shadow-sm">
          <CardHeader>
            <h2 className="text-lg font-bold text-gray-900">
              {editingAdmin ? '✏️ Editar Administrador' : '🆕 Nuevo Administrador'}
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
                  label={editingAdmin ? 'Nueva contraseña (dejar vacío para mantener)' : 'Contraseña'}
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="••••••••"
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Zona asignada</label>
                <select
                  value={formData.zoneId}
                  onChange={(e) => setFormData({ ...formData, zoneId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003f87] focus:border-[#003f87] text-sm"
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
                  <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                    ⚠️ Primero debes{' '}
                    <Link href="/superadmin/zones" className="underline text-[#003f87]">
                      crear una zona
                    </Link>
                  </p>
                )}
              </div>
              <div className="flex gap-3">
                <Button type="submit" loading={saving} disabled={zones.length === 0}>
                  {editingAdmin ? 'Actualizar Admin' : 'Crear Admin'}
                </Button>
                <Button type="button" variant="secondary" onClick={resetForm}>
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Search */}
      {admins.length > 0 && (
        <div className="relative">
          <input
            type="text"
            placeholder="Buscar por nombre, email o zona..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#003f87] focus:border-[#003f87] text-sm"
          />
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          )}
        </div>
      )}

      {/* Admins List */}
      <div className="space-y-4">
        {filteredAdmins.length === 0 ? (
          <Card className="text-center py-16">
            <span className="text-5xl block mb-4">👥</span>
            <p className="text-gray-500 font-medium">
              {searchQuery ? 'No hay resultados para tu búsqueda' : 'No hay administradores registrados'}
            </p>
            {!searchQuery && zones.length === 0 ? (
              <Link href="/superadmin/zones" className="text-[#003f87] hover:underline mt-3 inline-block text-sm font-medium">
                Primero crea una zona →
              </Link>
            ) : !searchQuery ? (
              <Button onClick={() => setShowForm(true)} className="mt-4">
                Crear primer administrador
              </Button>
            ) : null}
          </Card>
        ) : (
          filteredAdmins.map((admin) => (
            <Card key={admin.id} className="hover:shadow-md transition-shadow duration-200">
              <CardContent className="pt-5">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  {/* Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <h3 className="font-bold text-lg text-gray-900">{admin.name}</h3>
                      {admin.zone ? (
                        <Badge className="bg-[#003f87]/10 text-[#003f87] border border-[#003f87]/20">
                          📍 {admin.zone.name}
                        </Badge>
                      ) : (
                        <Badge className="bg-red-50 text-red-600 border border-red-200">
                          ⚠ Sin zona
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
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
                    <div className="bg-blue-50 px-4 py-2.5 rounded-xl">
                      <p className="text-2xl font-bold text-[#003f87]">{admin._count?.stores || 0}</p>
                      <p className="text-xs text-blue-500 mt-0.5">Tiendas</p>
                    </div>
                    <div className="bg-emerald-50 px-4 py-2.5 rounded-xl">
                      <p className="text-2xl font-bold text-emerald-600">{admin.stats?.totalDrivers || 0}</p>
                      <p className="text-xs text-emerald-500 mt-0.5">Repartidores</p>
                    </div>
                    <div className="bg-amber-50 px-4 py-2.5 rounded-xl">
                      <p className="text-2xl font-bold text-amber-600">{admin.stats?.completedOrders || 0}</p>
                      <p className="text-xs text-amber-500 mt-0.5">Pedidos</p>
                    </div>
                    <div className="bg-purple-50 px-4 py-2.5 rounded-xl">
                      <p className="text-lg font-bold text-purple-600">
                        {formatPrice(admin.stats?.totalDeliveryRevenue || 0)}
                      </p>
                      <p className="text-xs text-purple-500 mt-0.5">Envíos</p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 flex-shrink-0">
                    <Button size="sm" variant="secondary" onClick={() => handleEdit(admin)}>
                      ✏️ Editar
                    </Button>
                    <Link href={`/superadmin/messages?adminId=${admin.id}`}>
                      <Button size="sm" variant="secondary">
                        💬
                      </Button>
                    </Link>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => setConfirmDeleteId(admin.id)}
                      className="text-red-600 border-red-100 hover:bg-red-50"
                    >
                      🗑️
                    </Button>
                  </div>
                </div>

                {/* Inline delete confirmation */}
                {confirmDeleteId === admin.id && (
                  <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl">
                    <p className="text-sm text-red-800 font-semibold mb-1">
                      ⚠️ ¿Eliminar admin &quot;{admin.name}&quot;?
                    </p>
                    <p className="text-xs text-red-600 mb-3">
                      Se eliminarán: {admin._count?.stores || 0} tienda(s), {admin.stats?.totalDrivers || 0} repartidor(es),
                      {' '}{admin.stats?.totalOrders || 0} pedido(s) y todos los datos asociados. Esta acción no se puede deshacer.
                    </p>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="danger"
                        loading={deletingId === admin.id}
                        onClick={() => handleDelete(admin.id)}
                      >
                        Sí, eliminar todo
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => setConfirmDeleteId(null)}
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
