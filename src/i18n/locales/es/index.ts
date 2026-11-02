import { account } from './account'
import { auth } from './auth'
import { common } from './common'
import { connect } from './connect'
import { errors } from './errors'
import { onboarding } from './onboarding'

export const es = { common, auth, account, onboarding, connect, errors } as const
