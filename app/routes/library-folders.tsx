import Container from "@/components/Container"
import { Button } from "@/components/ui/button"
import { getLibraryFolders } from "@/lib/settings.server"
import { useLoaderData } from "@remix-run/react"
import { X as Close } from 'lucide-react'

export async function loader() {
  return {
    libraryFolders: await getLibraryFolders()
  }
}

export default function LibraryFolders() {
  const { libraryFolders } = useLoaderData<typeof loader>()
  return (
    <Container>
      <h2 className="text-2xl font-medium">Library Folders</h2>
      <ul className="divide-y my-6">
        {libraryFolders.map((folder) => (
          <li key={folder} className="p-3 hover:bg-gray-100 flex items-center">
            <p className="flex-grow">{folder}</p>
            <Button variant='ghost' size='icon'>
              <Close />              
            </Button>
          </li>
        ))}
      </ul>
      <Button>
        Add Folder
      </Button>
    </Container>
  )
}
