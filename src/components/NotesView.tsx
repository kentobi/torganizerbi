import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { listNotes, getNoteContent, createNote, saveNote, deleteNote } from '../api/notes'
import type { Note } from '../api/notes'

export function NotesView() {
  const { accessToken } = useAuth()
  const [notes, setNotes] = useState<Note[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [content, setContent] = useState('')
  const [savedContent, setSavedContent] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [showNewForm, setShowNewForm] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (!accessToken) return
    listNotes(accessToken)
      .then((data) => {
        setNotes(data)
        if (data.length > 0) selectNote(data[0].id)
      })
      .finally(() => setLoading(false))
  }, [accessToken])

  const selectNote = async (id: string) => {
    if (!accessToken) return
    setSelectedId(id)
    setContent('')
    setSavedContent('')
    const text = await getNoteContent(accessToken, id)
    setContent(text)
    setSavedContent(text)
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!accessToken || !newTitle.trim()) return
    const note = await createNote(accessToken, newTitle.trim())
    setNotes((prev) => [note, ...prev])
    setNewTitle('')
    setShowNewForm(false)
    selectNote(note.id)
  }

  const handleSave = async () => {
    if (!accessToken || !selectedId) return
    setSaving(true)
    await saveNote(accessToken, selectedId, content)
    setSavedContent(content)
    setSaving(false)
  }

  const handleDelete = async (id: string) => {
    if (!accessToken) return
    await deleteNote(accessToken, id)
    const remaining = notes.filter((n) => n.id !== id)
    setNotes(remaining)
    if (selectedId === id) {
      if (remaining.length > 0) selectNote(remaining[0].id)
      else { setSelectedId(null); setContent('') }
    }
  }

  const isDirty = content !== savedContent
  const selectedNote = notes.find((n) => n.id === selectedId)

  if (loading) return <p className="text-zinc-500 dark:text-zinc-400 text-sm">Lade Notizen…</p>

  return (
    <div className="flex h-full gap-3 min-h-0">
      {/* Sidebar */}
      <div className="w-44 shrink-0 flex flex-col gap-2">
        <button
          onClick={() => setShowNewForm((v) => !v)}
          className="w-full text-sm px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors text-left text-zinc-600 dark:text-zinc-400"
        >
          + Neue Notiz
        </button>

        {showNewForm && (
          <form onSubmit={handleCreate} className="flex flex-col gap-1">
            <input
              autoFocus
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Titel…"
              className="text-sm px-2 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-400"
            />
            <button type="submit" className="text-sm px-2 py-1 rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-zinc-700 dark:hover:bg-zinc-300 transition-colors">
              Erstellen
            </button>
          </form>
        )}

        <ul className="flex flex-col gap-0.5 overflow-y-auto">
          {notes.map((note) => (
            <li key={note.id} className="group flex items-center gap-1">
              <button
                onClick={() => selectNote(note.id)}
                className={`flex-1 text-left text-sm px-2 py-1.5 rounded-lg truncate transition-colors ${
                  selectedId === note.id
                    ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-medium'
                    : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800'
                }`}
              >
                {note.title}
              </button>
              <button
                onClick={() => handleDelete(note.id)}
                className="opacity-0 group-hover:opacity-100 text-zinc-400 hover:text-red-500 transition-all px-1 text-base leading-none"
                aria-label="Löschen"
              >
                ×
              </button>
            </li>
          ))}
          {notes.length === 0 && (
            <p className="text-xs text-zinc-400 dark:text-zinc-500 px-2">Noch keine Notizen</p>
          )}
        </ul>
      </div>

      {/* Editor */}
      <div className="flex-1 flex flex-col gap-2 min-w-0">
        {selectedNote ? (
          <>
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-medium truncate text-zinc-700 dark:text-zinc-300">
                {selectedNote.title}
              </span>
              <button
                onClick={handleSave}
                disabled={!isDirty || saving}
                className="shrink-0 text-xs px-3 py-1 rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 disabled:opacity-30 hover:bg-zinc-700 dark:hover:bg-zinc-300 transition-colors"
              >
                {saving ? 'Speichert…' : 'Speichern'}
              </button>
            </div>
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="flex-1 resize-none text-sm p-3 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-400 font-mono leading-relaxed"
              placeholder="Schreib drauf los…"
            />
          </>
        ) : (
          <p className="text-sm text-zinc-400 dark:text-zinc-500">Wähle eine Notiz aus oder erstelle eine neue.</p>
        )}
      </div>
    </div>
  )
}
