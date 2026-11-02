/** Códigos de país para el teléfono de la organización. Latinoamérica primero, luego el resto. */
export interface CountryCode { iso: string; name: string; dial: string }

export const COUNTRY_CODES: CountryCode[] = [
  { iso: 'PE', name: 'Perú', dial: '+51' },
  { iso: 'MX', name: 'México', dial: '+52' },
  { iso: 'CO', name: 'Colombia', dial: '+57' },
  { iso: 'CL', name: 'Chile', dial: '+56' },
  { iso: 'AR', name: 'Argentina', dial: '+54' },
  { iso: 'EC', name: 'Ecuador', dial: '+593' },
  { iso: 'BO', name: 'Bolivia', dial: '+591' },
  { iso: 'VE', name: 'Venezuela', dial: '+58' },
  { iso: 'UY', name: 'Uruguay', dial: '+598' },
  { iso: 'PY', name: 'Paraguay', dial: '+595' },
  { iso: 'CR', name: 'Costa Rica', dial: '+506' },
  { iso: 'PA', name: 'Panamá', dial: '+507' },
  { iso: 'GT', name: 'Guatemala', dial: '+502' },
  { iso: 'SV', name: 'El Salvador', dial: '+503' },
  { iso: 'HN', name: 'Honduras', dial: '+504' },
  { iso: 'NI', name: 'Nicaragua', dial: '+505' },
  { iso: 'DO', name: 'República Dominicana', dial: '+1' },
  { iso: 'PR', name: 'Puerto Rico', dial: '+1' },
  { iso: 'CU', name: 'Cuba', dial: '+53' },
  { iso: 'BR', name: 'Brasil', dial: '+55' },
  { iso: 'ES', name: 'España', dial: '+34' },
  { iso: 'US', name: 'Estados Unidos', dial: '+1' },
  { iso: 'CA', name: 'Canadá', dial: '+1' },
  { iso: 'GB', name: 'Reino Unido', dial: '+44' },
  { iso: 'DE', name: 'Alemania', dial: '+49' },
  { iso: 'FR', name: 'Francia', dial: '+33' },
  { iso: 'IT', name: 'Italia', dial: '+39' },
  { iso: 'PT', name: 'Portugal', dial: '+351' },
]

/** País sugerido por el idioma del navegador (es-PE → PE); Perú si no hay coincidencia. */
export function defaultCountry(locale = typeof navigator === 'undefined' ? '' : navigator.language): CountryCode {
  const region = locale.split('-')[1]?.toUpperCase()
  return COUNTRY_CODES.find((country) => country.iso === region) ?? COUNTRY_CODES[0]
}
