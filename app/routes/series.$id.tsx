import Container from "@/components/Container"
import PersonCard from "@/components/PersonCard"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Button } from "@/components/ui/button"
import { TVEpisode, formatImage, formatYear } from "@/lib/tv.config"
import {
  getLanguage,
  getSeason,
  getSeriesFSInfo,
  getTVSeries,
} from "@/lib/tv.server"
import { LoaderFunctionArgs } from "@remix-run/node"
import { Link, useLoaderData, useSearchParams } from "@remix-run/react"
import clsx from "clsx"
import { ArrowLeft, Edit3 as Edit, Star } from "lucide-react"

export async function loader({ request, params }: LoaderFunctionArgs) {
  const id = Number(params.id)
  const language = getLanguage(request)
  const series = await getTVSeries({ id, language })
  const fsInfo = await getSeriesFSInfo(id)

  const sp = new URL(request.url).searchParams
  const seasonNumber = sp.get("season")

  const season = seasonNumber
    ? await getSeason({ id, season_number: Number(seasonNumber), language })
    : null

  return { series, season, fsInfo }
}

export default function Series() {
  const { series, fsInfo } = useLoaderData<typeof loader>()
  return (
    <Container>
      <Link to="/">
        <Button variant="outline" size="sm" className="flex gap-2 mb-4">
          <ArrowLeft size={20} />
          <p>Back</p>
        </Button>
      </Link>
      <header
        className="relative rounded-t-md bg-cover bg-no-repeat bg-black bg-opacity-60 bg-blend-multiply"
        style={{
          backgroundImage: `url(${formatImage(series.backdrop_path, "w1280")})`,
        }}
      >
        <Link
          to={`/search?prev=${series.id}&q=${series.name}`}
          className="absolute top-2 right-2"
        >
          <Button variant="outline" size="sm" className="flex gap-2">
            <Edit size={20} />
            <p>Edit</p>
          </Button>
        </Link>
        <div className="flex flex-wrap gap-4 p-4 text-white">
          <img
            className="rounded-md"
            src={formatImage(series.poster_path, "w300")}
            alt={series.name}
          />
          <div>
            <p className="mb-1 text-lg font-medium">
              {formatYear(series.first_air_date)}
            </p>
            <h2 className="mb-1 text-4xl text-primary leading-tight font-semibold">
              <span>{series.name} </span>
              {series.original_name !== series.name && (
                <span className="text-lg font-medium text-gray-100">
                  {series.original_name}
                </span>
              )}
            </h2>
            <div className="text-xl flex gap-2 items-center mb-2">
              <Star className="text-yellow-200" />
              <span>{series.vote_average.toFixed(2)}</span>
              <p className="text-sm text-gray-300">
                {series.production_companies[0]?.name}
              </p>
            </div>
            <p className="mb-1 text-base">
              {series.genres.map((d) => d.name).join(", ")}
            </p>
            <p className="mb-1 text-lg">
              {series.episode_run_time.length > 0 &&
                `${series.episode_run_time.join(", ")} min - `}
              {series.status}
              {" - "}
              {series.number_of_episodes} Episodios, {series.number_of_seasons}{" "}
              Temporadas
            </p>
            <p className="text-2xl font-semibold italic mb-2 mt-6">
              {series.tagline}
            </p>
            <p className="text-base max-w-prose leading-relaxed">
              {series.overview}
            </p>
          </div>
        </div>
      </header>
      <div className="border rounded-b-md flex flex-wrap bg-white">
        <div className="w-full md:w-[300px] md:border-r">
          <p className="border-b p-4 text-xl font-semibold">Cast</p>
          <ul className="divide-y py-2" id="cast-list">
            {series.credits.cast.slice(0, 10).map((c) => (
              <PersonCard key={c.id} person={c} />
            ))}
          </ul>
        </div>
        <div className="flex-grow">
          <p className="border-b p-4 text-xl font-semibold">
            <span>Seasons</span>
            <span className="bg-orange-100 text-gray-600 rounded-sm ml-2 py-0.5 px-1 text-sm font-normal">
              {fsInfo?.numSeasons} / {series.seasons.length}
            </span>
            {fsInfo?.size && (
              <span className="text-gray-500 text-sm ml-2 font-medium">{formatSize(fsInfo?.size)}</span>
            )}
          </p>
          <SeasonList />
        </div>
      </div>
    </Container>
  )
}

