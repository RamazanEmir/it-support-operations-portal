import type { ReactNode } from 'react'

type FormFieldProps = {
  label: string
  htmlFor: string
  error?: string
  children: ReactNode
}

function FormField({ label, htmlFor, error, children }: FormFieldProps) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-2 block text-sm font-medium text-slate-700">
        {label}
      </label>
      {children}
      {error && <p id={`${htmlFor}-error`} role="alert" className="mt-2 text-sm text-red-700">{error}</p>}
    </div>
  )
}

export default FormField
