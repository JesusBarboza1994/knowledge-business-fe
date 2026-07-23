import type { Area, Member, Note, Session } from '../types'

export const mockSession: Session = {
  userId: 'u-1',
  email: 'jesus@mente2.com',
  name: 'Jesús Barboza',
  tenant: 'mente2',
  organizationName: 'MenteMente',
  role: 'admin',
}

export const initialAreas: Area[] = [
  {
    key: 'develop',
    name: 'Desarrollo',
    description: 'Arquitectura, servicios y decisiones técnicas.',
    color: '#b7e66b',
    access: 'manage',
    noteCount: 6,
  },
  {
    key: 'product',
    name: 'Producto',
    description: 'Visión, flujos y especificaciones del producto.',
    color: '#76b7ff',
    access: 'write',
    noteCount: 4,
  },
  {
    key: 'operations',
    name: 'Operaciones',
    description: 'Procesos, seguimiento e incidentes operativos.',
    color: '#e9a86f',
    access: 'read',
    noteCount: 2,
  },
]

const now = '2026-07-22T14:30:00.000Z'

export const initialNotes: Note[] = [
  {
    id: 'n-dev-index', area: 'develop', slug: 'develop-index', title: 'Desarrollo — Índice', kind: 'index',
    sensitivity: 'internal_area', visibleTo: ['develop'], version: 5, updatedAt: now, updatedBy: 'Jesús Barboza', archived: false,
    body: `# Desarrollo

Punto de entrada para la arquitectura y los flujos técnicos de Knowledge Hub.

## Fundamentos
- [[Arquitectura actual]] — componentes y responsabilidades principales.
- [[Modelo de datos]] — organizaciones, áreas, usuarios y notas.
- [[Autorización actual]] — permisos y límites vigentes.

## Experiencia de conocimiento
- [[Grafo de enlaces]] — conexiones entre notas y backlinks.
- [[Búsqueda híbrida]] — búsqueda textual y semántica.

## Trabajo pendiente
- [[API HTTP de conocimiento]]
`,
    versions: [{ version: 4, title: 'Desarrollo — Índice', body: '# Desarrollo\n\n- [[Arquitectura actual]]\n- [[Modelo de datos]]', editedAt: '2026-07-20T16:10:00.000Z', editedBy: 'Ana Torres' }],
  },
  {
    id: 'n-arch', area: 'develop', slug: 'arquitectura-actual', title: 'Arquitectura actual', kind: 'note',
    sensitivity: 'public_org', visibleTo: [], version: 3, updatedAt: '2026-07-22T12:20:00.000Z', updatedBy: 'Ana Torres',
    body: `# Arquitectura actual

Knowledge Hub está compuesto por un servicio **NestJS**, MongoDB para persistencia y una interfaz MCP para clientes inteligentes.

## Componentes

| Componente | Responsabilidad |
| --- | --- |
| Knowledge Service | Lectura, escritura y permisos |
| Parser Service | Extrae encabezados y [[Grafo de enlaces]] |
| Name Index | Resuelve slugs, alias y backlinks |

## Decisiones

El navegador consumirá en el futuro la [[API HTTP de conocimiento]]. El MVP utiliza un adaptador local con el mismo contrato esperado.
`,
    versions: [{ version: 2, title: 'Arquitectura actual', body: '# Arquitectura actual\n\nServicio NestJS conectado a MongoDB.', editedAt: '2026-07-18T09:00:00.000Z', editedBy: 'Jesús Barboza' }],
  },
  {
    id: 'n-data', area: 'develop', slug: 'modelo-de-datos', title: 'Modelo de datos', kind: 'note',
    sensitivity: 'internal_area', visibleTo: ['develop'], version: 2, updatedAt: '2026-07-21T18:45:00.000Z', updatedBy: 'Jesús Barboza',
    body: `# Modelo de datos

Cada nota pertenece a una organización y un área. El campo \`version\` permite detectar conflictos de edición.

## Entidades
- Organization
- Area
- User y memberships
- Note y NoteVersion

Ver también [[Autorización actual]] y [[Arquitectura actual]].`,
    versions: [],
  },
  {
    id: 'n-auth', area: 'develop', slug: 'autorizacion-actual', title: 'Autorización actual', kind: 'note',
    sensitivity: 'confidential', visibleTo: ['develop'], version: 4, updatedAt: '2026-07-21T10:15:00.000Z', updatedBy: 'Ana Torres',
    body: `# Autorización actual

Los accesos por área son \`read\`, \`write\` y \`manage\`.

- **read**: consulta y navegación.
- **write**: creación y edición.
- **manage**: administración y archivado.

La evolución se detalla en [[Permisos objetivo]].`,
    versions: [],
  },
  {
    id: 'n-graph', area: 'develop', slug: 'grafo-de-enlaces', title: 'Grafo de enlaces', kind: 'note',
    sensitivity: 'public_org', visibleTo: [], version: 2, updatedAt: '2026-07-20T15:05:00.000Z', updatedBy: 'Jesús Barboza',
    body: `# Grafo de enlaces

El grafo combina enlaces salientes, backlinks y relaciones con áreas. Cada área utiliza un color propio.

Los enlaces a [[Notas que todavía no existen]] se conservan como pendientes y aparecen con borde discontinuo.`,
    versions: [],
  },
  {
    id: 'n-log', area: 'develop', slug: 'develop-log', title: 'Desarrollo — Registro', kind: 'log',
    sensitivity: 'internal_area', visibleTo: ['develop'], version: 8, updatedAt: now, updatedBy: 'Sistema',
    body: `# Registro de Desarrollo

- 2026-07-18 NOTE: se documentó [[Arquitectura actual]].
- 2026-07-20 NOTE: se añadió [[Grafo de enlaces]].
- 2026-07-22 NOTE: se inició el frontend de Knowledge Hub.`,
    versions: [],
  },
  {
    id: 'n-prod-index', area: 'product', slug: 'product-index', title: 'Producto — Índice', kind: 'index',
    sensitivity: 'public_org', visibleTo: [], version: 3, updatedAt: now, updatedBy: 'María Luna',
    body: `# Producto

## Visión
- [[Knowledge Hub]]
- [[Experiencia de edición]]
- [[Navegación por conocimiento]]

## Dependencias
- [[Arquitectura actual]]`,
    versions: [],
  },
  {
    id: 'n-hub', area: 'product', slug: 'knowledge-hub', title: 'Knowledge Hub', kind: 'note',
    sensitivity: 'public_org', visibleTo: [], version: 6, updatedAt: '2026-07-22T11:05:00.000Z', updatedBy: 'María Luna',
    body: `# Knowledge Hub

Un espacio compartido para capturar, conectar y mantener el conocimiento vivo de una organización.

## Principios
1. Navegar antes que buscar.
2. Contexto visible en cada conexión.
3. Markdown como formato portable.

Se apoya en la [[Arquitectura actual]] y la [[Experiencia de edición]].`,
    versions: [],
  },
  {
    id: 'n-edit', area: 'product', slug: 'experiencia-de-edicion', title: 'Experiencia de edición', kind: 'note',
    sensitivity: 'internal_area', visibleTo: ['product'], version: 1, updatedAt: '2026-07-19T10:00:00.000Z', updatedBy: 'María Luna',
    body: `# Experiencia de edición

El editor ofrece Markdown, vista previa, autocompletado de wikilinks y guardado automático con control de versiones.

Cuando hay un conflicto se compara la versión local con la remota antes de decidir.`,
    versions: [],
  },
  {
    id: 'n-nav', area: 'product', slug: 'navegacion-por-conocimiento', title: 'Navegación por conocimiento', kind: 'note',
    sensitivity: 'public_org', visibleTo: [], version: 1, updatedAt: '2026-07-18T10:00:00.000Z', updatedBy: 'María Luna',
    body: `# Navegación por conocimiento

La navegación usa índices curados, búsqueda, pestañas y el [[Grafo de enlaces]].`, versions: [],
  },
  {
    id: 'n-ops-index', area: 'operations', slug: 'operations-index', title: 'Operaciones — Índice', kind: 'index',
    sensitivity: 'internal_area', visibleTo: ['operations'], version: 1, updatedAt: now, updatedBy: 'Carlos Ruiz',
    body: `# Operaciones

- [[Manual de incidentes]]`, versions: [],
  },
  {
    id: 'n-incidents', area: 'operations', slug: 'manual-de-incidentes', title: 'Manual de incidentes', kind: 'note',
    sensitivity: 'internal_area', visibleTo: ['operations'], version: 1, updatedAt: now, updatedBy: 'Carlos Ruiz',
    body: `# Manual de incidentes

Guía operativa para clasificar, escalar y resolver incidentes.`, versions: [],
  },
]

export const initialMembers: Member[] = [
  { id: 'u-1', name: 'Jesús Barboza', email: 'jesus@mente2.com', role: 'admin', status: 'active', memberships: { develop: 'manage', product: 'manage', operations: 'manage' } },
  { id: 'u-2', name: 'Ana Torres', email: 'ana@mente2.com', role: 'member', status: 'active', memberships: { develop: 'write', product: 'read' } },
  { id: 'u-3', name: 'María Luna', email: 'maria@mente2.com', role: 'member', status: 'active', memberships: { develop: 'read', product: 'manage' } },
  { id: 'u-4', name: 'Carlos Ruiz', email: 'carlos@mente2.com', role: 'member', status: 'invited', memberships: { operations: 'write' } },
]
