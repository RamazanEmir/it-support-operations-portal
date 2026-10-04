import { useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { Navigate } from 'react-router'
import { ApiError } from '../api/client'
import { useAuth } from '../auth/AuthContext'
import Button from '../components/ui/Button'
import FormField from '../components/ui/FormField'
import Input from '../components/ui/Input'

function LoginPage() {
  const { currentUser, isLoading, bootstrapError, retryBootstrap, login, logout } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const submitting = useRef(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (submitting.current) return
    submitting.current = true
    setPending(true)
    setError(null)
    try {
      await login({ email: email.trim(), password })
    } catch (error) {
      setError(error instanceof ApiError && error.status === 401
        ? 'Unable to sign in. Please check your email and password.'
        : 'Unable to sign in. Please try again.')
    } finally {
      setPassword('')
      setPending(false)
      submitting.current = false
    }
  }

  if (isLoading) return <p role="status" className="p-8 text-center text-sm text-slate-500">Loading your session...</p>
  if (currentUser) return <Navigate to={currentUser.role === 'employee' ? '/tickets' : '/'} replace />

  return (
    <main className="flex min-h-dvh items-center justify-center bg-slate-50 px-4 py-10 text-slate-900">
      <section className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <p className="text-sm font-semibold text-slate-600">IT Support Operations Portal</p>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">Sign in</h1>
        {bootstrapError ? (
          <div className="mt-6 space-y-4">
            <p role="alert" className="text-sm text-red-700">{bootstrapError}</p>
            <div className="flex gap-3">
              <Button onClick={retryBootstrap}>Retry</Button>
              <Button variant="secondary" onClick={logout}>Return to sign in</Button>
            </div>
          </div>
        ) : (
          <form className="mt-6 space-y-5" onSubmit={(event) => void handleSubmit(event)}>
            <FormField label="Email" htmlFor="login-email">
              <Input id="login-email" name="email" type="email" autoComplete="username" required
                value={email} onChange={(event) => setEmail(event.target.value)} disabled={pending} />
            </FormField>
            <FormField label="Password" htmlFor="login-password">
              <Input id="login-password" name="password" type="password" autoComplete="current-password" required
                value={password} onChange={(event) => setPassword(event.target.value)} disabled={pending} />
            </FormField>
            {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
            <Button type="submit" className="w-full" disabled={pending}>{pending ? 'Signing in...' : 'Sign In'}</Button>
          </form>
        )}
      </section>
    </main>
  )
}

export default LoginPage
