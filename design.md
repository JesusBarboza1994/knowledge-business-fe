# Design — KnowHub

Sistema de diseño bloqueado para esta app. Cualquier rediseño de pantalla lee
este archivo antes de emitir código. No se regenera por pantalla: se extiende o
se enmienda aquí cuando el sistema necesita crecer.

La regla de diversificación de Hallmark está **invertida** en este proyecto: las
pantallas deben compartir el sistema, no diferenciarse entre sí.

## Género

**modern-minimal** — herramienta de trabajo densa, oscura, para uso prolongado.
No es una landing: la función carga la pantalla, no la decoración.

## Posición de diseño

**El documento se compone como documento; la aplicación se compone como taller.**

Es la única decisión de la que cuelga todo lo demás. La superficie de lectura
(`.markdown-body`) usa serif, medida controlada e interlineado de lectura: una
nota se lee como algo escrito, no como el contenido de un formulario. El resto
del chrome —barra lateral, pestañas, inspector, administración— usa un grotesco
neutro, denso y funcional. La tensión entre las dos voces es la marca.

## Familias de macroestructura

- **Pantallas de aplicación** (workspace, grafo, administración): **Workbench**.
  Paneles fijos, contenido central desplazable, sin enriquecimiento.
  Knobs que pueden variar: número de paneles, lado del inspector, densidad de filas.
- **Pantallas de acceso** (login): **Split Studio**. Diptico: argumento a la
  izquierda, formulario a la derecha.

## Tema

Ancla de tono: **128°** (verde musgo). Todo neutro está teñido hacia esa ancla —
ningún gris tiene croma cero. Los valores viven en `src/index.css` `:root`.

| Token | OKLCH | Rol |
| --- | --- | --- |
| `--sunken` | `17.0% 0.008 128` | Hundido: campos, lienzo del grafo, insertos |
| `--ink` | `19.5% 0.009 128` | Base: fondo de app y editor |
| `--panel` | `22.5% 0.011 128` | Panel: barra lateral, inspector, tarjetas, modales |
| `--raised` | `26.5% 0.014 128` | Elevado: hover, chips activos, emergentes |
| `--line` | `30.5% 0.016 128` | Divisiones decorativas |
| `--line-strong` | `36.0% 0.018 128` | Bordes de hover y de superficie flotante |
| `--control` | `54.0% 0.020 128` | **Límite de control** — ≥3:1 sobre las 4 superficies (WCAG 1.4.11) |
| `--fg` | `94.0% 0.010 128` | Texto primario |
| `--fg-2` | `80.0% 0.014 128` | Texto secundario |
| `--muted` | `68.5% 0.019 128` | Texto terciario, rótulos, marcadores |
| `--accent` | `92.0% 0.012 128` | Acento único — **hueso, sin croma** |
| `--accent-ink` | `20.0% 0.008 128` | Texto sobre relleno de acento |
| `--focus` | `96.0% 0.014 128` | Anillo de foco: lo más claro del sistema |
| `--danger` / `--danger-ink` | `72.0% 0.150 22` / `22.0% 0.060 25` | Destructivo |
| `--warn` | `78.0% 0.110 78` | Restringido, conflicto, pendiente |

**Elevación por claridad, nunca por sombra de color.** Cada nivel sube ~3% de
luminosidad. Prohibido el halo de acento alrededor de tarjetas.

**El acento es neutro a propósito.** No hay tono de marca en el chrome: el único
color de la aplicación son los puntos de área, que llegan como dato. Eso obliga
a que la señal la lleve la forma, no el matiz — y es lo que hace que la interfaz
no se parezca a ninguna plantilla.

Presupuesto: ≤5% del área de cualquier vista. El hueso marca el botón primario,
el anillo de foco y el enlace. No rellena superficies.

### Señal sin tono

Con un acento neutro, estos estados no pueden distinguirse por color. Cada uno
declara de qué vive:

| Estado | Portador de la señal |
| --- | --- |
| Fila activa | Superficie elevada + regla de selección de 2px + peso 500 |
| Enlace | Claridad (92% frente a 80% del cuerpo) + subrayado de 1px |
| Enlace al pasar | El subrayado engorda a 2px |
| Enlace pendiente | Atenuado + subrayado punteado |
| Enlace restringido | `--warn` + subrayado doble |
| Pestaña activa | Superficie base + regla superior de 2px |
| Botón primario | Inversión: relleno claro, tinta oscura |
| Foco | Contorno de 2px en `--focus`, instantáneo |

El punteado significa **pendiente** en todo el producto. No usarlo como recurso
decorativo en ningún sitio.

