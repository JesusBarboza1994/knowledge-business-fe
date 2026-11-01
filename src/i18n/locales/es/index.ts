import { account } from './account'
import { auth } from './auth'
import { common } from './common'
import { errors } from './errors'

export const es = { common, auth, account, errors } as const
