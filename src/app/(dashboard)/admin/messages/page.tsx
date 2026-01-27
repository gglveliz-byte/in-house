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
  receiverId: string
}

export default function AdminMessagesPage() {
  const { data: session } = useSession()
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [messageType, setMessageType] = useState<string>('GENERAL')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (session?.user.id) {
      fetchMessages()
      // Poll cada 5 segundos
      const interval = setInterval(fetchMessages, 5000)
      return () => clearInterval(interval)
    }
  }, [session?.user.id])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const fetchMessages = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/messages')
      if (response.ok) {
        const data = await response.json()
        setMessages(data)
      }
    } catch (error) {
      console.error('Error fetching messages:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !session?.user.id) return

    setSending(true)
    try {
      const response = await fetch('/api/admin/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: newMessage,
          messageType,
        }),
      })

      if (response.ok) {
        setNewMessage('')
        fetchMessages()
      }
    } catch (error) {
      console.error('Error sending message:', error)
    } finally {
      setSending(false)
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const formData = new FormData()
    formData.append('file', file)

    try {
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
            content: '📎 Comprobante de pago adjunto',
            imageUrl: url,
            messageType: 'BILLING',
          }),
        })

        fetchMessages()
      }
    } catch (error) {
      console.error('Error uploading image:', error)
    }
  }

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto animate-pulse space-y-4">
        <div className="h-8 bg-gray-200 rounded w-1/3" />
        <div className="h-96 bg-gray-200 rounded" />
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">💬 Mensajes con Soporte</h1>
        <Badge className="bg-purple-100 text-purple-700">
          Chat con Super Admin
        </Badge>
      </div>

      <Card>
        <CardHeader className="border-b bg-purple-50">
          <div className="flex items-center gap-3">
            <span className="text-3xl">👑</span>
            <div>
              <h2 className="font-bold text-gray-900">Administración Central</h2>
              <p className="text-sm text-gray-500">Soporte, cobranza y avisos</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {/* Messages */}
          <div className="h-[400px] overflow-y-auto p-4 space-y-4">
            {messages.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <p className="text-4xl mb-2">💬</p>
                <p>No hay mensajes aún</p>
                <p className="text-sm mt-2">Aquí recibirás avisos de cobranza y soporte</p>
              </div>
            ) : (
              messages.map((msg) => {
                const isFromMe = msg.senderId === session?.user.id
                return (
                  <div
                    key={msg.id}
                    className={`flex ${isFromMe ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-2xl p-3 ${
                        isFromMe
                          ? 'bg-green-600 text-white'
                          : 'bg-purple-100 text-gray-900 border border-purple-200'
                      }`}
                    >
                      {!isFromMe && (
                        <p className="text-xs font-medium text-purple-600 mb-1">
                          👑 {msg.sender.name}
                        </p>
                      )}
                      {msg.imageUrl && (
                        <div className="mb-2">
                          <Image
                            src={msg.imageUrl}
                            alt="Adjunto"
                            width={200}
                            height={150}
                            className="rounded-lg cursor-pointer"
                            onClick={() => window.open(msg.imageUrl!, '_blank')}
                          />
                        </div>
                      )}
                      <p className="text-sm">{msg.content}</p>
                      <div className={`flex items-center gap-2 mt-1 text-xs ${
                        isFromMe ? 'text-green-200' : 'text-gray-400'
                      }`}>
                        <span>{formatDate(msg.createdAt)}</span>
                        {msg.messageType !== 'GENERAL' && (
                          <Badge className={`text-xs ${
                            msg.messageType === 'BILLING' ? 'bg-yellow-100 text-yellow-700' :
                            msg.messageType === 'SUPPORT' ? 'bg-blue-100 text-blue-700' :
                            'bg-green-100 text-green-700'
                          }`}>
                            {msg.messageType === 'BILLING' ? '💰 Cobranza' :
                             msg.messageType === 'SUPPORT' ? '🛠️ Soporte' :
                             '📢 Aviso'}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t p-4">
            <form onSubmit={sendMessage} className="space-y-3">
              <div className="flex gap-2">
                <select
                  value={messageType}
                  onChange={(e) => setMessageType(e.target.value)}
                  className="px-3 py-2 border rounded-lg text-sm"
                >
                  <option value="GENERAL">💬 General</option>
                  <option value="BILLING">💰 Pago</option>
                  <option value="SUPPORT">🛠️ Soporte</option>
                </select>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  id="image-upload"
                />
                <label
                  htmlFor="image-upload"
                  className="px-3 py-2 border rounded-lg cursor-pointer hover:bg-gray-50 flex items-center gap-1"
                  title="Subir comprobante de pago"
                >
                  📎 <span className="text-sm hidden sm:inline">Comprobante</span>
                </label>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Escribe un mensaje..."
                  className="flex-1 px-4 py-2 border rounded-xl focus:ring-2 focus:ring-green-500"
                />
                <Button type="submit" disabled={sending || !newMessage.trim()}>
                  {sending ? '...' : 'Enviar'}
                </Button>
              </div>
            </form>
          </div>
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="bg-yellow-50 border-yellow-200">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <span className="text-2xl">💡</span>
            <div>
              <h3 className="font-bold text-yellow-800">Información importante</h3>
              <ul className="text-sm text-yellow-700 mt-2 space-y-1">
                <li>• Usa este chat para comunicarte con la administración central</li>
                <li>• Envía comprobantes de pago mensual aquí</li>
                <li>• Recibirás notificaciones de cobranza y avisos importantes</li>
                <li>• El soporte técnico también se gestiona por este canal</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
