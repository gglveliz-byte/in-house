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
          { href: '/superadmin', label: 'Panel', icon: 'bar_chart' },
          { href: '/superadmin/zones', label: 'Zonas', icon: 'map' },
          { href: '/superadmin/admins', label: 'Admins', icon: 'group' },
          { href: '/superadmin/billing', label: 'Facturación', icon: 'payments' },
          { href: '/superadmin/messages', label: 'Mensajes', icon: 'chat' },
        ]
      case 'ADMIN':
        return [
          { href: '/admin', label: 'Panel', icon: 'bar_chart' },
          { href: '/admin/stores', label: 'Tiendas', icon: 'storefront' },
          { href: '/admin/users', label: 'Usuarios', icon: 'group' },
          { href: '/admin/orders', label: 'Pedidos', icon: 'inventory_2' },
          { href: '/admin/qr', label: 'QR', icon: 'qr_code_scanner' },
          { href: '/admin/messages', label: 'Mensajes', icon: 'chat' },
        ]
      case 'VENDOR':
        return [
          { href: '/vendor', label: 'Pedidos', icon: 'inventory_2' },
          { href: '/vendor/products', label: 'Productos', icon: 'lunch_dining' },
          { href: '/vendor/settings', label: 'Mi Tienda', icon: 'settings' },
        ]
      case 'DRIVER':
        return [
          { href: '/driver', label: 'Disponibles', icon: 'inventory_2' },
          { href: '/driver/active', label: 'En curso', icon: 'directions_car' },
          { href: '/driver/history', label: 'Historial', icon: 'history' },
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

  const isActive = (href: string) => {
    if (href === '/admin' || href === '/superadmin' || href === '/vendor' || href === '/driver') {
      return pathname === href
    }
    return pathname.startsWith(href)
  }

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-1.5 flex-shrink-0">
            <span className="material-symbols-outlined text-2xl text-[#003f87]">home</span>
            <span className="font-bold text-xl text-[#003f87] tracking-tight">BlueExpress</span>
          </Link>

          {/* Nav Items - Desktop */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-center',
                  isActive(item.href)
                    ? 'bg-[#003f87] text-white shadow-sm font-semibold'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                )}
              >
                <span className="material-symbols-outlined text-lg mr-1.5">{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </nav>

          {/* User Menu */}
          <div className="flex items-center gap-3">
            {/* Campanita de notificaciones */}
            {(user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') && (
              <NotificationBell />
            )}
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold text-gray-900">{user.name}</p>
              <p className="text-xs text-gray-500">{getRoleLabel()}</p>
            </div>
            <Link
              href="/azul"
              className="text-sm text-[#003f87] hover:text-[#003f87]/80 px-3 py-1.5 rounded-lg hover:bg-gray-100 border border-gray-200 transition-all duration-200 font-medium flex items-center gap-1.5"
              title="Ir a la Tienda de Clientes"
            >
              <span className="material-symbols-outlined text-lg">store</span>
              <span className="hidden md:inline">Ver Tienda</span>
            </Link>
            <button
              onClick={async () => {
                try {
                  await signOut({ callbackUrl: '/login' })
                } catch (error) {
                  console.error('Error al cerrar sesión:', error)
                  window.location.href = '/login'
                }
              }}
              className="text-sm text-gray-600 hover:text-red-600 px-3 py-1.5 rounded-lg hover:bg-red-50 border border-gray-200 hover:border-red-200 transition-all duration-200 font-medium"
            >
              Salir
            </button>
          </div>
        </div>

        {/* Mobile Nav */}
        <nav className="md:hidden flex overflow-x-auto pb-2 gap-1 no-scrollbar">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-200 flex items-center gap-1 flex-shrink-0',
                isActive(item.href)
                  ? 'bg-[#003f87] text-white font-semibold'
                  : 'text-gray-600 hover:bg-gray-100'
              )}
            >
              <span className="material-symbols-outlined text-lg">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  )
}
