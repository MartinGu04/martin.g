'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { cleanValue } from '@/lib/contact/validate'
import { ADMIN_HOME, ADMIN_LOGIN, adminAuthClient, requireAdmin } from './auth'
import { isUuid } from './config'
import { configuredCrmRepository, CrmError } from './crm'
import { cleanNote, isLeadStatus, statusLabels } from './leads-view'
import { checkAdmin, endSession } from './session'
import { adminFields, type ActionState, type SignInState } from './state'

/*
 * The admin's Server Actions. Each mutation calls requireAdmin() itself, whatever the page
 * or the proxy checked: an action is a public POST endpoint. Logs carry the step and a code
 * only, never a lead's content, an email address or a secret.
 */

const field = (data: FormData, name: string) => {
  const value = data.get(name)
  return typeof value === 'string' ? value : ''
}

const CRM_UNAVAILABLE = 'The CRM is not available right now. Nothing was changed.'

function logFailure(step: string, error: unknown) {
  console.error(
    error instanceof CrmError
      ? `[admin] ${step} failed (${error.code}).`
      : `[admin] ${step} failed.`,
  )
}

/**
 * Email and password sign-in through Supabase Auth, on the server. Every refusal reads the
 * same, so the page never tells whether an account exists. A real user who is not
 * ADMIN_USER_ID is signed out at once and refused like a wrong password.
 */
export async function signIn(_previous: SignInState, data: FormData): Promise<SignInState> {
  const email = cleanValue(field(data, adminFields.email)).slice(0, 254)
  const password = field(data, adminFields.password)
  const auth = await adminAuthClient()
  if (!auth) return { status: 'unavailable', email }
  if (!email || !password || password.length > 1024) return { status: 'error', email }

  let signedIn = false
  try {
    const { error } = await auth.client.auth.signInWithPassword({ email, password })
    signedIn = !error
  } catch {
    signedIn = false
  }
  if (!signedIn) return { status: 'error', email }

  const check = await checkAdmin(auth.client, auth.config.adminUserId)
  if (check.status !== 'admin') {
    await endSession(auth.client)
    return { status: 'error', email }
  }
  redirect(ADMIN_HOME)
}

/** Signs this browser out. requireAdmin first: anyone else is already signed out by it. */
export async function signOut(): Promise<void> {
  await requireAdmin()
  const auth = await adminAuthClient()
  if (auth) await endSession(auth.client)
  redirect(ADMIN_LOGIN)
}

export async function updateLeadStatus(
  previous: ActionState,
  data: FormData,
): Promise<ActionState> {
  await requireAdmin()
  const id = field(data, adminFields.leadId)
  const status = field(data, adminFields.status)
  if (!isUuid(id))
    return { status: 'error', message: 'This lead could not be found.', done: previous.done }
  if (!isLeadStatus(status))
    return { status: 'error', message: 'Choose one of the statuses.', done: previous.done }

  const crm = configuredCrmRepository()
  if (!crm) return { status: 'error', message: CRM_UNAVAILABLE, done: previous.done }
  try {
    const result = await crm.updateStatus(id, status, new Date())
    if (result === 'missing')
      return { status: 'error', message: 'This lead no longer exists.', done: previous.done }
  } catch (error) {
    logFailure('Status update', error)
    return { status: 'error', message: CRM_UNAVAILABLE, done: previous.done }
  }
  revalidatePath(ADMIN_HOME)
  revalidatePath(`${ADMIN_HOME}/leads/${id}`)
  return {
    status: 'success',
    message: `Status changed to ${statusLabels[status]}.`,
    done: Date.now(),
  }
}

export async function addLeadNote(previous: ActionState, data: FormData): Promise<ActionState> {
  await requireAdmin()
  const id = field(data, adminFields.leadId)
  if (!isUuid(id))
    return { status: 'error', message: 'This lead could not be found.', done: previous.done }
  const note = cleanNote(field(data, adminFields.note))
  if ('error' in note) return { status: 'error', message: note.error, done: previous.done }

  const crm = configuredCrmRepository()
  if (!crm) return { status: 'error', message: CRM_UNAVAILABLE, done: previous.done }
  try {
    const result = await crm.addNote(id, note.body)
    if (result === 'missing')
      return { status: 'error', message: 'This lead no longer exists.', done: previous.done }
  } catch (error) {
    logFailure('Adding a note', error)
    return { status: 'error', message: CRM_UNAVAILABLE, done: previous.done }
  }
  revalidatePath(`${ADMIN_HOME}/leads/${id}`)
  return { status: 'success', message: 'Note added.', done: Date.now() }
}
