'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ImageUpload } from '@/components/ui/image-upload'
import { formatPrice } from '@/lib/utils'
import type { Product } from '@/types'

export default function VendorProductsPage() {
  const { data: session, status } = useSession()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [storeId, setStoreId] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    image: '',
  })

  // Buscar la tienda del usuario por su ID
  const findUserStore = async () => {
    if (!session?.user?.id) return null

    try {
      const response = await fetch('/api/stores')
      const stores = await response.json()
      const userStore = stores.find((store: { ownerId: string }) =>
        store.ownerId === session.user.id
      )
      return userStore?.id || null
    } catch (error) {
      console.error('Error finding store:', error)
      return null
    }
  }

  const fetchProducts = async (sid: string) => {
    try {
      const response = await fetch(`/api/products?storeId=${sid}`)
      const data = await response.json()
      setProducts(data)
    } catch (error) {
      console.error('Error fetching products:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const init = async () => {
      if (status === 'loading') return

      let sid = session?.user?.storeId

      // Si no hay storeId en la sesión, buscar por userId
      if (!sid && session?.user?.id) {
        sid = await findUserStore()
      }

      if (sid) {
        setStoreId(sid)
        await fetchProducts(sid)
      } else {
        setLoading(false)
      }
    }

    init()
  }, [session, status])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!storeId) return

    try {
      if (editingProduct) {
        await fetch(`/api/products/${editingProduct.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: formData.name,
            description: formData.description,
            price: parseFloat(formData.price),
            image: formData.image || null,
          }),
        })
      } else {
        await fetch('/api/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: formData.name,
            description: formData.description,
            price: parseFloat(formData.price),
            image: formData.image || null,
            storeId: storeId,
          }),
        })
      }

      setShowForm(false)
      setEditingProduct(null)
      setFormData({ name: '', description: '', price: '', image: '' })
      fetchProducts(storeId)
    } catch (error) {
      console.error('Error saving product:', error)
    }
  }

  const handleEdit = (product: Product) => {
    setEditingProduct(product)
    setFormData({
      name: product.name,
      description: product.description || '',
      price: product.price.toString(),
      image: product.image || '',
    })
    setShowForm(true)
  }

  const handleToggleAvailability = async (product: Product) => {
    if (!storeId) return
    try {
      await fetch(`/api/products/${product.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isAvailable: !product.isAvailable }),
      })
      fetchProducts(storeId)
    } catch (error) {
      console.error('Error toggling availability:', error)
    }
  }

  const handleDelete = async (productId: string) => {
    if (!storeId) return
    if (!confirm('¿Estás seguro de eliminar este producto?')) return

    try {
      await fetch(`/api/products/${productId}`, { method: 'DELETE' })
      fetchProducts(storeId)
    } catch (error) {
      console.error('Error deleting product:', error)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3" />
          <div className="grid grid-cols-2 gap-4">
            <div className="h-48 bg-gray-200 rounded" />
            <div className="h-48 bg-gray-200 rounded" />
          </div>
        </div>
      </div>
    )
  }

  if (!storeId) {
    return (
      <div className="max-w-md mx-auto text-center py-12">
        <Card className="p-8">
          <span className="text-6xl block mb-4">🏪</span>
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            No tienes una tienda asignada
          </h2>
          <p className="text-gray-600">
            Contacta al administrador para que te asigne una tienda.
          </p>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Productos</h1>
        <Button onClick={() => setShowForm(true)}>+ Nuevo producto</Button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <h2 className="text-lg font-semibold">
                {editingProduct ? 'Editar producto' : 'Nuevo producto'}
              </h2>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  label="Nombre"
                  id="name"
                  required
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="Hamburguesa clásica"
                />

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descripción
                  </label>
                  <textarea
                    className="input"
                    rows={2}
                    value={formData.description}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, description: e.target.value }))
                    }
                    placeholder="Descripción del producto..."
                  />
                </div>

                <Input
                  label="Precio"
                  id="price"
                  type="number"
                  step="0.01"
                  required
                  value={formData.price}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, price: e.target.value }))
                  }
                  placeholder="99.00"
                />

                <ImageUpload
                  label="Imagen del producto"
                  value={formData.image}
                  onChange={(url) => setFormData((prev) => ({ ...prev, image: url }))}
                  folder="products"
                  placeholder="https://ejemplo.com/producto.jpg"
                />

                <div className="flex gap-2 pt-4">
                  <Button type="submit" className="flex-1">
                    {editingProduct ? 'Guardar cambios' : 'Crear producto'}
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => {
                      setShowForm(false)
                      setEditingProduct(null)
                      setFormData({ name: '', description: '', price: '', image: '' })
                    }}
                  >
                    Cancelar
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Products Grid */}
      {products.length === 0 ? (
        <Card className="text-center py-12">
          <p className="text-gray-500 mb-4">No tienes productos aún</p>
          <Button onClick={() => setShowForm(true)}>Crear mi primer producto</Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {products.map((product) => (
            <Card key={product.id} className="overflow-hidden">
              <div className="h-32 bg-gray-100 flex items-center justify-center">
                {product.image ? (
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-4xl">🍔</span>
                )}
              </div>
              <CardContent className="pt-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-medium">{product.name}</h3>
                    <p className="text-lg font-semibold text-primary-600">
                      {formatPrice(product.price)}
                    </p>
                  </div>
                  <Badge variant={product.isAvailable ? 'success' : 'danger'}>
                    {product.isAvailable ? 'Disponible' : 'Agotado'}
                  </Badge>
                </div>
                {product.description && (
                  <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                    {product.description}
                  </p>
                )}
                <div className="flex gap-2 mt-4">
                  <Button size="sm" variant="secondary" onClick={() => handleEdit(product)}>
                    Editar
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleToggleAvailability(product)}
                  >
                    {product.isAvailable ? 'Marcar agotado' : 'Marcar disponible'}
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => handleDelete(product.id)}
                  >
                    Eliminar
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
