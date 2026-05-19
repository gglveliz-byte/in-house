'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
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
        newStatus === 'CONFIRMED' ? 'Pedido confirmado' :
        newStatus === 'READY' ? 'Marcado como listo' : 'Pedido cancelado',
        newStatus !== 'CANCELLED'
      )
    } catch { showToast('Error al actualizar', false) }
  }

  const filtered = orders.filter(o => filter === 'all' || o.status === filter)
  const counts = { PENDING: 0, CONFIRMED: 0, READY: 0, DELIVERED: 0, CANCELLED: 0 }
  orders.forEach(o => { if (o.status in counts) counts[o.status as keyof typeof counts]++ })

  const FILTERS = [
    { v: 'all', icon: 'list', label: 'Todos' },
    { v: 'PENDING', icon: 'schedule', label: 'Pendientes' },
    { v: 'CONFIRMED', icon: 'check_circle', label: 'Confirmados' },
    { v: 'READY', icon: 'restaurant', label: 'Listos' },
    { v: 'PICKED_UP', icon: 'two_wheeler', label: 'En camino' },
    { v: 'DELIVERED', icon: 'task_alt', label: 'Entregados' },
  ]

  if (status === 'loading' || loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
      </div>
    )
  }

  return (
    <>
      {toast && (
        <div className={`fixed top-20 right-4 z-[60] px-5 py-3 rounded-xl shadow-lg text-white text-sm font-semibold transition-all ${toast.ok ? 'bg-green-600' : 'bg-error'}`}>
          {toast.msg}
        </div>
      )}

      <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface">Pedidos</h1>
          {storeInfo && (
            <p className="text-body-md text-on-surface-variant flex items-center gap-2 mt-1">
              {storeInfo.name}
              <span className={`text-label-md px-2 py-0.5 rounded-full font-medium ${storeInfo.isOpen ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {storeInfo.isOpen ? '● Abierto' : '● Cerrado'}
              </span>
            </p>
          )}
        </div>
        <div className="flex items-center gap-3">
          {permission === 'default' && (
            <button onClick={requestPermission} className="flex items-center gap-2 bg-surface-container-lowest border border-outline-variant px-4 py-2 rounded-lg text-label-md font-label-md text-secondary hover:bg-surface-container-high transition-colors">
              <span className="material-symbols-outlined text-[18px]">notifications</span>
              Activar Notificaciones
            </button>
          )}
          {permission === 'granted' && (
            <span className="flex items-center gap-1.5 text-label-md bg-green-50 text-green-700 border border-green-200 px-3 py-1.5 rounded-full font-medium">
              <span className="material-symbols-outlined text-[16px]">notifications_active</span>
              Activas
            </span>
          )}
          <button onClick={() => { const sid = session?.user?.storeId || storeInfo?.id; if (sid) fetchOrders(sid) }} className="flex items-center justify-center w-10 h-10 border border-outline-variant rounded-lg text-secondary hover:bg-surface-container-high transition-colors">
            <span className="material-symbols-outlined">refresh</span>
          </button>
        </div>
      </header>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { status: 'PENDING', label: 'Pendientes', icon: 'schedule', bgActive: 'border-amber-400 bg-amber-50', color: 'text-amber-600' },
          { status: 'CONFIRMED', label: 'Confirmados', icon: 'check_circle', bgActive: 'border-primary bg-primary-fixed', color: 'text-primary' },
          { status: 'READY', label: 'Listos', icon: 'restaurant', bgActive: 'border-green-500 bg-green-50', color: 'text-green-600' },
        ].map(({ status: s, label, icon, bgActive, color }) => (
          <button
            key={s}
            onClick={() => setFilter(filter === s ? 'all' : s)}
            className={`bg-surface-container-lowest border rounded-xl p-5 text-center hover:shadow-md transition-all ${filter === s ? `border-2 ${bgActive}` : 'border-outline-variant'}`}
          >
            <span className={`material-symbols-outlined text-[28px] ${color}`}>{icon}</span>
            <p className={`text-headline-md font-headline-md mt-1 ${color}`}>{counts[s as keyof typeof counts]}</p>
            <p className="text-body-sm text-on-surface-variant mt-1">{label}</p>
          </button>
        ))}
      </div>

      {/* Filter pills */}
      <div className="flex gap-2 overflow-x-auto pb-3 mb-6 no-scrollbar">
        {FILTERS.map(f => {
          const cnt = f.v === 'all' ? orders.length : orders.filter(o => o.status === f.v).length
          return (
            <button key={f.v} onClick={() => setFilter(f.v)}
              className={`px-4 py-2 rounded-full text-body-sm font-medium whitespace-nowrap flex items-center gap-1.5 transition-all ${filter === f.v ? 'bg-primary text-on-primary shadow-sm' : 'bg-surface-container-lowest border border-outline-variant text-on-surface-variant hover:bg-surface-container-high'}`}>
              <span className="material-symbols-outlined text-[16px]">{f.icon}</span>
              {f.label}
              {cnt > 0 && <span className={`text-label-md px-1.5 py-0.5 rounded-full font-bold ${filter === f.v ? 'bg-white/20' : 'bg-surface-container-highest'}`}>{cnt}</span>}
            </button>
          )
        })}
      </div>

      {/* Orders list */}
      {filtered.length === 0 ? (
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl text-center py-16">
          <span className="material-symbols-outlined text-5xl text-outline mb-3">package_2</span>
          <p className="text-on-surface-variant">No hay pedidos {filter !== 'all' && 'en este estado'}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(order => (
            <div key={order.id} className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between p-5 border-b border-outline-variant">
                <div>
                  <h3 className="font-headline-sm text-headline-sm text-primary">#{order.orderNumber}</h3>
                  <p className="text-body-sm text-on-surface-variant">{formatDate(order.createdAt)}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-label-md font-bold ${getOrderStatusColor(order.status)}`}>
                  {getOrderStatusLabel(order.status)}
                </span>
              </div>
              <div className="p-5">
                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <div className="bg-surface-container-low rounded-xl p-4">
                    <p className="text-label-md font-label-md text-secondary uppercase mb-2">Cliente</p>
                    <p className="text-body-md font-semibold text-on-surface">{order.customerName}</p>
                    <p className="text-body-sm text-on-surface-variant">{order.customerPhone}</p>
                    <p className="text-body-sm text-on-surface-variant">{order.customerAddress}</p>
                    {order.customerNotes && (
                      <div className="mt-2 bg-amber-50 text-amber-800 px-3 py-2 rounded-lg text-body-sm flex items-start gap-2">
                        <span className="material-symbols-outlined text-[16px] mt-0.5">edit_note</span>
                        {order.customerNotes}
                      </div>
                    )}
                  </div>
                  <div className="bg-surface-container-low rounded-xl p-4">
                    <p className="text-label-md font-label-md text-secondary uppercase mb-2">Productos</p>
                    {order.items.map(item => (
                      <p key={item.id} className="text-body-sm flex justify-between mb-1">
                        <span>{item.quantity}× {item.product.name}</span>
                        <span className="font-medium">{formatPrice(item.totalPrice)}</span>
                      </p>
                    ))}
                    <p className="font-bold text-primary text-body-md border-t border-outline-variant mt-3 pt-3">Total: {formatPrice(order.total)}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 pt-3 border-t border-outline-variant">
                  {order.status === 'CONFIRMED' && order.paymentStatus === 'VERIFIED' && (
                    <Link href={`/vendor/order/${order.id}`} className="flex items-center gap-2 bg-primary text-on-primary px-4 py-2 rounded-lg font-bold text-label-md hover:opacity-90 transition-opacity active:scale-95">
                      <span className="material-symbols-outlined text-[18px]">package_2</span>
                      Ver pedido
                    </Link>
                  )}
                  {(order.status === 'PENDING' || (order.status === 'CONFIRMED' && order.paymentStatus !== 'VERIFIED')) && (
                    <Link href={`/vendor/chat/${order.id}`} className="flex items-center gap-2 bg-primary text-on-primary px-4 py-2 rounded-lg font-bold text-label-md hover:opacity-90 transition-opacity active:scale-95">
                      <span className="material-symbols-outlined text-[18px]">chat</span>
                      Chat
                    </Link>
                  )}
                  {order.paymentStatus === 'UPLOADED' && order.status === 'PENDING' && (
                    <Link href={`/vendor/chat/${order.id}`} className="flex items-center gap-2 bg-amber-500 text-white px-4 py-2 rounded-lg font-bold text-label-md hover:opacity-90 transition-opacity active:scale-95">
                      <span className="material-symbols-outlined text-[18px]">image</span>
                      Verificar pago
                    </Link>
                  )}
                  {order.status === 'PENDING' && order.paymentStatus !== 'UPLOADED' && (
                    <button onClick={() => updateStatus(order.id, 'CONFIRMED')} className="flex items-center gap-2 bg-primary text-on-primary px-4 py-2 rounded-lg font-bold text-label-md hover:opacity-90 transition-opacity active:scale-95">
                      <span className="material-symbols-outlined text-[18px]">check</span>
                      Confirmar
                    </button>
                  )}
                  {order.status === 'CONFIRMED' && order.paymentStatus === 'VERIFIED' && (
                    <button onClick={() => updateStatus(order.id, 'READY')} className="flex items-center gap-2 bg-primary-container text-white px-4 py-2 rounded-lg font-bold text-label-md hover:opacity-90 transition-opacity active:scale-95">
                      <span className="material-symbols-outlined text-[18px]">restaurant</span>
                      Listo para enviar
                    </button>
                  )}
                  {(order.status === 'PENDING' || order.status === 'CONFIRMED') && (
                    <button onClick={() => updateStatus(order.id, 'CANCELLED')} className="flex items-center gap-2 border border-error text-error px-3 py-2 rounded-lg font-bold text-label-md hover:bg-error-container transition-colors active:scale-95">
                      <span className="material-symbols-outlined text-[18px]">close</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  )
}
