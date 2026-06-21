// @ts-nocheck
import { useState, useCallback } from 'react'
import { ResponsiveGridLayout } from 'react-grid-layout'
import { Widget } from './Widget'
import { TasksView } from './TasksView'
import { NotesView } from './NotesView'

const LAYOUT_KEY = 'dashboard_layout'

const DEFAULT_LAYOUTS = {
  lg: [
    { i: 'tasks', x: 0, y: 0, w: 5, h: 10, minW: 3, minH: 4 },
    { i: 'notes', x: 5, y: 0, w: 7, h: 10, minW: 4, minH: 4 },
  ],
  md: [
    { i: 'tasks', x: 0, y: 0, w: 4, h: 10, minW: 3, minH: 4 },
    { i: 'notes', x: 4, y: 0, w: 6, h: 10, minW: 4, minH: 4 },
  ],
  sm: [
    { i: 'tasks', x: 0, y: 0, w: 6, h: 8, minW: 3, minH: 4 },
    { i: 'notes', x: 0, y: 8, w: 6, h: 10, minW: 3, minH: 4 },
  ],
}

function loadLayouts() {
  try {
    const saved = localStorage.getItem(LAYOUT_KEY)
    return saved ? JSON.parse(saved) : DEFAULT_LAYOUTS
  } catch {
    return DEFAULT_LAYOUTS
  }
}

export function Dashboard() {
  const [layouts, setLayouts] = useState(loadLayouts)

  const handleLayoutChange = useCallback((_: unknown, all: unknown) => {
    setLayouts(all)
    localStorage.setItem(LAYOUT_KEY, JSON.stringify(all))
  }, [])

  return (
    <ResponsiveGridLayout
      layouts={layouts}
      breakpoints={{ lg: 1200, md: 996, sm: 768 }}
      cols={{ lg: 12, md: 10, sm: 6 }}
      rowHeight={50}
      draggableHandle=".drag-handle"
      onLayoutChange={handleLayoutChange}
    >
      <div key="tasks">
        <Widget title="Tasks">
          <TasksView />
        </Widget>
      </div>
      <div key="notes">
        <Widget title="Notizen">
          <NotesView />
        </Widget>
      </div>
    </ResponsiveGridLayout>
  )
}
