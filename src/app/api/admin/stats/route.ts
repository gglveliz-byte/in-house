import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/admin/stats - Dashboard stats adaptadas para el panel Admin
export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const zoneId = session.user.zoneId
    const storeWhere = zoneId ? { zoneId } : {}
    const orderWhere = zoneId ? { store: { zoneId } } : {}

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const [
      totalOrders,
      ordersByStatus,
      totalRevenueAgg,
      todayRevenueAgg,
      driversCount,
      topStoresRaw,
      recentOrders,
    ] = await Promise.all([
      // Total pedidos
      prisma.order.count({ where: orderWhere }),

      // Pedidos por estado
      prisma.order.groupBy({
        by: ['status'],
        where: orderWhere,
        _count: true,
      }),

      // Ingresos totales (pedidos entregados)
      prisma.order.aggregate({
        where: { ...orderWhere, status: 'DELIVERED' },
        _sum: { actualDeliveryFee: true },
      }),

      // Ingresos de hoy
      prisma.order.aggregate({
        where: { ...orderWhere, status: 'DELIVERED', deliveredAt: { gte: today } },
        _sum: { actualDeliveryFee: true },
      }),

      // Total repartidores
      prisma.user.count({
        where: { role: 'DRIVER', ...(zoneId ? { zoneId } : {}) },
      }),

      // Top tiendas por pedidos
      prisma.order.groupBy({
        by: ['storeId'],
        where: { ...orderWhere, status: 'DELIVERED' },
        _count: true,
        _sum: { total: true },
        orderBy: { _count: { storeId: 'desc' } },
        take: 5,
      }),

      // Pedidos recientes
      prisma.order.findMany({
        where: orderWhere,
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          id: true,
          orderNumber: true,
          customerName: true,
          total: true,
          status: true,
          createdAt: true,
        },
      }),
    ])

    // Obtener nombres de tiendas del top
    const storeIds = topStoresRaw.map((s) => s.storeId)
    const topStoreNames = storeIds.length > 0
      ? await prisma.store.findMany({
          where: { id: { in: storeIds } },
          select: { id: true, name: true },
        })
      : []
    const storeNameMap = new Map(topStoreNames.map((s) => [s.id, s.name]))

    const topStores = topStoresRaw.map((s) => ({
      id: s.storeId,
      name: storeNameMap.get(s.storeId) || 'Tienda',
      totalOrders: s._count,
      totalRevenue: s._sum.total || 0,
    }))

    // Contar pedidos por estado
    const statusCount = ordersByStatus.reduce<Record<string, number>>((acc, item) => {
      acc[item.status] = item._count
      return acc
    }, {})

    return NextResponse.json({
      orders: {
        total: totalOrders,
        pending: statusCount['PENDING'] || 0,
        confirmed: statusCount['CONFIRMED'] || 0,
        ready: statusCount['READY'] || 0,
        pickedUp: statusCount['PICKED_UP'] || 0,
        delivered: statusCount['DELIVERED'] || 0,
        cancelled: statusCount['CANCELLED'] || 0,
      },
      revenue: {
        total: totalRevenueAgg._sum.actualDeliveryFee || 0,
        today: todayRevenueAgg._sum.actualDeliveryFee || 0,
      },
      drivers: {
        total: driversCount,
      },
      topStores,
      recentOrders,
    })
  } catch (error) {
    console.error('Error fetching admin stats:', error)
    return NextResponse.json({ error: 'Error al obtener estadísticas' }, { status: 500 })
  }
}
