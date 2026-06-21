import type { ReactNode } from 'react'

interface WidgetProps {
  title: string
  children: ReactNode
}

export function Widget({ title, children }: WidgetProps) {
  return (
    <div className="h-full flex flex-col rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm overflow-hidden">
      <div
        className="drag-handle flex items-center gap-2 px-4 py-2.5 border-b border-zinc-100 dark:border-zinc-800 cursor-grab active:cursor-grabbing select-none"
      >
        <span className="text-zinc-300 dark:text-zinc-600 text-xs">⠿</span>
        <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{title}</span>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        {children}
      </div>
    </div>
  )
}
