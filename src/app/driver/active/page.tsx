'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { formatPrice } from '@/lib/utils'
import { pusherClient, CHANNELS, EVENTS } from '@/lib/pusher'
import type { Order } from '@/types'

const STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  PENDING:   { label: 'Pendiente',  cls: 'bg-amber-100 text-amber-900' },
  CONFIRMED: { label: 'Confirmado', cls: 'bg-blue-100 text-primary-container' },
  READY:     { label: 'Listo',      cls: 'bg-indigo-100 text-indigo-700' },
  PICKED_UP: { label: 'En Camino', cls: 'bg-primary-fixed text-primary' },
  DELIVERED: { label: 'Entregado', cls: 'bg-green-100 text-green-700' },
  CANCELLED: { label: 'Cancelado', cls: 'bg-error-container text-on-error-container' },
}

export default function DriverActiveOrdersPage() {
  const { data: session, status } = useSession()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [acceptingId, setAcceptingId] = useState<string | null>(null)
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null)

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 3000)
  }

  const fetchOrders = useCallback(async () => {
    try {
      const res = await fetch('/api/orders?status=READY')
      const json = await res.json()
      setOrders(json.data || json)
    } catch { /* silent */ } finally { setLoading(false) }
  }, [])

  useEffect(() => {
    if (status !== 'loading') fetchOrders()
  }, [status, fetchOrders])

  useEffect(() => {
    // Escuchar nuevos pedidos listos para auto-refrescar
    if (pusherClient) {
      const channel = pusherClient.subscribe(CHANNELS.DRIVER);
      channel.bind(EVENTS.ORDER_READY, (data: any) => {
        showToast(`¡Nuevo pedido disponible en ${data.storeName}!`);
        fetchOrders();
      });

      return () => {
        channel.unbind_all();
        pusherClient?.unsubscribe(CHANNELS.DRIVER);
      };
    }
  }, [fetchOrders]);

  const acceptOrder = async (orderId: string) => {
    setAcceptingId(orderId)
    try {
      await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'PICKED_UP', driverId: session?.user?.id }),
      })
      showToast('¡Pedido aceptado! Ve a recogerlo.')
      fetchOrders()
    } catch {
      showToast('Error al aceptar el pedido', false)
    } finally {
      setAcceptingId(null)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
        <p className="text-on-surface-variant font-body-md">Buscando pedidos...</p>
      </div>
    )
  }

  return (
    <>
      {toast && (
        <div className={`fixed top-20 left-1/2 -translate-x-1/2 z-[60] px-6 py-3 rounded-full shadow-lg text-white text-sm font-semibold transition-all ${toast.ok ? 'bg-green-600' : 'bg-error'}`}>
          {toast.msg}
        </div>
      )}

      {/* Map Section */}
      <section className="p-margin-mobile md:p-margin-desktop">
        <div className="relative w-full h-48 md:h-72 rounded-xl overflow-hidden border border-outline-variant bg-surface-container-low">
          {/* Map placeholder with gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary-fixed via-secondary-container to-surface-container-highest opacity-60"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="grid grid-cols-8 grid-rows-6 gap-1 opacity-30 absolute inset-4">
              {Array.from({ length: 48 }).map((_, i) => (
                <div key={i} className="border border-primary/20 rounded-sm"></div>
              ))}
            </div>
          </div>
          {/* Floating location card */}
          <div className="absolute bottom-4 left-4 right-4 md:left-margin-desktop md:right-auto md:w-72 p-4 bg-surface/90 backdrop-blur-md border border-outline-variant rounded-xl shadow-lg">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>my_location</span>
              <div>
                <p className="font-label-md text-label-md text-on-surface-variant">Tu ubicación actual</p>
                <p className="font-body-sm text-body-sm font-semibold">Detectando GPS...</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Active Orders Feed */}
      <section className="px-margin-mobile md:px-margin-desktop">
        <div className="flex justify-between items-center mb-6">
          <h2 className="font-headline-md text-headline-lg-mobile md:text-headline-md text-on-surface">Pedidos Disponibles</h2>
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 px-3 py-1 rounded-full border border-primary/20">
              <span className="font-label-md text-label-md text-primary">{orders.length} Pedidos Listos</span>
            </div>
            <button onClick={fetchOrders} className="w-9 h-9 flex items-center justify-center rounded-full border border-outline-variant hover:bg-surface-container-high transition-colors">
              <span className="material-symbols-outlined text-secondary text-[20px]">refresh</span>
            </button>
          </div>
        </div>

        {orders.length === 0 ? (
          <div className="text-center py-16 bg-surface-container-lowest border border-outline-variant rounded-xl">
            <span className="material-symbols-outlined text-5xl text-outline mb-3">two_wheeler</span>
            <h3 className="font-headline-sm text-headline-sm text-on-surface mb-2">Sin pedidos disponibles</h3>
            <p className="text-on-surface-variant font-body-md max-w-[260px] mx-auto">
              No hay pedidos listos para entrega en este momento. Actualiza para verificar.
            </p>
            <button onClick={fetchOrders} className="mt-6 bg-primary text-on-primary px-6 py-3 rounded-xl font-bold hover:opacity-90 active:scale-95 transition-all">
              Actualizar
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-gutter">
            {orders.map((order) => {
              const badge = STATUS_BADGE[order.status] || STATUS_BADGE.READY
              return (
                <div key={order.id} className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 transition-all hover:shadow-lg hover:border-primary group">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <p className="font-label-md text-label-md text-on-surface-variant mb-1">PEDIDO #{order.orderNumber}</p>
                      <h3 className="font-headline-sm text-headline-sm text-on-surface">
                        {order.items[0]?.product?.name ? order.items[0].product.name : 'Ver artículos'}
                      </h3>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase ${badge.cls}`}>
                      {badge.label}
                    </span>
                  </div>

                  <div className="space-y-3 mb-6">
                    <div className="flex items-start gap-3">
                      <span className="material-symbols-outlined text-outline text-sm">restaurant</span>
                      <p className="font-body-sm text-body-sm text-on-surface-variant">
                        {order.items.length} artículo{order.items.length !== 1 ? 's' : ''} — {formatPrice(order.total)}
                      </p>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="material-symbols-outlined text-primary text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>location_on</span>
                      <p className="font-body-sm text-body-sm font-semibold text-on-surface truncate">{order.customerAddress}</p>
                    </div>
                    {order.customerNotes && (
                      <div className="flex items-start gap-3 bg-amber-50 rounded-lg p-2">
                        <span className="material-symbols-outlined text-amber-600 text-sm">info</span>
                        <p className="font-body-sm text-body-sm text-amber-800">{order.customerNotes}</p>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Link
                      href={`/driver/active/${order.id}`}
                      className="flex-1 py-3 bg-surface-container border border-outline-variant text-on-surface font-bold rounded-lg hover:bg-surface-container-high transition-colors text-center text-body-sm"
                    >
                      Ver Detalles
                    </Link>
                    <button
                      onClick={() => acceptOrder(order.id)}
                      disabled={!!acceptingId}
                      className="flex-1 py-3 bg-primary text-on-primary font-bold rounded-lg hover:opacity-90 transition-opacity active:scale-95 duration-150 text-body-sm disabled:opacity-60"
                    >
                      {acceptingId === order.id ? 'Aceptando...' : 'Aceptar Pedido'}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>
    </>
  )
}
