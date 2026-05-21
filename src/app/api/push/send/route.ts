import { NextRequest, NextResponse } from 'next/server'
import { getSubscriptions, unregisterSubscription } from '@/lib/push-store'
import { sendPushNotification } from '@/lib/push'

// POST /api/push/send - Enviar notificación push de prueba en segundo plano a todos los dispositivos registrados
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const title = body.title || 'In-House Delivery 🚀'
    const text = body.body || '¡Tu pedido de prueba se ha procesado con éxito!'
    const link = body.link || '/vendor'

    const subscriptions = getSubscriptions()
    
    if (subscriptions.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'No hay navegadores suscritos para recibir notificaciones push en este momento.'
      })
    }

    let successCount = 0
    let failureCount = 0

    // Despachar notificaciones de forma secuencial
    for (const sub of subscriptions) {
      const res = await sendPushNotification(sub, {
        title,
        body: text,
        link
      })

      if (res.success) {
        successCount++
      } else {
        failureCount++
        if (res.expired) {
          // Limpieza automática de suscripciones revocadas o caducadas
          unregisterSubscription(sub.endpoint)
        }
      }
    }

    return NextResponse.json({
      success: true,
      summary: `Despachado con éxito a ${successCount} dispositivos. Falló/Expiró en ${failureCount}.`
    })
  } catch (error) {
    console.error('Error dispatching test notifications:', error)
    return NextResponse.json({ error: 'Error al enviar notificaciones push' }, { status: 500 })
  }
}
