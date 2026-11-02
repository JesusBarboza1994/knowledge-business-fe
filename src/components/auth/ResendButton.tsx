import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

/** El backend ignora reenvíos con menos de 60 s de diferencia; el botón refleja esa misma espera. */
const COOLDOWN_SECONDS = 60

export function ResendButton({ onResend, startCoolingDown = false }: { onResend: () => Promise<unknown>; startCoolingDown?: boolean }) {
  const { t } = useTranslation('account')
  const [remaining, setRemaining] = useState(startCoolingDown ? COOLDOWN_SECONDS : 0)
  const [sending, setSending] = useState(false)
  const [done, setDone] = useState(false)

  useEffect(() => {
    if (remaining <= 0) return
    const timer = window.setTimeout(() => setRemaining((value) => value - 1), 1000)
    return () => window.clearTimeout(timer)
  }, [remaining])

  async function resend() {
    setSending(true); setDone(false)
    try { await onResend(); setDone(true) }
    finally { setSending(false); setRemaining(COOLDOWN_SECONDS) }
  }

  return (
    <div className="space-y-2">
      <button type="button" className="secondary-button w-full" onClick={() => void resend()} disabled={sending || remaining > 0}>
        {sending ? <span className="loader small" /> : remaining > 0 ? t('common.resendIn', { seconds: remaining }) : t('common.resend')}
      </button>
      {done && <p className="text-xs text-muted" role="status">{t('common.resent')}</p>}
    </div>
  )
}
