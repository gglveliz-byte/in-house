# QA Checklist

Use this checklist for every PR and release to ensure quality and compliance.

- [ ] Requisitos: la implementación cumple lo descrito en `docs/READMEPLAN` y PRD.
- [ ] Rutas: ninguna ruta existente eliminada o modificada sin compatibilidad.
- [ ] Diseño: solo mejoras o ajustes menores que preservan la UI.
- [ ] Tests: pruebas unitarias e integración añadidas/actualizadas.
- [ ] Linter y type-check: pasar linters y `tsc`.
- [ ] Seguridad: revisar dependencias y manejo de datos sensibles.
- [ ] Performance: revisar consultas críticas (orders, stores) y optimizar índices.
- [ ] DB: añadir migraciones y plan de backfill si aplica.
- [ ] Accesibilidad básica: botones, labels, focus states.
- [ ] Documentación: `docs/READMEPLAN`, `README.md` actualizado.
