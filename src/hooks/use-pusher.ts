'use client'

import { useEffect, useCallback, useState, useRef } from 'react'
import Pusher from 'pusher-js'
import { CHANNELS, EVENTS, ORDER_STATUS_NOTIFICATIONS } from '@/lib/pusher'

let pusherInstance: Pusher | null = null

function getPusherInstance(): Pusher | null {
  if (typeof window === 'undefined') return null

  const key = process.env.NEXT_PUBLIC_PUSHER_KEY
  const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER

  if (!key || !cluster) {
    return null
  }

  if (!pusherInstance) {
    pusherInstance = new Pusher(key, { cluster })
  }

  return pusherInstance
}

// Hook básico para suscribirse a un canal y evento
export function usePusherChannel(
  channelName: string,
  eventName: string,
  callback: (data: unknown) => void,
  enabled: boolean = true
) {
  const callbackRef = useRef(callback)
  callbackRef.current = callback

  useEffect(() => {
    if (!enabled || !channelName) return

    const pusher = getPusherInstance()
    if (!pusher) return

    const channel = pusher.subscribe(channelName)
    
    const handler = (data: unknown) => {
      callbackRef.current(data)
    }
    
    channel.bind(eventName, handler)

    return () => {
      channel.unbind(eventName, handler)
      pusher.unsubscribe(channelName)
    }
  }, [channelName, eventName, enabled])
}

// Hook para VENDEDOR - escuchar pedidos de su tienda
export function useStoreOrders(storeId: string | null, onNewOrder: () => void, onOrderUpdate: () => void) {
  const [notification, setNotification] = useState<{
    show: boolean
    type: 'new' | 'update' | 'message'
    message: string
  } | null>(null)

  const handleNewOrder = useCallback((data: unknown) => {
    console.log('New order received:', data)
    
    // Mostrar notificación visual
    setNotification({
      show: true,
      type: 'new',
      message: `Nuevo pedido #${(data as { orderNumber?: number })?.orderNumber || ''}`
    })
    
    // Reproducir sonido
    playNotificationSound()
    
    // Mostrar notificación del sistema
    showSystemNotification('Nuevo pedido', 'Tienes un nuevo pedido pendiente')
    
    // Callback para refrescar datos
    onNewOrder()
    
    // Ocultar después de 5 segundos
    setTimeout(() => setNotification(null), 5000)
  }, [onNewOrder])

  const handleOrderUpdate = useCallback((data: unknown) => {
    console.log('Order updated:', data)
    const orderData = data as { paymentStatus?: string; orderNumber?: number }
    
    // Mostrar notificación si es un comprobante subido
    if (orderData.paymentStatus === 'UPLOADED') {
      setNotification({
        show: true,
        type: 'update',
        message: `📎 Pedido #${orderData.orderNumber || ''}: Comprobante recibido`
      })
      playNotificationSound()
      showSystemNotification('Comprobante recibido', `Pedido #${orderData.orderNumber || ''} tiene un nuevo comprobante`)
      setTimeout(() => setNotification(null), 5000)
    }
    
    onOrderUpdate()
  }, [onOrderUpdate])

  const handleNewMessage = useCallback((data: unknown) => {
    console.log('New message received:', data)
    const msgData = data as { orderNumber?: number; senderName?: string; content?: string }
    
    setNotification({
      show: true,
      type: 'message',
      message: `💬 Pedido #${msgData.orderNumber || ''}: ${msgData.content || 'Nuevo mensaje'}`
    })
    
    playNotificationSound()
    showSystemNotification(`Mensaje de ${msgData.senderName || 'Cliente'}`, msgData.content || 'Nuevo mensaje')
    
    onOrderUpdate()
    
    setTimeout(() => setNotification(null), 5000)
  }, [onOrderUpdate])

  usePusherChannel(
    storeId ? CHANNELS.STORE(storeId) : '',
    EVENTS.NEW_ORDER,
    handleNewOrder,
    !!storeId
  )
  
  usePusherChannel(
    storeId ? CHANNELS.STORE(storeId) : '',
    EVENTS.ORDER_UPDATED,
    handleOrderUpdate,
    !!storeId
  )
  
  usePusherChannel(
    storeId ? CHANNELS.STORE(storeId) : '',
    EVENTS.NEW_MESSAGE,
    handleNewMessage,
    !!storeId
  )

  return notification
}

// Hook para REPARTIDOR - escuchar pedidos listos
export function useDriverOrders(onOrderReady: (data: unknown) => void) {
  const [notification, setNotification] = useState<{
    show: boolean
    order: unknown
  } | null>(null)

  const handleOrderReady = useCallback((data: unknown) => {
    console.log('Order ready for pickup:', data)
    
    setNotification({ show: true, order: data })
    playNotificationSound()
    showSystemNotification(
      'Pedido listo para recoger',
      `Pedido #${(data as { orderNumber?: number })?.orderNumber || ''} en ${(data as { storeName?: string })?.storeName || ''}`
    )
    
    onOrderReady(data)
    
    setTimeout(() => setNotification(null), 10000)
  }, [onOrderReady])

  usePusherChannel(CHANNELS.DRIVER, EVENTS.ORDER_READY, handleOrderReady)

  return notification
}

