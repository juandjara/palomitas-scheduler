import {
  Link,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  isRouteErrorResponse,
  useRouteError,
} from "@remix-run/react"
import styles from "./globals.css?url"
import { LinksFunction } from "@remix-run/node"
import GlobalSpinner from "./components/GlobalSpinner"
import { Button } from "./components/ui/button"

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: styles },
]

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Palomitas Scheduler</title>
        <Meta />
        <Links />
      </head>
      <body className="dots">
        <GlobalSpinner />
        <div className="star-shadow"></div>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  )
}

export function ErrorBoundary() {
  const error = useRouteError()
  const isRouteError = isRouteErrorResponse(error)

  return (
    <div className="flex flex-col text-center items-center justify-center h-screen">
      <h1 className="text-4xl mb-4 font-bold text-rose-500">Error</h1>
      {isRouteError ? (
        <div>
          <p className="text-xl font-medium text-gray-600 mb-1">
            {error.status} {error.statusText}
          </p>
          {error.data && (
            <pre className="text-sm text-gray-600">
              {JSON.stringify(error.data, null, 2)}
            </pre>
          )}            
        </div>
      ) : (
        <p className="text-lg text-gray-600">{(error as Error).message}</p>
      )}
      <Link to="/" className="mt-6">
        <Button size='lg'>Go home</Button>
      </Link>
    </div>
  )
}

export default function App() {
  return <Outlet />
}
