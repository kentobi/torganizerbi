import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { getEvents, createEvent, deleteEvent } from '../api/calendar'
import type { CalEvent } from '../api/calendar'

type ViewMode = 'month' | 'week'

const WEEKDAYS = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So']
const MONTHS = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember']

function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function getMondayOfWeek(d: Date): Date {
  const day = d.getDay()
  const monday = new Date(d)
  monday.setDate(d.getDate() - (day === 0 ? 6 : day - 1))
  monday.setHours(0, 0, 0, 0)
  return monday
}

function getWeekDays(date: Date): Date[] {
  const monday = getMondayOfWeek(date)
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    return d
  })
}

function getMonthGrid(year: number, month: number): Date[] {
  const first = new Date(year, month, 1)
  const last = new Date(year, month + 1, 0)
  const startPad = (first.getDay() + 6) % 7
  const days: Date[] = []
  for (let i = startPad; i > 0; i--) days.push(new Date(year, month, 1 - i))
  for (let d = 1; d <= last.getDate(); d++) days.push(new Date(year, month, d))
  const rem = 7 - (days.length % 7)
  if (rem < 7) for (let i = 1; i <= rem; i++) days.push(new Date(year, month + 1, i))
  return days
}

function getEventDate(e: CalEvent): string {
  return e.start.date ?? e.start.dateTime?.slice(0, 10) ?? ''
}

function getEventEndDate(e: CalEvent): string {
  if (e.end.date) {
    // Google Calendar end.date is exclusive for all-day events
    const d = new Date(e.end.date)
    d.setDate(d.getDate() - 1)
    return toDateStr(d)
  }
  return e.end.dateTime?.slice(0, 10) ?? ''
}


function getEventTime(e: CalEvent): string {
  if (!e.start.dateTime) return ''
  return e.start.dateTime.slice(11, 16)
}

function formatDisplayDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  return `${d}. ${MONTHS[m - 1]} ${y}`
}

function parseEventInput(input: string): { title: string; time?: string } {
  // Matches: "13:00h Turnen", "13:00 Turnen", "9:00h Turnen", "13:00h", "13:00"
  const match = input.trim().match(/^(\d{1,2}:\d{2})h?\s*(.*)$/)
  if (match) {
    const [, rawTime, rest] = match
    const [h, m] = rawTime.split(':')
    const time = `${h.padStart(2, '0')}:${m}`
    return { title: rest.trim(), time }
  }
  return { title: input.trim() }
}

function isToday(d: Date): boolean {
  const t = new Date()
  return d.getFullYear() === t.getFullYear() && d.getMonth() === t.getMonth() && d.getDate() === t.getDate()
}

type EventSegment = {
  event: CalEvent
  startCol: number
  span: number
  isStart: boolean
  isEnd: boolean
  row: number
}

function getWeekSegments(allEvents: CalEvent[], weekDays: Date[]): EventSegment[] {
  const segs: EventSegment[] = []

  for (const event of allEvents) {
    const startStr = getEventDate(event)
    const endStr = getEventEndDate(event)
    let startCol = -1, endCol = -1
    for (let i = 0; i < weekDays.length; i++) {
      const d = toDateStr(weekDays[i])
      if (d >= startStr && d <= endStr) {
        if (startCol === -1) startCol = i
        endCol = i
      }
    }
    if (startCol === -1) continue
    segs.push({
      event,
      startCol,
      span: endCol - startCol + 1,
      isStart: toDateStr(weekDays[startCol]) === startStr,
      isEnd: toDateStr(weekDays[endCol]) === endStr,
      row: 0,
    })
  }

  // Longer events first so they get lower (more prominent) rows
  segs.sort((a, b) => b.span - a.span || a.startCol - b.startCol)

  // occupied[row][col] = true means that column is taken in that row
  const occupied: boolean[][] = []
  for (const seg of segs) {
    let row = 0
    let placed = false
    while (!placed) {
      if (row >= occupied.length) occupied.push(new Array(7).fill(false))
      let conflict = false
      for (let c = seg.startCol; c < seg.startCol + seg.span; c++) {
        if (occupied[row][c]) { conflict = true; break }
      }
      if (conflict) { row++ } else { placed = true }
    }
    seg.row = row
    for (let c = seg.startCol; c < seg.startCol + seg.span; c++) occupied[row][c] = true
  }

  return segs
}

