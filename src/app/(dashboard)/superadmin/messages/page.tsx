'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/lib/utils'
import Image from 'next/image'

interface Admin {
  id: string
  name: string
  email: string
  zone: { name: string } | null
}

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

export default function MessagesPage() {
  const { data: session } = useSession()
  const searchParams = useSearchParams()
  const preselectedAdminId = searchParams.get('adminId')
  
  const [admins, setAdmins] = useState<Admin[]>([])
  const [selectedAdmin, setSelectedAdmin] = useState<Admin | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [messageType, setMessageType] = useState<string>('GENERAL')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchAdmins()
  }, [])

  useEffect(() => {
    if (preselectedAdminId && admins.length > 0) {
      const admin = admins.find(a => a.id === preselectedAdminId)
      if (admin) setSelectedAdmin(admin)
    }
  }, [preselectedAdminId, admins])

  useEffect(() => {
    if (selectedAdmin) {
      fetchMessages(selectedAdmin.id)
      // Poll para nuevos mensajes cada 5 segundos
      const interval = setInterval(() => fetchMessages(selectedAdmin.id), 5000)
      return () => clearInterval(interval)
    }
  }, [selectedAdmin])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const fetchAdmins = async () => {
    try {
      const response = await fetch('/api/superadmin/admins')
      if (response.ok) {
        const data = await response.json()
        setAdmins(data)
      }
    } catch (error) {
      console.error('Error fetching admins:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchMessages = useCallback(async (adminId: string) => {
    try {
      const response = await fetch(`/api/superadmin/messages?adminId=${adminId}`)
      if (response.ok) {
        const data = await response.json()
        setMessages(data)
      }
    } catch (error) {
      console.error('Error fetching messages:', error)
    }
  }, [])

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !selectedAdmin || !session?.user.id) return

    setSending(true)
    try {
      const response = await fetch('/api/superadmin/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: newMessage,
          receiverId: selectedAdmin.id,
          messageType,
        }),
      })

      if (response.ok) {
        setNewMessage('')
        fetchMessages(selectedAdmin.id)
      }
    } catch (error) {
      console.error('Error sending message:', error)
    } finally {
      setSending(false)
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !selectedAdmin) return

    const formData = new FormData()
    formData.append('file', file)

    try {
      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (uploadRes.ok) {
        const { url } = await uploadRes.json()
        
        await fetch('/api/superadmin/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: '📎 Imagen adjunta',
            imageUrl: url,
            receiverId: selectedAdmin.id,
            messageType: 'BILLING',
          }),
        })

        fetchMessages(selectedAdmin.id)
      }
    } catch (error) {
      console.error('Error uploading image:', error)
    }
  }

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-gray-200 rounded w-1/3" />
        <div className="h-96 bg-gray-200 rounded" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">💬 Mensajes y Soporte</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Admin List */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <h2 className="font-bold">Administradores</h2>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y max-h-[500px] overflow-y-auto">
              {admins.map((admin) => (
                <button
                  key={admin.id}
                  onClick={() => setSelectedAdmin(admin)}
                  className={`w-full p-4 text-left hover:bg-gray-50 transition-colors ${
                    selectedAdmin?.id === admin.id ? 'bg-blue-50 border-l-4 border-[#003f87]' : ''
                  }`}
                >
                  <p className="font-medium text-gray-900">{admin.name}</p>
                  <p className="text-sm text-gray-500">{admin.zone?.name || 'Sin zona'}</p>
                </button>
              ))}
              {admins.length === 0 && (
                <p className="p-4 text-center text-gray-500">No hay administradores</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Chat */}
        <Card className="lg:col-span-2">
          {selectedAdmin ? (
            <>
              <CardHeader className="border-b bg-blue-50">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-bold text-gray-900">{selectedAdmin.name}</h2>
                    <p className="text-sm text-gray-500">{selectedAdmin.zone?.name}</p>
                  </div>
                  <Badge className="bg-[#003f87]/10 text-[#003f87]">
                    {selectedAdmin.email}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {/* Messages */}
                <div className="h-[400px] overflow-y-auto p-4 space-y-4">
                  {messages.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      <p className="text-4xl mb-2">💬</p>
                      <p>No hay mensajes aún</p>
                      <p className="text-sm">Inicia la conversación</p>
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
                                ? 'bg-[#003f87] text-white'
                                : 'bg-gray-100 text-gray-900'
                            }`}
                          >
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
                              isFromMe ? 'text-blue-200' : 'text-gray-400'
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
                        <option value="BILLING">💰 Cobranza</option>
                        <option value="SUPPORT">🛠️ Soporte</option>
                        <option value="ANNOUNCEMENT">📢 Aviso</option>
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
                        className="px-3 py-2 border rounded-lg cursor-pointer hover:bg-gray-50"
                      >
                        📎
                      </label>
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Escribe un mensaje..."
                        className="flex-1 px-4 py-2 border rounded-xl focus:ring-2 focus:ring-[#003f87]"
                      />
                      <Button type="submit" disabled={sending || !newMessage.trim()}>
                        {sending ? '...' : 'Enviar'}
                      </Button>
                    </div>
                  </form>
                </div>
              </CardContent>
            </>
          ) : (
            <CardContent className="py-12 text-center text-gray-500">
              <p className="text-4xl mb-4">👈</p>
              <p>Selecciona un administrador para iniciar el chat</p>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  )
}
