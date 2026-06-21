// @ts-nocheck
import { useState, useCallback } from 'react'
import { Responsive, WidthProvider } from 'react-grid-layout/legacy'
import { Widget } from './Widget'
import { TasksView } from './TasksView'
import { NotesView } from './NotesView'
import { CalendarView } from './CalendarView'

const ResponsiveGrid = WidthProvider(Responsive)

const LAYOUT_KEY = 'dashboard_layout'
const LAYOUT_VERSION = 4

const DEFAULT_LAYOUTS = {
  lg: [
    { i: 'calendar', x: 0,  y: 0,  w: 12, h: 11, minW: 6, minH: 8 },
    { i: 'tasks',    x: 0,  y: 11, w: 5,  h: 10, minW: 3, minH: 4 },
    { i: 'notes',    x: 5,  y: 11, w: 7,  h: 10, minW: 4, minH: 4 },
  ],
  md: [
    { i: 'calendar', x: 0, y: 0,  w: 10, h: 11, minW: 6, minH: 8 },
    { i: 'tasks',    x: 0, y: 11, w: 4,  h: 10, minW: 3, minH: 4 },
    { i: 'notes',    x: 4, y: 11, w: 6,  h: 10, minW: 4, minH: 4 },
  ],
  sm: [
    { i: 'calendar', x: 0, y: 0,  w: 6, h: 11, minW: 6, minH: 8 },
    { i: 'tasks',    x: 0, y: 11, w: 6, h: 8,  minW: 3, minH: 4 },
    { i: 'notes',    x: 0, y: 19, w: 6, h: 10, minW: 3, minH: 4 },
  ],
}

function loadLayouts() {
  try {
    const raw = localStorage.getItem(LAYOUT_KEY)
    if (!raw) return DEFAULT_LAYOUTS
    const parsed = JSON.parse(raw)
    if (parsed.__version !== LAYOUT_VERSION) return DEFAULT_LAYOUTS
    return parsed.layouts
  } catch {
    return DEFAULT_LAYOUTS
  }
}

function saveLayouts(layouts: unknown) {
  localStorage.setItem(LAYOUT_KEY, JSON.stringify({ __version: LAYOUT_VERSION, layouts }))
}

export function Dashboard() {
  const [layouts, setLayouts] = useState(loadLayouts)

  const handleLayoutChange = useCallback((_: unknown, all: unknown) => {
    setLayouts(all)
    saveLayouts(all)
  }, [])

  return (
    <ResponsiveGrid
      layouts={layouts}
      breakpoints={{ lg: 1200, md: 996, sm: 768 }}
      cols={{ lg: 12, md: 10, sm: 6 }}
      rowHeight={50}
      draggableHandle=".drag-handle"
      onLayoutChange={handleLayoutChange}
      margin={[8, 8]}
    >
      <div key="calendar" style={{ height: '100%' }}>
        <Widget title="Kalender">
          <CalendarView />
        </Widget>
      </div>
      <div key="tasks" style={{ height: '100%' }}>
        <Widget title="Tasks">
          <TasksView />
        </Widget>
      </div>
      <div key="notes" style={{ height: '100%' }}>
        <Widget title="Notizen">
          <NotesView />
        </Widget>
      </div>
    </ResponsiveGrid>
  )
}
