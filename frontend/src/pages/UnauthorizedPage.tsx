function UnauthorizedPage() {
  return (
    <section>
      <h1 className="text-2xl font-semibold tracking-tight text-slate-950">Access denied</h1>
      <p role="alert" className="mt-1.5 text-sm text-slate-500">You do not have permission to access this page.</p>
    </section>
  )
}

export default UnauthorizedPage
