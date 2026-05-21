'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { formatPrice } from '@/lib/utils'
import type { Order, Message } from '@/types'
import { pusherClient, CHANNELS, EVENTS } from '@/lib/pusher'

export default function DriverOrderDetailPage() {
  const { data: session } = useSession()
  const { orderId } = useParams() as { orderId: string }
  const router = useRouter()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [delivering, setDelivering] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [message, setMessage] = useState('')
  const [messages, setMessages] = useState<Array<{ text: string; from: 'driver' | 'client'; time: string }>>([
    { text: '¡Tu pedido está en camino!', from: 'driver', time: new Date().toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' }) }
  ])
  const chatRef = useRef<HTMLDivElement>(null)

  const mapDbMessage = (msg: Message) => ({
    text: msg.content,
    from: msg.senderType === 'DRIVER' ? ('driver' as const) : ('client' as const),
    time: new Date(msg.createdAt).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' }),
  })

  useEffect(() => {
    fetch(`/api/orders/${orderId}`)
      .then(r => r.json())
      .then(d => setOrder(d))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [orderId])

  useEffect(() => {
    // 1. Cargar historial real de mensajes del pedido
    fetch(`/api/orders/${orderId}/messages`)
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) {
          if (data.length === 0) {
            setMessages([
              { text: '¡Tu pedido está en camino!', from: 'driver', time: new Date().toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' }) }
            ])
          } else {
            setMessages(data.map(mapDbMessage))
          }
        }
      })
      .catch(err => console.error('Error fetching messages:', err))

    // 2. Suscribirse a Pusher para sincronizar nuevos mensajes en tiempo real
    if (pusherClient) {
      const channel = pusherClient.subscribe(CHANNELS.ORDER(orderId))
      channel.bind(EVENTS.NEW_MESSAGE, (data: { message: Message }) => {
        if (data?.message) {
          const mapped = mapDbMessage(data.message)
          setMessages(prev => {
            const exists = prev.some(m => m.text === mapped.text && m.from === mapped.from)
            if (exists) return prev
            return [...prev, mapped]
          })
        }
      })

      return () => {
        channel.unbind_all()
        pusherClient?.unsubscribe(CHANNELS.ORDER(orderId))
      }
    }
  }, [orderId])

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight
  }, [messages])

  const sendMessage = async (text: string) => {
    if (!text.trim()) return
    const time = new Date().toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })
    
    // Feedback inmediato local
    setMessages(prev => [...prev, { text, from: 'driver', time }])
    setMessage('')

    try {
      await fetch(`/api/orders/${orderId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: text.trim(),
          senderType: 'DRIVER',
          senderName: session?.user?.name || 'Repartidor',
        }),
      })
    } catch (err) {
      console.error('Error sending message:', err)
    }
  }

  const confirmDelivery = async () => {
    setDelivering(true)
    try {
      await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'DELIVERED' }),
      })
      if ('vibrate' in navigator) navigator.vibrate(200)
      setShowSuccess(true)
    } catch {
      alert('Error al confirmar la entrega. Intenta de nuevo.')
    } finally {
      setDelivering(false)
    }
  }

  const quickReplies = ['Estoy afuera', '5 min para llegar', '¿Piso exacto?', 'Pedido entregado']

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="text-center py-16 px-margin-mobile">
        <span className="material-symbols-outlined text-5xl text-outline">error_outline</span>
        <p className="text-on-surface-variant mt-3">Pedido no encontrado.</p>
        <Link href="/driver/active" className="mt-4 inline-block bg-primary text-on-primary px-6 py-3 rounded-xl font-bold">
          Volver
        </Link>
      </div>
    )
  }

  return (
    <>
      {/* Custom TopAppBar for detail */}
      <header className="bg-surface dark:bg-surface-dim border-b border-outline-variant sticky top-0 z-40">
        <div className="flex justify-between items-center px-margin-mobile md:px-margin-desktop h-16 w-full max-w-container-max mx-auto">
          <div className="flex items-center gap-3">
            <Link href="/driver/active" className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-container transition-colors">
              <span className="material-symbols-outlined text-primary">arrow_back</span>
            </Link>
            <h1 className="font-headline-sm text-headline-sm font-bold text-primary">Pedido #{order.orderNumber}</h1>
          </div>
          <span className="font-label-md text-label-md text-primary bg-primary-fixed px-3 py-1 rounded-full">En Camino</span>
        </div>
      </header>

      <main className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-base space-y-6 pb-32">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter">
          {/* Left Column */}
          <div className="lg:col-span-7 space-y-6">
            {/* Animated Map Card */}
            <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden">
              <div className="relative h-64 md:h-80 w-full">
                {/* Simulated animated map background */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary-fixed/60 via-secondary-container to-surface-container-highest">
                  <div className="absolute inset-0 grid grid-cols-10 grid-rows-8 gap-0.5 opacity-20">
                    {Array.from({ length: 80 }).map((_, i) => (
                      <div key={i} className="border border-primary/30"></div>
                    ))}
                  </div>
                </div>
                {/* Animated courier icon */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="relative">
                    <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white shadow-lg border-2 border-white animate-bounce">
                      <span className="material-symbols-outlined text-[20px]">moped</span>
                    </div>
                    {/* Destination pulse */}
                    <div className="absolute -top-8 right-2 w-3 h-3 bg-primary rounded-full animate-ping"></div>
                  </div>
                </div>
                {/* Open in maps button */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent flex items-end p-4 z-10">
                  <a
                    href={order.customerLat && order.customerLng
                      ? `https://maps.google.com/?q=${order.customerLat},${order.customerLng}`
                      : `https://maps.google.com/?q=${encodeURIComponent(order.customerAddress)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full md:w-auto bg-primary text-on-primary font-bold py-3 px-6 rounded-lg flex items-center justify-center gap-2 shadow-lg hover:scale-[1.02] transition-transform"
                  >
                    <span className="material-symbols-outlined">directions</span>
                    ABRIR EN MAPAS
                  </a>
                </div>
              </div>
              <div className="p-4 space-y-2">
                <div className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-primary mt-1" style={{ fontVariationSettings: "'FILL' 1" }}>location_on</span>
                  <div>
                    <p className="font-headline-sm text-headline-sm">{order.customerAddress}</p>
                    <p className="text-on-surface-variant text-body-md">{order.customerNotes || 'Sin instrucciones especiales'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Customer Details */}
            <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-primary-fixed bg-primary-fixed flex items-center justify-center text-primary font-bold text-headline-sm">
                  {order.customerName?.charAt(0).toUpperCase() || 'C'}
                </div>
                <div>
                  <p className="font-label-md text-label-md text-secondary">CLIENTE</p>
                  <p className="font-headline-sm text-headline-sm">{order.customerName}</p>
                  <p className="text-on-surface-variant text-body-sm">{order.customerPhone}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <a
                  href={`tel:${order.customerPhone}`}
                  className="w-12 h-12 flex items-center justify-center rounded-full bg-surface-container hover:bg-surface-container-high text-primary transition-colors"
                >
                  <span className="material-symbols-outlined">call</span>
                </a>
              </div>
            </div>

            {/* Order Items */}
            <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden">
              <div className="p-4 bg-surface-container-low border-b border-outline-variant flex justify-between items-center">
                <h3 className="font-headline-sm text-headline-sm">Artículos del Pedido</h3>
                <span className="bg-secondary-container text-on-secondary-container px-3 py-1 rounded-full font-label-md text-label-md">
                  {order.items.length} ITEMS
                </span>
              </div>
              <div className="divide-y divide-outline-variant">
                {order.items.map(item => (
                  <div key={item.id} className="p-4 flex items-center gap-4 hover:bg-surface-container-lowest transition-colors">
                    <div className="w-12 h-12 bg-surface-container rounded-lg flex items-center justify-center">
                      <span className="material-symbols-outlined text-secondary">inventory_2</span>
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-body-md">{item.product.name}</p>
                      <p className="text-on-surface-variant text-body-sm">{formatPrice(item.product.price)} c/u</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-primary">x{item.quantity}</p>
                      <p className="text-body-sm font-medium">{formatPrice(item.totalPrice)}</p>
                    </div>
                  </div>
                ))}
              </div>
              {order.customerNotes && (
                <div className="p-4 bg-surface-container-lowest border-t border-outline-variant italic text-on-surface-variant text-body-sm flex items-start gap-2">
                  <span className="material-symbols-outlined text-sm mt-0.5">info</span>
                  Instrucciones: {order.customerNotes}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Chat */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-surface-container-lowest border border-outline-variant rounded-xl flex flex-col h-[480px]">
              <div className="p-4 border-b border-outline-variant flex items-center gap-3">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <h3 className="font-headline-sm text-headline-sm">Chat con Cliente</h3>
              </div>

              {/* Messages */}
              <div ref={chatRef} className="flex-1 overflow-y-auto p-4 space-y-4" style={{ scrollbarWidth: 'thin', scrollbarColor: '#c2c6d4 transparent' }}>
                <div className="text-center">
                  <span className="text-[10px] font-label-md bg-surface-container px-2 py-0.5 rounded text-on-surface-variant">
                    HOY {new Date().toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                {messages.map((msg, i) => (
                  <div key={i} className={`flex flex-col max-w-[85%] ${msg.from === 'driver' ? 'items-end ml-auto' : 'items-start'}`}>
                    <div className={`p-3 text-body-sm ${msg.from === 'driver'
                      ? 'bg-primary text-on-primary rounded-tl-xl rounded-bl-xl rounded-br-xl'
                      : 'bg-surface-container-high text-on-surface rounded-tr-xl rounded-br-xl rounded-bl-xl'}`}>
                      {msg.text}
                    </div>
                    <div className="flex items-center gap-1 mt-1 mx-1">
                      <span className="text-[10px] text-on-surface-variant">{msg.time}</span>
                      {msg.from === 'driver' && (
                        <span className="material-symbols-outlined text-[12px] text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>done_all</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Quick replies + input */}
              <div className="p-4 border-t border-outline-variant space-y-3">
                <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
                  {quickReplies.map(reply => (
                    <button
                      key={reply}
                      onClick={() => sendMessage(reply)}
                      className="whitespace-nowrap px-3 py-1.5 rounded-full border border-primary text-primary font-label-md text-label-md hover:bg-primary hover:text-on-primary transition-colors"
                    >
                      {reply}
                    </button>
                  ))}
                </div>
                <div className="relative">
                  <input
                    type="text"
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && sendMessage(message)}
                    className="w-full bg-surface-container-low border border-outline-variant rounded-full px-4 py-3 pr-12 focus:ring-2 focus:ring-primary focus:outline-none text-body-sm"
                    placeholder="Escribe un mensaje..."
                  />
                  <button
                    onClick={() => sendMessage(message)}
                    className="absolute right-2 top-1.5 w-9 h-9 bg-primary text-on-primary rounded-full flex items-center justify-center hover:opacity-90 transition-opacity"
                  >
                    <span className="material-symbols-outlined text-[18px]">send</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Report Problem */}
            <button className="w-full flex items-center justify-between p-4 bg-error-container text-on-error-container rounded-xl border border-error/20 hover:bg-error/10 transition-colors group">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined">report</span>
                <span className="font-bold">Reportar Problema</span>
              </div>
              <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">chevron_right</span>
            </button>
          </div>
        </div>
      </main>

      {/* Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 w-full bg-surface border-t border-outline-variant px-margin-mobile py-4 z-40 shadow-[0_-4px_12px_rgba(0,0,0,0.05)]">
        <div className="max-w-container-max mx-auto flex gap-4">
          <Link
            href="/driver/active"
            className="hidden md:flex flex-1 items-center justify-center gap-2 border-2 border-outline text-on-surface-variant font-bold py-4 rounded-xl hover:bg-surface-container transition-colors"
          >
            <span className="material-symbols-outlined">arrow_back</span>
            VOLVER
          </Link>
          <button
            onClick={confirmDelivery}
            disabled={delivering}
            className="flex-[2] bg-primary text-on-primary font-bold py-4 px-6 rounded-xl flex items-center justify-center gap-3 shadow-lg hover:brightness-110 active:scale-95 transition-all disabled:opacity-60"
          >
            <span className="material-symbols-outlined text-2xl">check_circle</span>
            {delivering ? 'CONFIRMANDO...' : 'CONFIRMAR ENTREGA'}
          </button>
        </div>
      </div>

      {/* Success Modal */}
      {showSuccess && (
        <div className="fixed inset-0 bg-inverse-surface/60 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
          <div className="bg-surface-container-lowest rounded-2xl max-w-sm w-full p-8 text-center space-y-6 animate-in zoom-in-95 duration-300">
            <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <span className="material-symbols-outlined text-6xl text-green-600" style={{ fontVariationSettings: "'FILL' 1" }}>task_alt</span>
            </div>
            <div className="space-y-2">
              <h2 className="font-headline-md text-headline-md">¡Entrega Exitosa!</h2>
              <p className="text-on-surface-variant text-body-md">El pedido #{order.orderNumber} ha sido marcado como entregado correctamente.</p>
            </div>
            <button
              onClick={() => router.push('/driver/active')}
              className="w-full bg-primary text-on-primary font-bold py-4 rounded-xl hover:opacity-90 transition-opacity active:scale-95"
            >
              CONTINUAR SIGUIENTE PEDIDO
            </button>
          </div>
        </div>
      )}
    </>
  )
}
