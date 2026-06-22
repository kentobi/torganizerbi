import { useState, useEffect } from 'react'
import type { FormEvent } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { listLinks, saveLinks } from '../api/links'
import type { Link } from '../api/links'

function normalizeUrl(url: string): string {
  const trimmed = url.trim()
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
}

export function LinksView() {
  const { accessToken } = useAuth()
  const [links, setLinks] = useState<Link[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newUrl, setNewUrl] = useState('')

  useEffect(() => {
    if (!accessToken) return
    listLinks(accessToken)
      .then(setLinks)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [accessToken])

  const persist = async (next: Link[]) => {
    setLinks(next)
    if (accessToken) await saveLinks(accessToken, next)
  }

  const handleAdd = async (e: FormEvent) => {
    e.preventDefault()
    if (!newUrl.trim()) return
    const link: Link = { title: newTitle.trim() || newUrl.trim(), url: normalizeUrl(newUrl) }
    await persist([...links, link])
    setNewTitle('')
    setNewUrl('')
    setShowForm(false)
  }

  const handleDelete = async (index: number) => {
    await persist(links.filter((_, i) => i !== index))
  }

  if (loading) return <p className="text-zinc-500 dark:text-zinc-400 text-sm">Lade Links…</p>

  return (
    <div className="flex flex-col gap-3 h-full min-h-0">
      <button
        onClick={() => setShowForm((v) => !v)}
        className="w-full text-sm px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors text-left text-zinc-600 dark:text-zinc-400"
      >
        + Neuer Link
      </button>

      {showForm && (
        <form onSubmit={handleAdd} className="flex flex-col gap-1.5">
          <input
            autoFocus
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Titel…"
            className="text-sm px-2 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-400"
          />
          <input
            value={newUrl}
            onChange={(e) => setNewUrl(e.target.value)}
            placeholder="https://…"
            className="text-sm px-2 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-400"
          />
          <button
            type="submit"
            className="text-sm px-2 py-1 rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-zinc-700 dark:hover:bg-zinc-300 transition-colors"
          >
            Hinzufügen
          </button>
        </form>
      )}

      <ul className="flex flex-col gap-0.5 overflow-y-auto">
        {links.map((link, i) => (
          <li key={i} className="group flex items-center gap-1">
            <a
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 text-sm px-2 py-1.5 rounded-lg truncate text-blue-600 dark:text-blue-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
            >
              {link.title}
            </a>
            <button
              onClick={() => handleDelete(i)}
              className="opacity-0 group-hover:opacity-100 text-zinc-400 hover:text-red-500 transition-all px-1 text-base leading-none"
              aria-label="Löschen"
            >
              ×
            </button>
          </li>
        ))}
        {links.length === 0 && (
          <p className="text-xs text-zinc-400 dark:text-zinc-500 px-2">Noch keine Links</p>
        )}
      </ul>
    </div>
  )
}
