# PRD - Product Requirements Document
## In House Delivery Platform

**Versión:** 1.0
**Fecha:** 16 de febrero de 2026
**Estado:** En producción

---

## 1. Resumen Ejecutivo

**In House Delivery** es una plataforma SaaS multi-tenant de delivery de comida local, diseñada para operar en zonas geográficas independientes. Permite a administradores de zona gestionar tiendas, repartidores y pedidos dentro de su área, mientras un super administrador supervisa toda la plataforma.

### Propuesta de valor
- Plataforma completa de delivery sin dependencia de terceros (Rappi, Uber Eats, etc.)
- Modelo multi-zona escalable con administración descentralizada
- Comunicación en tiempo real entre clientes, vendedores y repartidores
- PWA para acceso móvil sin necesidad de publicar en app stores

---

## 2. Stack Tecnológico

| Capa | Tecnología |
|------|-----------|
| Frontend | Next.js 15 (App Router), React 18.3, TypeScript 5 |
| Estilos | TailwindCSS 3.4 |
| Estado | Zustand 4.5 |
| Backend | Next.js API Routes (serverless) |
| Autenticación | NextAuth.js 4.24 (JWT) |
| Base de datos | PostgreSQL (Render.com) |
| ORM | Prisma 5.22 |
| Tiempo real | Pusher / Pusher-js |
| Imágenes | Cloudinary |
| Mapas | Google Maps API |
| Comunicación | WhatsApp API |

---

## 3. Arquitectura del Sistema

### 3.1 Estructura de carpetas principal

```
src/
├── app/
│   ├── (public)/          # Rutas públicas (sin auth)
│   ├── (dashboard)/       # Rutas protegidas por rol
│   │   ├── admin/         # Panel administrador de zona
│   │   ├── vendor/        # Panel vendedor/tienda
│   │   ├── driver/        # Panel repartidor
│   │   └── superadmin/    # Panel super administrador
│   └── api/               # Endpoints REST
├── components/            # Componentes React reutilizables
├── lib/                   # Utilidades y configuraciones
├── stores/                # Estado global (Zustand)
├── types/                 # Definiciones TypeScript
└── hooks/                 # Custom hooks
```

### 3.2 Modelos de datos (12 modelos Prisma)

| Modelo | Descripción |
|--------|------------|
| **Zone** | Zonas geográficas de delivery (lat, lng, radio) |
| **User** | Usuarios del sistema (4 roles) |
| **Store** | Tiendas/restaurantes dentro de una zona |
| **Product** | Productos de cada tienda |
| **Category** | Categorías de productos por tienda |
| **Order** | Pedidos con estados y tracking |
| **OrderItem** | Items individuales de cada pedido |
| **Message** | Chat en tiempo real por pedido |
| **BillingCycle** | Ciclos de facturación para admins |
| **AdminMessage** | Mensajería entre admins y superadmin |
| **Notification** | Notificaciones del sistema por usuario |
| **Counter** | Contador global de número de pedido |

---

## 4. Roles y Permisos

### 4.1 Cliente (público, sin registro)
- Seleccionar zona geográfica
- Navegar tiendas y productos
- Agregar productos al carrito (una tienda a la vez)
- Realizar pedidos con dirección de entrega (Google Maps)
- Subir comprobante de pago
- Seguir estado del pedido en tiempo real
- Chat con el vendedor

### 4.2 Vendedor (VENDOR)
- Ver pedidos pendientes en tiempo real
- Confirmar/rechazar pedidos
- Verificar estado de pago
- Chat con clientes por pedido
- Marcar pedidos como listos para recoger
- Gestionar productos (CRUD) y categorías
- Configurar ajustes de tienda (logo, banner, dirección, tarifas de delivery)
- Acceso a analíticas de su tienda

### 4.3 Repartidor (DRIVER)
- Ver pedidos disponibles listos para recoger
- Aceptar entregas
- Navegación a la tienda (Google Maps)
- Contactar tienda por teléfono
- Marcar entregas como completadas
- Historial de entregas
- Notificaciones en tiempo real de nuevos pedidos

### 4.4 Administrador de Zona (ADMIN)
- Dashboard con estadísticas de su zona
- Gestión de tiendas en su zona
- Gestión de vendedores y repartidores
- Ver todos los pedidos de la zona
- Verificación de pagos
- Sistema de mensajería con superadmin
- Gestión de usuarios

### 4.5 Super Administrador (SUPER_ADMIN)
- Vista general de toda la plataforma
- Crear y gestionar administradores de zona
- Crear y gestionar zonas geográficas
- Sistema de facturación (billing cycles)
- Seguimiento de ingresos por zona
- Mensajería con administradores
- Estadísticas globales de la plataforma

---

## 5. Flujos Principales

### 5.1 Flujo de Pedido

