import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { calculateAmountDue } from '@/lib/billing'

// GET /api/superadmin/stats - Obtener estadísticas del dashboard
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Contar totales
    const [totalAdmins, totalZones, totalStores] = await Promise.all([
      prisma.user.count({
        where: { role: 'ADMIN', superAdminId: session.user.id },
      }),
      prisma.zone.count({ where: { isActive: true } }),
      prisma.store.count(),
    ])

    // Obtener todos los admins con sus estadísticas
    const admins = await prisma.user.findMany({
      where: {
        role: 'ADMIN',
        superAdminId: session.user.id,
      },
      select: {
        id: true,
        name: true,
        email: true,
        registeredAt: true,
        zone: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    // Calcular estadísticas por admin
    let totalOrders = 0
    let totalRevenue = 0
    let pendingBilling = 0

    const adminsWithStats = await Promise.all(
      admins.map(async (admin) => {
        if (!admin.zone) {
          return {
            id: admin.id, name: admin.name, email: admin.email,
            zoneName: null, registeredAt: admin.registeredAt,
            totalStores: 0, totalDrivers: 0, totalOrders: 0,
            completedOrders: 0, totalDeliveryRevenue: 0,
            amountDue: 10, billingStatus: 'PENDING_PAYMENT',
          }
        }

        const zoneId = admin.zone.id

        // Queries optimizadas con count/aggregate en vez de findMany
        const [
          storeCount,
          orderCount,
          completedOrderCount,
          deliveryRevenueAgg,
          driversCount,
        ] = await Promise.all([
          prisma.store.count({ where: { zoneId } }),
          prisma.order.count({ where: { store: { zoneId } } }),
          prisma.order.count({ where: { store: { zoneId }, status: 'DELIVERED' } }),
          prisma.order.aggregate({
            where: { store: { zoneId }, status: 'DELIVERED' },
            _sum: { actualDeliveryFee: true },
          }),
          prisma.user.count({ where: { role: 'DRIVER', zoneId } }),
        ])

        const completedOrders = completedOrderCount
        const deliveryRevenue = deliveryRevenueAgg._sum.actualDeliveryFee || 0

        // Calcular monto a cobrar
        const amountDue = calculateAmountDue(completedOrders)

        // Obtener estado de facturación real del ciclo actual
        const now = new Date()
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)
        
        const currentCycle = await prisma.billingCycle.findFirst({
          where: {
            adminId: admin.id,
            startDate: { gte: startOfMonth },
            endDate: { lte: endOfMonth },
          },
          orderBy: { createdAt: 'desc' },
        })
        
        // Determinar estado de facturación
        let billingStatus = 'PENDING_PAYMENT'
        if (currentCycle) {
          if (currentCycle.isPaid) {
            billingStatus = 'PAID'
          } else {
            // Verificar si está vencido (más de 30 días después del fin del ciclo)
            const daysSinceEnd = Math.floor((now.getTime() - currentCycle.endDate.getTime()) / (1000 * 60 * 60 * 24))
            if (daysSinceEnd > 30) {
              billingStatus = 'OVERDUE'
            } else {
              billingStatus = 'PENDING_PAYMENT'
            }
          }
        }

        totalOrders += orderCount
        totalRevenue += deliveryRevenue
        if (billingStatus !== 'PAID') {
          pendingBilling += amountDue
        }

        return {
          id: admin.id,
          name: admin.name,
          email: admin.email,
          zoneName: admin.zone?.name || null,
          registeredAt: admin.registeredAt,
          totalStores: storeCount,
          totalDrivers: driversCount,
          totalOrders: orderCount,
          completedOrders,
          totalDeliveryRevenue: deliveryRevenue,
          amountDue,
          billingStatus,
        }
      })
    )

    return NextResponse.json({
      totalAdmins,
      totalZones,
      totalStores,
      totalOrders,
      totalRevenue,
      pendingBilling,
      admins: adminsWithStats,
    })
  } catch (error) {
    console.error('Error fetching stats:', error)
    return NextResponse.json({ error: 'Error al obtener estadísticas' }, { status: 500 })
  }
}
