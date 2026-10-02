'use client'

import { useParams } from 'next/navigation'
import { defaultLocale, isLocale } from '@/i18n/config'
import { NotFoundContent } from '@/components/layout/NotFoundContent'

/** Not-found boundaries receive no params, so the locale is read on the client. */
export default function LocaleNotFound() {
  const params = useParams<{ locale?: string }>()
  return <NotFoundContent locale={isLocale(params.locale) ? params.locale : defaultLocale} />
}
