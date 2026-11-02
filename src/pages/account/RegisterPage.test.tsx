import { afterEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { RegisterPage } from './RegisterPage'
import { slugify } from '../../lib/slug'
import { accountApi } from '../../services/accountApi'

describe('slugify', () => {
  it('quita tildes, signos y espacios como exige el backend', () => {
    expect(slugify('Resortes Acme S.A.C.')).toBe('resortes-acme-s-a-c')
    expect(slugify('  Ñandú & Compañía  ')).toBe('nandu-compania')
    expect(slugify('a'.repeat(50))).toHaveLength(40)
  })
})

describe('RegisterPage', () => {
  afterEach(() => vi.restoreAllMocks())

  it('propone el identificador desde el nombre, crea la organización y pide revisar el correo', async () => {
    vi.spyOn(accountApi, 'checkSlug').mockImplementation(async (slug) => ({ slug, available: true }))
    const signup = vi.spyOn(accountApi, 'signup').mockResolvedValue({ email: 'ana@acme.com', organization: 'resortes-acme', verification_sent: true })
    const user = userEvent.setup()
    render(<MemoryRouter><RegisterPage /></MemoryRouter>)

    await user.type(screen.getByLabelText('Nombre de la empresa'), 'Resortes Acme')
    expect(screen.getByLabelText('Identificador de la organización')).toHaveValue('resortes-acme')
    await user.type(screen.getByLabelText('¿A qué se dedica tu empresa?'), 'Fabricación de resortes helicoidales en acero')
    await user.type(screen.getByPlaceholderText('987 654 321'), '987 654 321')
    await user.type(screen.getByLabelText('Tu nombre'), 'Ana Pérez')
    await user.type(screen.getByLabelText('Correo de trabajo'), 'ana@acme.com')
    await user.type(screen.getByLabelText('Contraseña'), 'contraseña-segura')

    await waitFor(() => expect(screen.getByText('Disponible')).toBeInTheDocument())
    await user.click(screen.getByRole('button', { name: /Crear organización/ }))

    expect(signup).toHaveBeenCalledWith(expect.objectContaining({ slug: 'resortes-acme', phone_number: '987 654 321', email: 'ana@acme.com' }))
    expect(await screen.findByRole('heading', { name: 'Revisa tu correo' })).toBeInTheDocument()
    expect(screen.getByText('ana@acme.com')).toBeInTheDocument()
  })

  it('no deja enviar si el identificador está ocupado', async () => {
    vi.spyOn(accountApi, 'checkSlug').mockImplementation(async (slug) => ({ slug, available: false, reason: 'taken' }))
    const user = userEvent.setup()
    render(<MemoryRouter><RegisterPage /></MemoryRouter>)

    await user.type(screen.getByLabelText('Nombre de la empresa'), 'Acme')

    expect(await screen.findByText('Ya está en uso')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Crear organización/ })).toBeDisabled()
  })
})