**Contraste verificado:** los 25 pares texto/fondo del sistema pasan 4.5:1;
bordes de control y anillo de foco pasan 3:1. Reverificar al mover cualquier `L`.

Los colores de área (`#b7e66b`, `#76b7ff`, `#e9a86f`) son **datos**, no tokens:
identifican áreas de conocimiento y llegan desde el backend. Con el acento
neutro son la única fuente de color de la aplicación, y por eso leen como
información en vez de como decoración.

## Tipografía

Tres familias, el techo de la regla 2+1.

| Rol | Familia | Dónde |
| --- | --- | --- |
| **Documento** | Newsreader 400/500/600 | `.markdown-body` y sus encabezados, `h1`–`h4`, título de nota, `.wordmark` |
| **Aplicación** | Geist 400/500/600 | Todo el chrome: filas, pestañas, rótulos, botones, formularios, tablas |
| **Identificador** | IBM Plex Mono 400/500 | Un solo rol: cadenas legibles por máquina — código, `kbd`, clave de área |

Todos los encabezados son **romanos**. Nunca cursiva en display: el énfasis se
lleva con peso, con el acento o con un subrayado dibujado.

**Escala 1.25 desde 16px. Piso duro en 12px** — no existe utilidad menor, ni en
Tailwind ni en CSS. Nada en la interfaz baja de `--text-2xs`.

```
--text-2xs   12px   rótulos, insignias, metadatos
--text-xs    13px   UI densa: filas, pestañas, inspector
--text-sm    14px   UI por defecto, botones, etiquetas
--text-md    16px   campos de formulario (también evita el zoom de iOS)
--text-prose 17px   superficie de lectura
--text-lg    20px   título de nota, h2 de modal
--text-xl    25px   h1 de sección
--text-2xl   31px   h1 de documento
--text-display  clamp(2.25rem, 3.5vw + 1.25rem, 3.25rem)
```

Interlineado: display 1.12 · encabezado 1.25 · UI 1.45 · prosa 1.70.
Medida de lectura: `--measure: 68ch` **en el contenedor, nunca en cada hijo**.
`ch` es relativo al `font-size` del propio elemento: puesta en los hijos, un h1
y un párrafo resuelven anchos distintos y cada uno arranca en una `x` diferente.
Tracking de rótulo en versalitas: `0.1em`. Números tabulares en toda columna de
cifras (`.count-badge`, `.graph-count`, tablas de markdown).

## Espaciado

Escala de 4pt con nombres semánticos, en `src/index.css`. Las pantallas usan
tokens (`var(--space-md)`), nunca valores crudos.

```
3xs 4 · 2xs 8 · xs 12 · sm 16 · md 24 · lg 32 · xl 48 · 2xl 72
```

Radios: `xs 4 · sm 6 · md 8 · lg 12 · xl 18 · pill 999`.
Dimensiones de armazón: `--sidebar-w 288px · --inspector-w 296px · --bar-h 64px`.

## Movimiento

- Easings nombrados: `--ease-out: cubic-bezier(0.16, 1, 0.3, 1)`,
  `--ease-in-out: cubic-bezier(0.65, 0, 0.35, 1)`. Nunca el `ease` del navegador,
  nunca rebote ni sobreimpulso en estados de UI.
- Duraciones: `--dur-fast 120ms` (color y fondo), `--dur-short 200ms` (espacial).
- Solo se animan `transform`, `opacity` y color. Nunca `width`, `height`,
  `margin`, `padding`, `top` o `left`.
- **Nunca `transition: all`.** Toda transición nombra sus propiedades.
- `prefers-reduced-motion: reduce` colapsa todo a ≤0.01ms y detiene el spinner.
- El anillo de foco **aparece instantáneo**: no se transiciona nunca.

## Estados e interacción

- Anillo único: `:focus-visible { outline: 2px solid var(--focus); outline-offset: 2px }`.
  Está prohibido `outline: none` o `box-shadow: none` en `:focus` sin reemplazo visible.
- Altura base compartida de controles: **44px**. Un campo y el botón que lo
  acompaña miden lo mismo.
- Deshabilitado se señala por tres canales: `opacity`, `cursor: not-allowed` y el
  atributo nativo.
- Éxito silencioso. Los avisos se reservan para fallos y para efectos invisibles.

## Voz de los botones

- **Primario** (`.primary-button`): relleno de acento, texto `--accent-ink`,
  `--radius-md`, 44px, `whitespace-nowrap`. Uno por pantalla.
