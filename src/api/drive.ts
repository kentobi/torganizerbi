const DRIVE_BASE = 'https://www.googleapis.com/drive/v3'

const FOLDER_NAME = 'torganizerbi'
const LEGACY_FOLDER_NAME = 'torganizer-notes'

export async function driveRequest<T>(url: string, token: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: { Authorization: `Bearer ${token}`, ...options?.headers },
  })
  if (!res.ok) throw new Error(`Drive API ${res.status}`)
  if (res.status === 204) return undefined as T
  return res.json()
}

let cachedFolderId: string | null = null

async function findFolder(token: string, name: string): Promise<string | null> {
  const search = await driveRequest<{ files: Array<{ id: string }> }>(
    `${DRIVE_BASE}/files?q=name='${name}' and mimeType='application/vnd.google-apps.folder' and trashed=false&fields=files(id)`,
    token
  )
  return search.files[0]?.id ?? null
}

export async function getOrCreateFolder(token: string): Promise<string> {
  if (cachedFolderId) return cachedFolderId

  // Already renamed/created in a previous session?
  let id = await findFolder(token, FOLDER_NAME)

  // One-time migration: rename the legacy folder so existing notes are kept
  if (!id) {
    const legacyId = await findFolder(token, LEGACY_FOLDER_NAME)
    if (legacyId) {
      await driveRequest(`${DRIVE_BASE}/files/${legacyId}`, token, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: FOLDER_NAME }),
      })
      id = legacyId
    }
  }

  // Nothing there yet → create fresh
  if (!id) {
    const folder = await driveRequest<{ id: string }>(`${DRIVE_BASE}/files`, token, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: FOLDER_NAME, mimeType: 'application/vnd.google-apps.folder' }),
    })
    id = folder.id
  }

  cachedFolderId = id
  return id
}
