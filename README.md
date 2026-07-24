# Knowledge Hub Frontend

MVP en React, TypeScript y Tailwind para navegar, editar y conectar notas Markdown por organización y área.

## Ejecutar

```bash
pnpm install
pnpm dev
```

La aplicación abre en `http://localhost:5173` y se conecta por defecto a `http://localhost:3000/v1`. Usa un usuario real creado en `knowledge-business`.

Para desarrollo local puedes configurar otra API creando `.env`:

```env
VITE_API_URL=http://localhost:3000/v1
```

## Capacidades del MVP

- ingreso automático a la organización asociada al usuario;
- áreas con permisos `read`, `write` y `manage`;
- explorador, búsqueda y pestañas de notas;
- editor Markdown con vista previa y autocompletado de `[[wikilinks]]`;
- autoguardado, guardado manual, versiones y comparación de conflictos;
- sensibilidad y visibilidad por área;
- backlinks, enlaces salientes y enlaces pendientes;
- grafo local y de área, con nodos diferenciados para áreas, índices y registros;
- administración de usuarios y accesos;
- interfaz oscura y adaptación básica para móvil.

## Arquitectura de integración

La UI consume `src/services/httpApi.ts`, usa cookies de sesión `httpOnly` y nunca se conecta directamente a MongoDB. En producción, el servidor del frontend expone `/api/*` como proxy hacia el backend para mantener la cookie en el mismo dominio y evitar el bloqueo de cookies de terceros en navegadores móviles. `src/services/mockApi.ts` permanece disponible únicamente para desarrollo con `VITE_USE_MOCKS=true`.

Los modelos de `src/types.ts` siguen la estructura actual de `knowledge-business`: organización/tenant único, memberships por área, notas Markdown, sensibilidad y versión optimista.

## Verificación

```bash
pnpm test
pnpm lint
pnpm build
```

Consulta [PRODUCTION.md](./PRODUCTION.md) para el trabajo pendiente antes de desplegar en Railway.

## Railway

Configura el directorio raíz del servicio como `knowledge-frontend`. En el servicio frontend de Railway define:

```env
VITE_API_URL=/api/v1
API_PROXY_TARGET=https://tu-backend.up.railway.app
```

`API_PROXY_TARGET` no debe incluir `/v1`. En el servicio backend define `FRONTEND_URL` con la URL HTTPS exacta del frontend. Railway utilizará `railway.json`; el servidor incluido respeta `PORT`, aplica fallback para rutas SPA y reenvía `/api/*` al backend.
# knowledge-business-fe
