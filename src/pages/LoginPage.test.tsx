import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { LoginPage } from './LoginPage'

describe('LoginPage', () => {
  it('muestra los textos traducidos, no las claves de i18n', () => {
    render(<LoginPage onLogin={() => {}} />)

    expect(screen.getByRole('heading', { name: 'Entra a tu organización' })).toBeInTheDocument()
    expect(screen.getByPlaceholderText('nombre@empresa.com')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Continuar/ })).toBeInTheDocument()
    expect(document.body.textContent).not.toMatch(/login\.\w+/)
  })
})
