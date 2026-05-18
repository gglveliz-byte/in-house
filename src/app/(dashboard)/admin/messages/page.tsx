'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/lib/utils'
import Image from 'next/image'

interface Message {
  id: string
  content: string
  imageUrl: string | null
  messageType: string
  isRead: boolean
  createdAt: string
  senderId: string
  sender: { name: string }
}

export default function AdminMessagesPage() {
  const { data: session } = useSession()
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [messageType, setMessageType] = useState('GENERAL')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const fetchMessages = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/messages')
      if (response.ok) {
        const data = await response.json()
        setMessages(data)
        setError(null)
      } else {
        const err = await response.json()
        if (err.error !== 'No tienes un Super Admin asignado') {
          setError(err.error || 'Error al cargar mensajes')
        }
      }
    } catch {
      setError('Error de conexión')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchMessages()
    // Polling cada 5 segundos
    const interval = setInterval(fetchMessages, 5000)
    return () => clearInterval(interval)
  }, [fetchMessages])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim()) return

    setSending(true)
    try {
      const response = await fetch('/api/admin/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: newMessage.trim(),
          messageType,
        }),
      })

      if (response.ok) {
        setNewMessage('')
        fetchMessages()
      } else {
        const err = await response.json()
        setError(err.error || 'Error al enviar mensaje')
      }
    } catch {
      setError('Error al enviar mensaje')
    } finally {
      setSending(false)
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingImage(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (uploadRes.ok) {
        const { url } = await uploadRes.json()

        await fetch('/api/admin/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: '📎 Imagen adjunta',
            imageUrl: url,
            messageType: 'BILLING',
          }),
        })

        fetchMessages()
      }
    } catch {
      setError('Error al subir imagen')
    } finally {
      setUploadingImage(false)
      // Limpiar el input
      e.target.value = ''
    }
  }

  const getMessageTypeLabel = (type: string) => {
    switch (type) {
      case 'BILLING': return '💰 Cobranza'
      case 'SUPPORT': return '🛠️ Soporte'
      case 'ANNOUNCEMENT': return '📢 Aviso'
      default: return null
    }
  }

  const getMessageTypeBadgeClass = (type: string) => {
    switch (type) {
      case 'BILLING': return 'bg-amber-100 text-amber-700 border border-amber-200'
      case 'SUPPORT': return 'bg-blue-100 text-blue-700 border border-blue-200'
      case 'ANNOUNCEMENT': return 'bg-emerald-100 text-emerald-700 border border-emerald-200'
      default: return ''
    }
  }

  if (loading) {
    return (
      <div className="space-y-4 max-w-3xl mx-auto">
        <div className="h-8 bg-gray-200 rounded w-48 animate-pulse" />
        <div className="h-[500px] bg-gray-200 rounded-xl animate-pulse" />
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">💬 Mensajes</h1>
          <p className="text-sm text-gray-500 mt-0.5">Comunicación con Super Admin</p>
        </div>
        <Button onClick={fetchMessages} variant="secondary" size="sm">
          🔄 Actualizar
        </Button>
      </div>

      {/* Error banner */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
          <span className="text-red-500">⚠️</span>
          <p className="text-red-700 text-sm">{error}</p>
          <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-600">✕</button>
        </div>
      )}

      {/* Chat Card */}
      <Card className="overflow-hidden border-2 border-gray-100 shadow-sm">
        {/* Chat Header */}
        <CardHeader className="border-b bg-gradient-to-r from-[#003f87] to-[#0056b3] text-white py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-xl">
              👤
            </div>
            <div>
              <h2 className="font-bold">Super Admin</h2>
              <p className="text-blue-200 text-sm">Plataforma In House</p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0 flex flex-col" style={{ height: '520px' }}>
          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#f8f9fa]">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <span className="text-6xl mb-4">💬</span>
                <p className="font-medium text-gray-500">No hay mensajes aún</p>
                <p className="text-sm text-gray-400 mt-1">Envía el primer mensaje al Super Admin</p>
              </div>
            ) : (
              messages.map((msg) => {
                const isFromMe = msg.senderId === session?.user.id
                const typeLabel = getMessageTypeLabel(msg.messageType)

                return (
                  <div
                    key={msg.id}
                    className={`flex ${isFromMe ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[78%] ${isFromMe ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                      {/* Sender name */}
                      <span className="text-xs text-gray-500 px-1">
                        {isFromMe ? 'Tú' : msg.sender.name}
                      </span>

                      {/* Bubble */}
                      <div
                        className={`rounded-2xl px-4 py-3 shadow-sm ${
                          isFromMe
                            ? 'bg-[#003f87] text-white rounded-tr-sm'
                            : 'bg-white text-gray-900 border border-gray-100 rounded-tl-sm'
                        }`}
                      >
                        {msg.imageUrl && (
                          <div className="mb-2">
                            <Image
                              src={msg.imageUrl}
                              alt="Adjunto"
                              width={220}
                              height={160}
                              className="rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                              onClick={() => window.open(msg.imageUrl!, '_blank')}
                            />
                          </div>
                        )}
                        <p className="text-sm leading-relaxed">{msg.content}</p>

                        <div className={`flex items-center gap-2 mt-1.5 ${isFromMe ? 'justify-end' : 'justify-start'}`}>
                          <span className={`text-xs ${isFromMe ? 'text-blue-200' : 'text-gray-400'}`}>
                            {formatDate(msg.createdAt)}
                          </span>
                          {typeLabel && (
                            <Badge className={`text-xs py-0 ${getMessageTypeBadgeClass(msg.messageType)}`}>
                              {typeLabel}
                            </Badge>
                          )}
                          {isFromMe && (
                            <span className={`text-xs ${msg.isRead ? 'text-blue-300' : 'text-blue-400'}`}>
                              {msg.isRead ? '✓✓' : '✓'}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="border-t bg-white p-4">
            <form onSubmit={sendMessage} className="space-y-3">
              {/* Type selector and image upload */}
              <div className="flex items-center gap-2">
                <select
                  value={messageType}
                  onChange={(e) => setMessageType(e.target.value)}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#003f87] focus:border-[#003f87] text-gray-700"
                >
                  <option value="GENERAL">💬 General</option>
                  <option value="BILLING">💰 Comprobante de pago</option>
                  <option value="SUPPORT">🛠️ Solicitud de soporte</option>
                </select>

                {/* Image upload */}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  id="admin-image-upload"
                />
                <label
                  htmlFor="admin-image-upload"
                  className={`px-3 py-1.5 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors text-sm flex items-center gap-1 ${
                    uploadingImage ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {uploadingImage ? '⏳' : '📎'} Adjuntar
                </label>
              </div>

              {/* Text input */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Escribe un mensaje..."
                  className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-[#003f87] focus:border-[#003f87] outline-none"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      if (newMessage.trim()) sendMessage(e as unknown as React.FormEvent)
                    }
                  }}
                />
                <Button
                  type="submit"
                  loading={sending}
                  disabled={!newMessage.trim() || sending}
                >
                  Enviar
                </Button>
              </div>
            </form>
          </div>
        </CardContent>
      </Card>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-blue-700">
        <p className="font-semibold mb-1">ℹ️ Tipos de mensajes disponibles:</p>
        <ul className="space-y-0.5 text-blue-600">
          <li>• <strong>General:</strong> Consultas o comentarios generales</li>
          <li>• <strong>Comprobante de pago:</strong> Para enviar el comprobante de tu pago mensual</li>
          <li>• <strong>Solicitud de soporte:</strong> Problemas técnicos o ayuda con la plataforma</li>
        </ul>
      </div>
    </div>
  )
}
