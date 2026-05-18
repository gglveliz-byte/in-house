'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/lib/utils'

interface User {
  id: string
  name: string
  email: string
  role: string
  phone: string | null
  createdAt: string
  store?: {
    name: string
  }
}

type ToastType = 'success' | 'error' | 'info'

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'VENDOR',
    phone: '',
  })

  const showToast = (message: string, type: ToastType = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3500)
  }

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users')
      if (response.ok) {
        const data = await response.json()
        setUsers(data)
      }
    } catch {
      showToast('Error al cargar usuarios', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        setShowForm(false)
        setFormData({ name: '', email: '', password: '', role: 'VENDOR', phone: '' })
        fetchUsers()
        showToast('Usuario creado correctamente', 'success')
      } else {
        const err = await response.json()
        showToast(err.error || 'Error al crear usuario', 'error')
      }
    } catch {
      showToast('Error de conexión', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (userId: string) => {
    setDeletingId(userId)
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        fetchUsers()
        setConfirmDeleteId(null)
        showToast('Usuario eliminado', 'success')
      } else {
        const err = await response.json()
        showToast(err.error || 'Error al eliminar', 'error')
        setConfirmDeleteId(null)
      }
    } catch {
      showToast('Error al eliminar usuario', 'error')
      setConfirmDeleteId(null)
    } finally {
      setDeletingId(null)
    }
  }

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return <Badge className="bg-[#003f87]/10 text-[#003f87] border border-[#003f87]/20">Admin</Badge>
      case 'VENDOR':
        return <Badge className="bg-blue-100 text-blue-700 border border-blue-200">Vendedor</Badge>
      case 'DRIVER':
        return <Badge className="bg-emerald-100 text-emerald-700 border border-emerald-200">Repartidor</Badge>
      default:
        return <Badge className="bg-gray-100 text-gray-600">{role}</Badge>
    }
  }

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user.store?.name || '').toLowerCase().includes(searchQuery.toLowerCase())
    const matchesRole = roleFilter === 'all' || user.role === roleFilter
    return matchesSearch && matchesRole
  })

  const counts = {
    all: users.length,
    VENDOR: users.filter((u) => u.role === 'VENDOR').length,
    DRIVER: users.filter((u) => u.role === 'DRIVER').length,
    ADMIN: users.filter((u) => u.role === 'ADMIN').length,
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-gray-200 rounded w-36 animate-pulse" />
        <div className="h-48 bg-gray-200 rounded-xl animate-pulse" />
        {[1, 2, 3].map((i) => <div key={i} className="h-16 bg-gray-200 rounded-xl animate-pulse" />)}
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-xl shadow-lg text-white text-sm font-medium flex items-center gap-2 ${
          toast.type === 'success' ? 'bg-emerald-600' :
          toast.type === 'error' ? 'bg-red-600' : 'bg-[#003f87]'
        }`}>
          {toast.type === 'success' ? '✓' : toast.type === 'error' ? '✕' : 'ℹ'} {toast.message}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">👥 Usuarios</h1>
          <p className="text-sm text-gray-500 mt-0.5">{users.length} usuario{users.length !== 1 ? 's' : ''} en tu zona</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancelar' : '+ Nuevo Usuario'}
        </Button>
      </div>

      {/* Form */}
      {showForm && (
        <Card className="border-2 border-[#003f87]/20 shadow-sm">
          <div className="p-5">
            <h2 className="text-lg font-bold text-gray-900 mb-4">🆕 Nuevo Usuario</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                  <input
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003f87] focus:border-[#003f87] text-sm"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Nombre completo"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003f87] focus:border-[#003f87] text-sm"
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="usuario@email.com"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
                  <input
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003f87] focus:border-[#003f87] text-sm"
                    type="password"
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="••••••••"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                  <input
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003f87] focus:border-[#003f87] text-sm"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+593 999 999 999"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Rol</label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003f87] focus:border-[#003f87] text-sm"
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  >
                    <option value="VENDOR">🏪 Vendedor</option>
                    <option value="DRIVER">🚗 Repartidor</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-3">
                <Button type="submit" loading={saving}>
                  Crear Usuario
                </Button>
                <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>
                  Cancelar
                </Button>
              </div>
            </form>
          </div>
        </Card>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Buscar por nombre, email o tienda..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#003f87] focus:border-[#003f87] text-sm"
          />
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">✕</button>
          )}
        </div>
        {/* Role filter pills */}
        <div className="flex gap-2">
          {[
            { value: 'all', label: `Todos (${counts.all})` },
            { value: 'VENDOR', label: `Vendedores (${counts.VENDOR})` },
            { value: 'DRIVER', label: `Repartidores (${counts.DRIVER})` },
          ].map((f) => (
            <button
              key={f.value}
              onClick={() => setRoleFilter(f.value)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                roleFilter === f.value
                  ? 'bg-[#003f87] text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Users Table */}
      <Card>
        <CardContent className="p-0 overflow-x-auto">
          {filteredUsers.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <span className="text-5xl block mb-3">👥</span>
              <p className="font-medium">{searchQuery ? 'Sin resultados para tu búsqueda' : 'No hay usuarios'}</p>
              {!searchQuery && (
                <Button onClick={() => setShowForm(true)} className="mt-4">
                  Crear primer usuario
                </Button>
              )}
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Usuario</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Rol</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Tienda</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Registro</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredUsers.map((user) => (
                  <>
                    <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-[#003f87]/10 flex items-center justify-center text-[#003f87] font-bold text-sm flex-shrink-0">
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900 text-sm">{user.name}</p>
                            {user.phone && <p className="text-xs text-gray-500">{user.phone}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{user.email}</td>
                      <td className="px-4 py-3">{getRoleBadge(user.role)}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {user.store?.name || <span className="text-gray-400 italic">-</span>}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {formatDate(user.createdAt)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => setConfirmDeleteId(confirmDeleteId === user.id ? null : user.id)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50 px-2 py-1 rounded-lg transition-all text-sm"
                          title="Eliminar usuario"
                        >
                          🗑️
                        </button>
                      </td>
                    </tr>
                    {/* Inline confirm delete */}
                    {confirmDeleteId === user.id && (
                      <tr key={`confirm-${user.id}`} className="bg-red-50">
                        <td colSpan={6} className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <p className="text-sm text-red-800 font-medium flex-1">
                              ⚠️ ¿Eliminar a <strong>{user.name}</strong>? Esta acción no se puede deshacer.
                            </p>
                            <Button
                              size="sm"
                              variant="danger"
                              loading={deletingId === user.id}
                              onClick={() => handleDelete(user.id)}
                            >
                              Eliminar
                            </Button>
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => setConfirmDeleteId(null)}
                            >
                              Cancelar
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