```
Cliente selecciona zona → Navega tiendas → Agrega productos al carrito
    → Checkout (dirección + datos) → Pedido creado (PENDING)
        → Vendedor confirma (CONFIRMED) → Vendedor marca listo (READY)
            → Repartidor acepta (PICKED_UP) → Entrega completada (DELIVERED)
```

**Estados del pedido:**
- `PENDING` → `CONFIRMED` → `READY` → `PICKED_UP` → `DELIVERED`
- `PENDING` / `CONFIRMED` → `CANCELLED`

### 5.2 Flujo de Pago

```
Pedido creado (payment: PENDING)
    → Cliente sube comprobante (payment: UPLOADED)
        → Admin/Vendedor verifica (payment: VERIFIED)
```

**Estados de pago de delivery:**
- `PENDING` → `PAID_CASH` | `PAID_TRANSFER`

### 5.3 Flujo de Facturación (Admin ↔ SuperAdmin)

```
SuperAdmin crea ciclo de facturación (ACTIVE)
    → Fin de ciclo (PENDING_PAYMENT)
        → Admin sube comprobante de pago
            → SuperAdmin verifica (PAID)
    → Si no paga a tiempo (OVERDUE)
```

---

## 6. API Endpoints

### 6.1 Autenticación
| Método | Ruta | Descripción |
|--------|------|------------|
| POST | `/api/auth/[...nextauth]` | Login/logout via NextAuth |

### 6.2 Pedidos
| Método | Ruta | Descripción |
|--------|------|------------|
| GET | `/api/orders` | Listar pedidos (filtrado por rol/zona) |
| POST | `/api/orders` | Crear pedido (público) |
| GET | `/api/orders/[id]` | Detalle de pedido |
| PATCH | `/api/orders/[id]` | Actualizar estado |
| GET | `/api/orders/ready` | Pedidos listos para repartidores |
| POST | `/api/orders/[id]/messages` | Mensajes del chat |
| POST | `/api/orders/[id]/payment` | Subir comprobante |
| POST | `/api/orders/[id]/delivery-payment` | Pago de delivery |

### 6.3 Tiendas
| Método | Ruta | Descripción |
|--------|------|------------|
| GET | `/api/stores` | Listar tiendas (filtrado por zona) |
| POST | `/api/stores` | Crear tienda |
| GET | `/api/stores/[slug]` | Detalle con productos |
| PATCH | `/api/stores/[id]` | Actualizar tienda |

### 6.4 Productos
| Método | Ruta | Descripción |
|--------|------|------------|
| GET | `/api/products` | Listar productos |
| POST | `/api/products` | Crear producto |
| GET | `/api/products/[id]` | Detalle de producto |
| PATCH | `/api/products/[id]` | Actualizar producto |
| DELETE | `/api/products/[id]` | Eliminar producto |

### 6.5 Usuarios
| Método | Ruta | Descripción |
|--------|------|------------|
| GET | `/api/users` | Listar usuarios |
| POST | `/api/users` | Crear usuario |
| PATCH | `/api/users/[id]` | Actualizar usuario |

### 6.6 Notificaciones
| Método | Ruta | Descripción |
|--------|------|------------|
| GET | `/api/notifications` | Notificaciones del usuario |
| POST | `/api/notifications/read-all` | Marcar todas como leídas |
| PATCH | `/api/notifications/[id]` | Marcar individual como leída |

### 6.7 Estadísticas
| Método | Ruta | Descripción |
|--------|------|------------|
| GET | `/api/stats` | Stats de admin de zona |
| GET | `/api/superadmin/stats` | Stats globales |

### 6.8 Super Admin
| Método | Ruta | Descripción |
|--------|------|------------|
| GET/POST | `/api/superadmin/admins` | CRUD admins |
| PATCH/DELETE | `/api/superadmin/admins/[id]` | Gestionar admin |
| GET/POST | `/api/superadmin/zones` | Gestionar zonas |
| GET/POST | `/api/superadmin/billing` | Facturación |
| GET | `/api/superadmin/messages` | Mensajería |

### 6.9 Otros
| Método | Ruta | Descripción |
|--------|------|------------|
| GET | `/api/zones` | Listar zonas (público) |
| POST | `/api/upload` | Subir imagen a Cloudinary |
| GET/POST | `/api/admin/messages` | Mensajería de admin |

---

## 7. Funcionalidades Técnicas Clave

### 7.1 Tiempo Real (Pusher)
- Notificaciones instantáneas de nuevos pedidos a vendedores
- Actualización de estado de pedido para clientes
- Alertas a repartidores cuando un pedido está listo
- Chat en vivo entre cliente y vendedor
- Canales organizados por zona, tienda, pedido y rol

