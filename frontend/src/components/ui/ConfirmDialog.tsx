import { useEffect, useId, useRef } from 'react'
import type { ReactNode } from 'react'
import Button from './Button'

type ConfirmDialogProps = {
  title: string
  children: ReactNode
  confirmLabel: string
  pending: boolean
  error?: string
  onConfirm: () => void
  onCancel: () => void
  fallbackFocusId: string
}

function ConfirmDialog({ title, children, confirmLabel, pending, error, onConfirm, onCancel, fallbackFocusId }: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const titleId = useId()
  const descriptionId = useId()

  useEffect(() => {
    const dialog = dialogRef.current
    const previousFocus = document.activeElement
    const previousOverflow = document.body.style.overflow
    dialog?.showModal()
    document.body.style.overflow = 'hidden'
    return () => {
      dialog?.close()
      document.body.style.overflow = previousOverflow
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected) {
        previousFocus.focus()
      } else {
        document.getElementById(fallbackFocusId)?.focus()
      }
    }
  }, [fallbackFocusId])

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      aria-busy={pending}
      className="fixed inset-0 m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-md overflow-y-auto rounded-lg border border-slate-200 bg-white p-6 text-slate-900 shadow-xl backdrop:bg-slate-950/50"
      onCancel={(event) => {
        event.preventDefault()
        if (!pending) onCancel()
      }}
    >
      <h2 id={titleId} className="text-lg font-semibold">{title}</h2>
      <p id={descriptionId} className="mt-2 text-sm leading-6 text-slate-600">{children}</p>
      {error && <p role="alert" className="mt-4 text-sm text-red-700">{error}</p>}
      <div className="mt-6 flex justify-end gap-3">
        <Button variant="secondary" disabled={pending} onClick={onCancel}>Cancel</Button>
        <Button variant="danger" disabled={pending} onClick={onConfirm}>
          {pending ? 'Deleting...' : confirmLabel}
        </Button>
      </div>
    </dialog>
  )
}

export default ConfirmDialog
