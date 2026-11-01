import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import { es } from './locales/es'

/**
 * Español es el único idioma por ahora. Para sumar inglés: crear `locales/en` con la misma forma
 * que `locales/es` (el tipo `Resources` lo exige), registrarlo en `resources` y agregar un
 * selector que llame a `i18n.changeLanguage`.
 */
export const defaultNS = 'common'
export const resources = { es } as const
export type Resources = (typeof resources)['es']

void i18n.use(initReactI18next).init({
  resources,
  lng: 'es',
  fallbackLng: 'es',
  defaultNS,
  ns: Object.keys(es),
  interpolation: { escapeValue: false }, // React ya escapa
  returnNull: false,
})

/** Traduce un código de error del backend; si no hay traducción usa el mensaje del servidor. */
export function translateError(code: string | undefined, fallback?: string): string {
  if (code && code in es.errors) return i18n.t(code as keyof typeof es.errors, { ns: 'errors' })
  return fallback || i18n.t('unknown', { ns: 'errors' })
}

export default i18n