### 7.2 Progressive Web App (PWA)
- Service Worker registrado para funcionamiento offline
- Prompt de instalación en dispositivos móviles
- Manifest con iconos configurados
- Diseño mobile-first responsive

### 7.3 Gestión de Estado (Zustand)
- **Cart Store**: Items del carrito, tienda seleccionada, totales, persistido en localStorage
- **Active Order Store**: Tracking del pedido activo del cliente

### 7.4 Integración de Mapas (Google Maps)
- Selector de ubicación para dirección de entrega en checkout
- Navegación para repartidores hacia la tienda
- Definición de zonas geográficas (lat, lng, radio)

### 7.5 Sistema de Imágenes (Cloudinary)
- Upload de logos y banners de tiendas
- Fotos de productos
- Comprobantes de pago
- Optimización y CDN automático

### 7.6 WhatsApp Integration
- Comunicación de pedidos vía WhatsApp API
- Notificaciones a clientes sobre estado de pedido

---

## 8. Seguridad

| Aspecto | Implementación |
|---------|---------------|
| Autenticación | NextAuth.js con JWT |
| Contraseñas | bcryptjs (salt rounds: 12) |
| Rutas protegidas | Middleware de sesión en dashboard |
| API protegida | `getServerSession()` en cada endpoint |
| Control de acceso | Verificación de rol por endpoint |
| Datos sensibles | Variables de entorno (.env) |

---

## 9. Infraestructura y Deploy

| Servicio | Proveedor |
|----------|----------|
| Hosting/App | Vercel (Next.js) |
| Base de datos | PostgreSQL en Render.com |
| Imágenes/CDN | Cloudinary |
| Tiempo real | Pusher |
| Mapas | Google Cloud Platform |

### Variables de entorno requeridas
```
DATABASE_URL          # PostgreSQL connection string
NEXTAUTH_SECRET       # JWT signing secret
NEXTAUTH_URL          # App URL para callbacks
PUSHER_APP_ID         # Pusher app ID
PUSHER_KEY            # Pusher public key
PUSHER_SECRET         # Pusher secret key
PUSHER_CLUSTER        # Pusher cluster region
CLOUDINARY_CLOUD_NAME # Cloudinary cloud name
CLOUDINARY_API_KEY    # Cloudinary API key
CLOUDINARY_API_SECRET # Cloudinary API secret
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY # Google Maps key
```

---

## 10. Scripts Disponibles

| Comando | Descripción |
|---------|------------|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de producción (genera Prisma + Next.js) |
| `npm run start` | Servidor de producción |
| `npm run lint` | Linting del código |
| `npm run db:push` | Sincronizar schema con la BD |
| `npm run db:studio` | Editor visual de la BD |
| `npm run db:seed` | Cargar datos de ejemplo |
| `npm run reset-password` | Resetear contraseña de usuario |
| `npm run list-users` | Listar usuarios del sistema |
| `npm run db:clean` | Limpiar base de datos |

---

## 11. Métricas y KPIs Sugeridos

| Métrica | Descripción |
|---------|------------|
| Pedidos por zona/día | Volumen de actividad por zona |
| Tiempo promedio de entrega | Desde CONFIRMED hasta DELIVERED |
| Tasa de cancelación | Pedidos cancelados / total |
| Revenue por zona | Ingresos de delivery por zona |
| Tiendas activas | Tiendas con pedidos en últimos 7 días |
| Repartidores activos | Drivers con entregas en últimos 7 días |
| Tasa de verificación de pago | Pagos verificados vs pendientes |

---

## 12. Limitaciones Actuales y Áreas de Mejora

### Limitaciones identificadas
1. **Sin registro de clientes**: Los clientes hacen pedidos sin crear cuenta
2. **Pago manual**: No hay pasarela de pago integrada (solo comprobante)
3. **Sin sistema de calificaciones**: No hay reviews de tiendas o repartidores
4. **Sin promociones/cupones**: No existe sistema de descuentos
5. **Carrito de una sola tienda**: No se pueden combinar productos de múltiples tiendas

### Mejoras potenciales
1. **Registro de clientes** con historial de pedidos y direcciones guardadas
2. **Integración con pasarelas de pago** (Stripe, MercadoPago, PayPal)
3. **Sistema de calificaciones y reseñas** para tiendas y repartidores
4. **Motor de promociones** (cupones, descuentos por primera compra, etc.)
5. **Tracking en mapa en tiempo real** de la ubicación del repartidor
6. **Notificaciones push** nativas del navegador
7. **Sistema de reportes exportables** (CSV/PDF) para admins
8. **Panel de analíticas avanzadas** con gráficos históricos
9. **Soporte multi-idioma** (i18n)
10. **Tests automatizados** (unit, integration, e2e)

---

*Documento generado automáticamente a partir del análisis del código fuente del proyecto In House Delivery.*
