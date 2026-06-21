const BASE = 'https://tasks.googleapis.com/tasks/v1'

async function request<T>(url: string, token: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  })
  if (!res.ok) throw new Error(`Tasks API ${res.status}`)
  if (res.status === 204) return undefined as T
  return res.json()
}

export interface TaskList {
  id: string
  title: string
}

export interface Task {
  id: string
  title: string
  status: 'needsAction' | 'completed'
  notes?: string
  due?: string
  parent?: string
}

export async function getTaskLists(token: string): Promise<TaskList[]> {
  const data = await request<{ items?: TaskList[] }>(`${BASE}/users/@me/lists`, token)
  return data.items ?? []
}

export async function getTasks(token: string, listId: string): Promise<Task[]> {
  const data = await request<{ items?: Task[] }>(
    `${BASE}/lists/${listId}/tasks?showCompleted=true&maxResults=100`,
    token
  )
  return data.items ?? []
}

export async function createTask(token: string, listId: string, title: string): Promise<Task> {
  return request<Task>(`${BASE}/lists/${listId}/tasks`, token, {
    method: 'POST',
    body: JSON.stringify({ title }),
  })
}

export async function updateTask(token: string, listId: string, task: Partial<Task> & { id: string }): Promise<Task> {
  return request<Task>(`${BASE}/lists/${listId}/tasks/${task.id}`, token, {
    method: 'PATCH',
    body: JSON.stringify(task),
  })
}

export async function deleteTask(token: string, listId: string, taskId: string): Promise<void> {
  return request<void>(`${BASE}/lists/${listId}/tasks/${taskId}`, token, {
    method: 'DELETE',
  })
}
