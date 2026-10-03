/*
 * What the admin's Server Actions answer. Messages are written for Martin and never carry
 * an internal error, a database code or anything about whether an account exists.
 */

export interface SignInState {
  status: 'idle' | 'error' | 'unavailable'
  /** Kept so a failed attempt does not clear the field; the password never comes back. */
  email?: string
}

export const initialSignInState: SignInState = { status: 'idle' }

/** One answer for every refused sign-in: wrong email, wrong password or not the admin. */
export const SIGN_IN_ERROR = 'That email and password combination did not work.'
export const SIGN_IN_UNAVAILABLE = 'Sign-in is not available in this environment.'

export interface ActionState {
  status: 'idle' | 'success' | 'error'
  message?: string
  /** Increments with every success, so a form can reset itself. */
  done?: number
}

export const initialActionState: ActionState = { status: 'idle', done: 0 }

export const adminFields = {
  email: 'email',
  password: 'password',
  leadId: 'lead',
  status: 'status',
  note: 'note',
} as const
