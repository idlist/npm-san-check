import type { SanCheckOptions } from '@src/types'
import normalizeUrl from 'normalize-url'

export interface PackageMeta {
  latest: string
  versions: string[]
}

export async function getPackageMeta(
  name: string,
  options: SanCheckOptions,
): Promise<PackageMeta | null> {
  if (options.provider === 'npm') {
    return await getMetaFromNpm(name, options)
  }
  if (options.provider === 'jsd') {
    return await getMetaFromJsDelivr(name)
  }
  return null
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
): Promise<PackageMeta> {
  const url = normalizeUrl(`${options.registry}/${name}`)
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Accept: 'application/vnd.npm.install-v1+json',
    },
  })

  const json = await response.json() as PartialNpmMeta
  const latest = json['dist-tags'].latest
  const versions = Object.keys(json.versions)
    .filter((key) => !json.versions[key].deprecated)

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
): Promise<PackageMeta> {
  const url = normalizeUrl(`${jsDelivrEndpoint}/${name}`)
  const response = await fetch(url, {
    method: 'GET',
  })

  const json = await response.json() as PartialJsDelivrMeta
  const latest = json.tags.latest
  const versions = json.versions

  return { latest, versions }
}
