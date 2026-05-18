import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// El superadmin usa el layout global de (dashboard) que ya tiene DashboardNav
// Este layout solo valida el rol y envuelve el contenido
export default async function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'SUPER_ADMIN') {
    redirect('/login')
  }

  return <>{children}</>
}
