import { API_URL } from './httpApi'

/**
 * Endpoints públicos de cuenta (registro, verificación, contraseña, invitaciones). Viven aparte de
 * `httpApi` porque necesitan el `code` de negocio del backend para traducir el error con i18n.
 */
export class AccountApiError extends Error {
  constructor(message: string, readonly status: number, readonly code?: string) { super(message) }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...init.headers },
  })
  const payload = await response.json().catch(() => null) as { data?: T; message?: string; code?: string } | null
  if (!response.ok) throw new AccountApiError(payload?.message ?? `HTTP ${response.status}`, response.status, payload?.code)
  return payload?.data as T
}

const post = <T>(path: string, body: unknown) => request<T>(path, { method: 'POST', body: JSON.stringify(body) })

export interface SignupInput {
  organization_name: string
  slug: string
  description: string
  phone_country_code: string
  phone_number: string
  name: string
  email: string
  password: string
}

export interface SignupResult { email: string; organization: string; verification_sent: boolean }
export interface SlugAvailability { slug: string; available: boolean; reason?: 'taken' | 'reserved' | 'invalid' }
export interface Invitation { email: string; name?: string; organization_name: string }

export const accountApi = {
  signup: (input: SignupInput) => post<SignupResult>('/signup', input),
  checkSlug: (slug: string) => request<SlugAvailability>(`/signup/slug-availability?slug=${encodeURIComponent(slug)}`),
  verifyEmail: (token: string) => post<unknown>('/auth/verify-email', { token }),
  resendVerification: (email: string) => post<unknown>('/auth/resend-verification', { email }),
  forgotPassword: (email: string) => post<unknown>('/auth/forgot-password', { email }),
  resetPassword: (token: string, password: string) => post<unknown>('/auth/reset-password', { token, password }),
  getInvitation: (token: string) => request<Invitation>(`/auth/invitation?token=${encodeURIComponent(token)}`),
  acceptInvitation: (token: string, password: string, name?: string) =>
    post<unknown>('/auth/accept-invitation', { token, password, ...(name ? { name } : {}) }),
  resendInvitation: (userId: string) => post<{ invitation_sent: boolean }>(`/users/${encodeURIComponent(userId)}/invitation`, {}),
}

/** Código de negocio de un error, venga de `accountApi` o de un error HTTP genérico. */
export function errorCode(reason: unknown): string | undefined {
  return reason instanceof AccountApiError ? reason.code : undefined
}

export interface CurrentOrganization {
  slug: string
  name: string
  plan: string
  /** `null` = el asistente de configuración no se ha terminado; ausente = organización previa. */
  onboarding_completed_at?: string | null
}

export interface ConnectInfo { product_name: string; mcp_url: string; auth: 'oauth' }

export const organizationApi = {
  current: () => request<CurrentOrganization>('/organizations/current'),
  completeOnboarding: () => post<CurrentOrganization>('/organizations/current/onboarding/complete', {}),
  connectInfo: () => request<ConnectInfo>('/organizations/current/connect'),
}

export interface InviteInput {
  email: string
  name: string
  role: 'member' | 'admin'
  memberships: Array<{ area: string; access: 'read' | 'write' | 'manage' }>
}

/** Igual que invitar desde Administrar, pero conserva `invitation_sent` para avisar si el correo falló. */
export const inviteApi = {
  invite: (input: InviteInput) => post<{ _id: string; email: string; invitation_sent: boolean }>('/users/invite', input),
}
