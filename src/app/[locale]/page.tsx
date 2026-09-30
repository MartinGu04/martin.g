import { notFound } from 'next/navigation'
import { isLocale } from '@/i18n/config'
import { getDictionary } from '@/i18n/get-dictionary'
import { homeCopy } from '@/i18n/dictionaries/home'
import type { DisciplineKey } from '@/i18n/dictionaries'
import { getProjectSequence } from '@/content/registry'
import { resolveConfidentialSummary, resolvePublicSummary } from '@/content/resolve'
import { HeroStage } from '@/components/home/HeroStage'
import { WorkBridge } from '@/components/home/WorkBridge'
import { OnWorld } from '@/components/home/OnWorld'
import { ReturnScene } from '@/components/home/ReturnScene'
import { MiMaMoWorld } from '@/components/home/MiMaMoWorld'
import { ConfidentialScene } from '@/components/home/ConfidentialScene'
import { ProcessStage } from '@/components/home/ProcessStage'
import { Capabilities, type Capability } from '@/components/home/Capabilities'
import { AboutScene } from '@/components/home/AboutScene'
import { ContactScene } from '@/components/home/ContactScene'

/** The capabilities shown, in order; each is proven by the projects that list it. */
const capabilityKeys: readonly DisciplineKey[] = [
  'product-strategy',
  'product-design',
  'system-design',
  'engineering',
  'operational-workflows',
  'brand-experience',
]

/**
 * The homepage as one continuous sequence of scenes (docs/HOMEPAGE.md):
 *
 *   arrival and statement (quiet, then monumental)
 *   bridge into the work (quiet)          cut
 *   ON takes over (warm, emotional)       wipe in, wipe out
 *   a breath in the MARTIN.G world        dissolve
 *   mi-ma-mo (technical)                  split in, split out
 *   confidential work (energy drop)       cut
 *   how I work (rhythmic)                 dissolve
 *   capabilities, about (calm)            cut
 *   the closing call to action (strong)   cut
 */
export default async function HomePage({ params }: PageProps<'/[locale]'>) {
  const { locale } = await params
  if (!isLocale(locale)) notFound()
  const dict = getDictionary(locale)
  const copy = homeCopy[locale]
  const sequence = getProjectSequence()

  const work = sequence.flatMap(({ project, number }) =>
    project.visibility === 'public'
      ? [{ number, ...resolvePublicSummary(project, locale, dict) }]
      : [],
  )
  const confidential = sequence.flatMap(({ project, number }) =>
    project.visibility === 'confidential'
      ? [{ number, ...resolveConfidentialSummary(project, locale, dict) }]
      : [],
  )
  const on = work.find((project) => project.id === 'on')
  const miMaMo = work.find((project) => project.id === 'mi-ma-mo')
  if (!on || !miMaMo) throw new Error('The homepage expects the ON and mi-ma-mo entries.')

  const capabilities: Capability[] = capabilityKeys.map((key) => ({
    key,
    label: dict.disciplines[key],
    proof: sequence
      .filter(({ project }) => project.disciplines.includes(key))
      .map(({ project }) => project.title[locale]),
  }))

  return (
    <>
      <HeroStage dict={dict} />

      <section id="work" aria-labelledby="work-title">
        <WorkBridge dict={dict} />
        <OnWorld project={on} dict={dict} />
        <ReturnScene index={miMaMo.number} dict={dict} />
        <MiMaMoWorld project={miMaMo} dict={dict} />
      </section>

      <ConfidentialScene items={confidential} dict={dict} />
      <ProcessStage copy={copy.process} />
      <Capabilities copy={copy.capabilities} items={capabilities} />
      <AboutScene copy={copy.about} />
      <ContactScene dict={dict} copy={copy.contact} />
    </>
  )
}
