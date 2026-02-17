import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/zones - Obtener zonas activas (público)
export async function GET() {
  try {
    const zones = await prisma.zone.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        description: true,
        latitude: true,
        longitude: true,
        currency: true,
      },
    })

    return NextResponse.json(zones)
  } catch (error) {
    console.error('Error fetching zones:', error)
    return NextResponse.json({ error: 'Error al obtener zonas' }, { status: 500 })
  }
}
