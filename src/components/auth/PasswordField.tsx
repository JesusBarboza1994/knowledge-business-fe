import { useId, useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { useTranslation } from 'react-i18next'

interface Props {
  label: string
  value: string
  onChange: (value: string) => void
  autoComplete: 'current-password' | 'new-password'
  placeholder?: string
  hint?: string
  minLength?: number
}

export function PasswordField({ label, value, onChange, autoComplete, placeholder, hint, minLength }: Props) {
  const [visible, setVisible] = useState(false)
  const { t } = useTranslation('account')
  const inputId = useId()
  const hintId = useId()
  // La etiqueta apunta solo al input: si envolviera también el botón y la ayuda, el nombre
  // accesible del campo incluiría "Mostrar contraseña" y el texto de ayuda.
  return (
    <div>
      <label className="field-label" htmlFor={inputId}>{label}</label>
      <span className="relative block">
        <input
          id={inputId}
          className="field pr-12"
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          autoComplete={autoComplete}
          placeholder={placeholder}
          minLength={minLength}
          aria-describedby={hint ? hintId : undefined}
        />
        <button type="button" className="password-toggle absolute right-1 top-1/2 grid -translate-y-1/2 place-items-center text-muted hover:text-fg" onClick={() => setVisible((current) => !current)} aria-label={visible ? t('common.hidePassword') : t('common.showPassword')}>
          {visible ? <EyeOff size={19} /> : <Eye size={19} />}
        </button>
      </span>
      {hint && <span id={hintId} className="mt-1.5 block text-xs text-muted">{hint}</span>}
    </div>
  )
}
