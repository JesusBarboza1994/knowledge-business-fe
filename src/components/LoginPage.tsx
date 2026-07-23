import { useState, type FormEvent } from 'react'
import { ArrowRight, Eye, EyeOff, Network, ShieldCheck, Sparkles } from 'lucide-react'
import { api } from '../services/api'
import type { Session } from '../types'

export function LoginPage({ onLogin }: { onLogin: (session: Session) => void }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function submit(event: FormEvent) {
    event.preventDefault(); setLoading(true); setError('')
    try { onLogin(await api.login(email, password)) }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'No se pudo iniciar sesión.') }
    finally { setLoading(false) }
  }

  return (
    <main className="login-grid min-h-screen overflow-hidden bg-ink text-stone-100">
      <section className="relative hidden border-r border-line lg:flex lg:flex-col lg:justify-between lg:p-12 xl:p-16">
        <div className="login-orb" />
        <div className="relative z-10 flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl border border-moss/30 bg-moss/10 text-moss"><Network size={20} /></div>
          <div><div className="font-semibold tracking-tight">Knowledge Hub</div><div className="text-xs text-muted">MenteMente</div></div>
        </div>
        <div className="relative z-10 max-w-xl">
          <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-moss/20 bg-moss/5 px-3 py-1.5 text-xs text-moss"><Sparkles size={13} /> Conocimiento que conserva su contexto</div>
          <h1 className="text-balance text-5xl font-medium leading-[1.06] tracking-[-0.04em] xl:text-6xl">Las ideas tienen más valor cuando puedes ver cómo se conectan.</h1>
          <p className="mt-6 max-w-lg text-base leading-7 text-muted">Explora la memoria de tu organización, escribe en Markdown y descubre las relaciones que hacen visible el conocimiento.</p>
        </div>
        <div className="relative z-10 flex items-center gap-6 text-xs text-muted">
          <span className="flex items-center gap-2"><ShieldCheck size={14} className="text-moss" /> Acceso por áreas</span>
          <span>Markdown portable</span><span>Historial de versiones</span>
        </div>
      </section>

      <section className="flex items-center justify-center px-6 py-12 sm:px-12">
        <div className="w-full max-w-sm">
          <div className="mb-10 flex items-center gap-3 lg:hidden"><div className="grid h-10 w-10 place-items-center rounded-xl bg-moss/10 text-moss"><Network size={20} /></div><span className="font-semibold">Knowledge Hub</span></div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-moss">Bienvenido</p>
          <h2 className="text-3xl font-medium tracking-tight">Entra a tu organización</h2>
          <p className="mt-3 text-sm leading-6 text-muted">Tu organización y tus áreas se cargarán automáticamente.</p>
          <form className="mt-9 space-y-5" onSubmit={submit}>
            <label className="block"><span className="field-label">Correo de trabajo</span><input className="field" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" /></label>
            <label className="block"><span className="field-label">Contraseña</span><span className="relative block"><input className="field pr-11" type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" /><button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-stone-200" onClick={() => setShowPassword((value) => !value)} aria-label="Mostrar contraseña">{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></span></label>
            {error && <p className="rounded-lg border border-red-400/20 bg-red-400/5 px-3 py-2 text-sm text-red-300">{error}</p>}
            <button className="group flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-moss font-semibold text-[#17200c] transition hover:bg-[#c8f47f] disabled:opacity-60" disabled={loading}>{loading ? <span className="loader dark" /> : <>Continuar <ArrowRight size={17} className="transition group-hover:translate-x-0.5" /></>}</button>
          </form>
          <p className="mt-6 text-center text-xs text-muted">Acceso seguro a tu espacio de conocimiento</p>
        </div>
      </section>
    </main>
  )
}
