import type { ReactNode } from 'react'

type TableProps = { label: string; headers: string[]; children: ReactNode }

function Table({ label, headers, children }: TableProps) {
  return (
    <div className="overflow-x-auto">
      <table aria-label={label} className="w-full min-w-max text-left">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50/80">
            {headers.map((header) => (
              <th key={header} scope="col" className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">{children}</tbody>
      </table>
    </div>
  )
}

export default Table
