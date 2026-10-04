import Button from '../ui/Button'
import Icon from '../ui/Icon'
import { useAuth } from '../../auth/AuthContext'
import { userRoleLabels } from '../../api/users'

type HeaderProps = {
  title: string
  navigationOpen: boolean
  onOpenNavigation: () => void
}

function Header({ title, navigationOpen, onOpenNavigation }: HeaderProps) {
  const { currentUser, logout } = useAuth()
  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-6 lg:px-8">
      <div className="flex items-center gap-3">
        <Button
          variant="secondary"
          className="min-h-10 px-2.5 lg:hidden"
          onClick={onOpenNavigation}
          aria-label="Open navigation"
          aria-controls="mobile-navigation"
          aria-expanded={navigationOpen}
        >
          <Icon name="menu" />
        </Button>
        <div className="text-sm font-semibold text-slate-800">{title}</div>
      </div>
      {currentUser && (
        <div className="ml-3 flex min-w-0 items-center gap-3">
          <div className="min-w-0 text-right">
            <p className="max-w-32 truncate text-sm font-medium text-slate-800 sm:max-w-64">{currentUser.name}</p>
            <p className="text-xs text-slate-500">{userRoleLabels[currentUser.role]}</p>
          </div>
          <Button variant="secondary" onClick={logout}>Logout</Button>
        </div>
      )}
    </header>
  )
}

export default Header
