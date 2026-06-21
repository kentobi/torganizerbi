// @ts-nocheck
import { useState, useCallback, useRef, useEffect } from 'react'
import { ResponsiveGridLayout } from 'react-grid-layout'
import { Widget } from './Widget'
import { TasksView } from './TasksView'
import { NotesView } from './NotesView'

const LAYOUT_KEY = 'dashboard_layout'
const LAYOUT_VERSION = 2 // bump when adding/removing widgets

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
  const containerRef = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(1200)

  useEffect(() => {
    if (!containerRef.current) return
    const observer = new ResizeObserver((entries) => {
      setWidth(entries[0].contentRect.width)
    })
    observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [])

  const handleLayoutChange = useCallback((_: unknown, all: unknown) => {
    setLayouts(all)
    saveLayouts(all)
  }, [])

  return (
    <div ref={containerRef}>
      <ResponsiveGridLayout
        layouts={layouts}
        width={width}
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
    </div>
  )
}
