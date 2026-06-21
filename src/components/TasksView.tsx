import { useState, useEffect } from 'react'
import type { FormEvent } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { getTaskLists, getTasks, createTask, updateTask, deleteTask } from '../api/tasks'
import type { TaskList, Task } from '../api/tasks'

export function TasksView() {
  const { accessToken } = useAuth()
  const [lists, setLists] = useState<TaskList[]>([])
  const [selectedListId, setSelectedListId] = useState<string | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [newTitle, setNewTitle] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!accessToken) return
    getTaskLists(accessToken)
      .then((data) => {
        setLists(data)
        if (data.length > 0) setSelectedListId(data[0].id)
      })
      .catch(() => setError('Fehler beim Laden der Listen'))
      .finally(() => setLoading(false))
  }, [accessToken])

  useEffect(() => {
    if (!accessToken || !selectedListId) return
    getTasks(accessToken, selectedListId).then(setTasks).catch(() => setError('Fehler beim Laden der Tasks'))
  }, [accessToken, selectedListId])

  const handleToggle = async (task: Task) => {
    if (!accessToken || !selectedListId) return
    const updated = await updateTask(accessToken, selectedListId, {
      id: task.id,
      status: task.status === 'completed' ? 'needsAction' : 'completed',
    })
    setTasks((prev) => prev.map((t) => (t.id === updated.id ? { ...t, ...updated } : t)))
  }

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault()
    if (!accessToken || !selectedListId || !newTitle.trim()) return
    const task = await createTask(accessToken, selectedListId, newTitle.trim())
    setTasks((prev) => [task, ...prev])
    setNewTitle('')
  }

  const handleDelete = async (taskId: string) => {
    if (!accessToken || !selectedListId) return
    await deleteTask(accessToken, selectedListId, taskId)
    setTasks((prev) => prev.filter((t) => t.id !== taskId))
  }

  if (loading) return <p className="text-zinc-500 dark:text-zinc-400 text-sm">Lade Tasks…</p>
  if (error) return <p className="text-red-500 text-sm">{error}</p>

  const open = tasks.filter((t) => t.status === 'needsAction' && !t.parent)
  const done = tasks.filter((t) => t.status === 'completed' && !t.parent)

  return (
    <div className="flex flex-col gap-4">
      <select
        value={selectedListId ?? ''}
        onChange={(e) => setSelectedListId(e.target.value)}
        className="w-full text-sm px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-400"
      >
        {lists.map((l) => (
          <option key={l.id} value={l.id}>{l.title}</option>
        ))}
      </select>

      <form onSubmit={handleCreate} className="flex gap-2">
        <input
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="Neue Aufgabe…"
          className="flex-1 text-sm px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-400"
        />
        <button
          type="submit"
          className="px-4 py-2 rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-sm font-medium hover:bg-zinc-700 dark:hover:bg-zinc-300 transition-colors"
        >
          +
        </button>
      </form>

      <ul className="flex flex-col gap-1">
        {open.map((task) => (
          <TaskItem key={task.id} task={task} onToggle={handleToggle} onDelete={handleDelete} />
        ))}
      </ul>

      {done.length > 0 && (
        <div className="flex flex-col gap-1">
          <p className="text-xs text-zinc-400 dark:text-zinc-500 font-medium uppercase tracking-wide">
            Erledigt ({done.length})
          </p>
          <ul className="flex flex-col gap-1">
            {done.map((task) => (
              <TaskItem key={task.id} task={task} onToggle={handleToggle} onDelete={handleDelete} />
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

function TaskItem({
  task,
  onToggle,
  onDelete,
}: {
  task: Task
  onToggle: (task: Task) => void
  onDelete: (id: string) => void
}) {
  const done = task.status === 'completed'
  return (
    <li className="group flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
      <input
        type="checkbox"
        checked={done}
        onChange={() => onToggle(task)}
        className="w-4 h-4 accent-zinc-600 dark:accent-zinc-400 cursor-pointer shrink-0"
      />
      <span className={`flex-1 text-sm ${done ? 'line-through text-zinc-400 dark:text-zinc-500' : ''}`}>
        {task.title}
      </span>
      <button
        onClick={() => onDelete(task.id)}
        className="opacity-0 group-hover:opacity-100 text-zinc-400 hover:text-red-500 transition-all text-base leading-none"
        aria-label="Löschen"
      >
        ×
      </button>
    </li>
  )
}
