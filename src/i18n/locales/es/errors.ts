/**
 * Mensajes por código de error del backend (`ErrorCode` en knowledge-business). La clave es el
 * código exacto: agregar aquí cada código nuevo que la interfaz pueda mostrar.
 */
export const errors = {
  EMAIL_TAKEN: 'Este correo ya pertenece a una organización.',
  AREA_NOT_FOUND: 'El área no existe o fue archivada.',
  AREA_KEY_TAKEN: 'Ya existe un área con esa clave (puede estar archivada).',
  SLUG_TAKEN: 'Ese identificador de organización no está disponible.',
  EMAIL_NOT_VERIFIED: 'Confirma tu correo antes de entrar.',
  TOKEN_INVALID: 'El enlace no es válido o ya venció.',
  VALIDATION_REQUEST_ERROR: 'Revisa los datos del formulario.',
  unknown: 'Algo salió mal. Inténtalo de nuevo.',
} as const
