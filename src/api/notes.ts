const DRIVE_BASE = 'https://www.googleapis.com/drive/v3'
const UPLOAD_BASE = 'https://www.googleapis.com/upload/drive/v3'
const FOLDER_NAME = 'torganizer-notes'

async function driveRequest<T>(url: string, token: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: { Authorization: `Bearer ${token}`, ...options?.headers },
  })
  if (!res.ok) throw new Error(`Drive API ${res.status}`)
  if (res.status === 204) return undefined as T
  return res.json()
}

export interface Note {
  id: string
  name: string
  title: string
  modifiedTime: string
}

let cachedFolderId: string | null = null

async function getOrCreateFolder(token: string): Promise<string> {
  if (cachedFolderId) return cachedFolderId

  const search = await driveRequest<{ files: Array<{ id: string }> }>(
    `${DRIVE_BASE}/files?q=name='${FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder' and trashed=false&fields=files(id)`,
    token
  )
  if (search.files.length > 0) {
    cachedFolderId = search.files[0].id
    return cachedFolderId
  }

  const folder = await driveRequest<{ id: string }>(
    `${DRIVE_BASE}/files`,
    token,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: FOLDER_NAME, mimeType: 'application/vnd.google-apps.folder' }),
    }
  )
  cachedFolderId = folder.id
  return cachedFolderId
}

function filenameToTitle(name: string): string {
  return name.replace(/^\d{4}-\d{2}-\d{2}-\d{2}-\d{2}-/, '').replace(/\.md$/, '')
}

function titleToFilename(title: string): string {
  const now = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  const prefix = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}-${pad(now.getHours())}-${pad(now.getMinutes())}`
  const slug = title.trim().replace(/\s+/g, '-').replace(/[^a-zA-Z0-9\-äöüÄÖÜß]/g, '') || 'notiz'
  return `${prefix}-${slug}.md`
}

export async function listNotes(token: string): Promise<Note[]> {
  const folderId = await getOrCreateFolder(token)
  const data = await driveRequest<{ files: Array<{ id: string; name: string; modifiedTime: string }> }>(
    `${DRIVE_BASE}/files?q='${folderId}' in parents and trashed=false&fields=files(id,name,modifiedTime)&orderBy=modifiedTime desc`,
    token
  )
  return (data.files ?? []).map((f) => ({
    id: f.id,
    name: f.name,
    title: filenameToTitle(f.name),
    modifiedTime: f.modifiedTime,
  }))
}

export async function getNoteContent(token: string, fileId: string): Promise<string> {
  const res = await fetch(`${DRIVE_BASE}/files/${fileId}?alt=media`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error(`Drive API ${res.status}`)
  return res.text()
}

export async function createNote(token: string, title: string): Promise<Note> {
  const folderId = await getOrCreateFolder(token)
  const filename = titleToFilename(title)
  const metadata = JSON.stringify({ name: filename, parents: [folderId] })

  const form = new FormData()
  form.append('metadata', new Blob([metadata], { type: 'application/json' }))
  form.append('media', new Blob([''], { type: 'text/plain' }))

  const file = await driveRequest<{ id: string; name: string; modifiedTime: string }>(
    `${UPLOAD_BASE}/files?uploadType=multipart&fields=id,name,modifiedTime`,
    token,
    { method: 'POST', body: form }
  )
  return { id: file.id, name: file.name, title, modifiedTime: file.modifiedTime }
}

export async function saveNote(token: string, fileId: string, content: string): Promise<void> {
  await fetch(`${UPLOAD_BASE}/files/${fileId}?uploadType=media`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'text/plain' },
    body: content,
  })
}

export async function deleteNote(token: string, fileId: string): Promise<void> {
  await driveRequest<void>(`${DRIVE_BASE}/files/${fileId}`, token, { method: 'DELETE' })
}
