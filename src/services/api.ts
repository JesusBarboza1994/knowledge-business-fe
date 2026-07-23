import { httpApi } from './httpApi'
import { mockApi } from './mockApi'

export const api = import.meta.env.VITE_USE_MOCKS === 'true' ? mockApi : httpApi
