import 'i18next'
import type { Resources, defaultNS } from './index'

declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: typeof defaultNS
    resources: Resources
  }
}
