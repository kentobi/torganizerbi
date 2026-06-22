import { driveRequest, getOrCreateFolder } from './drive'

const DRIVE_BASE = 'https://www.googleapis.com/drive/v3'
const UPLOAD_BASE = 'https://www.googleapis.com/upload/drive/v3'
const LINKS_FILENAME = 'links.md'

export interface Link {
  title: string
  url: string
}

let cachedFileId: string | null = null

async function getOrCreateLinksFile(token: string): Promise<string> {
  if (cachedFileId) return cachedFileId
  const folderId = await getOrCreateFolder(token)

  const search = await driveRequest<{ files: Array<{ id: string }> }>(
    `${DRIVE_BASE}/files?q=name='${LINKS_FILENAME}' and '${folderId}' in parents and trashed=false&fields=files(id)`,
    token
  )
  if (search.files.length > 0) {
    cachedFileId = search.files[0].id
    return cachedFileId
  }

  const metadata = JSON.stringify({ name: LINKS_FILENAME, parents: [folderId] })
  const form = new FormData()
  form.append('metadata', new Blob([metadata], { type: 'application/json' }))
  form.append('media', new Blob(['# Links\n'], { type: 'text/plain' }))
  const file = await driveRequest<{ id: string }>(
    `${UPLOAD_BASE}/files?uploadType=multipart&fields=id`,
    token,
    { method: 'POST', body: form }
  )
  cachedFileId = file.id
  return cachedFileId
}

function parseLinks(md: string): Link[] {
  const links: Link[] = []
  for (const line of md.split('\n')) {
    const m = line.match(/^- \[(.*?)\]\((.*?)\)\s*$/)
    if (m) links.push({ title: m[1], url: m[2] })
  }
  return links
}

function serializeLinks(links: Link[]): string {
  return ['# Links', '', ...links.map((l) => `- [${l.title}](${l.url})`), ''].join('\n')
}

export async function listLinks(token: string): Promise<Link[]> {
  const fileId = await getOrCreateLinksFile(token)
  const res = await fetch(`${DRIVE_BASE}/files/${fileId}?alt=media`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error(`Drive API ${res.status}`)
  return parseLinks(await res.text())
}

export async function saveLinks(token: string, links: Link[]): Promise<void> {
  const fileId = await getOrCreateLinksFile(token)
  await fetch(`${UPLOAD_BASE}/files/${fileId}?uploadType=media`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'text/plain' },
    body: serializeLinks(links),
  })
}
