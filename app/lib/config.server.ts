import invariant from "tiny-invariant"

export const TMDB_API_KEY = process.env.TMDB_API_KEY as string
invariant(TMDB_API_KEY, 'TMDB_API_KEY is not set')
