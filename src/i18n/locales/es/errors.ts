/**
 * Mensajes por código de error del backend (`ErrorCode` en knowledge-business). La clave es el
 * código exacto: agregar aquí cada código nuevo que la interfaz pueda mostrar.
 */
export const errors = {
  EMAIL_TAKEN: 'Este correo ya pertenece a una organización.',
  AREA_NOT_FOUND: 'El área no existe o fue archivada.',
  AREA_KEY_TAKEN: 'Ya existe un área con esa clave (puede estar archivada).',
  unknown: 'Algo salió mal. Inténtalo de nuevo.',
} as const
