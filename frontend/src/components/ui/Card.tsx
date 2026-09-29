import type { HTMLAttributes } from 'react'

function Card({ className = '', ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div {...props} className={`rounded-lg border border-slate-200 bg-white ${className}`} />
}

export default Card
