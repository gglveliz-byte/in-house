import { notFound } from 'next/navigation'
import Image from 'next/image'
import { prisma } from '@/lib/prisma'
import { Badge } from '@/components/ui/badge'
import { ProductCard } from '@/components/store/product-card'
import { formatPrice } from '@/lib/utils'

export const dynamic = 'force-dynamic'

async function getStore(slug: string) {
  const store = await prisma.store.findUnique({
    where: { slug },
    include: {
      categories: {
        orderBy: { order: 'asc' },
        include: {
          products: {
            where: { isAvailable: true },
            orderBy: { name: 'asc' },
          },
        },
      },
      products: {
        where: {
          isAvailable: true,
          categoryId: null,
        },
        orderBy: { name: 'asc' },
      },
    },
  })
  return store
}

export default async function StorePage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const store = await getStore(slug)

  if (!store) {
    notFound()
  }

  // Productos sin categoría
  const uncategorizedProducts = store.products

  return (
    <div className="pb-24 bg-gradient-to-br from-green-50 via-white to-orange-50 min-h-screen">
      {/* Store Header */}
      <div className="relative h-64 md:h-80 bg-gray-200 overflow-hidden">
        {store.banner ? (
          <Image
            src={store.banner}
            alt={store.name}
            fill
            className="object-cover"
            priority
            sizes="100vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-green-400 via-green-500 to-orange-500">
            <span className="text-9xl">🍽️</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent pointer-events-none" />
      </div>

      {/* Store Info */}
      <div className="max-w-7xl mx-auto px-4 -mt-20 relative z-10">
        <div className="bg-white rounded-2xl shadow-2xl p-6 md:p-8 border-4 border-white">
          <div className="flex flex-col md:flex-row items-start gap-6">
            {store.logo && (
              <div className="w-24 h-24 md:w-28 md:h-28 rounded-2xl bg-white shadow-xl overflow-hidden flex-shrink-0 border-4 border-white">
                <Image
                  src={store.logo}
                  alt={store.name}
                  width={112}
                  height={112}
                  className="object-cover w-full h-full"
                />
              </div>
            )}
            <div className="flex-1 w-full">
              <div className="flex flex-wrap items-center gap-3 mb-3">
                <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900">{store.name}</h1>
                <Badge variant={store.isOpen ? 'success' : 'danger'} className="text-sm px-4 py-1.5">
                  {store.isOpen ? '✓ Abierto ahora' : '✕ Cerrado'}
                </Badge>
              </div>
              {store.description && (
                <p className="text-gray-600 mt-2 text-lg leading-relaxed">{store.description}</p>
              )}
              <div className="flex flex-wrap items-center gap-4 mt-4">
                <span className="flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-full text-sm font-medium text-gray-700">
                  📍 {store.address}
                </span>
                {store.minDeliveryFee !== undefined && 
                 store.maxDeliveryFee !== undefined && 
                 store.minDeliveryFee >= 0 && 
                 store.maxDeliveryFee >= 0 &&
                 store.maxDeliveryFee >= store.minDeliveryFee ? (
                  <span className="flex items-center gap-2 bg-green-50 px-4 py-2 rounded-full text-sm font-semibold text-green-700">
                    🚚 Envío aproximado: {formatPrice(store.minDeliveryFee)} - {formatPrice(store.maxDeliveryFee)}
                  </span>
                ) : (
                  <span className="flex items-center gap-2 bg-green-50 px-4 py-2 rounded-full text-sm font-semibold text-green-700">
                    🚚 Envío: {formatPrice(store.deliveryFee)}
                  </span>
                )}
                {store.minOrder > 0 && (
                  <span className="flex items-center gap-2 bg-orange-50 px-4 py-2 rounded-full text-sm font-semibold text-orange-700">
                    💰 Mín: {formatPrice(store.minOrder)}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Products */}
      <div className="max-w-7xl mx-auto px-4 mt-8 md:mt-12">
        {/* Categories with products */}
        {store.categories.map((category) => (
          category.products.length > 0 && (
            <section key={category.id} className="mb-12">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-1 w-12 bg-gradient-to-r from-green-500 to-orange-500 rounded-full"></div>
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
                  {category.name}
                </h2>
                <div className="h-1 flex-1 bg-gradient-to-r from-orange-500 to-transparent rounded-full"></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {category.products.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    store={{
                      id: store.id,
                      name: store.name,
                      whatsapp: store.whatsapp,
                      deliveryFee: store.deliveryFee,
                    }}
                  />
                ))}
              </div>
            </section>
          )
        ))}

        {/* Uncategorized products */}
        {uncategorizedProducts.length > 0 && (
          <section className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-1 w-12 bg-gradient-to-r from-green-500 to-orange-500 rounded-full"></div>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
                {store.categories.length > 0 ? 'Otros productos' : 'Menú'}
              </h2>
              <div className="h-1 flex-1 bg-gradient-to-r from-orange-500 to-transparent rounded-full"></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {uncategorizedProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  store={{
                    id: store.id,
                    name: store.name,
                    whatsapp: store.whatsapp,
                    deliveryFee: store.deliveryFee,
                  }}
                />
              ))}
            </div>
          </section>
        )}

        {store.categories.every((c) => c.products.length === 0) &&
          uncategorizedProducts.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">
                No hay productos disponibles en este momento.
              </p>
            </div>
          )}
      </div>
    </div>
  )
}
