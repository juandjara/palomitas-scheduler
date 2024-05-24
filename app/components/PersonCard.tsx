import { CreditsItem, formatImage } from '@/lib/tv.config'

export default function PersonCard({ person }: { person: CreditsItem }) {
  return (
    <li className="flex gap-2 items-center px-2 bg-white text-gray-700">
      <div className="flex-shrink-0 m-2 w-20 h-20 rounded-full">
        <img
          alt="avatar"
          className="rounded-full w-full h-full object-cover"
          src={formatImage(person.profile_path, 'w185')}
        />
      </div>
      <div className="px-1">
        <p className="font-medium">{person.character}</p>
        <p className="text-gray-400">{person.name}</p>
      </div>
    </li>
  )
}
