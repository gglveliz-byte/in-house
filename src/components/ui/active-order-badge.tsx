'use client'

import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import { useActiveOrderStore, ActiveOrderStatus } from '@/stores/active-order-store'
import { formatPrice } from '@/lib/utils'
import { usePusherChannel } from '@/hooks/use-pusher'
import { CHANNELS, EVENTS } from '@/lib/pusher'

const STATUS_INFO: Record<ActiveOrderStatus, { label: string; icon: string; color: string }> = {
  PENDING: { label: 'Pendiente', icon: '⏳', color: 'bg-yellow-500' },
  CONFIRMED: { label: 'Confirmado', icon: '✅', color: 'bg-blue-500' },
  READY: { label: 'Listo', icon: '🍽️', color: 'bg-green-500' },
  PICKED_UP: { label: 'En camino', icon: '🛵', color: 'bg-orange-500' },
  DELIVERED: { label: 'Entregado', icon: '🎉', color: 'bg-green-600' },
  CANCELLED: { label: 'Cancelado', icon: '❌', color: 'bg-red-500' },
}

export function ActiveOrderBadge() {
  const [mounted, setMounted] = useState(false)
  const { activeOrder, updateStatus, clearActiveOrder } = useActiveOrderStore()

  useEffect(() => {
    setMounted(true)
  }, [])

  // Escuchar actualizaciones del pedido activo
  const clearTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (clearTimerRef.current) clearTimeout(clearTimerRef.current)
    }
  }, [])

  usePusherChannel(
    activeOrder?.id ? CHANNELS.ORDER(activeOrder.id) : '',
    EVENTS.ORDER_UPDATED,
    (data: unknown) => {
      if (!data || typeof data !== 'object') return
      const orderData = data as { status?: string }
      if (orderData.status) {
        const newStatus = orderData.status as ActiveOrderStatus
        if (newStatus === 'DELIVERED' || newStatus === 'CANCELLED') {
          if (clearTimerRef.current) clearTimeout(clearTimerRef.current)
          clearTimerRef.current = setTimeout(() => {
            clearActiveOrder()
          }, 5000)
        }
        updateStatus(newStatus)
      }
    },
    !!activeOrder?.id
  )

  // No renderizar en el servidor o si no hay pedido activo
  if (!mounted || !activeOrder) {
    return null
  }

  const statusInfo = STATUS_INFO[activeOrder.status] || STATUS_INFO.PENDING
  const isFinished = activeOrder.status === 'DELIVERED' || activeOrder.status === 'CANCELLED'

  return (
    <Link href={`/pedido/${activeOrder.id}`}>
      <div className={`fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 z-50 ${isFinished ? 'opacity-80' : ''}`}>
        <div className={`${statusInfo.color} text-white rounded-2xl shadow-2xl p-4 transform transition-all hover:scale-105 cursor-pointer`}>
          <div className="flex items-center gap-3">
            <div className="text-3xl animate-bounce">
              {statusInfo.icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <p className="font-bold text-sm">
                  {isFinished ? 'Pedido finalizado' : 'Pedido activo'}
                </p>
                <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">
                  #{activeOrder.orderNumber}
                </span>
              </div>
              <p className="text-white/90 text-sm mt-0.5">
                {activeOrder.storeName}
              </p>
              <div className="flex items-center justify-between mt-1">
                <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">
                  {statusInfo.label}
                </span>
                <span className="font-bold text-sm">
                  {formatPrice(activeOrder.total)}
                </span>
              </div>
            </div>
          </div>
          <div className="mt-2 text-center">
            <span className="text-xs text-white/80">
              {isFinished ? 'Toca para ver detalles' : 'Toca para ver el estado'}
            </span>
          </div>
        </div>
      </div>
    </Link>
  )
}
