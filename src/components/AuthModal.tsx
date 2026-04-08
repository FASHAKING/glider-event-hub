import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'

interface Props {
  open: boolean
  onClose: () => void
  /** which mode to start in; defaults to 'signin' */
  initialMode?: 'signin' | 'signup'
}

export default function AuthModal({ open, onClose, initialMode = 'signin' }: Props) {
  const { signIn, signUp } = useAuth()
  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode)
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (open) {
      setMode(initialMode)
      setError(null)
    }
  }, [open, initialMode])

  if (!open) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      const result =
        mode === 'signup'
          ? await signUp(username, email, password)
          : await signIn(email, password)
      if (!result.ok) {
        setError(result.error ?? 'Something went wrong.')
        return
      }
      setUsername('')
      setEmail('')
      setPassword('')
      onClose()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-glider-black/40 dark:bg-glider-black/80 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
        className="card w-full max-w-md p-6 shadow-card space-y-5"
      >
        <div className="flex items-start justify-between">
          <div>
            <h2 className="font-display text-2xl font-bold text-glider-black dark:text-glider-darkText">
              {mode === 'signup' ? 'Create your account' : 'Welcome back'}
            </h2>
            <p className="text-sm text-glider-gray dark:text-glider-darkMuted mt-0.5">
              {mode === 'signup'
                ? 'Set reminders, connect socials, get notified.'
                : 'Sign in to manage reminders and notifications.'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-glider-gray dark:text-glider-darkMuted hover:text-glider-black dark:hover:text-glider-darkText text-2xl leading-none w-8 h-8 rounded-full hover:bg-glider-light dark:hover:bg-glider-darkPanel2 flex items-center justify-center"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="space-y-3">
          {mode === 'signup' && (
            <Field label="Username">
              <input
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="input"
                placeholder="@yourhandle"
              />
            </Field>
          )}
          <Field label="Email">
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input"
              placeholder="you@example.com"
            />
          </Field>
          <Field label="Password">
            <input
              required
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input"
              placeholder="••••••••"
            />
          </Field>
        </div>

        {error && (
          <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-xl px-3 py-2">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="btn-primary w-full text-sm disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {submitting
            ? mode === 'signup'
              ? 'Creating account…'
              : 'Signing in…'
            : mode === 'signup'
              ? 'Create account'
              : 'Sign in'}
        </button>

        <div className="text-center text-xs text-glider-gray dark:text-glider-darkMuted">
          {mode === 'signup' ? (
            <>
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => {
                  setMode('signin')
                  setError(null)
                }}
                className="text-glider-olive dark:text-glider-mint font-semibold hover:underline"
              >
                Sign in
              </button>
            </>
          ) : (
            <>
              New here?{' '}
              <button
                type="button"
                onClick={() => {
                  setMode('signup')
                  setError(null)
                }}
                className="text-glider-olive dark:text-glider-mint font-semibold hover:underline"
              >
                Create an account
              </button>
            </>
          )}
        </div>
      </form>
    </div>
  )
}

function Field({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <label className="block">
      <span className="block text-xs uppercase tracking-wider text-glider-gray dark:text-glider-darkMuted font-medium mb-1.5">
        {label}
      </span>
      {children}
    </label>
  )
}
