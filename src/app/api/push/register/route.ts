import { NextRequest, NextResponse } from 'next/server'
import { registerSubscription } from '@/lib/push-store'
import { getVapidKeys } from '@/lib/push'

// GET /api/push/register - Retornar la clave pública VAPID dinámica para que el navegador se suscriba
export async function GET() {
  try {
    const keys = getVapidKeys()
    return NextResponse.json({ publicKey: keys.publicKey })
  } catch (error) {
    console.error('Error fetching VAPID public key:', error)
    return NextResponse.json({ error: 'Error al obtener la clave pública VAPID' }, { status: 500 })
  }
}

// POST /api/push/register - Almacenar una suscripción Push de un navegador
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { subscription, userId } = body

    if (!subscription || !subscription.endpoint || !subscription.keys) {
      return NextResponse.json({ error: 'Estructura de suscripción inválida' }, { status: 400 })
    }

    registerSubscription({
      endpoint: subscription.endpoint,
      keys: {
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
      },
      userId: userId || null
    })

    return NextResponse.json({ success: true, message: 'Suscripción registrada exitosamente en In-House.' })
  } catch (error) {
    console.error('Error registering push subscription:', error)
    return NextResponse.json({ error: 'Error al registrar la suscripción push' }, { status: 500 })
  }
}
