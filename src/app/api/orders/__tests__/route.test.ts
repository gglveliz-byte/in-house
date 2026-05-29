import { vi, describe, it, expect, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

// Mock prisma and next-auth session
vi.mock('@/lib/prisma', () => ({
  prisma: {
    order: {
      findMany: vi.fn(async () => [{ id: 'o1', orderNumber: 1 }]),
      count: vi.fn(async () => 1),
    },
  },
}))

vi.mock('next-auth', () => ({
  getServerSession: vi.fn(async () => null),
}))

import { GET } from '../route'
import { prisma } from '@/lib/prisma'

describe('GET /api/orders', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('calls prisma.order.findMany and count with storeId filter', async () => {
    const req = new Request('https://example.com/api/orders?storeId=store123&page=1&limit=10') as unknown as NextRequest

    const res = await GET(req)

    expect(prisma.order.findMany).toHaveBeenCalled()
    expect(prisma.order.count).toHaveBeenCalled()

    const findManyMock = prisma.order.findMany as unknown as { mock: { calls: Array<unknown[]> } }
    const calledWith = findManyMock.mock.calls[0][0] as { where: Record<string, unknown> }
    expect(calledWith.where).toEqual({ storeId: 'store123' })
  })
})