function formatSize(size: number) {
  if (!size) return "0 B"
  const units = ["B", "KB", "MB", "GB", "TB"]
  let i = 0
  while (size >= 1024 && i < units.length - 1) {
    size /= 1024
    i++
  }
  return `${size.toFixed(2)} ${units[i]}`
}

function SeasonList() {
  const { series, season } = useLoaderData<typeof loader>()
  const [sp, setSP] = useSearchParams()
  const seasonNumber = (sp.get("season") as string) || ""

  function isOpen(s: number) {
    return season ? Number(seasonNumber) === s : false
  }

  return (
    <Accordion
      id="season-list"
      type="single"
      value={seasonNumber}
      onValueChange={(val) => {
        setSP(
          (prev) => {
            prev.set("season", val)
            return prev
          },
          { preventScrollReset: true }
        )
      }}
      collapsible
      className="w-full mb-4 p-3"
    >
      {series.seasons.map((s) => (
        <AccordionItem
          key={s.id}
          title={s.name}
          value={String(s.season_number)}
          className="border-b-0"
        >
          <AccordionTrigger
            className={clsx(
              "items-start text-left pl-1 p-2 border-b",
              "hover:no-underline hover:bg-orange-50 bg-white text-gray-700",
              "transition-colors duration-300 ease-in-out"
            )}
          >
            <div className="md:flex gap-4 justify-start items-start">
              <div
                className={clsx("mb-4 md:-m-2", {
                  "h-[120px] overflow-hidden": !isOpen(s.season_number),
                })}
              >
                <img
                  alt={s.name}
                  className="object-contain mx-auto"
                  src={formatImage(s.poster_path, "w185")}
                />
              </div>
              <div className="flex-grow">
                <p className="font-medium">{s.name}</p>
                <p className="text-gray-400">{s.episode_count} Episodes</p>
                {isOpen(s.season_number) && (
                  <p className="max-w-prose text-base mt-3">
                    {season?.overview}
                  </p>
                )}
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="">
            <p className="mb-2 mt-6 font-medium">Episodes</p>
            {season?.episodes ? (
              <EpisodeList
                eps={season?.episodes}
                isOpen={isOpen(s.season_number)}
              />
            ) : null}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  )
}

function EpisodeList({ eps, isOpen }: { eps: TVEpisode[]; isOpen: boolean }) {
  return (
    <ul
      id="episode-list"
      className={clsx(
        "divide-y border mt-2",
        "transition-all duration-300 ease-in-out overflow-hidden",
        isOpen ? "max-h-[8000px]" : "max-h-0"
      )}
    >
      {eps.map((e) => (
        <li
          key={e.id}
          className={clsx(
            "md:flex gap-2 items-start",
            "bg-white text-gray-700 hover:bg-orange-50",
            "transition-colors duration-300 ease-in-out"
          )}
        >
          {e.still_path ? (
            <img
              alt={`${e.name} screenshot`}
              className="w-32 h-32 object-cover"
              src={formatImage(e.still_path, "w185")}
            />
          ) : <div className="w-32 h-32 bg-gray-100"></div>}
          <div className="px-2 md:px-1 py-2">
            <p className="font-medium">{e.name}</p>
            <p className="text-gray-400">
              {new Date(e.air_date).toLocaleDateString(undefined, {
                dateStyle: 'medium'
              })}
            </p>
            <p className="max-w-prose text-base my-3">{e.overview}</p>
          </div>
        </li>
      ))}
    </ul>
  )
}
