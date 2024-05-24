import { getJSON } from "@/json"
import { TMDB_API_KEY } from "./config.server"
import { TMDB_API_URL, TVResult, ExtendedTVResult, ExtendedTVSeason } from "./tv.config"
import { redis } from "./redis.server"
import { SeriesFSInfo } from "./scan.queue"

export type SortKey = 'trending' | 'popularity' | 'vote_average' | 'first_air_date' | 'title'
export type SortType = 'asc' | 'desc'

type SearchTVParams = {
  sort_key: SortKey
  sort_type: SortType
  language: string
  page?: number
  query?: string
  with_genres?: string
  with_networks?: string
  primary_release_year?: number
}

const defaultParams = {
  include_adult: 'false',
  include_video: 'false',
  'vote_count.gte': '5',
  sort_key: 'trending',
  sort_type: 'desc',
  // language: 'es-ES',
}

export async function searchTVSeries(params: SearchTVParams) {
  const { sort_key, sort_type, with_genres = '', with_networks = '' } = params
  const hasNotDefaultSort = sort_key !== defaultParams.sort_key || sort_type !== defaultParams.sort_type
  const hasFilters = hasNotDefaultSort || !!with_genres || !!with_networks

  let url = `${TMDB_API_URL}/trending/tv/week`
  if (hasFilters) {
    url = `${TMDB_API_URL}/discover/tv`
  }
  if (params.query) {
    url = `${TMDB_API_URL}/search/tv`
  }

  const urlParams = {
    api_key: TMDB_API_KEY,
    ...defaultParams,
    ...params,
    sort_by: `${sort_key || defaultParams.sort_key}.${sort_type || defaultParams.sort_type}`,
    page: String(params.page || 1),
    primary_release_year: String(params.primary_release_year || ''),
  }

  const res = await getJSON<{ results: TVResult[] }>(`${url}?${new URLSearchParams(urlParams)}`)
  return res.results
}

type DetailsTVParams = {
  id: number
  language: string
}

export async function getTVSeries(params: DetailsTVParams) {
  const urlParams = {
    language: params.language,
    api_key: TMDB_API_KEY,
    append_to_response: 'external_ids,watch/providers,credits'
  }

  const url = `${TMDB_API_URL}/tv/${params.id}`
  const data = await getJSON<ExtendedTVResult>(`${url}?${new URLSearchParams(urlParams)}`)
  data.seasons.reverse()

  return data
}

export async function getSeason(params: { id: number; season_number: number; language: string }) {
  const urlParams = {
    language: params.language,
    api_key: TMDB_API_KEY,
  }

  const url = `${TMDB_API_URL}/tv/${params.id}/season/${params.season_number}`
  const data = await getJSON<ExtendedTVSeason>(`${url}?${new URLSearchParams(urlParams)}`)
  return data
}

export function getLanguage(request: Request) {
  const langHeader = request.headers.get('Accept-Language')
  const language = langHeader ? langHeader.split(',')[0] : 'en-US'
  return language
}

export async function getSeriesFSInfo(id: number) {
  const fsInfo = await redis.get(`series:${id}:fsInfo`)
  return fsInfo ? JSON.parse(fsInfo) as SeriesFSInfo : null
}

export async function getSeriesList() {
  const seriesIds = await redis.smembers('series')
  const seriesStr = await redis.mget(...seriesIds.map((id) => `series:${id}:tvInfo`))
  const series = seriesStr
    .filter(Boolean)
    .map((s) => JSON.parse(s!) as TVResult)

  return series
}

export async function saveSeries(result: TVResult, prevId?: number) {
  if (prevId) {
    await redis.srem('series', prevId)
    await redis.del(`series:${prevId}:fsInfo`)
    await redis.del(`series:${prevId}:tvInfo`)
  }

  await redis.sadd('series', result.id)
  await redis.set(`series:${result.id}:tvInfo`, JSON.stringify(result))
}

export async function saveBatchSeries(series: { tvInfo: TVResult; fsInfo: SeriesFSInfo }[]) {
  await redis.sadd('series', series.map((r) => r.tvInfo.id))
  await redis.mset(
    ...series.flatMap((r) => [
      `series:${r.tvInfo.id}:fsInfo`,
      JSON.stringify(r.fsInfo),
      `series:${r.tvInfo.id}:tvInfo`,
      JSON.stringify(r.tvInfo),
    ])
  )
}
