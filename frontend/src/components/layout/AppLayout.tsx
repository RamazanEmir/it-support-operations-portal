import { useEffect, useRef, useState } from 'react'
import { matchPath, Outlet, useLocation } from 'react-router'
import Header from './Header'
import Sidebar from './Sidebar'

function AppLayout() {
  const { pathname } = useLocation()
  const navigationRef = useRef<HTMLDialogElement>(null)
  const [navigationOpen, setNavigationOpen] = useState(false)
  let title = 'Page not found'
  if (pathname === '/') title = 'Dashboard'
  else if (matchPath('/assignments/new', pathname)) title = 'Assign Asset'
  else if (matchPath('/assignments/:id', pathname)) title = 'Assignment Details'
  else if (matchPath('/assignments', pathname)) title = 'Assignments'
  else if (matchPath('/assets/new', pathname)) title = 'Add Asset'
  else if (matchPath('/assets/:id/edit', pathname)) title = 'Edit Asset'
  else if (matchPath('/assets/:id', pathname)) title = 'Asset Details'
  else if (matchPath('/assets', pathname)) title = 'Assets'
  else if (matchPath('/it-requests/new', pathname)) title = 'Create IT Request'
  else if (matchPath('/it-requests/:id/edit', pathname)) title = 'Edit IT Request'
  else if (matchPath('/it-requests/:id', pathname)) title = 'IT Request Details'
  else if (matchPath('/it-requests', pathname)) title = 'IT Requests'
  else if (matchPath('/users/new', pathname)) title = 'Add User'
  else if (matchPath('/users/:id/edit', pathname)) title = 'Edit User'
  else if (matchPath('/users', pathname)) title = 'Users'
  else if (matchPath('/tickets/new', pathname)) title = 'Create Ticket'
  else if (matchPath('/tickets/:id', pathname)) title = 'Ticket Details'
  else if (matchPath('/tickets', pathname)) title = 'Tickets'

  useEffect(() => {
    navigationRef.current?.close()
  }, [pathname])

  useEffect(() => {
    const desktop = window.matchMedia('(min-width: 1024px)')
    function closeOnDesktop() {
      if (desktop.matches) navigationRef.current?.close()
    }
    desktop.addEventListener('change', closeOnDesktop)
    return () => desktop.removeEventListener('change', closeOnDesktop)
  }, [])

  useEffect(() => {
    if (!navigationOpen) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = previousOverflow }
  }, [navigationOpen])

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="fixed inset-y-0 left-0 z-40 hidden w-60 lg:block">
        <Sidebar />
      </div>
      <dialog
        ref={navigationRef}
        id="mobile-navigation"
        aria-label="Navigation"
        className="fixed inset-y-0 left-0 m-0 h-dvh max-h-none w-60 max-w-none border-0 bg-slate-950 p-0 text-white backdrop:bg-slate-950/40"
        onClose={() => setNavigationOpen(false)}
        onClick={(event) => {
          if (event.target !== event.currentTarget) return
          const bounds = event.currentTarget.getBoundingClientRect()
          if (
            event.clientX < bounds.left || event.clientX > bounds.right ||
            event.clientY < bounds.top || event.clientY > bounds.bottom
          ) {
            event.currentTarget.close()
          }
        }}
      >
        <Sidebar onClose={() => navigationRef.current?.close()} />
      </dialog>
      <div className="lg:pl-60">
        <Header
          title={title}
          navigationOpen={navigationOpen}
          onOpenNavigation={() => {
            navigationRef.current?.showModal()
            setNavigationOpen(true)
          }}
        />
        <main className="mx-auto max-w-screen-2xl p-4 sm:p-6 lg:px-8 lg:py-7">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default AppLayout
