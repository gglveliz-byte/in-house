import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/orders/ready - Obtener pedidos listos para repartidor (solo de su zona)
export async function GET(request: NextRequest) {
  try {
    // Obtener sesión para filtrar por zona del repartidor
    const session = await getServerSession(authOptions)
    
    // Si es repartidor, solo ver pedidos de su zona
    const where: Record<string, unknown> = {
      status: 'READY',
      driverId: null,
    }
    
    if (session?.user?.role === 'DRIVER' && session.user.zoneId) {
      where.store = {
        zoneId: session.user.zoneId
      }
    }

    const orders = await prisma.order.findMany({
      where,
      include: {
        items: {
          include: {
            product: true,
          },
        },
        store: {
          select: {
            name: true,
            address: true,
            whatsapp: true,
            latitude: true,
            longitude: true,
            minDeliveryFee: true,
            maxDeliveryFee: true,
          },
        },
      },
      orderBy: { readyAt: 'asc' },
    })

    return NextResponse.json(orders)
  } catch (error) {
    console.error('Error fetching ready orders:', error)
    return NextResponse.json({ error: 'Error al obtener pedidos' }, { status: 500 })
  }
}
