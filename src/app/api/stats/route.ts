import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/stats - Estadísticas para el admin (filtrado por zona)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const storeId = searchParams.get('storeId')

    // Obtener sesión para filtrar por zona si es admin
    const session = await getServerSession(authOptions)

    // Construir filtro dinámico
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

    const [
      totalOrders,
      todayOrders,
      totalRevenue,
      todayRevenue,
      ordersByStatus,
      totalStores,
      totalProducts,
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

      // Total de tiendas (filtrado por zona si es admin)
      prisma.store.count(
        session?.user?.role === 'ADMIN' && session.user.zoneId && !storeId
          ? { where: { zoneId: session.user.zoneId } }
          : undefined
      ),

      // Total de productos
      prisma.product.count(storeId ? { where: { storeId } } : undefined),
    ])

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
    })
  } catch (error) {
    console.error('Error fetching stats:', error)
    return NextResponse.json({ error: 'Error al obtener estadísticas' }, { status: 500 })
  }
}
