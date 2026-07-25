/**
 * Puente entre los tokens de `src/index.css` y las APIs que no leen CSS.
 *
 * Cytoscape pinta sobre canvas: no resuelve `var(--x)` y su parser de color no
 * entiende `oklch()`. Y `getComputedStyle().color` tampoco basta — Chrome
 * conserva el espacio de color en el valor computado y devuelve
 * `oklch(0.94 0.01 128)`, que Cytoscape descarta silenciosamente pintando negro.
 *
 * La conversión fiable es pintar el color en un canvas de 1×1 y leer el píxel:
 * el navegador hace la conversión a sRGB y nos devuelve bytes exactos. Así los
 * valores siguen viviendo en un único sitio, el CSS.
 */
const cache = new Map<string, string>()
const SENTINEL = '#ff00ff'

let context: CanvasRenderingContext2D | null | undefined

function pixelContext(): CanvasRenderingContext2D | null {
  if (context !== undefined) return context
  if (typeof document === 'undefined') return (context = null)
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = 1
  context = canvas.getContext('2d', { willReadFrequently: true })
  return context
}

function computedValue(property: 'color' | 'fontFamily', name: string): string {
  if (typeof document === 'undefined' || !document.body) return ''
  const probe = document.createElement('span')
  probe.style.cssText = `display:none;${property === 'color' ? 'color' : 'font-family'}:var(--${name})`
  document.body.appendChild(probe)
  const value = getComputedStyle(probe)[property]
  probe.remove()
  return value
}

export function token(name: string): string {
  const cached = cache.get(name)
  if (cached !== undefined) return cached

  // Sin resolver, devolvemos la referencia cruda: en jsdom no hay layout y el
  // grafo no se pinta, así que no vale la pena duplicar valores como respaldo.
  let value = `var(--${name})`
  const context = pixelContext()
  const computed = computedValue('color', name)

  if (context && computed) {
    // Si el parser rechaza el valor, `fillStyle` conserva el anterior: el
    // centinela distingue «no se pudo leer» de «el color es negro».
    context.fillStyle = SENTINEL
    context.fillStyle = computed
    if (context.fillStyle !== SENTINEL) {
      context.clearRect(0, 0, 1, 1)
      context.fillRect(0, 0, 1, 1)
      const [r, g, b, a] = context.getImageData(0, 0, 1, 1).data
      value = a === 255 ? `rgb(${r}, ${g}, ${b})` : `rgba(${r}, ${g}, ${b}, ${(a / 255).toFixed(3)})`
    }
  }

  cache.set(name, value)
  return value
}

/** Resuelve un token tipográfico (`--font-body`, `--font-display`, `--font-mono`). */
export function fontToken(name: string): string {
  const key = `font:${name}`
  const cached = cache.get(key)
  if (cached !== undefined) return cached

  const value = computedValue('fontFamily', name) || 'sans-serif'
  cache.set(key, value)
  return value
}
