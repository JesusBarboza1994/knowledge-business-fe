import { useEffect, useState } from 'react'
import { Check, Copy, KeyRound } from 'lucide-react'
import { Trans, useTranslation } from 'react-i18next'
import { organizationApi, type ConnectInfo } from '../../services/accountApi'

/**
 * Instrucciones para agregar el servidor MCP como conector personalizado de Claude. Se usa tanto
 * en el asistente de configuración como en la página fija "Conectar con Claude".
 */
export function ConnectClaude({ compact = false }: { compact?: boolean }) {
  const { t } = useTranslation('connect')
  const { t: tc } = useTranslation('common')
  const product = tc('productName')
  const [info, setInfo] = useState<ConnectInfo | null>(null)
  const [failed, setFailed] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    organizationApi.connectInfo().then(setInfo).catch(() => setFailed(true))
  }, [])

  async function copy() {
    if (!info) return
    try {
      await navigator.clipboard.writeText(info.mcp_url)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1800)
    } catch {
      // Sin permiso de portapapeles: la URL queda seleccionable en el campo.
    }
  }

  const steps = ['open', 'add', 'login', 'use'] as const
  const examples = t('examples', { returnObjects: true }) as readonly string[]

  return (
    <div className="space-y-6">
      <div>
        <span className="field-label" id="mcp-url-label">{t('urlLabel')}</span>
        {failed ? (
          <p className="rounded-md border border-danger/25 bg-danger/10 px-3 py-2 text-sm text-danger" role="alert">{t('failed')}</p>
        ) : !info ? (
          <p className="flex items-center gap-2 text-sm text-muted" role="status"><span className="loader small" /> {t('loading')}</p>
        ) : (
          <div className="flex gap-2">
            <input className="field font-mono text-sm" readOnly value={info.mcp_url} aria-labelledby="mcp-url-label" onFocus={(event) => event.currentTarget.select()} />
            <button type="button" className="secondary-button shrink-0" onClick={() => void copy()} aria-live="polite">
              {copied ? <><Check size={15} /> {t('copied')}</> : <><Copy size={15} /> {t('copy')}</>}
            </button>
          </div>
        )}
      </div>

      <div>
        <h3 className="text-sm font-medium">{t('stepsTitle')}</h3>
        <ol className="mt-3 space-y-3">
          {steps.map((step, index) => (
            <li key={step} className="flex gap-3 text-sm leading-6 text-fg-2">
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full border border-line text-xs text-muted">{index + 1}</span>
              <span><Trans t={t} i18nKey={`steps.${step}`} values={{ product }} components={{ strong: <strong className="font-medium text-fg" /> }} /></span>
            </li>
          ))}
        </ol>
      </div>

      <p className="flex gap-2 rounded-lg border border-line bg-sunken px-3 py-2 text-xs leading-5 text-fg-2">
        <KeyRound size={14} className="mt-0.5 shrink-0 text-accent" /> {t('noToken')}
      </p>

      {!compact && (
        <>
          <p className="text-xs leading-5 text-muted">{t('teamNote')}</p>
          <div>
            <h3 className="text-sm font-medium">{t('examplesTitle')}</h3>
            <ul className="mt-3 space-y-2">
              {examples.map((example) => (
                <li key={example} className="rounded-lg border border-line px-3 py-2 text-sm text-fg-2">“{example}”</li>
              ))}
            </ul>
          </div>
        </>
      )}
    </div>
  )
}
