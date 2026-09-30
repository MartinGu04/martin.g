import 'server-only'
import type { ConfidentialProject, Project, PublicProject } from './schema'
import { on } from './projects/on'
import { miMaMo } from './projects/mi-ma-mo'
import { confidential01, confidential02 } from './projects/confidential'

/** Adding a project: create its module in ./projects and list it here. */
const registry: readonly Project[] = [on, miMaMo, confidential01, confidential02]

const byOrder = <T extends Project>(a: T, b: T) => a.order - b.order

/** Drafts are filtered here, at the data layer, so they are never rendered or built. */
export function getPublishedProjects(): Project[] {
  return registry.filter((p) => p.status === 'published').sort(byOrder)
}

export function getPublicProjects(): PublicProject[] {
  return getPublishedProjects().filter((p): p is PublicProject => p.visibility === 'public')
}

export function getConfidentialProjects(): ConfidentialProject[] {
  return getPublishedProjects().filter(
    (p): p is ConfidentialProject => p.visibility === 'confidential',
  )
}

/** Only public, published projects have routes. */
export function getPublicProject(slug: string): PublicProject | undefined {
  return getPublicProjects().find((p) => p.id === slug)
}

/** Every registered project, drafts included. For build-time checks only. */
export function getAllProjectsForChecks(): readonly Project[] {
  return registry
}
