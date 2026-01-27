'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { cn } from '@/lib/utils'
import { NotificationBell } from '@/components/notifications/notification-bell'

interface DashboardNavProps {
  user: {
    name?: string | null
    email?: string | null
    role: string
    zoneName?: string | null
  }
}

export function DashboardNav({ user }: DashboardNavProps) {
  const pathname = usePathname()

  const getNavItems = () => {
    switch (user.role) {
      case 'SUPER_ADMIN':
        return [
          { href: '/superadmin', label: 'Dashboard', icon: '📊' },
          { href: '/superadmin/zones', label: 'Zonas', icon: '🗺️' },
          { href: '/superadmin/admins', label: 'Admins', icon: '👥' },
          { href: '/superadmin/billing', label: 'Facturación', icon: '💰' },
          { href: '/superadmin/messages', label: 'Mensajes', icon: '💬' },
        ]
      case 'ADMIN':
        return [
          { href: '/admin', label: 'Dashboard', icon: '📊' },
          { href: '/admin/stores', label: 'Tiendas', icon: '🏪' },
          { href: '/admin/users', label: 'Usuarios', icon: '👥' },
          { href: '/admin/orders', label: 'Pedidos', icon: '📦' },
          { href: '/admin/messages', label: 'Mensajes', icon: '💬' },
        ]
      case 'VENDOR':
        return [
          { href: '/vendor', label: 'Pedidos', icon: '📦' },
          { href: '/vendor/products', label: 'Productos', icon: '🍔' },
          { href: '/vendor/settings', label: 'Mi Tienda', icon: '⚙️' },
        ]
      case 'DRIVER':
        return [
          { href: '/driver', label: 'Disponibles', icon: '📦' },
          { href: '/driver/active', label: 'En curso', icon: '🚗' },
          { href: '/driver/history', label: 'Historial', icon: '📋' },
        ]
      default:
        return []
    }
  }

  const navItems = getNavItems()

  const getRoleLabel = () => {
    switch (user.role) {
      case 'SUPER_ADMIN':
        return 'Super Admin'
      case 'ADMIN':
        return user.zoneName ? `Admin - ${user.zoneName}` : 'Administrador'
      case 'VENDOR':
        return 'Vendedor'
      case 'DRIVER':
        return 'Repartidor'
      default:
        return user.role
    }
  }

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl">🏠</span>
            <span className="font-bold text-xl text-primary-600">In House</span>
          </Link>

          {/* Nav Items */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                  pathname === item.href
                    ? 'bg-primary-50 text-primary-600'
                    : 'text-gray-600 hover:bg-gray-100'
                )}
              >
                <span className="mr-2">{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </nav>

          {/* User Menu */}
          <div className="flex items-center gap-4">
            {/* Campanita de notificaciones (para Admin) */}
            {(user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') && (
              <NotificationBell />
            )}
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-gray-900">{user.name}</p>
              <p className="text-xs text-gray-500">{getRoleLabel()}</p>
            </div>
            <button
              onClick={async () => {
                try {
                  await signOut({ callbackUrl: '/login' })
                } catch (error) {
                  console.error('Error al cerrar sesión:', error)
                  // Fallback: redirigir manualmente
                  window.location.href = '/login'
                }
              }}
              className="text-sm text-gray-600 hover:text-gray-900 px-3 py-1 rounded hover:bg-gray-100 transition-colors"
            >
              Salir
            </button>
          </div>
        </div>

        {/* Mobile Nav */}
        <nav className="md:hidden flex overflow-x-auto pb-3 gap-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors',
                pathname === item.href
                  ? 'bg-primary-50 text-primary-600'
                  : 'text-gray-600 hover:bg-gray-100'
              )}
            >
              <span className="mr-1">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  )
}
