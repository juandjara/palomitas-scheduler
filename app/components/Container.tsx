import Nav from "./Nav"

export default function Container({ children, ...props }: React.HTMLProps<HTMLDivElement> & {
  children: React.ReactNode 
}) {
  return (
    <div className="mx-auto py-6 px-3 max-w-screen-xl">
      <h1 className="text-2xl italic mb-4">Palomitas Scheduler</h1>
      <Nav />
      <main {...props}>{children}</main>
    </div>
  )
}
