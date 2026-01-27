import Pusher from 'pusher'
import PusherClient from 'pusher-js'

// Verificar si Pusher está configurado
const isPusherConfigured = () => {
  return !!(
    process.env.PUSHER_APP_ID &&
    process.env.PUSHER_KEY &&
    process.env.PUSHER_SECRET &&
    process.env.PUSHER_CLUSTER
  )
}

// Servidor (para emitir eventos) - solo si está configurado
let pusherServerInstance: Pusher | null = null

export const getPusherServer = (): Pusher | null => {
  if (!isPusherConfigured()) {
    return null
  }
  
  if (!pusherServerInstance) {
    pusherServerInstance = new Pusher({
      appId: process.env.PUSHER_APP_ID!,
      key: process.env.PUSHER_KEY!,
      secret: process.env.PUSHER_SECRET!,
      cluster: process.env.PUSHER_CLUSTER!,
      useTLS: true,
    })
  }
  
  return pusherServerInstance
}

// Mantener compatibilidad con código existente
export const pusherServer = {
  trigger: async (channel: string, event: string, data: unknown) => {
    const server = getPusherServer()
    if (server) {
      return server.trigger(channel, event, data)
    }
    console.warn('Pusher server not configured, skipping event:', event)
    return Promise.resolve()
  }
}

// Cliente (para escuchar eventos)
export const pusherClient = typeof window !== 'undefined' && process.env.NEXT_PUBLIC_PUSHER_KEY
  ? new PusherClient(
      process.env.NEXT_PUBLIC_PUSHER_KEY,
      {
        cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || 'us2',
      }
    )
  : null

// Canales
export const CHANNELS = {
  // Canal general de pedidos (admin ve todos)
  ORDERS: 'orders',
  // Canal específico de tienda (vendedor ve solo su tienda)
  STORE: (storeId: string) => `store-${storeId}`,
  // Canal de repartidores
  DRIVER: 'drivers',
  // Canal específico de pedido (cliente ve su pedido)
  ORDER: (orderId: string) => `order-${orderId}`,
  // Canal de admin
  ADMIN: 'admin',
}

// Eventos
export const EVENTS = {
  // Nuevo pedido creado
  NEW_ORDER: 'new-order',
  // Pedido actualizado (cambio de estado)
  ORDER_UPDATED: 'order-updated',
  // Pedido listo para recoger
  ORDER_READY: 'order-ready',
  // Pedido recogido por repartidor
  ORDER_PICKED_UP: 'order-picked-up',
  // Pedido entregado
  ORDER_DELIVERED: 'order-delivered',
  // Pedido cancelado
  ORDER_CANCELLED: 'order-cancelled',
  // Nuevo mensaje en el chat
  NEW_MESSAGE: 'new-message',
  // Pago verificado
  PAYMENT_VERIFIED: 'payment-verified',
}

// Estados de pedido con sus etiquetas para notificaciones
export const ORDER_STATUS_NOTIFICATIONS: Record<string, { title: string; message: string; icon: string }> = {
  PENDING: {
    title: 'Pedido recibido',
    message: 'Tu pedido ha sido recibido y está pendiente de confirmación',
    icon: '📝'
  },
  CONFIRMED: {
    title: 'Pedido confirmado',
    message: 'Tu pedido ha sido confirmado y se está preparando',
    icon: '✅'
  },
  READY: {
    title: 'Pedido listo',
    message: 'Tu pedido está listo y esperando al repartidor',
    icon: '🍽️'
  },
  PICKED_UP: {
    title: 'Pedido en camino',
    message: 'Un repartidor recogió tu pedido y va en camino',
    icon: '🏍️'
  },
  DELIVERED: {
    title: 'Pedido entregado',
    message: 'Tu pedido ha sido entregado. ¡Buen provecho!',
    icon: '🎉'
  },
  CANCELLED: {
    title: 'Pedido cancelado',
    message: 'Tu pedido ha sido cancelado',
    icon: '❌'
  },
}
