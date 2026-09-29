import type { ReactNode } from 'react'

type PageHeaderProps = {
  title: string
  description?: string
  action?: ReactNode
  id?: string
}

function PageHeader({ title, description, action, id }: PageHeaderProps) {
  return (
    <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 id={id} tabIndex={-1} className="text-2xl font-semibold tracking-tight text-slate-950">
          {title}
        </h1>
        {description && <p className="mt-1.5 text-sm text-slate-500">{description}</p>}
      </div>
      {action}
    </div>
  )
}

export default PageHeader
