'use client'

import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navItems = [
  { href: '/superadmin', label: 'Dashboard', icon: '📊' },
  { href: '/superadmin/zones', label: 'Zonas', icon: '🗺️' },
  { href: '/superadmin/admins', label: 'Administradores', icon: '👥' },
  { href: '/superadmin/billing', label: 'Facturación', icon: '💰' },
  { href: '/superadmin/messages', label: 'Mensajes', icon: '💬' },
]

export default function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { data: session, status } = useSession()
  const pathname = usePathname()

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  if (!session || session.user.role !== 'SUPER_ADMIN') {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-3xl">👑</span>
              <div>
                <h1 className="text-xl font-bold">Super Admin Panel</h1>
                <p className="text-purple-200 text-sm">Gestión de Plataforma SaaS</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-purple-200 text-sm">{session.user.name}</span>
              <Link
                href="/api/auth/signout"
                className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Cerrar sesión
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-1 overflow-x-auto py-2">
            {navItems.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                    isActive
                      ? 'bg-purple-100 text-purple-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <span>{item.icon}</span>
                  {item.label}
                </Link>
              )
            })}
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">{children}</main>
    </div>
  )
}