- **Secundario** (`.secondary-button`): borde `--control` sobre `--panel`.
- **Destructivo** (`.danger-button`): relleno `--danger`, texto `--danger-ink`.
- Etiquetas en imperativo y cortas: «Crear nota», «Guardar cambios». Nunca
  envuelven a dos líneas en ningún ancho.

## Lo que toda pantalla comparte

El logotipo, las tres familias tipográficas y sus roles, el acento y su
presupuesto, la escala de tipo con su piso de 12px, la escala de 4pt, la voz de
los botones, el anillo de foco.

## Lo que puede variar

La macroestructura dentro de su familia, la densidad de filas, la disposición de
paneles. Nunca el tema, nunca la pareja tipográfica, nunca el acento.

## Sin enriquecimiento

Esta app **no lleva** ilustración de héroe, vídeo, fondo abstracto ni orbes.
La única imagen del sistema es el logotipo. El grafo de conocimiento es el
activo visual del producto: si una pantalla necesita una imagen, se usa el grafo.

## Estado

Aplicado a todo el código:

- Sistema de tokens completo. Cero valores de color literales en `src/`.
- Pareja tipográfica y escala con piso de 12px.
- Escala de 4pt, radios, easings, duraciones, escala de `z-index`.
- `prefers-reduced-motion` y anillo de foco global.
- Acento hueso y los portadores de señal de la tabla de arriba.
- Login recompuesto: un bloque centrado, marca anclada y un fragmento de grafo
  dibujado a mano que ocupa el ancho que antes era aire.

Pendiente del audit (fuera del alcance de esta pasada):

- Podar los rótulos en versalitas del chrome (quedan ~20; el objetivo es 2).
- Estados 8/8 por componente interactivo.
- Nombre de producto único (conviven Knowvault / KnowHub / Know Hub).
- Archivado optimista con deshacer en lugar del modal de confirmación.

## Exports

### tokens.css

Los tokens canónicos viven en `src/index.css` `:root`. Se declaran en dos capas:
`--c-*` guarda los canales OKLCH sin envolver, para que Tailwind pueda componer
opacidad (`bg-panel/40`); el token resuelto (`--panel`) es para CSS plano.

```css
:root {
  --c-sunken: 17.0% 0.008 128;   --sunken: oklch(var(--c-sunken));
  --c-ink:    19.5% 0.009 128;   --ink:    oklch(var(--c-ink));
  --c-panel:  22.5% 0.011 128;   --panel:  oklch(var(--c-panel));
  --c-raised: 26.5% 0.014 128;   --raised: oklch(var(--c-raised));
  --c-line:   30.5% 0.016 128;   --line:   oklch(var(--c-line));
  --c-control:54.0% 0.020 128;   --control:oklch(var(--c-control));
  --c-fg:     94.0% 0.010 128;   --fg:     oklch(var(--c-fg));
  --c-muted:  68.5% 0.019 128;   --muted:  oklch(var(--c-muted));
  --c-accent: 92.0% 0.012 128;   --accent: oklch(var(--c-accent));
  --c-focus:  96.0% 0.014 128;   --focus:  oklch(var(--c-focus));

  --font-display: 'Newsreader', ui-serif, Georgia, serif;
  --font-body:    'Geist', ui-sans-serif, system-ui, sans-serif;
  --font-mono:    'IBM Plex Mono', ui-monospace, monospace;

  --space-3xs: .25rem; --space-2xs: .5rem;  --space-xs: .75rem;
  --space-sm:  1rem;   --space-md: 1.5rem;  --space-lg: 2rem;
  --space-xl:  3rem;   --space-2xl: 4.5rem;

  --ease-out: cubic-bezier(0.16, 1, 0.3, 1);
  --dur-fast: 120ms; --dur-short: 200ms;
  --radius-md: 8px; --radius-lg: 12px; --radius-pill: 999px;
}
```

### Tailwind

`tailwind.config.js` no contiene ni un valor literal: cada color se compone con
`oklch(var(--c-<nombre>) / <alpha-value>)` y cada tamaño referencia su token.
Añadir un color al sistema significa añadir el token en `index.css` primero.

### Puente para canvas

Cytoscape pinta sobre canvas y no resuelve `var()`, y su parser de color tampoco
entiende `oklch()`. Cuidado: `getComputedStyle().color` **no basta** — Chrome
conserva el espacio de color y devuelve `oklch(0.94 0.01 128)`, que Cytoscape
descarta en silencio pintando negro.

`src/lib/tokens.ts` resuelve el token y luego lo pinta en un canvas de 1×1 para
leer el píxel: el navegador hace la conversión a sRGB y devuelve bytes exactos.
Lleva un centinela para distinguir «no se pudo leer» de «el color es negro».
