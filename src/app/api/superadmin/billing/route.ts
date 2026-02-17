import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { calculateAmountDue } from '@/lib/billing'

// GET /api/superadmin/billing - Obtener resumen de facturación
export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Obtener fecha de inicio y fin del mes actual
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)

    // Obtener todos los admins gestionados por este super admin
    const admins = await prisma.user.findMany({
      where: {
        superAdminId: session.user.id,
        role: 'ADMIN',
      },
      include: {
        zone: true,
        billingCycles: {
          orderBy: { startDate: 'desc' },
          take: 5,
        },
      },
    })

    // Para cada admin, calcular pedidos y monto del mes actual
    const currentCycles = []
    const paidCycles = []
    let totalPending = 0
    let totalPaid = 0

    for (const admin of admins) {
      // Contar pedidos completados este mes en la zona del admin
      const completedOrders = await prisma.order.count({
        where: {
          store: {
            zoneId: admin.zoneId,
          },
          status: 'DELIVERED',
          deliveredAt: {
            gte: startOfMonth,
            lte: endOfMonth,
          },
        },
      })

      const amountDue = calculateAmountDue(completedOrders)

      // Verificar si ya existe un ciclo de facturación para este mes
      let cycle = admin.billingCycles.find(
        (c) =>
          new Date(c.startDate) >= startOfMonth &&
          new Date(c.endDate) <= endOfMonth
      )

      // Si no existe, crear uno o usar datos calculados
      const cycleData = {
        id: cycle?.id || `temp-${admin.id}`,
        startDate: startOfMonth.toISOString(),
        endDate: endOfMonth.toISOString(),
        totalOrders: completedOrders,
        amountDue: amountDue,
        isPaid: cycle?.isPaid || false,
        paidAt: cycle?.paidAt?.toISOString() || null,
        admin: {
          id: admin.id,
          name: admin.name,
          email: admin.email,
          zone: admin.zone,
        },
      }

      if (cycleData.isPaid) {
        paidCycles.push(cycleData)
        totalPaid += amountDue
      } else {
        currentCycles.push(cycleData)
        totalPending += amountDue
      }
    }

    return NextResponse.json({
      totalPending,
      totalPaid,
      totalAdmins: admins.length,
      currentCycles,
      paidCycles,
    })
  } catch (error) {
    console.error('Error fetching billing:', error)
    return NextResponse.json({ error: 'Error al obtener facturación' }, { status: 500 })
  }
}
