import { auth } from './auth'
import { common } from './common'
import { errors } from './errors'

export const es = { common, auth, errors } as const
