'use client'

import { useSession, signOut } from 'next-auth/react'
import Link from 'next/link'

export default function DriverProfilePage() {
  const { data: session } = useSession()

  const stats = [
    { icon: 'check_circle', label: 'Entregados hoy', value: '—', color: 'text-green-600' },
    { icon: 'star', label: 'Calificación', value: '4.9', color: 'text-amber-500' },
    { icon: 'payments', label: 'Ganado hoy', value: '—', color: 'text-primary' },
  ]

  return (
    <div className="px-margin-mobile md:px-margin-desktop py-8 space-y-6 max-w-lg mx-auto">
      {/* Profile Card */}
      <div className="bg-primary rounded-2xl p-6 text-on-primary relative overflow-hidden">
        <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-white/10"></div>
        <div className="absolute -right-4 -bottom-8 w-24 h-24 rounded-full bg-white/5"></div>
        <div className="relative z-10 flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-white/20 border-2 border-white flex items-center justify-center text-headline-md font-bold">
            {session?.user?.name?.charAt(0).toUpperCase() || 'R'}
          </div>
          <div>
            <p className="text-label-md font-label-md opacity-80">REPARTIDOR</p>
            <h2 className="font-headline-sm text-headline-sm font-bold">{session?.user?.name || 'Repartidor'}</h2>
            <p className="text-body-sm opacity-70">{session?.user?.email}</p>
          </div>
        </div>
        <div className="relative z-10 mt-4 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
          <span className="text-body-sm opacity-90">Disponible para pedidos</span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {stats.map(({ icon, label, value, color }) => (
          <div key={label} className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 text-center">
            <span className={`material-symbols-outlined ${color}`} style={{ fontVariationSettings: "'FILL' 1" }}>{icon}</span>
            <p className={`font-headline-sm text-headline-sm font-bold mt-1 ${color}`}>{value}</p>
            <p className="text-label-md font-label-md text-on-surface-variant mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Quick Links */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden">
        {[
          { href: '/driver/active', icon: 'shopping_bag', label: 'Pedidos Disponibles', sub: 'Ver pedidos listos para recoger' },
          { href: '/driver/history', icon: 'history', label: 'Historial de Entregas', sub: 'Revisa tus entregas anteriores' },
        ].map(({ href, icon, label, sub }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center gap-4 p-4 hover:bg-surface-container-low transition-colors border-b border-outline-variant last:border-0"
          >
            <div className="w-10 h-10 rounded-full bg-primary-fixed flex items-center justify-center text-primary">
              <span className="material-symbols-outlined">{icon}</span>
            </div>
            <div className="flex-1">
              <p className="font-body-md font-semibold text-on-surface">{label}</p>
              <p className="text-body-sm text-on-surface-variant">{sub}</p>
            </div>
            <span className="material-symbols-outlined text-outline">chevron_right</span>
          </Link>
        ))}
      </div>

      {/* Sign Out */}
      <button
        onClick={() => signOut({ callbackUrl: '/login' })}
        className="w-full flex items-center justify-center gap-2 p-4 border border-error/30 text-error rounded-xl hover:bg-error-container transition-colors font-bold"
      >
        <span className="material-symbols-outlined">logout</span>
        Cerrar Sesión
      </button>
    </div>
  )
}
