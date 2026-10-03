/*
 * Synthetic configuration and people for the admin's tests. Nothing here is real: the
 * keys only have the shape of Supabase keys, the addresses are on the reserved .example
 * domain, and the server they point at is tests/support/fake-supabase-server.mjs.
 */

export const FAKE_PORT = Number(process.env.FAKE_SUPABASE_PORT ?? 3199)
export const FAKE_URL = `http://127.0.0.1:${FAKE_PORT}`

export const PUBLISHABLE_KEY = 'sb_publishable_synthetic_e2e_key'
export const SECRET_KEY = 'sb_secret_synthetic_e2e_key'

export const ADMIN = Object.freeze({
  id: '6f1c2d3e-4b5a-4c6d-8e7f-9a0b1c2d3e4f',
  email: 'owner@studio.example',
  password: 'synthetic-owner-password-1',
})

/** A real account in the same Supabase project that is not the admin. */
export const OTHER = Object.freeze({
  id: '0a1b2c3d-4e5f-4a6b-9c8d-7e6f5a4b3c2d',
  email: 'someone@studio.example',
  password: 'synthetic-someone-password-1',
})

/** The next server's environment for the e2e suite (playwright.config.ts). */
export const ADMIN_E2E_ENV = Object.freeze({
  SUPABASE_URL: FAKE_URL,
  SUPABASE_PUBLISHABLE_KEY: PUBLISHABLE_KEY,
  SUPABASE_SECRET_KEY: SECRET_KEY,
  ADMIN_USER_ID: ADMIN.id,
})
