import Button from '../ui/Button'
import Icon from '../ui/Icon'

type HeaderProps = {
  title: string
  navigationOpen: boolean
  onOpenNavigation: () => void
}

function Header({ title, navigationOpen, onOpenNavigation }: HeaderProps) {
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
    </header>
  )
}

export default Header
