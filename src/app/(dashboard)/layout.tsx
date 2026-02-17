import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { DashboardNav } from '@/components/dashboard/dashboard-nav'
import { prisma } from '@/lib/prisma'
import { DashboardCurrencyProvider } from '@/components/dashboard-currency-provider'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/login')
  }

  // Obtener moneda de la zona del usuario
  let currency = 'USD'
  if (session.user.zoneId) {
    const zone = await prisma.zone.findUnique({
      where: { id: session.user.zoneId },
      select: { currency: true },
    })
    if (zone?.currency) currency = zone.currency
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardCurrencyProvider currency={currency} />
      <DashboardNav user={session.user} />
      <main className="p-4 md:p-8">{children}</main>
    </div>
  )
}
