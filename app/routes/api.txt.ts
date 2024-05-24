import { readFiles } from "@/lib/scan.queue"

export async function loader() {
  const data = await readFiles('/hdd/media/tv')
  return data
}
