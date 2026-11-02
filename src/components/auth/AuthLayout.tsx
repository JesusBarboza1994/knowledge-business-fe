import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { BrandMark } from '../BrandMark'

/**
 * Marco de todas las pantallas sin sesión (login, registro, enlaces por correo): el argumento del
 * producto a la izquierda en escritorio y el formulario a la derecha.
 */
export function AuthLayout({ children, wide = false }: { children: ReactNode; wide?: boolean }) {
  const { t } = useTranslation('auth')
  const { t: tc } = useTranslation('common')
  return (
    <main className="login-grid login-screen min-h-screen overflow-hidden bg-ink text-fg">
      <section className="login-argument hidden lg:grid">
        <div className="login-brand">
          <BrandMark className="h-10 w-10" />
          <div>
            <div className="wordmark">{tc('productName')}</div>
            <div className="text-xs text-muted">{t('login.tagline')}</div>
          </div>
        </div>

        <ConnectionDiagram />

        <div className="login-block">
          <h1 className="text-balance">{t('login.headline')}</h1>
          <p>{t('login.pitch')}</p>
          <div className="login-facts">
            <span>{t('login.facts.areas')}</span>
            <span>{t('login.facts.markdown')}</span>
            <span>{t('login.facts.history')}</span>
          </div>
        </div>
      </section>

      <section className="login-panel flex items-center justify-center px-6 py-12 sm:px-12">
        <div className={`login-form w-full ${wide ? 'max-w-md' : 'max-w-sm'}`}>
          <div className="login-mobile-brand mb-10 flex items-center gap-3 lg:hidden">
            <BrandMark className="h-11 w-11" />
            <div>
              <span className="wordmark block">{tc('productName')}</span>
              <span className="text-xs text-muted">{t('login.tagline')}</span>
            </div>
          </div>
          {children}
        </div>
      </section>
    </main>
  )
}

/**
 * Fragmento de grafo, dibujado a mano. No es adorno: el titular habla de ver
 * cómo se conectan las ideas y esto es exactamente eso — tres áreas, sus notas
 * y los enlaces que las cruzan. El único nodo lleno es el acento de la pantalla.
 */
function ConnectionDiagram() {
  const hubs = [
    { x: 148, y: 132 },
    { x: 372, y: 252 },
    { x: 190, y: 398 },
  ]
  const notes = [
    { x: 58, y: 78, hub: 0 }, { x: 96, y: 208, hub: 0 },
    { x: 216, y: 54, hub: 0 }, { x: 246, y: 182, hub: 0 },
    { x: 452, y: 168, hub: 1 }, { x: 468, y: 326, hub: 1 },
    { x: 348, y: 118, hub: 1 }, { x: 396, y: 374, hub: 1 },
    { x: 86, y: 468, hub: 2 }, { x: 256, y: 484, hub: 2 },
    { x: 104, y: 334, hub: 2 }, { x: 282, y: 328, hub: 2 },
  ]
  // Enlaces que cruzan de un área a otra: lo que el producto hace visible.
  const crossLinks = [
    [3, 6], [3, 11], [1, 10], [11, 7], [4, 2], [9, 7], [0, 2],
  ] as const
  const focus = 3

  return (
    <svg className="login-diagram" viewBox="0 0 520 520" fill="none" aria-hidden="true">
      {notes.map((note, index) => (
        <line
          key={`m${index}`}
          x1={hubs[note.hub].x} y1={hubs[note.hub].y} x2={note.x} y2={note.y}
          stroke="var(--line)" strokeWidth="1"
        />
      ))}
      {crossLinks.map(([from, to]) => (
        <line
          key={`c${from}-${to}`}
          x1={notes[from].x} y1={notes[from].y} x2={notes[to].x} y2={notes[to].y}
          stroke="var(--control)" strokeWidth="1.25"
        />
      ))}
      {hubs.map((hub, index) => (
        <rect
          key={`h${index}`}
          x={hub.x - 12} y={hub.y - 12} width="24" height="24" rx="6"
          fill="var(--panel)" stroke="var(--fg-2)" strokeWidth="1"
        />
      ))}
      {notes.map((note, index) => (
        <circle
          key={`n${index}`}
          cx={note.x} cy={note.y} r={index === focus ? 7 : 5}
          fill={index === focus ? 'var(--accent)' : 'var(--ink)'}
          stroke={index === focus ? 'var(--accent)' : 'var(--control)'}
          strokeWidth="1"
        />
      ))}
    </svg>
  )
}
