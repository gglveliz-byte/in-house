import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/orders/ready - Obtener pedidos listos para repartidor
export async function GET() {
  try {
    const orders = await prisma.order.findMany({
      where: {
        status: 'READY',
        driverId: null,
      },
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
