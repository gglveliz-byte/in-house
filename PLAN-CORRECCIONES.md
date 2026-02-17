# Plan de Correcciones - In House Delivery Backend

**Fecha:** 16 de febrero de 2026
**Basado en:** Auditoría completa del backend (27 archivos API)

---

## FASE 0: Diagnóstico del Error de Deploy (Render)

### Problema reportado
- Error 1018: "Could not find host" en `in-house-psnd.onrender.com`
- Error 502: "Bad gateway" - Host Error

### Acciones
- [ ] Verificar estado del servicio en el dashboard de Render (https://dashboard.render.com)
- [ ] Si el servicio está suspendido: reactivar o crear uno nuevo
- [ ] Si está activo pero falla: revisar logs de deploy en Render para ver el error exacto
- [ ] Verificar que TODAS las variables de entorno estén configuradas en Render:
  - `DATABASE_URL`
  - `NEXTAUTH_SECRET`
  - `NEXTAUTH_URL` (debe apuntar a la URL correcta del servicio)
  - `PUSHER_APP_ID`, `PUSHER_KEY`, `PUSHER_SECRET`, `PUSHER_CLUSTER`
  - `NEXT_PUBLIC_PUSHER_KEY`, `NEXT_PUBLIC_PUSHER_CLUSTER`
  - `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
  - `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
- [ ] Verificar que la BD PostgreSQL en Render esté activa y accesible
- [ ] Correr `npm run build` localmente para confirmar que no hay errores de compilación
- [ ] Si el dominio cambió, actualizar `NEXTAUTH_URL` y DNS/Cloudflare

> **Nota:** Los servicios gratuitos de Render se suspenden tras 15 min de inactividad y pueden tardar ~30s en arrancar. Si el plan es free, considerar upgrade o usar Vercel.

---

## FASE 1: Correcciones Críticas (P0) - Seguridad

### 1.1 Agregar autenticación a endpoints desprotegidos

**Archivos afectados:**
- `src/app/api/orders/[id]/route.ts` (GET)
- `src/app/api/orders/[id]/messages/route.ts` (GET, POST)
- `src/app/api/orders/[id]/payment/route.ts` (PATCH)
- `src/app/api/orders/[id]/delivery-payment/route.ts` (PATCH)
- `src/app/api/upload/route.ts` (POST)

**Cambios:**
```
Para cada endpoint:
1. Importar getServerSession y authOptions al top del archivo
2. Obtener sesión: const session = await getServerSession(authOptions)
3. Para endpoints que SOLO usan vendedores/admins/drivers:
   - Rechazar si no hay sesión: if (!session) return 401
4. Para endpoints mixtos (cliente sin auth + vendedores):
   - GET /orders/[id]: Permitir sin auth (cliente trackea por ID)
     PERO limitar datos expuestos (no mostrar datos sensibles de la tienda)
   - POST /orders/[id]/messages: Permitir sin auth para CUSTOMER senderType
     PERO requerir auth para VENDOR/SYSTEM senderType
   - PATCH /orders/[id]/payment:
     * paymentStatus='UPLOADED' → Permitir sin auth (cliente sube comprobante)
     * paymentStatus='VERIFIED' → REQUIERE auth con rol VENDOR o ADMIN
```

**Caso especial - Payment verification:**
```typescript
// SOLO vendedores y admins pueden verificar pagos
if (paymentStatus === 'VERIFIED') {
  const session = await getServerSession(authOptions)
  if (!session || !['VENDOR', 'ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }
}
```

### 1.2 Corregir Mass Assignment en productos y zonas

**Archivos afectados:**
- `src/app/api/products/[id]/route.ts` (PATCH)
- `src/app/api/superadmin/zones/[id]/route.ts` (PATCH)

**Cambio para productos:**
```typescript
// ANTES (vulnerable):
data: body

// DESPUÉS (whitelist de campos):
const allowedFields = ['name', 'description', 'price', 'image', 'isAvailable', 'categoryId']
const updateData: Record<string, unknown> = {}
for (const field of allowedFields) {
  if (field in body) {
    updateData[field] = body[field]
  }
}
// Validar precio positivo
if (updateData.price !== undefined && (typeof updateData.price !== 'number' || updateData.price < 0)) {
  return NextResponse.json({ error: 'Precio inválido' }, { status: 400 })
}
data: updateData
```

**Cambio para zonas:**
```typescript
const allowedFields = ['name', 'description', 'latitude', 'longitude', 'radius', 'isActive']
const updateData: Record<string, unknown> = {}
for (const field of allowedFields) {
  if (field in body) {
    updateData[field] = body[field]
  }
}
data: updateData
```

### 1.3 Proteger endpoint de upload

**Archivo:** `src/app/api/upload/route.ts`

**Cambio:**
```typescript
// Agregar al inicio del POST:
const session = await getServerSession(authOptions)
if (!session) {
  return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
}
```

> **Excepción:** Si los clientes (sin auth) necesitan subir comprobantes,
> crear un endpoint separado `/api/upload/payment-proof` con validaciones
> más estrictas (solo 1 imagen, max 2MB, rate limited).

---

## FASE 2: Correcciones Altas (P1) - Lógica de Negocio

### 2.1 Corregir lógica de delivery fee (siempre calcula 0)

**Archivo:** `src/app/api/orders/route.ts` (líneas 130-133)

**Problema:** `minDeliveryFee` y `maxDeliveryFee` tienen `@default(0)` en Prisma,
así que nunca son `undefined`. La condición `hasDeliveryRange` siempre es `true`
porque `0 >= 0`, y el deliveryFee siempre se guarda como 0.

**Corrección:**
```typescript
// ANTES:
const hasDeliveryRange = store.minDeliveryFee !== undefined &&
                         store.maxDeliveryFee !== undefined &&
                         store.maxDeliveryFee >= store.minDeliveryFee

// DESPUÉS:
const hasDeliveryRange = store.minDeliveryFee > 0 || store.maxDeliveryFee > 0

// Si hay rango configurado, el delivery fee se definirá después (al entregar)
// Si no hay rango, usar el deliveryFee fijo de la tienda
const deliveryFee = hasDeliveryRange ? 0 : (store.deliveryFee || 0)
const total = subtotal + deliveryFee
```

### 2.2 Corregir race condition en counter de pedidos

**Archivo:** `src/app/api/orders/route.ts` (líneas 136-140)

**Opción A - Transacción Prisma (recomendada):**
```typescript
const order = await prisma.$transaction(async (tx) => {
  const counter = await tx.counter.update({
    where: { id: 'order_counter' },
    data: { value: { increment: 1 } },
  })

  return tx.order.create({
    data: {
      orderNumber: counter.value,
      // ... resto de datos
    },
  })
})
```

**Opción B - Secuencia PostgreSQL (más robusta):**
Agregar un campo autoincremental o usar raw SQL sequence.

### 2.3 Agregar validación de transiciones de estado

**Archivo:** `src/app/api/orders/[id]/route.ts`

**Agregar antes de actualizar:**
```typescript
// Mapa de transiciones válidas
const VALID_TRANSITIONS: Record<string, string[]> = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['READY', 'CANCELLED'],
  READY: ['PICKED_UP', 'CANCELLED'],
  PICKED_UP: ['DELIVERED'],
  DELIVERED: [],    // Estado final
  CANCELLED: [],    // Estado final
}

if (status) {
  // Obtener pedido actual para validar transición
  const currentOrder = await prisma.order.findUnique({
    where: { id },
    select: { status: true },
  })

  if (!currentOrder) {
    return NextResponse.json({ error: 'Pedido no encontrado' }, { status: 404 })
  }

  const allowedStatuses = VALID_TRANSITIONS[currentOrder.status] || []
  if (!allowedStatuses.includes(status)) {
    return NextResponse.json(
      { error: `No se puede cambiar de ${currentOrder.status} a ${status}` },
      { status: 400 }
    )
  }
}
```

### 2.4 Agregar autenticación al endpoint de stats

**Archivo:** `src/app/api/stats/route.ts`

```typescript
// Agregar después de obtener la sesión:
if (!session) {
  return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
}
```

---

## FASE 3: Correcciones Medias (P2)

### 3.1 Unificar función calculateAmountDue

**Acción:** Crear `src/lib/billing.ts`
```typescript
export function calculateAmountDue(completedOrders: number): number {
  const cycleNumber = Math.floor(completedOrders / 1000)
  const ordersInCycle = completedOrders % 1000
  const cycleBase = cycleNumber * 10

  if (ordersInCycle <= 30) return 10 + cycleBase

  const rangesAfter30 = Math.ceil((ordersInCycle - 30) / 20)
  const amount = 10 + rangesAfter30 * 10

  return Math.min(amount, 100) + cycleBase
}
```

Luego importar desde los 3 archivos que la usan:
- `src/app/api/superadmin/billing/route.ts`
- `src/app/api/superadmin/billing/[id]/route.ts`
- `src/app/api/superadmin/stats/route.ts`

### 3.2 Agregar paginación a listados

**Archivos:** `orders/route.ts`, `users/route.ts`, `stores/route.ts`

```typescript
const page = parseInt(searchParams.get('page') || '1')
const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)
const skip = (page - 1) * limit

const [items, total] = await Promise.all([
  prisma.order.findMany({
    where,
    skip,
    take: limit,
    orderBy: { createdAt: 'desc' },
    // ... includes
  }),
  prisma.order.count({ where }),
])

return NextResponse.json({
  data: items,
  pagination: {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  },
})
```

### 3.3 Agregar validación de inputs en creación de pedidos

**Archivo:** `src/app/api/orders/route.ts`

```typescript
// Validaciones básicas
if (!storeId || !customerName?.trim() || !customerPhone?.trim() || !customerAddress?.trim()) {
  return NextResponse.json(
    { error: 'Tienda, nombre, teléfono y dirección son requeridos' },
    { status: 400 }
  )
}

if (!items || !Array.isArray(items) || items.length === 0) {
  return NextResponse.json(
    { error: 'El pedido debe tener al menos un producto' },
    { status: 400 }
  )
}

// Validar formato de teléfono (básico)
if (customerPhone.trim().length < 7) {
  return NextResponse.json(
    { error: 'Número de teléfono inválido' },
    { status: 400 }
  )
}
```

### 3.4 Ocultar email del owner en endpoint público de stores

**Archivo:** `src/app/api/stores/route.ts`

```typescript
// ANTES:
owner: {
  select: {
    id: true,
    name: true,
    email: true,  // ← QUITAR para requests públicos
  },
},

// DESPUÉS:
// Solo incluir owner si hay sesión de admin/superadmin
...(session?.user?.role === 'ADMIN' || session?.user?.role === 'SUPER_ADMIN'
  ? {
      owner: {
        select: { id: true, name: true, email: true },
      },
    }
  : {}),
```

### 3.5 Corregir filtro de usuarios con role + OR

**Archivo:** `src/app/api/users/route.ts`

```typescript
// Si es admin y se pide un role específico, filtrar el OR por ese role
if (session?.user?.role === 'ADMIN' && session.user.id) {
  const roleFilter = role // capturar antes de borrar
  const orConditions = []

  if (!roleFilter || roleFilter === 'VENDOR') {
    orConditions.push({
      role: 'VENDOR',
      stores: { some: { zoneId: session.user.zoneId } }
    })
  }
  if (!roleFilter || roleFilter === 'DRIVER') {
    orConditions.push({
      role: 'DRIVER',
      zoneId: session.user.zoneId
    })
  }

  where.OR = orConditions
  delete where.role
}
```

---

## FASE 4: Mejoras de Rendimiento (P3)

### 4.1 Agregar índices al schema de Prisma

**Archivo:** `prisma/schema.prisma`

```prisma
model Order {
  // ... campos existentes

  @@index([status])
  @@index([storeId])
  @@index([zoneId])
  @@index([driverId])
  @@index([createdAt])
  @@index([status, storeId])
}

model Store {
  // ... campos existentes

  @@index([zoneId])
  @@index([ownerId])
}

model User {
  // ... campos existentes

  @@index([role])
  @@index([zoneId])
  @@index([superAdminId])
}

model Message {
  // ... campos existentes

  @@index([orderId])
}

model Notification {
  // ... campos existentes

  @@index([userId, isRead])
}

model BillingCycle {
  // ... campos existentes

  @@index([adminId])
  @@index([startDate, endDate])
}
```

Después: `npx prisma db push` para aplicar.

### 4.2 Optimizar N+1 queries en superadmin stats

**Archivo:** `src/app/api/superadmin/stats/route.ts`

Reemplazar findMany + filter en JS por aggregations de Prisma:
```typescript
// ANTES: Carga TODOS los orders en memoria
const orders = await prisma.order.findMany({
  where: { storeId: { in: storeIds } },
  select: { status: true, actualDeliveryFee: true },
})
const completedOrders = orders.filter(o => o.status === 'DELIVERED').length

// DESPUÉS: Usa count y aggregate en la BD
const [totalOrders, completedOrders, deliveryRevenue] = await Promise.all([
  prisma.order.count({ where: { storeId: { in: storeIds } } }),
  prisma.order.count({ where: { storeId: { in: storeIds }, status: 'DELIVERED' } }),
  prisma.order.aggregate({
    where: { storeId: { in: storeIds }, status: 'DELIVERED' },
    _sum: { actualDeliveryFee: true },
  }),
])
```

### 4.3 Mover imports dinámicos al top-level

**Archivos afectados:**
- `src/app/api/orders/[id]/route.ts`
- `src/app/api/products/route.ts`
- `src/app/api/products/[id]/route.ts`
- `src/app/api/stores/[slug]/route.ts`

```typescript
// ANTES (dentro de la función):
const { getServerSession } = await import('next-auth')
const { authOptions } = await import('@/lib/auth')

// DESPUÉS (al top del archivo):
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
```

---

## FASE 5: Mejoras de Arquitectura (opcionales)

### 5.1 Crear middleware de autenticación reutilizable

**Crear:** `src/lib/api-auth.ts`
```typescript
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { NextResponse } from 'next/server'

export async function requireAuth(roles?: string[]) {
  const session = await getServerSession(authOptions)

  if (!session) {
    return { error: NextResponse.json({ error: 'No autorizado' }, { status: 401 }), session: null }
  }

  if (roles && !roles.includes(session.user.role)) {
    return { error: NextResponse.json({ error: 'Acceso denegado' }, { status: 403 }), session: null }
  }

  return { error: null, session }
}
```

### 5.2 Agregar validación con Zod (opcional)

**Instalar:** `npm install zod`

Crear schemas de validación para cada endpoint:
```typescript
import { z } from 'zod'

export const createOrderSchema = z.object({
  storeId: z.string().cuid(),
  customerName: z.string().min(2).max(100),
  customerPhone: z.string().min(7).max(20),
  customerAddress: z.string().min(5).max(500),
  customerLat: z.number().optional(),
  customerLng: z.number().optional(),
  customerNotes: z.string().max(500).optional(),
  items: z.array(z.object({
    productId: z.string().cuid(),
    quantity: z.number().int().positive(),
    notes: z.string().max(200).optional(),
  })).min(1),
})
```

---

## Orden de Ejecución Recomendado

| Paso | Fase | Tiempo estimado | Impacto |
|------|------|-----------------|---------|
| 1 | Fase 0 - Fix deploy | Diagnóstico | Restaurar servicio |
| 2 | Fase 1.1 - Auth en payment | 30 min | Prevenir fraude |
| 3 | Fase 1.2 - Mass assignment | 20 min | Prevenir manipulación |
| 4 | Fase 1.3 - Auth en upload | 10 min | Prevenir abuso |
| 5 | Fase 2.1 - Delivery fee | 15 min | Cálculos correctos |
| 6 | Fase 2.2 - Race condition | 20 min | Datos consistentes |
| 7 | Fase 2.3 - Transiciones | 20 min | Estados válidos |
| 8 | Fase 2.4 - Auth en stats | 5 min | Datos protegidos |
| 9 | Fase 3.1 - Unificar billing | 15 min | Facturación correcta |
| 10 | Fase 3.2 - Paginación | 30 min | Performance |
| 11 | Fase 3.3 - Validación inputs | 20 min | Datos limpios |
| 12 | Fase 3.4-3.5 - Fixes menores | 15 min | Seguridad/lógica |
| 13 | Fase 4.1 - Índices BD | 10 min | Performance BD |
| 14 | Fase 4.2-4.3 - Optimizaciones | 30 min | Performance API |
| 15 | Fase 5 - Arquitectura | Opcional | Mantenibilidad |

---

*Plan generado a partir de la auditoría completa del backend realizada el 16/02/2026*
