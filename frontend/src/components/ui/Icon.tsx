type IconProps = {
  name: 'asset' | 'dashboard' | 'ticket' | 'menu' | 'close' | 'users' | 'plus' | 'arrow-left'
  className?: string
}

function Icon({ name, className = 'size-5' }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {name === 'dashboard' && <path d="M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z" />}
      {name === 'ticket' && (
        <>
          <path d="M4 5.5A1.5 1.5 0 0 1 5.5 4h13A1.5 1.5 0 0 1 20 5.5V9a3 3 0 0 0 0 6v3.5a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 18.5V15a3 3 0 0 0 0-6V5.5Z" />
          <path d="M13 7v2M13 15v2M13 11v2" />
        </>
      )}
      {name === 'menu' && <path d="M4 6h16M4 12h16M4 18h16" />}
      {name === 'asset' && <><rect x="3" y="3" width="18" height="13" rx="2" /><path d="M8 21h8M12 16v5" /></>}
      {name === 'close' && <path d="m6 6 12 12M18 6 6 18" />}
      {name === 'users' && (
        <>
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
        </>
      )}
      {name === 'plus' && <path d="M12 5v14M5 12h14" />}
      {name === 'arrow-left' && <path d="m15 18-6-6 6-6" />}
    </svg>
  )
}

export default Icon
