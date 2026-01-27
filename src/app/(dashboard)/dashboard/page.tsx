import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/login')
  }

  // Redirigir según el rol
  switch (session.user.role) {
    case 'SUPER_ADMIN':
      redirect('/superadmin')
    case 'ADMIN':
      redirect('/admin')
    case 'VENDOR':
      redirect('/vendor')
    case 'DRIVER':
      redirect('/driver')
    default:
      redirect('/login')
  }
}
