import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { BrandMark } from '../components/BrandMark'
import { ConnectClaude } from '../components/connect/ConnectClaude'

export function ConnectClaudePage() {
  const { t } = useTranslation('connect')
  const { t: tc } = useTranslation('common')
  return (
    <main className="min-h-screen bg-ink px-4 py-8 text-fg sm:px-8 sm:py-12">
      <div className="mx-auto w-full max-w-2xl">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted hover:text-fg"><ArrowLeft size={15} /> {t('back')}</Link>
        <div className="mt-8 flex items-center gap-3">
          <BrandMark className="h-10 w-10" />
          <h1 className="font-display text-2xl font-medium">{t('title')}</h1>
        </div>
        <p className="mt-3 text-sm leading-6 text-muted">{t('subtitle', { product: tc('productName') })}</p>
        <section className="surface-card mt-8 p-5 sm:p-6"><ConnectClaude /></section>
      </div>
    </main>
  )
}