// Hook para ADMIN - escuchar todos los pedidos
export function useAdminOrders(onNewOrder: () => void, onOrderUpdate: () => void) {
  const [notification, setNotification] = useState<{
    show: boolean
    type: 'new' | 'update'
    message: string
  } | null>(null)

  const handleNewOrder = useCallback((data: unknown) => {
    console.log('Admin: New order:', data)
    const orderData = data as { orderNumber?: number; storeName?: string }
    
    setNotification({
      show: true,
      type: 'new',
      message: `Nuevo pedido #${orderData.orderNumber || ''} en ${orderData.storeName || ''}`
    })
    
    playNotificationSound()
    onNewOrder()
    
    setTimeout(() => setNotification(null), 5000)
  }, [onNewOrder])

  const handleOrderUpdate = useCallback((data: unknown) => {
    console.log('Admin: Order updated:', data)
    onOrderUpdate()
  }, [onOrderUpdate])

  usePusherChannel(CHANNELS.ADMIN, EVENTS.NEW_ORDER, handleNewOrder)
  usePusherChannel(CHANNELS.ADMIN, EVENTS.ORDER_UPDATED, handleOrderUpdate)

  return notification
}

// Hook para CLIENTE - escuchar actualizaciones de su pedido específico
export function useOrderUpdates(orderId: string | null) {
  const [orderStatus, setOrderStatus] = useState<string | null>(null)
  const [notification, setNotification] = useState<{
    show: boolean
    title: string
    message: string
    icon: string
  } | null>(null)

  const handleOrderUpdate = useCallback((data: unknown) => {
    console.log('Order update for customer:', data)
    const orderData = data as { 
      status?: string
      orderId?: string
      actualDeliveryFee?: number | null
      deliveryPaymentStatus?: string | null
    }
    
    // Si se registró el valor del envío, forzar actualización
    if (orderData.actualDeliveryFee !== undefined && orderData.actualDeliveryFee !== null) {
      console.log('Delivery fee registered, triggering refresh...')
      // Disparar un evento personalizado para que la página se actualice
      window.dispatchEvent(new CustomEvent('order-delivery-fee-updated', { 
        detail: { actualDeliveryFee: orderData.actualDeliveryFee } 
      }))
    }
    
    // Actualizar estado si cambió
    if (orderData.status) {
      setOrderStatus(orderData.status)
      
      const statusInfo = ORDER_STATUS_NOTIFICATIONS[orderData.status]
      if (statusInfo) {
        setNotification({
          show: true,
          title: statusInfo.title,
          message: statusInfo.message,
          icon: statusInfo.icon
        })
        
        playNotificationSound()
        showSystemNotification(statusInfo.title, statusInfo.message)
        
        setTimeout(() => setNotification(null), 8000)
      }
    }
  }, [])

  // Escuchar todos los eventos relevantes
  usePusherChannel(
    orderId ? CHANNELS.ORDER(orderId) : '',
    EVENTS.ORDER_UPDATED,
    handleOrderUpdate,
    !!orderId
  )
  
  usePusherChannel(
    orderId ? CHANNELS.ORDER(orderId) : '',
    EVENTS.ORDER_PICKED_UP,
    handleOrderUpdate,
    !!orderId
  )
  
  usePusherChannel(
    orderId ? CHANNELS.ORDER(orderId) : '',
    EVENTS.ORDER_DELIVERED,
    handleOrderUpdate,
    !!orderId
  )
  
  usePusherChannel(
    orderId ? CHANNELS.ORDER(orderId) : '',
    EVENTS.ORDER_CANCELLED,
    handleOrderUpdate,
    !!orderId
  )

  return { orderStatus, notification }
}

// Helpers
function playNotificationSound() {
  try {
    if (typeof window !== 'undefined') {
      const AudioCtxClass = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
      if (AudioCtxClass) {
        const ctx = new AudioCtxClass()
        
        // Primer tono (ding - D5)
        const osc1 = ctx.createOscillator()
        const gain1 = ctx.createGain()
        osc1.type = 'sine'
        osc1.frequency.setValueAtTime(587.33, ctx.currentTime)
        gain1.gain.setValueAtTime(0, ctx.currentTime)
        gain1.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 0.05)
        gain1.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35)
        osc1.connect(gain1)
        gain1.connect(ctx.destination)
        osc1.start()
        osc1.stop(ctx.currentTime + 0.35)

        // Segundo tono (dong - A5)
        const osc2 = ctx.createOscillator()
        const gain2 = ctx.createGain()
        osc2.type = 'sine'
        osc2.frequency.setValueAtTime(880.00, ctx.currentTime + 0.12)
        gain2.gain.setValueAtTime(0, ctx.currentTime + 0.12)
        gain2.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 0.17)
        gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.55)
        osc2.connect(gain2)
        gain2.connect(ctx.destination)
        osc2.start(ctx.currentTime + 0.12)
        osc2.stop(ctx.currentTime + 0.55)
        return
      }
    }
  } catch (e) {
    console.warn('Web Audio synthesis failed, falling back:', e)
  }

  try {
    const audio = new Audio('/notification.mp3')
    audio.volume = 0.5
    audio.play().catch(() => {
      // Silently fail if autoplay is blocked
    })
  } catch {
    // Audio not supported
  }
}

function showSystemNotification(title: string, body: string) {
  if (typeof window === 'undefined') return
  
  if (Notification.permission === 'granted') {
    new Notification(title, {
      body,
      icon: '/logo.png',
      badge: '/logo.png',
    })
  }
}

// Hook para verificar si Pusher está disponible
export function usePusherAvailable(): boolean {
  const [available, setAvailable] = useState(false)
  useEffect(() => {
    setAvailable(getPusherInstance() !== null)
  }, [])
  return available
}

// Hook para solicitar permiso de notificaciones
export function useNotificationPermission() {
  const [permission, setPermission] = useState<NotificationPermission>('default')

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermission(Notification.permission)
    }
  }, [])

  const requestPermission = useCallback(async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return 'denied'
    }

    const result = await Notification.requestPermission()
    setPermission(result)
    return result
  }, [])

  return { permission, requestPermission }
}
