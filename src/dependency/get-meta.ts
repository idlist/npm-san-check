import type { NetworkIssue, SanCheckOptions } from '@src/types'
import normalizeUrl from 'normalize-url'

export interface PackageMeta {
  latest: string
  versions: string[]
}

export async function getPackageMeta(
  name: string,
  options: SanCheckOptions,
): Promise<PackageMeta | NetworkIssue> {
  if (options.provider === 'npm') {
    return await getMetaFromNpm(name, options)
  }
  if (options.provider === 'jsd') {
    return await getMetaFromJsDelivr(name)
  }
  return 'no-provider'
}

interface PartialNpmMeta {
  'dist-tags': {
    latest: string
  }
  versions: {
    [prop: string]: {
      deprecated: string
    }
  }
}

async function getMetaFromNpm(
  name: string,
  options: SanCheckOptions,
): Promise<PackageMeta | NetworkIssue> {
  const url = normalizeUrl(`${options.registry}/${name}`)
  let json: any = null

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/vnd.npm.install-v1+json',
      },
    })
    json = await response.json()
  } catch {
    return 'failed'
  }

  if (json == null) return 'failed'
  if (!('dist-tag' in json) || !('version' in json)) return 'invalid'

  const meta = json as PartialNpmMeta
  const latest = meta['dist-tags'].latest
  const versions = Object.keys(meta.versions)
    .filter((key) => !meta.versions[key].deprecated)

  return { latest, versions }
}

interface PartialJsDelivrMeta {
  tags: {
    latest: string
  }
  versions: string[]
}

const jsDelivrEndpoint = `https://data.jsdelivr.com/v1/package/npm`

async function getMetaFromJsDelivr(
  name: string,
): Promise<PackageMeta | NetworkIssue> {
  const url = normalizeUrl(`${jsDelivrEndpoint}/${name}`)
  let json: any = null

  try {
    const response = await fetch(url, {
      method: 'GET',
    })
    json = response.json()
  } catch {
    return 'failed'
  }

  if (json == null) return 'failed'
  if (!('tag' in json) || !('version' in json)) return 'invalid'

  const meta = json as PartialJsDelivrMeta
  const latest = meta.tags.latest
  const versions = meta.versions

  return { latest, versions }
}
