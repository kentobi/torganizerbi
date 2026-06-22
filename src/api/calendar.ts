const BASE = 'https://www.googleapis.com/calendar/v3'

async function calRequest<T>(url: string, token: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  })
  if (!res.ok) throw new Error(`Calendar API ${res.status}`)
  if (res.status === 204) return undefined as T
  return res.json()
}

export interface CalEvent {
  id: string
  summary: string
  start: { date?: string; dateTime?: string }
  end: { date?: string; dateTime?: string }
}

export async function getEvents(token: string, timeMin: Date, timeMax: Date): Promise<CalEvent[]> {
  const params = new URLSearchParams({
    timeMin: timeMin.toISOString(),
    timeMax: timeMax.toISOString(),
    singleEvents: 'true',
    orderBy: 'startTime',
    maxResults: '250',
  })
  const data = await calRequest<{ items?: CalEvent[] }>(
    `${BASE}/calendars/primary/events?${params}`,
    token
  )
  return data.items ?? []
}

export async function createEvent(
  token: string,
  summary: string,
  date: string,
  time?: string,
): Promise<CalEvent> {
  if (time) {
    // Timed event: interpret as local time, convert to UTC for API
    const start = new Date(`${date}T${time}:00`)
    const end = new Date(start.getTime() + 60 * 60 * 1000)
    return calRequest<CalEvent>(`${BASE}/calendars/primary/events`, token, {
      method: 'POST',
      body: JSON.stringify({
        summary,
        start: { dateTime: start.toISOString() },
        end: { dateTime: end.toISOString() },
      }),
    })
  }
  // All-day event
  const next = new Date(date)
  next.setDate(next.getDate() + 1)
  const endDate = next.toISOString().slice(0, 10)
  return calRequest<CalEvent>(`${BASE}/calendars/primary/events`, token, {
    method: 'POST',
    body: JSON.stringify({
      summary,
      start: { date },
      end: { date: endDate },
    }),
  })
}

export async function deleteEvent(token: string, eventId: string): Promise<void> {
  return calRequest<void>(`${BASE}/calendars/primary/events/${eventId}`, token, {
    method: 'DELETE',
  })
}
