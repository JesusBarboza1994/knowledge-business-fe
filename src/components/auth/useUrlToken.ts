import { useState } from 'react'

/**
 * Lee `?token=` una sola vez y lo quita de la barra de direcciones, para que no quede en el
 * historial ni viaje en el Referer de enlaces externos.
 */
export function useUrlToken(): string {
  const [token] = useState(() => {
    if (typeof window === 'undefined') return ''
    const url = new URL(window.location.href)
    const value = url.searchParams.get('token') ?? ''
    if (value) {
      url.searchParams.delete('token')
      window.history.replaceState(window.history.state, '', `${url.pathname}${url.search}${url.hash}`)
    }
    return value
  })
  return token
}
