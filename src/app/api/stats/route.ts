import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/stats - Estadísticas para el admin (filtrado por zona)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const storeId = searchParams.get('storeId')

    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const where: Record<string, unknown> = {}
    if (storeId) {
      where.storeId = storeId
    } else if (session?.user?.role === 'ADMIN' && session.user.zoneId) {
      // Si es admin sin storeId específico, filtrar por zona
      where.store = {
        zoneId: session.user.zoneId
      }
    }

    // Pedidos de hoy
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Zone filter for store/driver lookups
    const zoneStoreFilter = session?.user?.role === 'ADMIN' && session.user.zoneId && !storeId
      ? { zoneId: session.user.zoneId }
      : undefined

    const [
      totalOrders,
      todayOrders,
      totalRevenue,
      todayRevenue,
      ordersByStatus,
      totalStores,
      totalProducts,
      revenueByStoreRaw,
      todayRevenueByStoreRaw,
      revenueByDriverRaw,
      todayRevenueByDriverRaw,
    ] = await Promise.all([
      // Total de pedidos
      prisma.order.count({ where }),

      // Pedidos de hoy
      prisma.order.count({
        where: {
          ...where,
          createdAt: { gte: today },
        },
      }),

      // Ingresos totales
      prisma.order.aggregate({
        where: {
          ...where,
          status: 'DELIVERED',
        },
        _sum: { total: true },
      }),

      // Ingresos de hoy
      prisma.order.aggregate({
        where: {
          ...where,
          status: 'DELIVERED',
          createdAt: { gte: today },
        },
        _sum: { total: true },
      }),

      // Pedidos por estado
      prisma.order.groupBy({
        by: ['status'],
        where,
        _count: true,
      }),

      // Total de tiendas
      prisma.store.count(zoneStoreFilter ? { where: zoneStoreFilter } : undefined),

      // Total de productos
      prisma.product.count(storeId ? { where: { storeId } } : undefined),

      // Revenue por tienda (pedidos entregados)
      prisma.order.groupBy({
        by: ['storeId'],
        where: { ...where, status: 'DELIVERED' },
        _sum: { subtotal: true, total: true },
        _count: true,
      }),

      // Revenue por tienda HOY
      prisma.order.groupBy({
        by: ['storeId'],
        where: { ...where, status: 'DELIVERED', createdAt: { gte: today } },
        _sum: { subtotal: true },
        _count: true,
      }),

      // Revenue por repartidor (delivery fees)
      prisma.order.groupBy({
        by: ['driverId'],
        where: { ...where, status: 'DELIVERED', driverId: { not: null } },
        _sum: { actualDeliveryFee: true },
        _count: true,
      }),

      // Revenue por repartidor HOY
      prisma.order.groupBy({
        by: ['driverId'],
        where: { ...where, status: 'DELIVERED', driverId: { not: null }, createdAt: { gte: today } },
        _sum: { actualDeliveryFee: true },
        _count: true,
      }),
    ])

    // Fetch store names for revenue breakdown
    const storeIds = revenueByStoreRaw.map(s => s.storeId)
    const stores = storeIds.length > 0
      ? await prisma.store.findMany({
          where: { id: { in: storeIds } },
          select: { id: true, name: true },
        })
      : []
    const storeMap = new Map(stores.map(s => [s.id, s.name]))

    // Build today lookup for stores
    const todayStoreMap = new Map(
      todayRevenueByStoreRaw.map(s => [s.storeId, { revenue: s._sum.subtotal || 0, orders: s._count }])
    )

    const revenueByStore = revenueByStoreRaw
      .map(s => ({
        storeId: s.storeId,
        storeName: storeMap.get(s.storeId) || 'Tienda desconocida',
        totalOrders: s._count,
        totalRevenue: s._sum.subtotal || 0,
        todayRevenue: todayStoreMap.get(s.storeId)?.revenue || 0,
        todayOrders: todayStoreMap.get(s.storeId)?.orders || 0,
      }))
      .sort((a, b) => b.totalRevenue - a.totalRevenue)

    // Fetch driver names for revenue breakdown
    const driverIds = revenueByDriverRaw
      .map(d => d.driverId)
      .filter((id): id is string => id !== null)
    const drivers = driverIds.length > 0
      ? await prisma.user.findMany({
          where: { id: { in: driverIds } },
          select: { id: true, name: true, phone: true },
        })
      : []
    const driverMap = new Map(drivers.map(d => [d.id, { name: d.name, phone: d.phone }]))

    // Build today lookup for drivers
    const todayDriverMap = new Map(
      todayRevenueByDriverRaw
        .filter(d => d.driverId !== null)
        .map(d => [d.driverId!, { fees: d._sum.actualDeliveryFee || 0, deliveries: d._count }])
    )

    const revenueByDriver = revenueByDriverRaw
      .filter(d => d.driverId !== null)
      .map(d => {
        const info = driverMap.get(d.driverId!) || { name: 'Desconocido', phone: '' }
        return {
          driverId: d.driverId!,
          driverName: info.name,
          driverPhone: info.phone,
          totalDeliveries: d._count,
          totalDeliveryFees: d._sum.actualDeliveryFee || 0,
          todayDeliveryFees: todayDriverMap.get(d.driverId!)?.fees || 0,
          todayDeliveries: todayDriverMap.get(d.driverId!)?.deliveries || 0,
        }
      })
      .sort((a, b) => b.totalDeliveries - a.totalDeliveries)

    // Obtener moneda de la zona del admin
    let currency = 'USD'
    if (session.user.zoneId) {
      const zone = await prisma.zone.findUnique({
        where: { id: session.user.zoneId },
        select: { currency: true },
      })
      if (zone?.currency) currency = zone.currency
    }

    return NextResponse.json({
      totalOrders,
      todayOrders,
      totalRevenue: totalRevenue._sum.total || 0,
      todayRevenue: todayRevenue._sum.total || 0,
      ordersByStatus: ordersByStatus.reduce(
        (acc, item) => {
          acc[item.status] = item._count
          return acc
        },
        {} as Record<string, number>
      ),
      totalStores,
      totalProducts,
      revenueByStore,
      revenueByDriver,
      currency,
    })
  } catch (error) {
    console.error('Error fetching stats:', error)
    return NextResponse.json({ error: 'Error al obtener estadísticas' }, { status: 500 })
  }
}
