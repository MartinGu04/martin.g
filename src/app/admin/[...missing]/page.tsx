import { notFound } from 'next/navigation'
import { requireAdmin } from '@/lib/admin/auth'

/** Any other /admin address: the admin's own 404, and only for the admin. */
export default async function AdminMissing() {
  await requireAdmin()
  notFound()
}
