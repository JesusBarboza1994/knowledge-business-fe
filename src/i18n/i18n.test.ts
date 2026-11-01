import { describe, expect, it } from 'vitest'
import i18n, { translateError } from './index'

describe('i18n', () => {
  it('inicia en español', () => {
    expect(i18n.language).toBe('es')
    expect(i18n.t('auth:login.submit')).toBe('Continuar')
  })

  it('traduce códigos de error conocidos del backend', () => {
    expect(translateError('EMAIL_TAKEN', 'raw')).toBe('Este correo ya pertenece a una organización.')
  })

  it('usa el mensaje del servidor cuando el código no tiene traducción', () => {
    expect(translateError('SOMETHING_NEW', 'Mensaje del servidor')).toBe('Mensaje del servidor')
    expect(translateError(undefined)).toBe('Algo salió mal. Inténtalo de nuevo.')
  })
})
