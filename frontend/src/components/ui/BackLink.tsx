import { Link } from 'react-router'
import Icon from './Icon'

function BackLink({ to }: { to: string }) {
  return (
    <Link to={to} className="mb-3 -ml-2 inline-flex min-h-9 items-center gap-2 rounded-md border border-transparent px-3.5 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
      <Icon name="arrow-left" />
      Back
    </Link>
  )
}

export default BackLink
