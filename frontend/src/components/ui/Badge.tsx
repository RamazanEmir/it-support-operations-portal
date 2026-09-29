import type { ReactNode } from 'react'

type BadgeProps = { tone: 'violet' | 'blue' | 'slate'; children: ReactNode }

const toneClasses = {
  violet: 'border-violet-200 bg-violet-50 text-violet-700',
  blue: 'border-blue-200 bg-blue-50 text-blue-700',
  slate: 'border-slate-200 bg-slate-100 text-slate-600',
}

function Badge({ tone, children }: BadgeProps) {
  return (
    <span className={`inline-flex whitespace-nowrap rounded-md border px-2 py-0.5 text-xs font-medium ${toneClasses[tone]}`}>
      {children}
    </span>
  )
}

export default Badge
