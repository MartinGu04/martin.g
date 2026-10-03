import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { isLocale } from '@/i18n/config'
import { pageMetadata, siteUrl } from '@/lib/site'
import { siteSocialImage } from '@/lib/social'
import { homeStructuredData, serializeJsonLd } from '@/lib/structured-data'
import { getDictionary } from '@/i18n/get-dictionary'
import { homeCopy } from '@/i18n/dictionaries/home'
import { showcaseCopy } from '@/i18n/dictionaries/showcase'
import { contactCopy } from '@/i18n/dictionaries/contact'
import { trustHref } from '@/lib/trust'
import { capabilityProof, type Evidence } from '@/content/capabilities'
import { getSiteProjectSequence } from '@/content/saved-copy'
import { onMedia } from '@/content/projects/on'
import { miMaMoMedia } from '@/content/projects/mi-ma-mo'
import { thread } from '@/content/worlds'
import { resolveConfidentialSummary, resolvePublicSummary } from '@/content/resolve'
import { HeroScene } from '@/components/home/HeroScene'
import { WorkBridge, type WorkChapter } from '@/components/home/WorkBridge'
import { OnWorld } from '@/components/home/OnWorld'
import { MiMaMoWorld } from '@/components/home/MiMaMoWorld'
import { ConfidentialScene } from '@/components/home/ConfidentialScene'
import { ProcessStage } from '@/components/home/ProcessStage'
import { Capabilities, type Capability } from '@/components/home/Capabilities'
import { AboutScene } from '@/components/home/AboutScene'
import { ContactScene } from '@/components/home/ContactScene'

export async function generateMetadata({ params }: PageProps<'/[locale]'>): Promise<Metadata> {
  const { locale } = await params
  if (!isLocale(locale)) return {}
  const { site } = getDictionary(locale)
  return pageMetadata({
    locale,
    path: '',
    title: { absolute: site.title },
    description: site.description,
    siteName: site.name,
    image: siteSocialImage(locale, site),
  })
}

/**
 * The homepage as one continuous sequence of scenes (docs/HOMEPAGE.md): identity, then
 * proposition, then proof, quickly; the deeper storytelling happens inside the worlds.
 *
 *   identity and principle (dark graphite)     one frame, timed beats
 *   index of the work (lighter graphite)       cut
 *   ON (cream, the retreat)                    soft wipe
 *   המחלבה, id mi-ma-mo (midnight, technical)  split in, split out
 *   Internal Systems (gunmetal)                 cut
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
  const sequence = await getSiteProjectSequence()

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

  const firstConfidential = confidential[0]
  const chapters: WorkChapter[] = [
    {
      href: '#on',
      number: on.number,
      title: on.title,
      identity: showcase.chapters.onIdentity,
      line: showcase.chapters.on,
      accent: thread.on,
      preview: { kind: 'image', src: onMedia.siteHome.src },
    },
    {
      href: '#mi-ma-mo',
      number: miMaMo.number,
      title: miMaMo.title,
      line: showcase.chapters.miMaMo,
      accent: thread.miMaMo,
      preview: { kind: 'image', src: miMaMoMedia.dashboard.src, position: 'right top' },
    },
    {
      href: '#confidential',
      number: confidential.map((item) => item.number).join('–'),
      title: dict.work.confidentialTitle,
      line: showcase.chapters.defense,
      accent: thread.defense,
      // The bridge previews this chapter with geometry only, whatever the covers are.
      preview: {
        kind: 'diagram',
        pattern:
          firstConfidential?.cover.kind === 'abstract' ? firstConfidential.cover.pattern : 'grid',
      },
    },
  ]

  const proof: Record<Evidence, Capability['evidence'][number]> = {
    on: { href: '#on', title: on.title },
    'mi-ma-mo': { href: '#mi-ma-mo', title: miMaMo.title },
    defense: { href: '#confidential', title: dict.work.confidentialTitle },
  }
  const capabilities: Capability[] = capabilityProof.map(({ key, evidence }) => ({
    key,
    label: dict.disciplines[key],
    statement: showcase.capabilities[key],
    evidence: evidence.map((place) => proof[place]),
  }))

  const structuredData = homeStructuredData({
    locale,
    origin: siteUrl(),
    siteName: dict.site.name,
    description: dict.site.description,
    person: { name: copy.about.name, role: copy.about.role },
  })

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(structuredData) }}
      />
      <HeroScene dict={dict} name={copy.about.name} role={copy.about.role} />

      <section id="work" aria-labelledby="work-title">
        <WorkBridge dict={dict} chapters={chapters} />
        <OnWorld project={on} dict={dict} showcase={showcase} locale={locale} />
        <MiMaMoWorld project={miMaMo} dict={dict} showcase={showcase} locale={locale} />
      </section>

      <ConfidentialScene items={confidential} dict={dict} />
      <ProcessStage copy={copy.process} />
      <Capabilities copy={copy.capabilities} items={capabilities} />
      <AboutScene copy={copy.about} marks={showcase.aboutMarks} locale={locale} />
      <ContactScene
        copy={copy.contact}
        cycle={showcase.contactCycle}
        action={{ label: contactCopy[locale].cta, href: trustHref(locale, 'contact') }}
      />
    </>
  )
}
