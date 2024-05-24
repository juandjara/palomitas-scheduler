import { registerQueue } from './queue.server'
import fs from 'fs/promises'
import path from 'path'
import { searchTVSeries } from './tv.server'

export type ScanPayload = {
  path: string
  language?: string
}

export type SeriesFSInfo = {
  name: string
  numSeasons: number
  numEpisodes: number
  size: number
  files: string[]
}

export async function readFiles(root: string) {
  const _path = path.join(process.cwd(), 'list.txt')
  const list = await fs.readFile(_path, 'utf-8')
  const lines = list.split('\n')

  const sizeMap = new Map<string, number>()
  const seasonMap = new Map<string, string[]>()
  const seriesMap = new Map<string, string[]>()

  for (const line of lines) {
    const [size, _path] = line.split('	')
    const relPath = _path.replace(`${root}/`, '')
    const parts = relPath.split('/').filter(Boolean)
    const filename = parts.pop()!
    const isFile = /\.\w+$/.test(filename)
    const extension = filename && filename.split('.').pop()!
    const isSubtitle = ['srt', 'vtt', 'ass'].includes(extension)

    if (!isFile || isSubtitle) {
      continue
    }

    sizeMap.set(relPath, Number(size))

    const [series, season] = parts
    const hasSeason = !!season
    if (!seriesMap.has(series)) {
      seriesMap.set(series, [])
    }
    seriesMap.get(series)!.push(relPath)

    if (hasSeason) {
      if (!seasonMap.has(series)) {
        seasonMap.set(series, [])
      }
      seasonMap.get(series)!.push(season)
    }
  }

  const series = [] as SeriesFSInfo[]

  for (const [seriesKey, files] of seriesMap) {
    const numSeasons = new Set(seasonMap.get(seriesKey) ?? []).size || 1
    let size = 0
    for (const file of files) {
      size += sizeMap.get(file)!
    }
    series.push({
      name: seriesKey,
      numSeasons,
      numEpisodes: files.length,
      size,
      files,
    })
  }

  return series
}

export const scanQueue = registerQueue<ScanPayload>('scan', async (job) => {
  const root = job.data.path
  const language = job.data.language || ''
  const files = await readFiles(root)
  const results = []

  for (const file of files) {
    job.log(`Processing ${file.name}`)
    const [year] = file.name.match(/(\d{4})/) || []

    const res = await searchTVSeries({
      language,
      sort_key: 'trending',
      sort_type: 'desc',
      query: year ? file.name.replace(year, '').trim() : file.name,
      primary_release_year: year ? Number(year.replace(')', '').replace('(', '')) : undefined,
    })
    results.push({
      file,
      results: res.slice(0, 5)
    })
    await job.updateProgress((files.indexOf(file) + 1) / files.length)
  }

  return results
})
