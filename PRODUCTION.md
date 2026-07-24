# Pendientes para producción

El frontend ya utiliza la API HTTP y la persistencia real del backend. Antes de exponerlo públicamente deben completarse o validarse estos puntos operativos.

## Backend HTTP requerido

- [x] Crear autenticación HTTP para las rutas administrativas y de conocimiento.
- [x] Exponer contexto con organización, rol, áreas y permisos efectivos.
- [x] Exponer listado, búsqueda, lectura, creación, actualización y archivado de notas.
- [x] Exponer enlaces entrantes, salientes y pendientes; el frontend deriva el grafo de notas autorizadas.
- [x] Exponer historial de versiones.
- [ ] Implementar restauración de una versión anterior.
- [x] Exponer usuarios, invitaciones y memberships para administradores de tenant.
- [x] Mantener `base_version` y responder `409` para resolver conflictos.
- [x] Aplicar redacción de wikilinks restringidos antes de entregar cuerpos al frontend.

## Sesión y seguridad

- [x] Sustituir el token accesible a JavaScript por una cookie `httpOnly` configurable como `secure` y `sameSite`.
- [x] Implementar login, logout y expiración de sesión en el backend.
- [ ] Implementar renovación silenciosa de sesión si se necesita una duración deslizante.
- [x] Permitir restringir CORS a los dominios declarados en `FRONTEND_URLS`.
- [x] Validar el origen de mutaciones autenticadas con cookie.
- [ ] Añadir rate limiting al login y auditoría de operaciones sensibles.
- [x] Verificar tenant, rol y permisos de área en el servidor.

## Sustitución del mock

- [x] Crear `src/services/httpApi.ts` con el mismo contrato público de `mockApi.ts`.
- [ ] Configurar `VITE_API_URL` con la URL pública definitiva de Railway.
- [x] Sustituir la persistencia local por el backend real.
- [x] Mapear el envelope real del interceptor de respuestas de NestJS.
- [ ] Añadir estados de reintento, offline y errores por operación.
- [ ] Conectar un proveedor de correo y un flujo de aceptación para invitaciones.

## Datos y experiencia

- [ ] Implementar adjuntos e imágenes mediante almacenamiento de objetos; nunca guardar archivos grandes en el bundle.
- [ ] Definir reglas definitivas para tags, alias, Mermaid y embeds.
- [ ] Implementar paginación o virtualización para organizaciones con muchas notas.
- [ ] Calcular el grafo en servidor para colecciones grandes y aplicar filtros de permisos antes de responder.
- [ ] Añadir restauración de notas archivadas y versiones.
- [ ] Cargar editor y grafo bajo demanda para reducir el bundle inicial (el build del MVP advierte un chunk de aproximadamente 1.5 MB).

## Railway

- [x] Crear servicio estático/frontend con `pnpm build` y servir `dist/`.
- [x] Servir `dist/` con el servidor Node incluido y fallback SPA hacia `index.html`.
- [x] Usar `/api/v1` como URL de API en producción para mantener una sesión first-party.
- [ ] Definir `VITE_API_URL=/api/v1` y `API_PROXY_TARGET=https://<backend>` en Railway.
- [ ] Definir `FRONTEND_URL=https://<frontend>` en el backend.
- [ ] Usar dominios HTTPS estables para frontend y backend.
- [ ] Configurar health checks, logs y alertas de ambos servicios.
- [x] Incluir configuración base de Railway y health checks para ambos servicios.
- [ ] Ejecutar migraciones o validaciones de índices Mongo antes del despliegue.

## Calidad mínima adicional

- [ ] Pruebas E2E de login, lectura, edición, conflicto y permisos.
- [ ] Pruebas de integración contra la API real.
- [ ] Auditoría de accesibilidad con teclado y lector de pantalla.
- [ ] Monitoreo de errores de frontend y trazabilidad con el backend.
