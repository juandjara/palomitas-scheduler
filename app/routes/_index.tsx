import Container from "@/components/Container"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { formatImage, formatYear } from "@/lib/tv.config"
import { Form, Link, useLoaderData, useNavigation, useSearchParams, useSubmit } from "@remix-run/react"
import clsx from "clsx"
import { Search } from "lucide-react"
import debounce from 'just-debounce'
import { useMemo } from "react"
import { LoaderFunctionArgs } from "@remix-run/node"
import { getSeriesList } from "@/lib/tv.server"

export async function loader({ request }: LoaderFunctionArgs) {
  const sp = new URL(request.url).searchParams
  const q = sp.get('q') || ''
  const sort = sp.get('sort') || 'asc'

  const series = await getSeriesList()
  const filteredSeries = series
    .filter((s) => q ? s.name.toLowerCase().includes(q.toLowerCase()) : true)
    .sort((a, b) => {
      if (sort === 'asc') {
        return a.name.localeCompare(b.name)
      }
      return b.name.localeCompare(a.name)
    })

  return {
    series: filteredSeries
  }
}

export default function Index() {
  const { series } = useLoaderData<typeof loader>()
  const { state } = useNavigation()
  const busy = state !== 'idle'
  const [sp] = useSearchParams()
  const q = sp.get('q') || ''
  const sort = sp.get('sort') || 'asc'

  const submit = useSubmit()
  const debouncedSubmit = useMemo(() => debounce(submit, 500), [submit])

  return (
    <Container>
      <Form onChange={(ev) => {
        const data = new FormData(ev.currentTarget)
        submit(data)
      }}>
        <header className="flex flex-wrap gap-3 items-center mb-4">
          <h1 className="text-2xl font-semibold">My Library</h1>
          <div className="flex-grow"></div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Sort by:</span>
            <select
              className="text-sm px-2 py-1 border border-gray-300 rounded-md"
              name="sort"
              id="sort"
              defaultValue={sort}
              disabled={busy}
            >
              <option value="asc">A-Z</option>
              <option value="desc">Z-A</option>
            </select>
          </div>
          <div className="relative">
            <Input
              id="q"
              name="q"
              type="search"
              placeholder="Search by title"
              disabled={busy}
              defaultValue={q}
              onChange={(ev) => {
                ev.stopPropagation()
                debouncedSubmit(ev.currentTarget.form)
              }}
            />
            <Search className="absolute top-2 right-2" color='hsl(var(--muted-foreground))' />
          </div>
          <Link to='/search'>
            <Button size='sm'>Add new</Button>
          </Link>
          <Link to='/import'>
            <Button variant='secondary' size='sm'>Import</Button>
          </Link>
        </header>
      </Form>
      {series.length === 0 && (
        <>        
          <p className="mb-3 text-center">You have no series in your library</p>
          <div className="mx-auto text-center">
            <Link to='/search'>
              <Button className="mx-1" size='sm'>Add some</Button>
            </Link>
            <span> or </span>
            <Link to='/import'>
              <Button className="mx-1" size='sm'>Import from disc</Button>
            </Link>
          </div>
        </>
      )}
      <ul className="flex flex-wrap gap-3 justify-center items-stretch">
        {series.map((s) => (
          <li key={s.id} className="relative group">
            <div className="bg-white rounded-lg shadow-md border h-full w-[300px]">
              <div className="overflow-hidden relative rounded-t-lg">
                <img
                  src={formatImage(s.poster_path, 'w300')}
                  alt={s.name}
                  loading='lazy'
                  className={clsx(
                    'aspect-[3/4.5] w-full object-cover -z-10',
                    'transition-transform duration-300 transform group-hover:scale-110'
                  )}
                />
              </div>
              <div className="p-3 pt-2">
                <h3 className="text-lg font-semibold">{s.name}</h3>
                <p className="text-sm font-normal text-muted-foreground">
                  {formatYear(s.first_air_date)}
                </p>
              </div>
            </div>
            <Link to={`/series/${s.id}`} className="absolute inset-0">
              <span className="sr-only">{s.name}</span>
            </Link>
          </li>
        ))}
      </ul>
    </Container>
  )
}
