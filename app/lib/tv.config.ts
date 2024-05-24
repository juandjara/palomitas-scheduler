
export const TMDB_API_URL = 'https://api.themoviedb.org/3'
export const TMDB_IMAGE_URL = 'https://image.tmdb.org/t/p'

export const SORT_KEYS = [
  { label: 'Tredning', value: 'trending' },
  { label: 'Popularity', value: 'popularity' },
  { label: 'Vote average', value: 'vote_average' },
  { label: 'Air date', value: 'first_air_date' },
  { label: 'Title', value: 'title' }
] as const
export const SORT_TYPES = [
  { label: 'De mayor a menor', value: 'desc' },
  { label: 'De menor a mayor', value: 'asc' }
] as const

export type TVResult = {
  adult: boolean
  backdrop_path: string
  first_air_date: string // YYYY-MM-DD
  genre_ids: number[]
  id: number
  name: string
  origin_country: string[]
  original_language: string
  overview: string
  popularity: number
  poster_path: string
  vote_average: number
  vote_count: number
}

export type ExternalIDs = {
  id: number
  freebase_mid: string
  freebase_id: string
  imdb_id: string
  tvrage_id: number
  wikidata_id: string
  facebook_id: string
  instagram_id: string
  tiktok_id: string
  twitter_id: string
  youtube_id: string
}

export type RegionWatchProvider = {
  link: string
  flatrate: WatchProviderItem
  rent: WatchProviderItem
  buy: WatchProviderItem
  ads: WatchProviderItem
}

type WatchProviderItem = {
  logo_path: string
  provider_id: number
  provider_name: string
  display_priority: number
}

export type WatchProviders = {
  id: number
  results: Record<string, RegionWatchProvider> // keys are lang codes with 2 chars
}

export type Credits = {
  id: number
  cast: CreditsItem[]
  crew: CreditsItem[]
}

export type CreditsItem = {
  adult: boolean
  gender: number
  id: number
  known_for_department: string
  name: string
  original_name: string
  popularity: number
  profile_path: string
  character?: string
  credit_id: string
  order?: number
}

export type Network = {
  name: string
  id: number
  logo_path: string
  origin_country: string
}

export type TVSeason = {
  air_date: string
  episode_count: number
  id: number
  name: string
  overview: string
  poster_path: string
  season_number: number
  vote_average: number
}

export type TVEpisode = {
  air_date: string
  episode_number: number
  id: number
  name: string
  overview: string
  production_code: string
  runtime: number
  season_number: number
  show_id: number
  still_path: string
  vote_average: number
  vote_count: number
  crew: CreditsItem[]
  guest_stars: CreditsItem[]
}

export type ExtendedTVSeason = TVSeason & {
  _id: string
  episodes: TVEpisode[]
}

export type ExtendedTVResult = TVResult & {
  original_name: string
  genres: { id: number; name: string }[]
  networks: Network[]
  external_ids: ExternalIDs
  'watch/providers': WatchProviders
  credits: Credits
  episode_run_time: number[]
  in_production: boolean
  last_air_date: string
  next_episode_to_air: string
  number_of_episodes: number
  number_of_seasons: number
  status: string
  tagline: string
  type: string
  seasons: TVSeason[]
  production_companies: Network[]
}


export function formatImage(image: string, widthConfig: string) {
  if (!image || !widthConfig || image.startsWith('http')) {
    return image
  }
  return `${TMDB_IMAGE_URL}/${widthConfig}${image}`
}

export function formatYear(date: string) {
  return date ? `(${new Date(date).getFullYear()})` : '(unreleased)'
}
