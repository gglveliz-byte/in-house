# 🚀 Guía de Despliegue de Producción: BlueExpress

Esta guía detalla los pasos exactos para subir tu aplicación **BlueExpress** a internet de forma permanente, segura (HTTPS) y gratuita, permitiendo que cualquier persona pueda acceder, pedir comida e instalar la aplicación PWA directamente en su celular.

---

## 🛠️ Requisitos Previos

1. **Base de Datos en la Nube:**
   - Si ya tienes tu base de datos PostgreSQL activa en **Neon** (o Supabase), copia la cadena de conexión de producción. Debe verse algo así:
     `postgresql://user:password@ep-cool-pool-123456.us-east-2.aws.neon.tech/neondb?sslmode=require`

2. **Pusher (Tiempo Real):**
   - Asegúrate de tener a la mano tus credenciales de Pusher (App ID, Key, Secret, Cluster).

---

## 🚀 Despliegue en Vercel (Paso a Paso)

Vercel es la plataforma ideal y oficial para Next.js. El despliegue toma menos de 2 minutos:

### Paso 1: Crear Proyecto en Vercel
1. Entra a [vercel.com](https://vercel.com) e inicia sesión con tu cuenta de **GitHub**.
2. Haz clic en **"Add New"** > **"Project"**.
3. Busca tu repositorio `gglveliz-byte/in-house` (in-house) y haz clic en **"Import"**.

### Paso 2: Rellenar las Variables de Entorno
En la sección **"Environment Variables"** de Vercel, agrega exactamente las siguientes claves y valores que requiere la app:

| Nombre de la Variable | Descripción / Ejemplo |
|---|---|
| `DATABASE_URL` | Tu URL de conexión segura de Neon (PostgreSQL). |
| `NEXTAUTH_SECRET` | Una clave aleatoria segura (ej. puedes generarla o poner una frase larga como `blueexpress_secure_production_secret_key_123`). |
| `NEXTAUTH_URL` | Tu URL final de producción (ej. `https://blue-express.vercel.app` o tu dominio personalizado). *Nota: Si aún no la sabes, puedes dejarla en blanco al inicio y Vercel la autogenerará.* |
| `NEXT_PUBLIC_PUSHER_KEY` | La llave pública de tu cuenta de Pusher. |
| `NEXT_PUBLIC_PUSHER_CLUSTER` | El cluster asignado de Pusher (ej. `us2`, `sa1`). |
| `PUSHER_APP_ID` | Tu App ID privado de Pusher. |
| `PUSHER_SECRET` | Tu Secret ID privado de Pusher. |

### Paso 3: Lanzar Despliegue
1. Haz clic en el botón azul **"Deploy"**.
2. Vercel detectará la configuración de Next.js, descargará las dependencias, ejecutará `prisma generate` de forma automática para estructurar los modelos, compilará el código y ¡listo!
3. En menos de 2 minutos obtendrás una URL segura del tipo `https://tu-proyecto.vercel.app`.

---

## 📱 Cómo Instalar la App Móvil (PWA) en Producción

Una vez que tu sitio esté desplegado en la URL de Vercel (HTTPS):
1. Abre el navegador de tu celular (Chrome en Android, Safari en iOS).
2. Ingresa a `https://tu-proyecto.vercel.app/descargar` (o la ruta raíz `/` y dale a "Descargar App").
3. **En Android:** Te saldrá un botón directo flotante que dice **"Instalar Aplicación"**. Tócalo y la aplicación se añadirá de forma nativa a tu pantalla de inicio en 2 segundos.
4. **En iOS:** Presiona el botón de compartir de Safari (flecha hacia arriba) y selecciona **"Agregar a la pantalla de inicio"**.

---

### ¡Tu aplicación está lista para el mercado global! 🏁
