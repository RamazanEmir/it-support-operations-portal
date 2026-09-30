import { NavLink } from 'react-router'
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
      <nav aria-label="Main navigation" className="min-h-0 flex-1 space-y-1 overflow-y-auto px-3 py-5">
        <div className="mb-5">
          <NavLink
            to="/" end onClick={onClose}
            className={({ isActive }) => `relative flex min-h-9 items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${isActive
              ? 'bg-slate-800 text-white hover:bg-slate-800 before:absolute before:inset-y-2 before:left-0 before:w-0.5 before:rounded-full before:bg-blue-400'
              : 'text-slate-400 hover:bg-slate-900 hover:text-slate-100'}`}
          >
            <Icon name="dashboard" />
            Dashboard
          </NavLink>
        </div>
        <div className="mb-5">
          <div className="mb-2 px-3 text-xs font-medium text-slate-400">Support</div>
          <NavLink
            to="/tickets" onClick={onClose}
            className={({ isActive }) => `relative flex min-h-9 items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${isActive
              ? 'bg-slate-800 text-white hover:bg-slate-800 before:absolute before:inset-y-2 before:left-0 before:w-0.5 before:rounded-full before:bg-blue-400'
              : 'text-slate-400 hover:bg-slate-900 hover:text-slate-100'}`}
          >
            <Icon name="ticket" />
            Tickets
          </NavLink>
        </div>
        <div className="mb-2 px-3 text-xs font-medium text-slate-400">Users</div>
        <NavLink
          to="/users" onClick={onClose}
          className={({ isActive }) => `relative flex min-h-9 items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${isActive
            ? 'bg-slate-800 text-white hover:bg-slate-800 before:absolute before:inset-y-2 before:left-0 before:w-0.5 before:rounded-full before:bg-blue-400'
            : 'text-slate-400 hover:bg-slate-900 hover:text-slate-100'}`}
        >
          <Icon name="users" />
          Users
        </NavLink>
      </nav>
    </aside>
  )
}

export default Sidebar
