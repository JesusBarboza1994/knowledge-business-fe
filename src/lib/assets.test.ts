import { describe, expect, it } from 'vitest'
import { assetIdFromRef, assetUrlTransform, uploadPlaceholder, uploadToken } from './assets'

const id = '6a64f94d70006eebcadf104e'

describe('assetIdFromRef', () => {
  it('extrae el id de una referencia kb:asset', () => {
    expect(assetIdFromRef(`kb:asset/${id}`)).toBe(id)
  })

  it('ignora query y fragmento', () => {
    expect(assetIdFromRef(`kb:asset/${id}?v=2`)).toBe(id)
    expect(assetIdFromRef(`kb:asset/${id}#top`)).toBe(id)
  })

  it('descarta cualquier cosa que no sea un ObjectId', () => {
    expect(assetIdFromRef('kb:asset/../../etc/passwd')).toBeUndefined()
    expect(assetIdFromRef('kb:asset/')).toBeUndefined()
    expect(assetIdFromRef(`kb:asset/${id}extra`)).toBeUndefined()
  })

  it('deja pasar de largo las URLs normales', () => {
    expect(assetIdFromRef('https://ejemplo.com/x.png')).toBeUndefined()
    expect(assetIdFromRef(undefined)).toBeUndefined()
  })
})

describe('assetUrlTransform', () => {
  /** Sin esto react-markdown vacía el src y la imagen se rompe sin ningún error. */
  it('preserva la referencia kb:asset en lugar de vaciarla', () => {
    expect(assetUrlTransform(`kb:asset/${id}`)).toBe(`kb:asset/${id}`)
  })

  it('mantiene el saneado por defecto para el resto de esquemas', () => {
    expect(assetUrlTransform('https://ejemplo.com/x.png')).toBe('https://ejemplo.com/x.png')
    expect(assetUrlTransform('/relativa.png')).toBe('/relativa.png')
    expect(assetUrlTransform('javascript:alert(1)')).toBe('')
    expect(assetUrlTransform('kb:otracosa/123')).toBe('')
  })
})

describe('uploadPlaceholder', () => {
  /** El src queda vacío a propósito: el navegador muestra el alt, que es el mensaje de progreso. */
  it('deja el nombre del archivo visible mientras sube', () => {
    expect(uploadPlaceholder('captura.png', 'abc')).toBe('![Subiendo captura.png…](kb:upload/abc)')
    expect(assetUrlTransform('kb:upload/abc')).toBe('')
  })

  it('distingue subidas concurrentes del mismo archivo', () => {
    const first = uploadPlaceholder('captura.png', uploadToken())
    const second = uploadPlaceholder('captura.png', uploadToken())
    expect(first).not.toBe(second)
  })
})
