import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { calculateAmountDue } from '@/lib/billing'

// PATCH /api/superadmin/billing/[id] - Marcar ciclo como pagado
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { isPaid } = body

    // Verificar si es un ID temporal (no existe en DB)
    if (id.startsWith('temp-')) {
      // Crear el ciclo de facturación
      const adminId = id.replace('temp-', '')
      
      // Obtener fecha de inicio y fin del mes actual
      const now = new Date()
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)

      // Verificar que el admin pertenece a este super admin
      const admin = await prisma.user.findFirst({
        where: {
          id: adminId,
          superAdminId: session.user.id,
        },
      })

      if (!admin) {
        return NextResponse.json({ error: 'Admin no encontrado' }, { status: 404 })
      }

      // Contar pedidos completados este mes
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

      // Crear ciclo de facturación
      const newCycle = await prisma.billingCycle.create({
        data: {
          adminId: admin.id,
          startDate: startOfMonth,
          endDate: endOfMonth,
          totalOrders: completedOrders,
          amountDue: amountDue,
          isPaid: isPaid || false,
          paidAt: isPaid ? new Date() : null,
        },
      })

      return NextResponse.json(newCycle)
    }

    // Actualizar ciclo existente
    const cycle = await prisma.billingCycle.findUnique({
      where: { id },
      include: { admin: true },
    })

    if (!cycle) {
      return NextResponse.json({ error: 'Ciclo no encontrado' }, { status: 404 })
    }

    // Verificar que el admin pertenece a este super admin
    if (cycle.admin.superAdminId !== session.user.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const updatedCycle = await prisma.billingCycle.update({
      where: { id },
      data: {
        isPaid: isPaid,
        paidAt: isPaid ? new Date() : null,
      },
    })

    return NextResponse.json(updatedCycle)
  } catch (error) {
    console.error('Error updating billing cycle:', error)
    return NextResponse.json({ error: 'Error al actualizar ciclo' }, { status: 500 })
  }
}
