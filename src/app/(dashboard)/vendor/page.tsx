'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession, signOut } from 'next-auth/react'
import Link from 'next/link'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatPrice, formatDate, getOrderStatusLabel, getOrderStatusColor } from '@/lib/utils'
import { useStoreOrders, useNotificationPermission } from '@/hooks/use-pusher'
import type { Order } from '@/types'

interface StoreInfo { id: string; name: string; isOpen: boolean }

export default function VendorOrdersPage() {
  const { data: session, status } = useSession()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [storeInfo, setStoreInfo] = useState<StoreInfo | null>(null)
  const [noStoreAssigned, setNoStoreAssigned] = useState(false)
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null)

  const { permission, requestPermission } = useNotificationPermission()

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 3000)
  }

  const fetchOrders = useCallback(async (sid: string) => {
    try {
      const res = await fetch(`/api/orders?storeId=${sid}`)
      const json = await res.json()
      setOrders(json.data || json)
    } catch { /* silent */ } finally { setLoading(false) }
  }, [])

  const storeId = session?.user?.storeId || storeInfo?.id || null
  useStoreOrders(storeId, () => { if (storeId) fetchOrders(storeId) }, () => { if (storeId) fetchOrders(storeId) })

  useEffect(() => {
    const init = async () => {
      if (status === 'loading') return
      let sid = session?.user?.storeId
      if (!sid && session?.user?.id) {
        try {
          const stores = await (await fetch('/api/stores')).json()
          const found = stores.find((s: { ownerId: string }) => s.ownerId === session.user.id)
          if (found) { sid = found.id; setStoreInfo(found) }
        } catch {}
      }
      if (sid) {
        if (!storeInfo) {
          try {
            const stores = await (await fetch('/api/stores')).json()
            const s = stores.find((s: { id: string }) => s.id === sid)
            if (s) setStoreInfo(s)
          } catch {}
        }
        await fetchOrders(sid)
      } else {
        setLoading(false)
        setNoStoreAssigned(true)
      }
    }
    init()
  }, [session, status, fetchOrders, storeInfo])

  const updateStatus = async (orderId: string, newStatus: string) => {
    try {
      await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      const sid = session?.user?.storeId || storeInfo?.id
      if (sid) fetchOrders(sid)
      showToast(
        newStatus === 'CONFIRMED' ? '✓ Pedido confirmado' :
        newStatus === 'READY' ? '🍽️ Marcado como listo' : 'Pedido cancelado',
        newStatus !== 'CANCELLED'
      )
    } catch { showToast('Error al actualizar', false) }
  }

  const filtered = orders.filter(o => filter === 'all' || o.status === filter)
  const counts = { PENDING: 0, CONFIRMED: 0, READY: 0, DELIVERED: 0, CANCELLED: 0 }
  orders.forEach(o => { if (o.status in counts) counts[o.status as keyof typeof counts]++ })

  const FILTERS = [
    { v: 'all', label: 'Todos' },
    { v: 'PENDING', label: '⏳ Pendientes' },
    { v: 'CONFIRMED', label: '✓ Confirmados' },
    { v: 'READY', label: '🍽️ Listos' },
    { v: 'PICKED_UP', label: '🚗 En camino' },
    { v: 'DELIVERED', label: '✅ Entregados' },
  ]

  if (status === 'loading' || loading) return (
    <div className="space-y-4">
      {[1,2,3].map(i => <div key={i} className="h-32 bg-gray-100 rounded-xl animate-pulse" />)}
    </div>
  )

  if (noStoreAssigned) return (
    <div className="max-w-sm mx-auto py-12">
      <Card className="p-8 text-center border-2 border-[#003f87]/20">
        <span className="text-5xl block mb-3">🏪</span>
        <h2 className="font-bold text-gray-900 mb-2">Sin tienda asignada</h2>
        <p className="text-sm text-gray-500 mb-5">Cierra sesión y vuelve a entrar para cargar tu tienda.</p>
        <Button onClick={() => signOut({ callbackUrl: '/login' })} className="w-full">Reiniciar sesión</Button>
      </Card>
    </div>
  )

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-xl shadow-lg text-white text-sm font-semibold ${toast.ok ? 'bg-emerald-600' : 'bg-red-600'}`}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">📦 Pedidos</h1>
          {storeInfo && (
            <p className="text-sm text-gray-500 mt-0.5">
              {storeInfo.name}
              <span className={`ml-2 text-xs px-2 py-0.5 rounded-full font-medium ${storeInfo.isOpen ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                {storeInfo.isOpen ? '● Abierto' : '● Cerrado'}
              </span>
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {permission === 'default' && <Button onClick={requestPermission} variant="secondary" size="sm">🔔 Notificaciones</Button>}
          {permission === 'granted' && <span className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1.5 rounded-full font-medium">🔔 Activas</span>}
          <Button onClick={() => { const sid = session?.user?.storeId || storeInfo?.id; if (sid) fetchOrders(sid) }} variant="secondary" size="sm">🔄</Button>
          <Link href="/vendor/products"><Button size="sm" variant="secondary">🍽️ Productos</Button></Link>
          <Link href="/vendor/settings"><Button size="sm" variant="secondary">⚙️ Tienda</Button></Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { status: 'PENDING', label: 'Pendientes', color: 'text-amber-600', border: 'border-amber-300' },
          { status: 'CONFIRMED', label: 'Confirmados', color: 'text-[#003f87]', border: 'border-[#003f87]' },
          { status: 'READY', label: 'Listos', color: 'text-emerald-600', border: 'border-emerald-400' },
        ].map(({ status: s, label, color, border }) => (
          <Card
            key={s}
            className={`cursor-pointer hover:shadow-md transition-all ${filter === s ? `border-2 ${border}` : ''}`}
            onClick={() => setFilter(filter === s ? 'all' : s)}
          >
            <CardContent className="pt-5 pb-4 text-center">
              <p className={`text-3xl font-bold ${color}`}>{counts[s as keyof typeof counts]}</p>
              <p className="text-sm text-gray-500 mt-1">{label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filter pills */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {FILTERS.map(f => {
          const cnt = f.v === 'all' ? orders.length : orders.filter(o => o.status === f.v).length
          return (
            <button key={f.v} onClick={() => setFilter(f.v)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap flex items-center gap-1.5 transition-all ${filter === f.v ? 'bg-[#003f87] text-white shadow-sm' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
              {f.label}
              {cnt > 0 && <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${filter === f.v ? 'bg-white/20' : 'bg-gray-200 text-gray-600'}`}>{cnt}</span>}
            </button>
          )
        })}
      </div>

      {/* Orders list */}
      {filtered.length === 0 ? (
        <Card className="text-center py-16">
          <span className="text-5xl block mb-3">📭</span>
          <p className="text-gray-400">No hay pedidos {filter !== 'all' && 'en este estado'}</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {filtered.map(order => (
            <Card key={order.id} className="border-l-4 border-l-[#003f87] hover:shadow-sm transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div>
                  <h3 className="font-bold text-[#003f87]">#{order.orderNumber}</h3>
                  <p className="text-xs text-gray-400">{formatDate(order.createdAt)}</p>
                </div>
                <Badge className={getOrderStatusColor(order.status)}>{getOrderStatusLabel(order.status)}</Badge>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid md:grid-cols-2 gap-3 mb-4">
                  <div className="bg-gray-50 rounded-xl p-3">
                    <p className="text-xs font-semibold text-gray-400 uppercase mb-1">Cliente</p>
                    <p className="text-sm font-semibold text-gray-900">{order.customerName}</p>
                    <p className="text-xs text-gray-500">{order.customerPhone}</p>
                    <p className="text-xs text-gray-500">{order.customerAddress}</p>
                    {order.customerNotes && <p className="text-xs mt-1 text-amber-700 bg-amber-50 px-2 py-1 rounded-lg">📝 {order.customerNotes}</p>}
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3">
                    <p className="text-xs font-semibold text-gray-400 uppercase mb-1">Productos</p>
                    {order.items.map(item => (
                      <p key={item.id} className="text-sm flex justify-between">
                        <span>{item.quantity}× {item.product.name}</span>
                        <span className="font-medium">{formatPrice(item.totalPrice)}</span>
                      </p>
                    ))}
                    <p className="font-bold text-[#003f87] text-sm border-t mt-2 pt-2">Total: {formatPrice(order.total)}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 pt-3 border-t">
                  {order.status === 'CONFIRMED' && order.paymentStatus === 'VERIFIED' && (
                    <Link href={`/vendor/order/${order.id}`}><Button size="sm">📦 Ver pedido</Button></Link>
                  )}
                  {(order.status === 'PENDING' || (order.status === 'CONFIRMED' && order.paymentStatus !== 'VERIFIED')) && (
                    <Link href={`/vendor/chat/${order.id}`}><Button size="sm" className="bg-emerald-600 hover:bg-emerald-700">💬 Chat</Button></Link>
                  )}
                  {order.paymentStatus === 'UPLOADED' && order.status === 'PENDING' && (
                    <Link href={`/vendor/chat/${order.id}`}><Button size="sm" className="bg-amber-500 hover:bg-amber-600">📎 Verificar pago</Button></Link>
                  )}
                  {order.status === 'PENDING' && order.paymentStatus !== 'UPLOADED' && (
                    <Button size="sm" onClick={() => updateStatus(order.id, 'CONFIRMED')}>✓ Confirmar</Button>
                  )}
                  {order.status === 'CONFIRMED' && order.paymentStatus === 'VERIFIED' && (
                    <Button size="sm" className="bg-[#0056b3] hover:bg-[#003f87]" onClick={() => updateStatus(order.id, 'READY')}>🍽️ Listo para enviar</Button>
                  )}
                  {(order.status === 'PENDING' || order.status === 'CONFIRMED') && (
                    <Button size="sm" variant="danger" onClick={() => updateStatus(order.id, 'CANCELLED')}>✕</Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
