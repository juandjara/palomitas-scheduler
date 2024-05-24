import Container from "@/components/Container"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { SORT_KEYS, TVResult, formatImage, formatYear } from "@/lib/tv.config"
import { SortKey, SortType, saveSeries, searchTVSeries } from "@/lib/tv.server"
import { ActionFunctionArgs, LoaderFunctionArgs, redirect } from "@remix-run/node"
import { Form, Link, useLoaderData, useNavigation, useSearchParams, useSubmit } from "@remix-run/react"
import clsx from "clsx"
import debounce from "just-debounce"
import { Search, ArrowLeft, Star } from "lucide-react"
import { useMemo, useState } from "react"

export async function loader({ request }: LoaderFunctionArgs) {
  const sp = new URL(request.url).searchParams
  const q = sp.get('q') || ''
  const sort_key = (sp.get('sort_key') || 'trending') as SortKey
  const sort_type = (sp.get('sort_type') || 'desc') as SortType

  const langHeader = request.headers.get('Accept-Language')
  const language = langHeader ? langHeader.split(',')[0] : 'en-US'

  const results = await searchTVSeries({
    query: q,
    sort_key,
    sort_type,
    language
  })

  return { results }
}

export async function action({ request }: ActionFunctionArgs) {
  const fd = await request.formData()
  const prev = fd.get('prev') as string
  const result = fd.get('result')

  if (!result) {
    throw new Response('Result is required', { status: 400 })
  }

  const data = JSON.parse(result as string) as TVResult
  const prevId = prev ? Number(prev) : undefined

  await saveSeries(data, prevId)

  return redirect(`/series/${data.id}`)
}

export default function SearchPage() {
  const { results } = useLoaderData<typeof loader>()
  const [sp] = useSearchParams()
  const q = sp.get('q') || ''
  const sortKey = sp.get('sort_key') || 'trending'
  const sortType = sp.get('sort_type') || 'desc'
  const prevId = sp.get('prev')

  const { state } = useNavigation()
  const busy = state !== 'idle'
  const submit = useSubmit()
  const debouncedSubmit = useMemo(() => debounce(submit, 500), [submit])
  const [selection, setSelection] = useState<number>(prevId ? Number(prevId) : -1)

  return (
    <Container className="px-1">
      <Link to="/">
        <Button variant="outline" size="sm" className="flex gap-2 mb-4">
          <ArrowLeft size={20} />
          <p>Back</p>
        </Button>
      </Link>
      <h2 className="text-2xl font-medium mb-4">Add new series</h2>
      <Form
        className="flex flex-wrap gap-3 items-center"
        onChange={(ev) => {
          const data = new FormData(ev.currentTarget)
          submit(data)
        }}
      >
        <div className="flex-grow">
          <Label htmlFor="q">
            Search the new series you want to add by title
          </Label>
          <div className="relative">
            <Input
              id="q"
              name="q"
              type="search"
              placeholder="Search series"
              defaultValue={q}
              disabled={busy}
              onChange={(ev) => {
                ev.stopPropagation()
                debouncedSubmit(ev.currentTarget.form)
              }}
            />
            <Search className="absolute top-2 right-2" />
          </div>
        </div>
        <div>
          <Label htmlFor="sort_key" className="block">
            Sort by
          </Label>
          <select
            id="sort_key"
            name="sort_key"
            className="mr-3 text-sm px-2 py-2 border border-gray-300 rounded-md"
            defaultValue={sortKey}
            disabled={busy}
          >
            {SORT_KEYS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <select
            id="sort_type"
            name="sort_type"
            className="text-sm px-2 py-2 border border-gray-300 rounded-md"
            defaultValue={sortType}
            disabled={busy}
          >
            <option value="desc">Desc</option>
            <option value="asc">Asc</option>
          </select>
        </div>
      </Form>
      {results.length === 0 && (
        <p className="text-center mt-4 text-muted-foreground">
          No results found
        </p>
      )}
      <Form method="POST" className="sticky top-2 z-20 mt-5">
        <input type="hidden" name="prev" value={prevId || ""} />
        <input
          type="hidden"
          name="result"
          value={
            selection
              ? JSON.stringify(results.find((d) => d.id === selection))
              : ""
          }
        />
        <Button disabled={!selection || busy}>
          {busy ? "Saving..." : prevId ? "Update series" : "Add series"}
        </Button>
      </Form>
      <ul className="mt-5">
        {results.map((d) => (
          <li
            key={d.id}
            className={clsx(
              "relative group flex flex-wrap md:flex-nowrap border shadow-sm rounded-md mb-5",
              selection === d.id ? "bg-primary/10" : "bg-white"
            )}
          >
            <div
              className={clsx(
                "flex-shrink-0 overflow-hidden relative w-full md:w-auto",
                "rounded-t-md md:rounded-l-md bg-gray-200"
              )}
            >
              <img
                src={formatImage(d.backdrop_path, "w300")}
                alt={d.name}
                loading="lazy"
                className={clsx(
                  "w-full md:w-auto md:h-full object-cover",
                  "transition-transform duration-300 transform group-hover:scale-110"
                )}
              />
            </div>
            <div className="flex-grow p-4">
              <p className="text-xl text-card-foreground font-medium mb-2">
                {d.name}{" "}
                <span className="text-base font-normal text-muted-foreground">
                  {formatYear(d.first_air_date)}
                </span>
              </p>
              <p className="text-sm flex gap-1 items-center mb-2">
                <Star color="orange" size={20} />
                <span>{d.vote_average.toFixed(2)} </span>
              </p>
              <p>{d.overview}</p>
            </div>
            <button
              onClick={() => setSelection(d.id)}
              className="absolute inset-0 block w-full"
            >
              <span className="sr-only">Select {d.name}</span>
            </button>
          </li>
        ))}
      </ul>
    </Container>
  )
}
