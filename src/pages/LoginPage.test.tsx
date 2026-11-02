import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { LoginPage } from './LoginPage'

describe('LoginPage', () => {
  it('muestra los textos traducidos, no las claves de i18n', () => {
    render(<MemoryRouter><LoginPage onLogin={() => {}} /></MemoryRouter>)

    expect(screen.getByRole('heading', { name: 'Entra a tu organización' })).toBeInTheDocument()
    expect(screen.getByPlaceholderText('nombre@empresa.com')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Continuar/ })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Crea tu organización' })).toHaveAttribute('href', '/registro')
    expect(screen.getByRole('link', { name: '¿Olvidaste tu contraseña?' })).toHaveAttribute('href', '/recuperar-contrasena')
    expect(document.body.textContent).not.toMatch(/login\.\w+/)
  })
})
