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

interface StoreInfo {
  id: string
  name: string
  isOpen: boolean
}

export default function VendorOrdersPage() {
  const { data: session, status } = useSession()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')
  const [storeInfo, setStoreInfo] = useState<StoreInfo | null>(null)
  const [noStoreAssigned, setNoStoreAssigned] = useState(false)
  
  // Permisos de notificación
  const { permission, requestPermission } = useNotificationPermission()

  // Buscar la tienda del usuario por su ID (por si el storeId no está en la sesión)
  const findUserStore = async () => {
    if (!session?.user?.id) return null

    try {
      const response = await fetch('/api/stores')
      const stores = await response.json()

      // Buscar si alguna tienda pertenece a este usuario
      const userStore = stores.find((store: { ownerId: string }) =>
        store.ownerId === session.user.id
      )

      return userStore || null
    } catch (error) {
      console.error('Error finding store:', error)
      return null
    }
  }

  const fetchOrders = useCallback(async (storeId: string) => {
    try {
      const response = await fetch(`/api/orders?storeId=${storeId}`)
      const data = await response.json()
      setOrders(data)
    } catch (error) {
      console.error('Error fetching orders:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  // Hook para notificaciones en tiempo real
  const storeId = session?.user?.storeId || storeInfo?.id || null
  const notification = useStoreOrders(
    storeId,
    () => {
      // Callback cuando llega un nuevo pedido
      if (storeId) fetchOrders(storeId)
    },
    () => {
      // Callback cuando se actualiza un pedido
      if (storeId) fetchOrders(storeId)
    }
  )

  useEffect(() => {
    const initializeData = async () => {
      if (status === 'loading') return

      let currentStoreId = session?.user?.storeId

      // Si no hay storeId en la sesión, buscar por userId
      if (!currentStoreId && session?.user?.id) {
        const foundStore = await findUserStore()
        if (foundStore) {
          currentStoreId = foundStore.id
          setStoreInfo(foundStore)
        }
      }

      if (currentStoreId) {
        // Si tenemos storeId en sesión pero no info de tienda, obtenerla
        if (!storeInfo) {
          try {
            const res = await fetch(`/api/stores`)
            const stores = await res.json()
            const store = stores.find((s: { id: string }) => s.id === currentStoreId)
            if (store) setStoreInfo(store)
          } catch {}
        }

        await fetchOrders(currentStoreId)
        setNoStoreAssigned(false)
      } else {
        setLoading(false)
        setNoStoreAssigned(true)
      }
    }

    initializeData()
  }, [session, status, fetchOrders, storeInfo])

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      const storeId = session?.user?.storeId || storeInfo?.id
      if (storeId) fetchOrders(storeId)
    } catch (error) {
      console.error('Error updating order:', error)
    }
  }

  const handleRefreshSession = async () => {
    // Cerrar sesión y redirigir a login para obtener el storeId actualizado
    await signOut({ callbackUrl: '/login' })
  }

  const filteredOrders = orders.filter((order) => {
    if (filter === 'all') return true
    return order.status === filter
  })

  const pendingCount = orders.filter((o) => o.status === 'PENDING').length
  const confirmedCount = orders.filter((o) => o.status === 'CONFIRMED').length
  const readyCount = orders.filter((o) => o.status === 'READY').length

  if (status === 'loading' || loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3" />
          <div className="h-32 bg-gray-200 rounded" />
          <div className="h-32 bg-gray-200 rounded" />
        </div>
      </div>
    )
  }

  // Mostrar notificación flotante de nuevo pedido
  const NotificationBanner = () => {
    if (!notification?.show) return null
    
    const getBannerStyle = () => {
      switch (notification.type) {
        case 'new':
          return 'bg-gradient-to-r from-green-600 to-orange-500 text-white'
        case 'message':
          return 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white'
        default:
          return 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white'
      }
    }
    
    const getIcon = () => {
      switch (notification.type) {
        case 'new':
          return '🔔'
        case 'message':
          return '💬'
        default:
          return '📎'
      }
    }
    
    const getTitle = () => {
      switch (notification.type) {
        case 'new':
          return '¡Nuevo pedido!'
        case 'message':
          return 'Nuevo mensaje'
        default:
          return 'Comprobante recibido'
      }
    }
    
    return (
      <div className="fixed top-4 right-4 z-50 animate-bounce">
        <div className={`px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 ${getBannerStyle()}`}>
          <span className="text-3xl">{getIcon()}</span>
          <div>
            <p className="font-bold">{getTitle()}</p>
            <p className="text-sm opacity-90">{notification.message}</p>
          </div>
        </div>
      </div>
    )
  }

  // Si no hay tienda asignada
  if (noStoreAssigned) {
    return (
      <div className="max-w-md mx-auto text-center py-12">
        <Card className="p-8">
          <span className="text-6xl block mb-4">🏪</span>
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            No tienes una tienda asignada
          </h2>
          <p className="text-gray-600 mb-6">
            Si acabas de crear tu cuenta, es posible que necesites cerrar sesión y volver a entrar para cargar los datos de tu tienda.
          </p>
          <div className="space-y-3">
            <Button onClick={handleRefreshSession} className="w-full">
              Cerrar sesión y volver a entrar
            </Button>
            <p className="text-xs text-gray-500">
              Si el problema persiste, contacta al administrador.
            </p>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Notificación flotante */}
      <NotificationBanner />
      
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pedidos</h1>
          {storeInfo && (
            <p className="text-sm text-gray-500">
              {storeInfo.name} • {storeInfo.isOpen ? '🟢 Abierto' : '🔴 Cerrado'}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {permission === 'default' && (
            <Button onClick={requestPermission} variant="secondary" size="sm">
              🔔 Activar notificaciones
            </Button>
          )}
          {permission === 'granted' && (
            <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
              🔔 Notificaciones activas
            </span>
          )}
          <Button onClick={() => {
            const currentStoreId = session?.user?.storeId || storeInfo?.id
            if (currentStoreId) fetchOrders(currentStoreId)
          }} variant="secondary" size="sm">
            🔄 Actualizar
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <Card className="text-center p-4">
          <p className="text-3xl font-bold text-yellow-600">{pendingCount}</p>
          <p className="text-sm text-gray-600">Pendientes</p>
        </Card>
        <Card className="text-center p-4">
          <p className="text-3xl font-bold text-blue-600">{confirmedCount}</p>
          <p className="text-sm text-gray-600">Confirmados</p>
        </Card>
        <Card className="text-center p-4">
          <p className="text-3xl font-bold text-purple-600">{readyCount}</p>
          <p className="text-sm text-gray-600">Listos</p>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {[
          { value: 'all', label: 'Todos' },
          { value: 'PENDING', label: 'Pendientes' },
          { value: 'CONFIRMED', label: 'Confirmados' },
          { value: 'READY', label: 'Listos' },
          { value: 'PICKED_UP', label: 'En camino' },
          { value: 'DELIVERED', label: 'Entregados' },
        ].map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              filter === f.value
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {filteredOrders.length === 0 ? (
          <Card className="text-center py-12">
            <p className="text-gray-500">No hay pedidos {filter !== 'all' && 'en este estado'}</p>
          </Card>
        ) : (
          filteredOrders.map((order) => (
            <Card key={order.id}>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <h3 className="font-semibold">Pedido #{order.orderNumber}</h3>
                  <p className="text-sm text-gray-500">{formatDate(order.createdAt)}</p>
                </div>
                <Badge className={getOrderStatusColor(order.status)}>
                  {getOrderStatusLabel(order.status)}
                </Badge>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-sm text-gray-700 mb-2">Cliente</h4>
                    <p className="text-sm">{order.customerName}</p>
                    <p className="text-sm text-gray-600">{order.customerPhone}</p>
                    <p className="text-sm text-gray-600">{order.customerAddress}</p>
                    {order.customerNotes && (
                      <p className="text-sm text-gray-500 mt-1">
                        Notas: {order.customerNotes}
                      </p>
                    )}
                  </div>
                  <div>
                    <h4 className="font-medium text-sm text-gray-700 mb-2">Productos</h4>
                    {order.items.map((item) => (
                      <p key={item.id} className="text-sm">
                        {item.quantity}x {item.product.name} - {formatPrice(item.totalPrice)}
                      </p>
                    ))}
                    <p className="font-semibold mt-2">Total: {formatPrice(order.total)}</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t">
                  {/* Si el pago está verificado y confirmado, mostrar botón de preparar pedido */}
                  {order.status === 'CONFIRMED' && order.paymentStatus === 'VERIFIED' && (
                    <Link href={`/vendor/order/${order.id}`}>
                      <Button size="sm" className="bg-purple-600 hover:bg-purple-700">
                        📦 Ver pedido
                      </Button>
                    </Link>
                  )}
                  
                  {/* Botón de chat para pedidos pendientes o sin pago verificado */}
                  {(order.status === 'PENDING' || (order.status === 'CONFIRMED' && order.paymentStatus !== 'VERIFIED')) && (
                    <Link href={`/vendor/chat/${order.id}`}>
                      <Button size="sm" className="bg-green-600 hover:bg-green-700">
                        💬 Abrir chat
                      </Button>
                    </Link>
                  )}
                  
                  {/* Estado del pago */}
                  {order.paymentStatus === 'UPLOADED' && order.status === 'PENDING' && (
                    <Link href={`/vendor/chat/${order.id}`}>
                      <Button size="sm" className="bg-yellow-500 hover:bg-yellow-600 text-black">
                        📎 Verificar pago
                      </Button>
                    </Link>
                  )}
                  
                  {order.status === 'PENDING' && order.paymentStatus !== 'UPLOADED' && (
                    <Button
                      size="sm"
                      onClick={() => updateOrderStatus(order.id, 'CONFIRMED')}
                    >
                      ✓ Confirmar
                    </Button>
                  )}
                  
                  {order.status === 'CONFIRMED' && order.paymentStatus === 'VERIFIED' && (
                    <Button
                      size="sm"
                      onClick={() => updateOrderStatus(order.id, 'READY')}
                      className="bg-purple-600 hover:bg-purple-700"
                    >
                      🍽️ Listo para enviar
                    </Button>
                  )}
                  
                  {(order.status === 'PENDING' || order.status === 'CONFIRMED') && (
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => updateOrderStatus(order.id, 'CANCELLED')}
                    >
                      ✕
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
