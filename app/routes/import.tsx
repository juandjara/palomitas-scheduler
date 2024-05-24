import Container from "@/components/Container"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { SeriesFSInfo, scanQueue } from "@/lib/scan.queue"
import { getLibraryFolders } from "@/lib/settings.server"
import { TVResult, formatImage, formatYear } from "@/lib/tv.config"
import { getLanguage, saveBatchSeries } from "@/lib/tv.server"
import { ActionFunctionArgs, redirect } from "@remix-run/node"
import { useLoaderData, Link, Form, useNavigation } from "@remix-run/react"
import { ArrowLeft } from "lucide-react"
import { useMemo, useState } from "react"

export async function loader() {
  const job = await scanQueue.getJob('import')
  return {
    job: job?.asJSON() ?? null,
    libraryFolders: await getLibraryFolders()
  }
}

export async function action({ request }: ActionFunctionArgs) {
  const fd = await request.formData()
  const action = fd.get('action')

  if (action === 'scan') {
    const libraryFolder = fd.get('libraryFolder')
    if (!libraryFolder) {
      throw new Response('Library folder is required', { status: 400 })
    }
  
    // TODO: check libraryFolder exists in FS
    const language = getLanguage(request)
  
    const job = await scanQueue.add('import', { language, path: libraryFolder }, { jobId: 'import' })
    return {
      id: job.id,
      timestamp: job.timestamp,
    }
  }

  if (action === 'import') {
    const selection = JSON.parse(fd.get('selection') as string ?? '[]') as boolean[]
    const indexes = JSON.parse(fd.get('indexes') as string ?? '[]') as number[]
    const job = await scanQueue.getJob('import')
    if (!job) {
      throw new Response('Job not found', { status: 404 })
    }

    const series = job.returnvalue as { file: SeriesFSInfo; results: TVResult[] }[]
    const selectedResults = series
      .map((s, index) => ({
        tvInfo: s.results[indexes[index] ?? 0],
        fsInfo: s.file,
      }))
      .filter((_, index) => selection[index] !== false)

    await saveBatchSeries(selectedResults)
    await job.remove()

    return redirect('/')
  }

  return null
}

export default function Import() {
  const { state } = useNavigation()
  const busy = state !== 'idle'

  const { job, libraryFolders } = useLoaderData<typeof loader>()
  const data = useMemo(() => {
    const series = JSON.parse(job?.returnvalue ?? '[]') as { file: SeriesFSInfo; results: TVResult[] }[]
    return series.map((s) => ({
      series: s.file,
      results: s.results as TVResult[]
    }))
  }, [job?.returnvalue])

  const [selection, setSelection] = useState([] as boolean[])
  const [indexes, setIndexes] = useState([] as number[])

  const numSelected = data.length - selection.filter((b) => b === false).length

  function getResult(dIndex: number) {
    const d = data[dIndex]
    const result = d?.results[indexes[dIndex] ?? 0]
    return result
  }

  return (
    <Container>
      <Link to='/'>
        <Button variant="outline" size='sm' className="flex gap-2 mb-4">
          <ArrowLeft size={20} />
          <p>Back</p>
        </Button>
      </Link>
      <h2 className="text-2xl font-medium mb-4">Import from disc</h2>
      {job?.returnvalue ? (
        <Form method="POST">
          <p className="text-lg mb-4 text-muted-foreground">
            Found {data.length} series in the library folder
          </p>
          <input type="hidden" name="selection" value={JSON.stringify(selection)} />
          <input type="hidden" name="indexes" value={JSON.stringify(indexes)} />
          <div className="sticky top-2 py-2">
            <Button
              name="action"
              value="import"
              type="submit"
              disabled={busy || numSelected === 0}
            >
              {busy ? 'Importing...' : `Import ${numSelected} series`}
            </Button>
          </div>
          <ul className="divide-y-2">
            {data.map((d, dIndex) => (
              <li key={d.series.name} className="flex flex-wrap md:flex-nowrap gap-4 py-5">
                <div>
                  <input
                    type="checkbox"
                    className="rounded-xl w-6 h-6"
                    checked={selection[dIndex] ?? true}
                    onChange={(e) => {
                      setSelection((prev) => {
                        prev[dIndex] = e.target.checked
                        return [...prev]
                      })
                    }}
                  />
                </div>
                <div className="flex-grow">
                  <p className="text-lg font-medium">{d.series.name}</p>
                  {d.results.length > 0 ? (
                    <select
                      value={indexes[dIndex]}
                      onChange={(e) => {
                        const newIndex = Number(e.target.value)
                        setIndexes((prev) => {
                          prev[dIndex] = newIndex
                          return [...prev]
                        })
                      }}
                      className="px-2 py-1 my-3 rounded-md"
                    >
                      {d.results.map((r, index) => (
                        <option key={r.id} value={index}>
                          {r.name} {formatYear(r.first_air_date)}
                        </option>
                      ))}
                    </select>
                  ) : null}
                  <div></div>
                  <p>{getResult(dIndex)?.overview}</p>
                </div>
                {getResult(dIndex) ? (
                  <div className="flex-shrink-0">
                    <img
                      alt=""
                      className="rounded-md bg-gray-200"
                      src={formatImage(getResult(dIndex).backdrop_path, 'w300')}
                      width={300}
                      height={200}
                      loading="lazy"
                    />
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        </Form>
      ) : (        
        <Form method="POST">
          <p className="text-lg mb-6 text-muted-foreground">
            Select a library folder to import series from
          </p>
          <div className="my-6">
            <Label htmlFor="libraryFolder">Library Folder</Label>
            <select className="px-2 py-1 rounded-md" id="libraryFolder" name="libraryFolder">
              {libraryFolders.map((folder) => (
                <option key={folder} value={folder}>
                  {folder}
                </option>
              ))}
            </select>
          </div>
          {libraryFolders.length === 0 && (
            <p className="my-2">
              You have not added any library folders.
              Please <Link className="underline" to="/library-folders">add a library folder</Link> to import series from
            </p>
          )}
          <Button
            disabled={busy || libraryFolders.length === 0}
            type="submit"
            name="action"
            value="scan"
          >
            {busy ? 'Scanning folder...' : 'Scan folder'}
          </Button>
        </Form>
      )}
    </Container>
  )
}
