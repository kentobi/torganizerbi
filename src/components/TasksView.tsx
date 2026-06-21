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

  if (loading) return <p>Lade Tasks…</p>
  if (error) return <p>{error}</p>

  const open = tasks.filter((t) => t.status === 'needsAction' && !t.parent)
  const done = tasks.filter((t) => t.status === 'completed' && !t.parent)

  return (
    <div>
      <select value={selectedListId ?? ''} onChange={(e) => setSelectedListId(e.target.value)}>
        {lists.map((l) => (
          <option key={l.id} value={l.id}>{l.title}</option>
        ))}
      </select>

      <form onSubmit={handleCreate}>
        <input
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="Neue Aufgabe…"
        />
        <button type="submit">+</button>
      </form>

      <ul>
        {open.map((task) => (
          <li key={task.id}>
            <input type="checkbox" checked={false} onChange={() => handleToggle(task)} />
            <span>{task.title}</span>
            <button onClick={() => handleDelete(task.id)}>×</button>
          </li>
        ))}
      </ul>

      {done.length > 0 && (
        <>
          <p>Erledigt ({done.length})</p>
          <ul>
            {done.map((task) => (
              <li key={task.id}>
                <input type="checkbox" checked={true} onChange={() => handleToggle(task)} />
                <span style={{ textDecoration: 'line-through', opacity: 0.5 }}>{task.title}</span>
                <button onClick={() => handleDelete(task.id)}>×</button>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  )
}
