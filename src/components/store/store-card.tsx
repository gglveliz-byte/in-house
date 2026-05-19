import Link from 'next/link'
import Image from 'next/image'
import { Badge } from '@/components/ui/badge'
import { formatPrice } from '@/lib/utils'
import { Store as StoreIcon } from 'lucide-react'

interface StoreCardProps {
  store: {
    id: string
    name: string
    slug: string
    description: string | null
    logo: string | null
    banner: string | null
    address: string
    isOpen: boolean
    minOrder: number
    deliveryFee: number
    minDeliveryFee?: number
    maxDeliveryFee?: number
  }
}

export function StoreCard({ store }: StoreCardProps) {
  return (
    <Link href={`/tienda/${store.slug}`}>
      <div className="group card overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:-translate-y-1 border-2 border-transparent hover:border-primary/20">
        {/* Banner */}
        <div className="relative h-48 bg-surface-container-low overflow-hidden">
          {store.banner ? (
            <Image
              src={store.banner}
              alt={store.name}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-surface-container">
              <span className="text-primary opacity-30 group-hover:scale-110 transition-transform duration-300">
                <StoreIcon size={64} />
              </span>
            </div>
          )}

          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />

          {/* Status Badge */}
          <div className="absolute top-3 right-3 z-10">
            <Badge variant={store.isOpen ? 'success' : 'danger'} className="shadow-lg">
              {store.isOpen ? '✓ Abierto' : '✕ Cerrado'}
            </Badge>
          </div>

          {/* Logo */}
          {store.logo && (
            <div className="absolute -bottom-8 left-4 z-10">
              <div className="w-20 h-20 rounded-2xl bg-white shadow-xl overflow-hidden border-4 border-white transform group-hover:scale-105 transition-transform duration-300">
                <Image
                  src={store.logo}
                  alt={`Logo de ${store.name}`}
                  width={80}
                  height={80}
                  className="object-cover w-full h-full"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Content */}
        <div className={`p-5 ${store.logo ? 'pt-12' : 'pt-5'} bg-white`}>
          <h3 className="font-bold text-xl text-gray-900 mb-2 group-hover:text-primary transition-colors">
            {store.name}
          </h3>

          {store.description && (
            <p className="text-sm text-gray-600 mt-1 line-clamp-2 leading-relaxed">
              {store.description}
            </p>
          )}

          <div className="flex items-center gap-2 mt-4 text-xs text-gray-500">
            <span className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded-full">
              📍 <span className="truncate max-w-[200px]">{store.address}</span>
            </span>
          </div>

          <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
            <div className="flex items-center gap-3 text-sm">
              {store.minDeliveryFee !== undefined && 
               store.maxDeliveryFee !== undefined && 
               store.minDeliveryFee >= 0 && 
               store.maxDeliveryFee >= 0 &&
               store.maxDeliveryFee >= store.minDeliveryFee ? (
                <span className="flex items-center gap-1 text-gray-700 bg-primary/5 border border-primary/10 px-3 py-1.5 rounded-full font-medium">
                  🚚 Envío: {formatPrice(store.minDeliveryFee)} - {formatPrice(store.maxDeliveryFee)}
                </span>
              ) : (
                <span className="flex items-center gap-1 text-gray-700 bg-primary/5 border border-primary/10 px-3 py-1.5 rounded-full font-medium">
                  🚚 Envío: {formatPrice(store.deliveryFee)}
                </span>
              )}
              {store.minOrder > 0 && (
                <span className="flex items-center gap-1 text-gray-700 bg-gray-50 border border-gray-100 px-3 py-1.5 rounded-full font-medium">
                  💰 Mín: {formatPrice(store.minOrder)}
                </span>
              )}
            </div>
            <div className="text-primary font-bold text-lg">
              →
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}
