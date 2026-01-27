import { CartButton } from '@/components/cart/cart-button'
import { ActiveOrderBadge } from '@/components/ui/active-order-badge'

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2">
            <span className="text-2xl">🏠</span>
            <span className="font-bold text-xl text-primary-600">In House</span>
          </a>
          <CartButton />
        </div>
      </header>

      {/* Main Content */}
      <main className="pb-24">{children}</main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-auto py-6">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm text-gray-500">
          © 2026 In House Delivery. Todos los derechos reservados.
        </div>
      </footer>

      {/* Globo flotante de pedido activo */}
      <ActiveOrderBadge />
    </div>
  )
}
