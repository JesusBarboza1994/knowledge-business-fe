import { afterEach, describe, expect, it, vi } from 'vitest'
import { StrictMode } from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { VerifyEmailPage } from './VerifyEmailPage'
import { accountApi } from '../../services/accountApi'

describe('VerifyEmailPage', () => {
  afterEach(() => { vi.restoreAllMocks(); window.history.replaceState(null, '', '/') })

  it('consume el token una sola vez aunque StrictMode monte dos veces, y lo quita de la URL', async () => {
    window.history.replaceState(null, '', '/verificar-email?token=abc123abc123')
    const verify = vi.spyOn(accountApi, 'verifyEmail').mockResolvedValue({})
    const onVerified = vi.fn().mockResolvedValue(undefined)

    render(<StrictMode><MemoryRouter><VerifyEmailPage onVerified={onVerified} /></MemoryRouter></StrictMode>)

    await waitFor(() => expect(onVerified).toHaveBeenCalledTimes(1))
    expect(verify).toHaveBeenCalledTimes(1)
    expect(verify).toHaveBeenCalledWith('abc123abc123')
    expect(window.location.search).toBe('')
  })

  it('ofrece reenviar el correo si el enlace no sirve', async () => {
    window.history.replaceState(null, '', '/verificar-email?token=vencido-vencido')
    vi.spyOn(accountApi, 'verifyEmail').mockRejectedValue(new Error('TOKEN_INVALID'))

    render(<MemoryRouter><VerifyEmailPage onVerified={vi.fn()} /></MemoryRouter>)

    expect(await screen.findByRole('heading', { name: 'No pudimos confirmar tu correo' })).toBeInTheDocument()
  })
})
