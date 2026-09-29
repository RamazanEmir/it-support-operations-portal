import type { ReactNode } from 'react'

type BadgeProps = { tone: 'violet' | 'blue' | 'slate' | 'amber' | 'red' | 'emerald'; children: ReactNode }

const toneClasses = {
  violet: 'border-violet-200 bg-violet-50 text-violet-700',
  blue: 'border-blue-200 bg-blue-50 text-blue-700',
  slate: 'border-slate-200 bg-slate-100 text-slate-600',
  amber: 'border-amber-200 bg-amber-50 text-amber-700',
  red: 'border-red-200 bg-red-50 text-red-700',
  emerald: 'border-emerald-200 bg-emerald-50 text-emerald-700',
}

function Badge({ tone, children }: BadgeProps) {
  return (
    <span className={`inline-flex whitespace-nowrap rounded-md border px-2 py-0.5 text-xs font-medium ${toneClasses[tone]}`}>
      {children}
    </span>
  )
}

export default Badge