function EventModal({ event, onClose, onDelete }: {
  event: CalEvent
  onClose: () => void
  onDelete: (id: string) => Promise<void>
}) {
  const [confirming, setConfirming] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async () => {
    setDeleting(true)
    await onDelete(event.id)
    onClose()
  }

  const startStr = getEventDate(event)
  const endStr = getEventEndDate(event)
  const time = getEventTime(event)
  const dateLabel = startStr !== endStr
    ? `${formatDisplayDate(startStr)} – ${formatDisplayDate(endStr)}`
    : formatDisplayDate(startStr)

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-zinc-900 rounded-xl shadow-xl border border-zinc-200 dark:border-zinc-700 w-full max-w-sm mx-4 p-5 flex flex-col gap-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col gap-1">
            <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">{event.summary}</h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              {dateLabel}
              {time && <span className="ml-2">{time} Uhr</span>}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 text-xl leading-none shrink-0 mt-0.5"
          >
            ×
          </button>
        </div>

        <div className="border-t border-zinc-100 dark:border-zinc-800 pt-3">
          {!confirming ? (
            <button
              onClick={() => setConfirming(true)}
              className="text-sm text-red-500 hover:text-red-700 dark:hover:text-red-400 transition-colors"
            >
              Termin löschen
            </button>
          ) : (
            <div className="flex flex-col gap-2">
              <p className="text-sm text-zinc-600 dark:text-zinc-400">Termin wirklich löschen?</p>
              <div className="flex gap-2">
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="flex-1 py-1.5 rounded-lg bg-red-500 hover:bg-red-600 text-white text-sm font-medium transition-colors disabled:opacity-50"
                >
                  {deleting ? 'Löscht…' : 'Ja, löschen'}
                </button>
                <button
                  onClick={() => setConfirming(false)}
                  className="flex-1 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 text-sm text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                >
                  Abbrechen
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export function CalendarView() {
  const { accessToken } = useAuth()
  const [viewMode, setViewMode] = useState<ViewMode>('month')
  const [current, setCurrent] = useState(new Date())
  const [events, setEvents] = useState<CalEvent[]>([])
  const [creatingDate, setCreatingDate] = useState<string | null>(null)
  const [newTitle, setNewTitle] = useState('')
  const [selectedEvent, setSelectedEvent] = useState<CalEvent | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const year = current.getFullYear()
  const month = current.getMonth()

  const visibleDays = viewMode === 'month' ? getMonthGrid(year, month) : getWeekDays(current)

  useEffect(() => {
    if (!accessToken || visibleDays.length === 0) return
    const first = new Date(visibleDays[0])
    first.setHours(0, 0, 0, 0)
    const last = new Date(visibleDays[visibleDays.length - 1])
    last.setHours(23, 59, 59, 999)
    getEvents(accessToken, first, last).then(setEvents).catch(() => {})
  }, [accessToken, viewMode, year, month, current.toDateString()])

  useEffect(() => {
    if (creatingDate) inputRef.current?.focus()
  }, [creatingDate])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setSelectedEvent(null) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const navigate = (dir: 1 | -1) => {
    setCurrent((prev) => {
      const d = new Date(prev)
      if (viewMode === 'month') d.setMonth(d.getMonth() + dir)
      else d.setDate(d.getDate() + dir * 7)
      return d
    })
  }

  const handleDayClick = (dateStr: string) => {
    setCreatingDate(dateStr)
    setNewTitle('')
  }

  const handleCreate = async (e: { preventDefault(): void }) => {
    e.preventDefault()
    if (!accessToken || !creatingDate || !newTitle.trim()) return
    const { title, time } = parseEventInput(newTitle)
    const ev = await createEvent(accessToken, title || newTitle.trim(), creatingDate, time)
    setEvents((prev) => [...prev, ev])
    setCreatingDate(null)
    setNewTitle('')
  }

  const handleDelete = async (eventId: string) => {
    if (!accessToken) return
    await deleteEvent(accessToken, eventId)
    setEvents((prev) => prev.filter((e) => e.id !== eventId))
  }

  const headerLabel = viewMode === 'month'
    ? `${MONTHS[month]} ${year}`
    : (() => {
        const days = getWeekDays(current)
        return `${days[0].getDate()}. – ${days[6].getDate()}. ${MONTHS[days[6].getMonth()]} ${days[6].getFullYear()}`
      })()

  return (
    <>
      <div className="flex flex-col gap-2 h-full">
        {/* Header */}
        <div className="flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-1">
            <button onClick={() => navigate(-1)} className="p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 text-sm">‹</button>
            <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200 min-w-36 text-center">{headerLabel}</span>
            <button onClick={() => navigate(1)} className="p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 text-sm">›</button>
          </div>
          <div className="flex rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-700 text-xs">
            <button
              onClick={() => setViewMode('month')}
              className={`px-2.5 py-1 transition-colors ${viewMode === 'month' ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900' : 'text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800'}`}
            >
              Monat
            </button>
            <button
              onClick={() => setViewMode('week')}
              className={`px-2.5 py-1 transition-colors ${viewMode === 'week' ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900' : 'text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800'}`}
            >
              Woche
            </button>
          </div>
        </div>

        {/* Weekday headers */}
        <div className="grid grid-cols-7 shrink-0">
          {WEEKDAYS.map((d) => (
            <div key={d} className="text-center text-xs font-medium text-zinc-400 dark:text-zinc-500 py-1">{d}</div>
          ))}
        </div>

        {/* Calendar grid – split into week rows for spanning event bars */}
        {(() => {
          const weeks: Date[][] = []
          for (let i = 0; i < visibleDays.length; i += 7) weeks.push(visibleDays.slice(i, i + 7))
          const MAX_ROWS = viewMode === 'week' ? 5 : 2

          return (
            <div className="flex flex-col flex-1 gap-px bg-zinc-100 dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-800 rounded-lg overflow-hidden">
              {weeks.map((weekDays, weekIdx) => {
                const segs = getWeekSegments(events, weekDays)
                const visibleRowCount = Math.min(MAX_ROWS, segs.reduce((m, s) => Math.max(m, s.row + 1), 0))
                const visibleSegs = segs.filter(s => s.row < MAX_ROWS)

                const morePerCol: number[] = Array(7).fill(0)
                for (const seg of segs.filter(s => s.row >= MAX_ROWS)) {
                  for (let c = seg.startCol; c < seg.startCol + seg.span; c++) morePerCol[c]++
                }
                return (
                  <div key={weekIdx} className="flex-1 flex flex-col bg-white dark:bg-zinc-900 min-h-0">
                    {/* Day number row */}
                    <div className="grid grid-cols-7 gap-px bg-zinc-100 dark:bg-zinc-800">
                      {weekDays.map((day, dayIdx) => {
                        const dateStr = toDateStr(day)
                        const isCurrentMonth = day.getMonth() === month
                        const today = isToday(day)
                        const isCreating = creatingDate === dateStr
                        const moreCount = morePerCol[dayIdx]
                        return (
                          <div
                            key={dateStr}
                            onClick={() => !isCreating && handleDayClick(dateStr)}
                            className="bg-white dark:bg-zinc-900 px-1 pt-1 pb-0.5 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/80 transition-colors"
                          >
                            <div className="flex items-center justify-between">
                              <div className={`text-xs w-6 h-6 flex items-center justify-center rounded-full font-medium ${
                                today ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900'
                                : isCurrentMonth ? 'text-zinc-700 dark:text-zinc-300'
                                : 'text-zinc-300 dark:text-zinc-600'
                              }`}>
                                {day.getDate()}
                              </div>
                              {moreCount > 0 && (
                                <span className="text-xs text-zinc-400 dark:text-zinc-500 pr-0.5">+{moreCount}</span>
                              )}
                            </div>
                            {isCreating && (
                              <form onSubmit={handleCreate} onClick={e => e.stopPropagation()}>
                                <input
                                  ref={inputRef}
                                  value={newTitle}
                                  onChange={e => setNewTitle(e.target.value)}
                                  onBlur={() => setCreatingDate(null)}
                                  onKeyDown={e => e.key === 'Escape' && setCreatingDate(null)}
                                  placeholder="Titel…"
                                  className="mt-0.5 w-full text-xs px-1 py-0.5 rounded border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 focus:outline-none"
                                />
                              </form>
                            )}
                          </div>
                        )
                      })}
                    </div>

                    {/* Event bar rows */}
                    {Array.from({ length: visibleRowCount }, (_, row) => (
                      <div key={row} className="grid grid-cols-7 h-5">
                        {visibleSegs.filter(s => s.row === row).map(seg => (
                          <div
                            key={seg.event.id}
                            style={{ gridColumn: `${seg.startCol + 1} / span ${seg.span}` }}
                            onClick={e => { e.stopPropagation(); setSelectedEvent(seg.event) }}
                            title={seg.event.summary}
                            className={[
                              'my-0.5 h-4 flex items-center text-xs truncate cursor-pointer',
                              'bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300',
                              'hover:bg-blue-200 dark:hover:bg-blue-800/50 transition-colors',
                              seg.isStart ? 'ml-0.5 rounded-l-full pl-2' : '',
                              seg.isEnd ? 'mr-0.5 rounded-r-full' : '',
                            ].filter(Boolean).join(' ')}
                          >
                            {seg.isStart && (
                              <span className="truncate leading-none">
                                {getEventTime(seg.event) && <span className="opacity-70 mr-1">{getEventTime(seg.event)}</span>}
                                {seg.event.summary}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    ))}

                    {/* Clickable empty area below events */}
                    <div className="flex-1 grid grid-cols-7 gap-px bg-zinc-100 dark:bg-zinc-800">
                      {weekDays.map(day => (
                        <div
                          key={`sp-${toDateStr(day)}`}
                          onClick={() => handleDayClick(toDateStr(day))}
                          className="bg-white dark:bg-zinc-900 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/80 transition-colors"
                        />
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          )
        })()}
      </div>

      {selectedEvent && (
        <EventModal
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
          onDelete={handleDelete}
        />
      )}
    </>
  )
}
