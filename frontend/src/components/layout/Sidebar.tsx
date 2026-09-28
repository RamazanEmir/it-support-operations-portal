import Button from '../ui/Button'
import Icon from '../ui/Icon'

type SidebarProps = { onClose?: () => void }

function Sidebar({ onClose }: SidebarProps) {
  return (
    <aside className="flex h-full w-60 flex-col bg-slate-950 text-white">
      <div className="flex h-16 shrink-0 items-center justify-between border-b border-slate-800 px-5">
        <div>
          <div className="text-sm font-semibold leading-tight">IT Support</div>
          <div className="text-xs text-slate-400">Operations</div>
        </div>
        {onClose && (
          <Button
            variant="ghost"
            className="min-h-9 px-2 text-slate-300 hover:bg-slate-800 hover:text-white"
            onClick={onClose}
            aria-label="Close navigation"
          >
            <Icon name="close" />
          </Button>
        )}
      </div>
      <nav aria-label="Main navigation" className="min-h-0 flex-1 space-y-1 overflow-y-auto px-3 py-5" />
    </aside>
  )
}

export default Sidebar
