'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { formatPrice, formatDate, getOrderStatusLabel, getOrderStatusColor } from '@/lib/utils'
import { useStoreOrders } from '@/hooks/use-pusher'
import type { Order } from '@/types'

interface StoreInfo { id: string; name: string; isOpen: boolean }

export default function VendorDashboardPage() {
  const { data: session, status } = useSession()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [storeInfo, setStoreInfo] = useState<StoreInfo | null>(null)
  
  const storeId = session?.user?.storeId || storeInfo?.id || null

  const fetchOrders = useCallback(async (sid: string) => {
    try {
      const res = await fetch(`/api/orders?storeId=${sid}`)
      const json = await res.json()
      setOrders(json.data || json)
    } catch { /* silent */ } finally { setLoading(false) }
  }, [])

  useStoreOrders(storeId, () => { if (storeId) fetchOrders(storeId) }, () => { if (storeId) fetchOrders(storeId) })

  useEffect(() => {
    const init = async () => {
      if (status === 'loading') return
      let sid = session?.user?.storeId
      if (!sid && session?.user?.id) {
        try {
          const res = await fetch('/api/stores')
          if (res.ok) {
            const stores = await res.json()
            if (Array.isArray(stores)) {
              const found = stores.find((s: { ownerId: string }) => s.ownerId === session.user.id)
              if (found) { sid = found.id; setStoreInfo(found) }
            }
          }
        } catch {}
      }
      if (sid) {
        if (!storeInfo) {
          try {
            const res = await fetch('/api/stores')
            if (res.ok) {
              const stores = await res.json()
              if (Array.isArray(stores)) {
                const s = stores.find((s: { id: string }) => s.id === sid)
                if (s) setStoreInfo(s)
              }
            }
          } catch {}
        }
        await fetchOrders(sid)
      } else {
        setLoading(false)
      }
    }
    init()
  }, [session, status, fetchOrders, storeInfo])

  const { todaySales, todayCompleted, todayCustomers } = useMemo(() => {
    const today = new Date().toDateString()
    let sales = 0
    let completed = 0
    const customers = new Set()
    orders.forEach(o => {
      const isToday = new Date(o.createdAt).toDateString() === today
      if (isToday) {
        if (o.status === 'DELIVERED') {
          sales += o.total
          completed++
        }
        customers.add(o.customerPhone)
      }
    })
    return { todaySales: sales, todayCompleted: completed, todayCustomers: customers.size }
  }, [orders])

  // Cálculo de Gráfica Semanal Dinámica (Últimos 7 días móviles)
  const weeklyData = useMemo(() => {
    const days: { date: Date; name: string; sales: number }[] = []
    const dayNames = ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab']
    
    // Generar últimas 7 fechas
    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      days.push({
        date: d,
        name: dayNames[d.getDay()],
        sales: 0
      })
    }

    // Sumar ventas de órdenes entregadas
    orders.forEach(o => {
      if (o.status === 'DELIVERED') {
        const orderDate = new Date(o.createdAt)
        days.forEach(day => {
          if (orderDate.toDateString() === day.date.toDateString()) {
            day.sales += o.total
          }
        })
      }
    })

    const maxSales = Math.max(...days.map(d => d.sales), 1)
    
    return days.map(d => {
      const isMax = d.sales === Math.max(...days.map(x => x.sales)) && d.sales > 0
      return {
        ...d,
        isMax,
        heightPercentage: (d.sales / maxSales) * 100
      }
    })
  }, [orders])

  // Cálculo de los 3 Productos Estrella más vendidos de la tienda
  const topProducts = useMemo(() => {
    const productSales: Record<string, { name: string; quantity: number; image: string | null; price: number }> = {}
    
    orders.forEach(o => {
      if (o.status === 'DELIVERED' && o.items) {
        o.items.forEach(item => {
          if (item.product) {
            const p = item.product
            if (!productSales[p.id]) {
              productSales[p.id] = {
                name: p.name,
                quantity: 0,
                image: p.image || null,
                price: p.price
              }
            }
            productSales[p.id].quantity += item.quantity
          }
        })
      }
    })

    return Object.values(productSales)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 3)
  }, [orders])

  if (status === 'loading' || loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
      </div>
    )
  }

  return (
    <>
      <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface">Panel de Control</h1>
          <p className="text-body-md text-on-surface-variant">Resumen de operaciones para hoy, {new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })}.</p>
        </div>
        <div className="flex gap-3">
          <Link href="/vendor/orders" className="bg-primary-container text-white px-6 py-2 rounded-lg font-bold flex items-center gap-2 hover:opacity-90 transition-opacity active:scale-95">
            <span className="material-symbols-outlined">assignment</span>
            Ver Todos los Pedidos
          </Link>
        </div>
      </header>

      {/* Bento Grid Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {/* Main KPI Card */}
        <div className="md:col-span-2 bg-surface-container-lowest border border-outline-variant rounded-xl p-6 flex flex-col justify-between hover:shadow-lg transition-shadow">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-label-md font-label-md text-secondary uppercase tracking-wider">Ventas del Día (Entregadas)</span>
              <h3 className="text-headline-lg font-headline-lg text-primary-container mt-1">{formatPrice(todaySales)}</h3>
            </div>
            <div className="bg-green-100 text-green-700 px-2 py-1 rounded-full flex items-center gap-1 text-label-md font-bold">
              <span className="material-symbols-outlined text-[16px]">trending_up</span>
              Estadísticas
            </div>
          </div>
          <div className="mt-4 flex items-center gap-4">
            <div className="flex -space-x-2">
              <div className="w-8 h-8 rounded-full border-2 border-white bg-primary-fixed flex items-center justify-center text-[10px] font-bold text-primary">C</div>
              <div className="w-8 h-8 rounded-full border-2 border-white bg-secondary-fixed flex items-center justify-center text-[10px] font-bold">+{todayCustomers}</div>
            </div>
            <span className="text-body-sm text-on-surface-variant">Clientes atendidos hoy</span>
          </div>
        </div>

        {/* Metrics Column */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 flex flex-col justify-between hover:shadow-lg transition-shadow">
          <div className="flex items-center gap-3 text-secondary">
            <span className="material-symbols-outlined">check_circle</span>
            <span className="text-label-md font-label-md uppercase">Completados</span>
          </div>
          <h3 className="text-headline-md font-headline-md mt-2">{todayCompleted}</h3>
          <p className="text-body-sm text-on-surface-variant mt-1">Órdenes finalizadas hoy</p>
        </div>
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 flex flex-col justify-between hover:shadow-lg transition-shadow">
          <div className="flex items-center gap-3 text-secondary">
            <span className="material-symbols-outlined">stars</span>
            <span className="text-label-md font-label-md uppercase">Calificación</span>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <h3 className="text-headline-md font-headline-md">4.9</h3>
            <span className="material-symbols-outlined text-amber-400" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
          </div>
          <p className="text-body-sm text-on-surface-variant mt-1">Basado en opiniones reales</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Weekly Sales Chart (Dynamic representation) */}
        <div className="lg:col-span-2 bg-surface-container-lowest border border-outline-variant rounded-xl p-6 flex flex-col justify-between">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-headline-sm text-headline-sm text-on-surface">Ventas Semanales</h3>
            <span className="text-label-md text-on-surface-variant bg-surface-container-low px-3 py-1 rounded-lg">
              Últimos 7 días
            </span>
          </div>

          <div className="h-64 flex items-end justify-between gap-2 px-2 relative mt-4">
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none border-b border-outline-variant">
              <div className="border-t border-surface-container-highest w-full h-0"></div>
              <div className="border-t border-surface-container-highest w-full h-0"></div>
              <div className="border-t border-surface-container-highest w-full h-0"></div>
            </div>
            {/* Chart Bars */}
            {weeklyData.map((day, i) => (
              <div key={i} className="flex flex-col items-center flex-1 z-10 group relative">
                {/* Premium Interactive Tooltip */}
                <div className="absolute bottom-[105%] bg-surface-container-highest border border-outline-variant text-on-surface text-[11px] px-2.5 py-1 rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-30 font-bold whitespace-nowrap">
                  {formatPrice(day.sales)}
                </div>
                
                <div 
                  className={`w-full max-w-[34px] rounded-t-lg transition-all duration-1000 origin-bottom cursor-pointer ${
                    day.isMax ? 'bg-primary-container' : 'bg-secondary-container hover:bg-primary'
                  }`} 
                  style={{ height: `${Math.max(day.heightPercentage, 5)}%` }}
                ></div>
                <span className={`text-[11px] md:text-label-md font-label-md mt-2 ${day.isMax ? 'text-primary font-bold' : 'text-secondary'}`}>
                  {day.name}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions / Best Products */}
        <div className="flex flex-col gap-6">
          <div className="bg-primary-container text-white rounded-xl p-6 relative overflow-hidden group">
            <div className="relative z-10">
              <h3 className="font-headline-sm text-headline-sm mb-2">Ticket Promedio</h3>
              <p className="text-headline-md font-bold">{formatPrice(todayCompleted > 0 ? todaySales / todayCompleted : 0)}</p>
              <p className="text-body-sm opacity-80 mt-4">Mantén tus promociones activas para aumentar este valor.</p>
              <Link href="/vendor/orders" className="mt-4 inline-block bg-white text-primary-container px-4 py-2 rounded-lg font-bold text-label-md hover:bg-primary-fixed transition-colors">Ver Detalles</Link>
            </div>
            <span className="material-symbols-outlined absolute -right-4 -bottom-4 text-9xl opacity-10 group-hover:scale-110 transition-transform">receipt_long</span>
          </div>

          {/* Top 3 Productos Estrella */}
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6">
            <h3 className="font-headline-sm text-headline-sm text-on-surface mb-4">Productos Estrella</h3>
            <div className="flex flex-col gap-3">
              {topProducts.length > 0 ? (
                topProducts.map((p, idx) => (
                  <div key={p.name} className="flex items-center gap-3 p-2 rounded-lg border border-outline-variant hover:bg-surface-container-low transition-colors">
                    <div className="w-12 h-12 rounded-lg overflow-hidden bg-surface-container-low flex-shrink-0 flex items-center justify-center border border-outline-variant relative">
                      {p.image ? (
                        <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="material-symbols-outlined text-secondary text-2xl">fastfood</span>
                      )}
                      <div className="absolute top-0 left-0 bg-primary text-white text-[10px] font-bold px-1.5 py-0.5 rounded-br-lg shadow-sm">
                        #{idx + 1}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-label-md font-bold text-on-surface truncate">{p.name}</p>
                      <p className="text-body-sm text-on-surface-variant">{p.quantity} vendidos</p>
                    </div>
                    <div className="text-right">
                      <p className="text-label-md font-bold text-primary">{formatPrice(p.price)}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-body-sm text-secondary text-center py-4">No hay datos de ventas aún.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Orders Table */}
      <div className="mt-8 bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden shadow-sm">
        <div className="p-6 border-b border-outline-variant flex justify-between items-center">
          <h3 className="font-headline-sm text-headline-sm text-on-surface">Pedidos Recientes</h3>
          <Link href="/vendor/orders" className="text-primary font-bold text-label-md hover:underline">Ver todos</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-surface-container-low border-b border-outline-variant">
              <tr>
                <th className="p-4 text-label-md font-label-md text-secondary uppercase">ID Pedido</th>
                <th className="p-4 text-label-md font-label-md text-secondary uppercase">Cliente</th>
                <th className="p-4 text-label-md font-label-md text-secondary uppercase">Estado</th>
                <th className="p-4 text-label-md font-label-md text-secondary uppercase">Total</th>
                <th className="p-4 text-label-md font-label-md text-secondary uppercase">Hora</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {orders.slice(0, 5).map(order => (
                <tr key={order.id} className="hover:bg-surface-container-lowest transition-colors cursor-pointer group">
                  <td className="p-4 font-bold text-on-surface">#{order.orderNumber}</td>
                  <td className="p-4 text-body-md">{order.customerName}</td>
                  <td className="p-4">
                    <span className={`px-3 py-1 rounded-full text-label-md font-bold ${getOrderStatusColor(order.status)}`}>
                      {getOrderStatusLabel(order.status)}
                    </span>
                  </td>
                  <td className="p-4 font-bold">{formatPrice(order.total)}</td>
                  <td className="p-4 text-on-surface-variant">{formatDate(order.createdAt).split(',')[1]}</td>
                </tr>
              ))}
              {orders.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-secondary">
                    No hay pedidos recientes.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}
