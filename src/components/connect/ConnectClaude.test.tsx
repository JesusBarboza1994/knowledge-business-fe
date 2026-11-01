import { afterEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ConnectClaude } from './ConnectClaude'
import { organizationApi } from '../../services/accountApi'

describe('ConnectClaude', () => {
  afterEach(() => vi.restoreAllMocks())

  it('muestra la URL del MCP, los pasos con el nombre del producto y que no hace falta token', async () => {
    vi.spyOn(organizationApi, 'connectInfo').mockResolvedValue({ product_name: 'Knowledge Hub', mcp_url: 'https://api.example.com/mcp', auth: 'oauth' })

    render(<ConnectClaude />)

    expect(await screen.findByDisplayValue('https://api.example.com/mcp')).toBeInTheDocument()
    expect(screen.getByText(/Agregar conector personalizado/)).toBeInTheDocument()
    expect(screen.getAllByText(/Knowledge Hub/).length).toBeGreaterThan(0)
    expect(screen.getByText(/No necesitas copiar ningún token/)).toBeInTheDocument()
    expect(document.body.textContent).not.toMatch(/steps\.\w+/)
  })

  it('avisa si no se pudo obtener la URL', async () => {
    vi.spyOn(organizationApi, 'connectInfo').mockRejectedValue(new Error('500'))
    render(<ConnectClaude />)
    expect(await screen.findByRole('alert')).toHaveTextContent('No pudimos obtener la URL')
  })
})
