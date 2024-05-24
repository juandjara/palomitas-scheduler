import { Link } from "@remix-run/react"

const LINKS = [
  { to: "/", text: "Home" },
  { to: "/downloads", text: "Downloads" },
  { to: "/settings", text: "Settings" },
]

export default function Nav() {
  return (
    <nav>
      <ul className="flex items-center gap-2 mb-6">
        {LINKS.map((link) => (
          <li key={link.to}>
            <Link className="px-2 py-1 rounded-md bg-secondary text-secondary-foreground" to={link.to}>{link.text}</Link>
          </li>
        ))}
      </ul>
    </nav>
  )
}
