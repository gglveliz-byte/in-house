'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { usePusherChannel } from '@/hooks/use-pusher'
import { CHANNELS, EVENTS } from '@/lib/pusher'

interface Message {
  id: string
  content: string
  imageUrl: string | null
  senderType: 'CUSTOMER' | 'VENDOR' | 'DRIVER' | 'SYSTEM'
  senderName: string
  createdAt: string
}

interface OrderChatProps {
  orderId: string
  orderNumber: number
  userType: 'CUSTOMER' | 'VENDOR'
  userName: string
  storeName?: string
  paymentMethods?: string | null
  onPaymentUpload?: (imageUrl: string) => void
  disabled?: boolean // Para deshabilitar cuando el pago está verificado
  disabledMessage?: string // Mensaje a mostrar cuando está deshabilitado
}

export function OrderChat({
  orderId,
  orderNumber,
  userType,
  userName,
  storeName,
  paymentMethods,
  onPaymentUpload,
  disabled = false,
  disabledMessage = 'El chat ha sido cerrado',
}: OrderChatProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [viewingImage, setViewingImage] = useState<string | null>(null) // Para el visor de imágenes
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Scroll al final cuando hay nuevos mensajes
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  // Cargar mensajes
  const fetchMessages = useCallback(async () => {
    try {
      const response = await fetch(`/api/orders/${orderId}/messages`)
      if (response.ok) {
        const data = await response.json()
        setMessages(data)
      }
    } catch (error) {
      console.error('Error fetching messages:', error)
    } finally {
      setLoading(false)
    }
  }, [orderId])

  // Cargar mensajes al inicio
  useEffect(() => {
    fetchMessages()
  }, [fetchMessages])

  // Scroll cuando cambian los mensajes
  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Escuchar nuevos mensajes en tiempo real
  usePusherChannel(
    CHANNELS.ORDER(orderId),
    EVENTS.NEW_MESSAGE,
    (data: unknown) => {
      const messageData = data as { message: Message }
      if (messageData.message) {
        setMessages((prev) => {
          // Evitar duplicados
          if (prev.find((m) => m.id === messageData.message.id)) {
            return prev
          }
          return [...prev, messageData.message]
        })
      }
    },
    !!orderId
  )

  // Enviar mensaje
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || sending) return

    setSending(true)
    try {
      const response = await fetch(`/api/orders/${orderId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: newMessage.trim(),
          senderType: userType,
          senderName: userName,
        }),
      })

      if (response.ok) {
        setNewMessage('')
        // El mensaje llegará por Pusher, pero también lo agregamos localmente
        const message = await response.json()
        setMessages((prev) => {
          if (prev.find((m) => m.id === message.id)) {
            return prev
          }
          return [...prev, message]
        })
      }
    } catch (error) {
      console.error('Error sending message:', error)
    } finally {
      setSending(false)
    }
  }

  // Subir imagen
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingImage(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const uploadResponse = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (!uploadResponse.ok) {
        throw new Error('Error uploading image')
      }

      const { url } = await uploadResponse.json()

      // Enviar mensaje con imagen
      const response = await fetch(`/api/orders/${orderId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: '📷 Imagen enviada',
          imageUrl: url,
          senderType: userType,
          senderName: userName,
        }),
      })

      if (response.ok) {
        const message = await response.json()
        setMessages((prev) => {
          if (prev.find((m) => m.id === message.id)) {
            return prev
          }
          return [...prev, message]
        })

        // Si es comprobante de pago del cliente
        if (userType === 'CUSTOMER' && onPaymentUpload) {
          onPaymentUpload(url)
        }
      }
    } catch (error) {
      console.error('Error uploading image:', error)
      alert('Error al subir la imagen. Por favor intenta de nuevo.')
    } finally {
      setUploadingImage(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  // Formatear hora
  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('es-EC', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (loading) {
    return (
      <div className="flex-1 flex flex-col bg-gray-50">
        <div className="bg-gradient-to-r from-green-600 to-green-700 p-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-white/20 animate-pulse" />
            <div className="flex-1 space-y-1">
              <div className="h-3 bg-white/20 rounded w-24 animate-pulse" />
              <div className="h-2 bg-white/20 rounded w-16 animate-pulse" />
            </div>
          </div>
        </div>
        <div className="flex-1 p-3 space-y-3">
          <div className="flex justify-start">
            <div className="w-2/3 h-16 bg-gray-200 rounded-2xl animate-pulse" />
          </div>
          <div className="flex justify-end">
            <div className="w-1/2 h-12 bg-green-200 rounded-2xl animate-pulse" />
          </div>
          <div className="flex justify-start">
            <div className="w-3/5 h-10 bg-gray-200 rounded-2xl animate-pulse" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Visor de imagen en pantalla completa */}
      {viewingImage && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Visor de imagen"
          onClick={() => setViewingImage(null)}
        >
          <button
            onClick={() => setViewingImage(null)}
            aria-label="Cerrar imagen"
            className="absolute top-4 right-4 w-12 h-12 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center text-white text-2xl transition-colors z-10"
          >
            ✕
          </button>
          <img
            src={viewingImage}
            alt="Imagen ampliada"
            className="max-w-full max-h-full object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {/* Header del chat - compacto para móvil */}
      <div className="bg-gradient-to-r from-green-600 to-green-700 text-white p-3 shadow-lg">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-lg flex-shrink-0">
            {userType === 'CUSTOMER' ? '🏪' : '👤'}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-bold text-sm truncate">
              {userType === 'CUSTOMER' ? storeName : `Cliente - Pedido #${orderNumber}`}
            </h3>
            <p className="text-xs text-green-100">
              Pedido #{orderNumber}
            </p>
          </div>
        </div>
      </div>

      {/* Mensajes */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {/* Mostrar métodos de pago al cliente */}
        {userType === 'CUSTOMER' && paymentMethods && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4 mb-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">💳</span>
              <h4 className="font-bold text-blue-900">Métodos de pago</h4>
            </div>
            <div className="text-sm text-blue-800 whitespace-pre-wrap">
              {paymentMethods}
            </div>
            <p className="text-xs text-blue-600 mt-3 flex items-center gap-1">
              <span>📷</span>
              <span>Envía el comprobante usando el botón de cámara</span>
            </p>
          </div>
        )}

        {messages.length === 0 && !paymentMethods ? (
          <div className="text-center py-8">
            <span className="text-4xl block mb-2">💬</span>
            <p className="text-gray-500">No hay mensajes aún</p>
            <p className="text-sm text-gray-400">
              {userType === 'CUSTOMER'
                ? 'Envía un mensaje para coordinar tu pedido'
                : 'El cliente puede escribirte aquí'}
            </p>
          </div>
        ) : messages.length === 0 ? null : (
          messages.map((message) => {
            const isOwn =
              (userType === 'CUSTOMER' && message.senderType === 'CUSTOMER') ||
              (userType === 'VENDOR' && message.senderType === 'VENDOR')
            const isSystem = message.senderType === 'SYSTEM'

            if (isSystem) {
              return (
                <div key={message.id} className="flex justify-center">
                  <div className="bg-gray-200 text-gray-600 px-4 py-2 rounded-full text-sm">
                    {message.content}
                  </div>
                </div>
              )
            }

            return (
              <div
                key={message.id}
                className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2 shadow-sm ${
                    isOwn
                      ? 'bg-green-600 text-white rounded-br-md'
                      : 'bg-white text-gray-900 rounded-bl-md'
                  }`}
                >
                  {!isOwn && (
                    <p className={`text-xs font-medium mb-1 ${isOwn ? 'text-green-100' : 'text-green-600'}`}>
                      {message.senderType === 'DRIVER' ? `🏍️ ${message.senderName}` : message.senderName}
                    </p>
                  )}
{message.imageUrl && (
                                    <div className="mb-2">
                                      <button
                                        onClick={() => setViewingImage(message.imageUrl)}
                                        className="block"
                                      >
                                        <img
                                          src={message.imageUrl}
                                          alt="Imagen"
                                          className="max-w-full rounded-lg max-h-48 object-cover cursor-pointer hover:opacity-90 transition-opacity"
                                        />
                                      </button>
                                    </div>
                                  )}
                  <p className="break-words">{message.content}</p>
                  <p
                    className={`text-xs mt-1 ${
                      isOwn ? 'text-green-100' : 'text-gray-400'
                    }`}
                  >
                    {formatTime(message.createdAt)}
                  </p>
                </div>
              </div>
            )
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input de mensaje - optimizado para móvil */}
      <div className="bg-white border-t safe-area-pb">
        {/* Mensaje cuando el chat está deshabilitado */}
        {disabled ? (
          <div className="p-4 text-center bg-gray-100">
            <div className="bg-green-100 text-green-800 px-4 py-3 rounded-xl inline-flex items-center gap-2">
              <span className="text-xl">✅</span>
              <span className="font-medium">{disabledMessage}</span>
            </div>
          </div>
        ) : (
          <>
            {/* Indicador de subir comprobante para el cliente */}
            {userType === 'CUSTOMER' && (
              <div className="px-3 pt-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingImage}
                  className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white py-3 px-4 rounded-xl flex items-center justify-center gap-3 transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 shadow-lg"
                >
                  {uploadingImage ? (
                    <>
                      <span className="text-xl animate-spin">⏳</span>
                      <span className="font-medium">Subiendo...</span>
                    </>
                  ) : (
                    <>
                      <span className="text-2xl">📷</span>
                      <span className="font-bold">Sube tu comprobante aquí</span>
                      <span className="text-xl animate-bounce">👆</span>
                    </>
                  )}
                </button>
              </div>
            )}
            
            <form onSubmit={handleSendMessage} className="flex gap-2 items-center p-2">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageUpload}
                accept="image/*"
                className="hidden"
              />
              {/* Botón de cámara solo para vendedor (el cliente tiene el botón grande arriba) */}
              {userType === 'VENDOR' && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingImage}
                  className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors disabled:opacity-50 flex items-center justify-center flex-shrink-0"
                >
                  {uploadingImage ? '⏳' : '📷'}
                </button>
              )}
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Escribe un mensaje..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm min-w-0"
                disabled={sending}
              />
              <button
                type="submit"
                disabled={!newMessage.trim() || sending}
                aria-label="Enviar mensaje"
                className="w-10 h-10 rounded-full bg-green-600 hover:bg-green-700 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center flex-shrink-0"
              >
                {sending ? '⏳' : '➤'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
