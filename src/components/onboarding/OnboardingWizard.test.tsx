import { afterEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { OnboardingWizard } from './OnboardingWizard'
import { api } from '../../services/api'
import { inviteApi, organizationApi } from '../../services/accountApi'
import type { Area, Session } from '../../types'

const session: Session = { userId: 'u1', email: 'ana@acme.com', name: 'Ana', tenant: 'acme', organizationName: 'Resortes Acme', role: 'admin' }
const area = { key: 'operaciones', name: 'Operaciones', description: '', access: 'manage', color: '#000', noteCount: 0, defaultSensitivity: 'public_org' } as unknown as Area

describe('OnboardingWizard', () => {
  afterEach(() => { vi.restoreAllMocks(); window.localStorage.clear() })

  it('recorre los tres pasos: crea el área, invita y termina en Conectar con Claude', async () => {
    const createArea = vi.spyOn(api, 'createArea').mockResolvedValue(area)
    const invite = vi.spyOn(inviteApi, 'invite').mockResolvedValue({ _id: 'x', email: 'luis@acme.com', invitation_sent: true })
    vi.spyOn(organizationApi, 'connectInfo').mockResolvedValue({ product_name: 'NoesisHub', mcp_url: 'https://api.example.com/mcp', auth: 'oauth' })
    const complete = vi.spyOn(organizationApi, 'completeOnboarding').mockResolvedValue({ slug: 'acme', name: 'Acme', plan: 'free', onboarding_completed_at: '2026-11-01' })
    const onFinish = vi.fn()
    const user = userEvent.setup()

    render(<OnboardingWizard session={session} areas={[]} onFinish={onFinish} />)

    expect(screen.getByRole('heading', { name: 'Crea tu primera área' })).toBeInTheDocument()
    await user.type(screen.getByLabelText('Nombre del área'), 'Operaciones')
    await user.click(screen.getByRole('button', { name: /Crear área/ }))
    expect(createArea).toHaveBeenCalledWith(expect.objectContaining({ key: 'operaciones', name: 'Operaciones' }))

    expect(await screen.findByRole('heading', { name: 'Invita a tu equipo' })).toBeInTheDocument()
    await user.type(screen.getByLabelText('Nombre'), 'Luis')
    await user.type(screen.getByLabelText('Correo'), 'luis@acme.com')
    await user.click(screen.getByRole('button', { name: /Enviar invitación/ }))
    expect(invite).toHaveBeenCalledWith(expect.objectContaining({ email: 'luis@acme.com', memberships: [{ area: 'operaciones', access: 'write' }] }))
    expect(await screen.findByText('Invitación enviada a luis@acme.com')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /Continuar/ }))

    expect(await screen.findByDisplayValue('https://api.example.com/mcp')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /Ir a mi espacio/ }))
    expect(complete).toHaveBeenCalled()
    expect(onFinish).toHaveBeenCalled()
  })

  it('si ya hay un área retoma en el paso de invitar, y se puede omitir', async () => {
    vi.spyOn(organizationApi, 'connectInfo').mockResolvedValue({ product_name: 'NoesisHub', mcp_url: 'https://api.example.com/mcp', auth: 'oauth' })
    const user = userEvent.setup()
    render(<OnboardingWizard session={session} areas={[area]} onFinish={vi.fn()} />)

    expect(screen.getByRole('heading', { name: 'Invita a tu equipo' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /Omitir por ahora/ }))
    expect(await screen.findByRole('heading', { name: 'Conectar con Claude' })).toBeInTheDocument()
  })

  it('avisa si la invitación se creó pero el correo no salió', async () => {
    vi.spyOn(inviteApi, 'invite').mockResolvedValue({ _id: 'x', email: 'luis@acme.com', invitation_sent: false })
    const user = userEvent.setup()
    render(<OnboardingWizard session={session} areas={[area]} onFinish={vi.fn()} />)

    await user.type(screen.getByLabelText('Nombre'), 'Luis')
    await user.type(screen.getByLabelText('Correo'), 'luis@acme.com')
    await user.click(screen.getByRole('button', { name: /Enviar invitación/ }))

    expect(await screen.findByText(/el correo no salió/)).toBeInTheDocument()
  })
})
