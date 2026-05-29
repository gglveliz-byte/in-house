# Auditoría y Guía de Arquitectura de Base de Datos Prisma (In-House)

Este documento detalla la revisión completa de la base de datos PostgreSQL gestionada a través de Prisma ORM para la plataforma *In House*. Analiza las políticas de borrado en cascada, la mitigación de condiciones de carrera en el contador de pedidos y el estado de la indexación para optimizar el rendimiento.

---

## 1. Estrategia de Borrado en Cascada y Relaciones Críticas

Las políticas de borrado en cascada (`onDelete`) son fundamentales para evitar registros huérfanos sin causar pérdida accidental de datos históricos sensibles (como facturación o pedidos completados).

### 1.1 Mapeo de Acciones en Cascada Existentes
El esquema actual de Prisma define las siguientes reglas de eliminación:

*   **Store → Category & Product**:
    *   `Category` tiene `onDelete: Cascade` con `Store`. Si una tienda se elimina, sus categorías asociadas se borran automáticamente de forma segura.
    *   `Product` tiene `onDelete: Cascade` con `Store`. Si la tienda se elimina, todos sus productos se eliminan automáticamente.
*   **Category → Product**:
    *   `Product` se relaciona con `Category` a través de `onDelete: SetNull`. Si una categoría se elimina, los productos asociados no se borran; simplemente se limpian de categoría (`categoryId` pasa a ser `null`). Esto es de gran utilidad para no perder productos.
*   **Order → OrderItem & Message**:
    *   `OrderItem` tiene `onDelete: Cascade` con `Order`. Si un pedido es eliminado, sus ítems individuales se borran.
    *   `Message` tiene `onDelete: Cascade` con `Order`. Al borrar un pedido, se elimina todo su historial de chat de soporte.
*   **User → PasswordReset**:
    *   `PasswordReset` tiene `onDelete: Cascade` con `User`. Al borrar un usuario, sus tokens de reseteo expiran y se eliminan.

### 1.2 Puntos de Atención y Recomendaciones
1.  **Product → OrderItem (Sin cascada / Restringido)**:
    *   `OrderItem` referencia a `Product` de forma directa sin cláusula `onDelete`. Por comportamiento por defecto de PostgreSQL/Prisma, si intentas borrar un producto (`Product`) que ya ha sido pedido por un cliente en el pasado (que tiene un `OrderItem` asociado), **la base de datos rechazará la eliminación** lanzando una violación de clave foránea (`Foreign key constraint failed`).
    *   *Recomendación de arquitectura*: Nunca borres físicamente un producto en producción. Utiliza el campo de control lógico `isAvailable` (establecido en `false`) para deshabilitarlo en el menú de la tienda sin alterar el historial de ventas.
2.  **User → Order (Vendedor / Repartidor)**:
    *   El modelo `Order` referencia a un `driver` (User) y un `Store` (propietario vendedor). Borrar un usuario con rol `VENDOR` o `DRIVER` que tiene historial de pedidos lanzará fallos de restricción.
    *   *Recomendación*: Bloquear borrados directos de usuarios en producción. Implementar un estado lógico `isActive` o desactivar las credenciales en lugar de purgar el registro.

---

## 2. Prevención de Condiciones de Carrera (Concurrencia en Pedidos)

El número visible de pedido (`orderNumber`) es un entero consecutivo esencial para la comunicación rápida de repartidores y clientes. Para evitar números duplicados bajo alta demanda concurrente, se implementa una transacción atómica.

### 2.1 Modelo `Counter`
El modelo está diseñado con una única fila para llevar la secuencia de pedidos:
```prisma
model Counter {
  id    String @id @default("order_counter")
  value Int    @default(1000)
}
```

### 2.2 Transacción Atómica con Prisma
En `src/app/api/orders/route.ts`, la lógica utiliza la transacción transaccional interactiva de Prisma (`$transaction`):
```typescript
const order = await prisma.$transaction(async (tx) => {
  const counter = await tx.counter.upsert({
    where: { id: 'order_counter' },
    update: { value: { increment: 1 } },
    create: { id: 'order_counter', value: 1001 },
  })

  return tx.order.create({
    data: {
      orderNumber: counter.value,
      // ... resto de propiedades
    }
  })
})
```

#### ¿Por qué esto es seguro frente a condiciones de carrera?
1.  **Bloqueo de Fila (Row Locking)**: Al ejecutar un `upsert` o un `update` con `increment` dentro de un bloque `$transaction`, PostgreSQL adquiere un bloqueo exclusivo sobre la fila del contador para esa transacción específica.
2.  **Aislamiento**: Cualquier otra solicitud concurrente que intente actualizar la misma fila `order_counter` quedará en espera ordenada hasta que la primera transacción confirme (`commit`) o falle (`rollback`).
3.  **Consistencia**: Esto garantiza que cada pedido reciba un `orderNumber` único, estrictamente secuencial y libre de colisiones.

---

## 3. Plan de Indexación y Rendimiento de Consultas

Las consultas de lectura pesadas en aplicaciones móviles de entrega deben ser ultrarrápidas. Hemos implementado índices explícitos (`@@index`) en las tablas con mayor volumen de lecturas.

### 3.1 Índices en `Order`
```prisma
model Order {
  // ...
  @@index([status])            // Búsqueda de pedidos READY para repartidores
  @@index([storeId])           // Panel de control del vendedor
  @@index([zoneId])            // Dashboard de Administrador de Zona
  @@index([driverId])          // Historial/Pedidos activos del Repartidor
  @@index([createdAt])         // Ordenamiento por fecha en feeds públicos
  @@index([status, storeId])   // Filtro compuesto recurrente de tiendas
  @@index([deliveredAt])       // Cálculo rápido de comisiones / finanzas
}
```

### 3.2 Índices en `Store` y `User`
*   `Store.zoneId` y `Store.ownerId`: Indexa la relación geográfica de zonas y asociación de propietarios para evitar escaneos secuenciales completos (`Full Table Scans`) al abrir el listado de restaurantes.
*   `User.role` y `User.zoneId`: Acelera la segmentación interna al despachar notificaciones en tiempo real a repartidores o buscar administradores de zona.

---

## 4. Guía de Ejecución de Cambios y Migraciones en Producción

El ecosistema actual utiliza Render.com para PostgreSQL y Vercel para la aplicación Web. Dado que la base de datos de producción es compartida, sigue esta guía estricta para evitar la interrupción del servicio.

### 4.1 Comandos Básicos de Sincronización

*   **Desarrollo Local / Sincronización Inmediata**:
    ```bash
    npm run db:push
    ```
    *Uso:* Aplica los cambios de `schema.prisma` directamente a la base de datos conectada en `DATABASE_URL` sin generar archivos de migración intermedios. Excelente para desarrollo ágil y startups.

*   **Carga de Semilla de Datos de Prueba (Seed)**:
    ```bash
    npm run db:seed
    ```
    *Uso:* Ejecuta `prisma/seed.ts` para poblar la base de datos con tiendas, productos de ejemplo y usuarios de prueba con roles asignados.

### 4.2 Proceso de Despliegue Seguro
1.  **No elimines columnas existentes** en uso por versiones anteriores de la app en producción. Si necesitas renombrar una columna, hazlo en dos fases (agregar nueva columna → migrar datos → retirar columna antigua).
2.  Antes de subir a producción, realiza un `npm run build` localmente para confirmar que el compilador de Next.js y el cliente generado de Prisma se integran sin discrepancias.
