# 📜 Scripts de Utilidad

## 🔐 Resetear Contraseña

Resetea la contraseña de cualquier usuario de forma interactiva.

```bash
npm run reset-password
```

O directamente:

```bash
npx tsx scripts/reset-password.ts
```

### Cómo usar:

1. El script mostrará una lista de todos los usuarios
2. Selecciona el usuario por número o email
3. Confirma que es el usuario correcto
4. Ingresa la nueva contraseña (mínimo 6 caracteres)
5. Confirma la contraseña
6. ¡Listo! La contraseña se actualizará en la base de datos

### Ejemplo:

```
📋 USUARIOS DISPONIBLES:
================================================================================
1. 👑 Luis Veliz                        lveliz213@hotmail.com              (SUPER_ADMIN)
2. 🛡️ prueba                            prueba@prueba.com                  (ADMIN)
...

👉 Ingresa el número del usuario o el email: 1

✅ Usuario seleccionado:
   👤 Nombre: Luis Veliz
   📧 Email: lveliz213@hotmail.com
   🎭 Rol: SUPER_ADMIN

¿Deseas continuar con este usuario? (s/n): s

🔑 Ingresa la nueva contraseña:
   (La contraseña debe tener al menos 6 caracteres)
   Nueva contraseña: ********
   Confirma la contraseña: ********

⏳ Actualizando contraseña...
✅ Contraseña actualizada exitosamente!
```

---

## 👥 Listar Usuarios

Lista todos los usuarios registrados en la base de datos.

```bash
npm run list-users
```

O directamente:

```bash
npx tsx scripts/list-users.ts
```

---

**Nota:** Asegúrate de tener configurada la variable de entorno `DATABASE_URL` en tu archivo `.env`.
