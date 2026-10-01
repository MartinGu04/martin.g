import { notFound } from 'next/navigation'
import { isLocale } from '@/i18n/config'
import { getDictionary } from '@/i18n/get-dictionary'
import { homeCopy } from '@/i18n/dictionaries/home'
import { showcaseCopy } from '@/i18n/dictionaries/showcase'
import type { DisciplineKey } from '@/i18n/dictionaries'
import { getProjectSequence } from '@/content/registry'
import { resolveConfidentialSummary, resolvePublicSummary } from '@/content/resolve'
import { HeroScene } from '@/components/home/HeroScene'
import { WorkBridge, type WorkIndexEntry } from '@/components/home/WorkBridge'
import { OnWorld } from '@/components/home/OnWorld'
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
 * The homepage as one continuous sequence of scenes (docs/HOMEPAGE.md): identity, then
 * proposition, then proof, quickly; the deeper storytelling happens inside the worlds.
 *
 *   identity and principle (dark graphite)     one frame, timed beats
 *   index of the work (lighter graphite)       cut
 *   ON (cream, the retreat)                    soft wipe
 *   המחלבה, id mi-ma-mo (midnight, technical)  split in, split out
 *   Defense Systems (gunmetal)                 cut
 *   how I work (graphite, advances on its own) dissolve
 *   capabilities (bone), about (warm)          cut
 *   the closing call to action (graphite)      cut
 *
 * Several scenes are ambient: they keep moving while visible (docs/HOMEPAGE.md).
 */
export default async function HomePage({ params }: PageProps<'/[locale]'>) {
  const { locale } = await params
  if (!isLocale(locale)) notFound()
  const dict = getDictionary(locale)
  const copy = homeCopy[locale]
  const showcase = showcaseCopy[locale]
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

  const index: WorkIndexEntry[] = [
    { href: '#on', number: on.number, title: on.title },
    { href: '#mi-ma-mo', number: miMaMo.number, title: miMaMo.title },
    {
      href: '#confidential',
      number: confidential.map((item) => item.number).join('–'),
      title: dict.work.confidentialTitle,
    },
  ]

  const capabilities: Capability[] = capabilityKeys.map((key) => ({
    key,
    label: dict.disciplines[key],
    proof: sequence
      .filter(({ project }) => project.disciplines.includes(key))
      .map(({ project }) => project.title[locale]),
  }))

  return (
    <>
      <HeroScene dict={dict} name={copy.about.name} role={copy.about.role} />

      <section id="work" aria-labelledby="work-title">
        <WorkBridge dict={dict} entries={index} />
        <OnWorld project={on} dict={dict} showcase={showcase} locale={locale} />
        <MiMaMoWorld project={miMaMo} dict={dict} showcase={showcase} locale={locale} />
      </section>

      <ConfidentialScene items={confidential} dict={dict} />
      <ProcessStage copy={copy.process} />
      <Capabilities copy={copy.capabilities} items={capabilities} />
      <AboutScene copy={copy.about} locale={locale} />
      <ContactScene copy={copy.contact} cycle={showcase.contactCycle} />
    </>
  )
}
