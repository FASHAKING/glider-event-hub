import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import type {
  SocialConnection,
  SocialPlatform,
  UserAccount,
} from '../types'

const ACCOUNTS_KEY = 'glider-event-hub:accounts'
const SESSION_KEY = 'glider-event-hub:session'

/**
 * NOTE: this is a fully client-side auth implementation for the demo.
 * Passwords are stored as a trivial hash in localStorage – good enough to
 * keep this PR self-contained, but obviously not for production use.
 */
function trivialHash(input: string): string {
  let h = 0
  for (let i = 0; i < input.length; i++) {
    h = (h << 5) - h + input.charCodeAt(i)
    h |= 0
  }
  return `h${h}`
}

interface AuthState {
  user: UserAccount | null
  signUp: (
    username: string,
    email: string,
    password: string,
  ) => { ok: true } | { ok: false; error: string }
  signIn: (
    email: string,
    password: string,
  ) => { ok: true } | { ok: false; error: string }
  signOut: () => void
  connectSocial: (
    platform: SocialPlatform,
    handle: string,
  ) => { ok: true } | { ok: false; error: string }
  disconnectSocial: (platform: SocialPlatform) => void
  toggleSocialNotifications: (platform: SocialPlatform) => void
  toggleReminder: (eventId: string) => void
  hasReminder: (eventId: string) => boolean
}

const AuthContext = createContext<AuthState | undefined>(undefined)

function loadAccounts(): UserAccount[] {
  try {
    const raw = localStorage.getItem(ACCOUNTS_KEY)
    return raw ? (JSON.parse(raw) as UserAccount[]) : []
  } catch {
    return []
  }
}

function saveAccounts(accounts: UserAccount[]) {
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts))
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [accounts, setAccounts] = useState<UserAccount[]>(() => loadAccounts())
  const [sessionId, setSessionId] = useState<string | null>(() => {
    try {
      return localStorage.getItem(SESSION_KEY)
    } catch {
      return null
    }
  })

  useEffect(() => {
    saveAccounts(accounts)
  }, [accounts])

  useEffect(() => {
    if (sessionId) localStorage.setItem(SESSION_KEY, sessionId)
    else localStorage.removeItem(SESSION_KEY)
  }, [sessionId])

  const user = useMemo(
    () => accounts.find((a) => a.id === sessionId) || null,
    [accounts, sessionId],
  )

  const updateUser = useCallback(
    (updater: (u: UserAccount) => UserAccount) => {
      setAccounts((prev) =>
        prev.map((a) => (a.id === sessionId ? updater(a) : a)),
      )
    },
    [sessionId],
  )

  const signUp = useCallback<AuthState['signUp']>(
    (username, email, password) => {
      const cleanEmail = email.trim().toLowerCase()
      if (!username.trim() || !cleanEmail || !password)
        return { ok: false, error: 'All fields are required.' }
      if (password.length < 6)
        return { ok: false, error: 'Password must be at least 6 characters.' }
      if (accounts.some((a) => a.email.toLowerCase() === cleanEmail))
        return { ok: false, error: 'An account with that email already exists.' }
      const newUser: UserAccount = {
        id: `u-${Date.now()}`,
        username: username.trim(),
        email: cleanEmail,
        passwordHash: trivialHash(password),
        createdAt: new Date().toISOString(),
        socials: {},
        remindersFor: [],
      }
      setAccounts((prev) => [...prev, newUser])
      setSessionId(newUser.id)
      return { ok: true }
    },
    [accounts],
  )

  const signIn = useCallback<AuthState['signIn']>(
    (email, password) => {
      const cleanEmail = email.trim().toLowerCase()
      const found = accounts.find((a) => a.email.toLowerCase() === cleanEmail)
      if (!found) return { ok: false, error: 'No account with that email.' }
      if (found.passwordHash !== trivialHash(password))
        return { ok: false, error: 'Incorrect password.' }
      setSessionId(found.id)
      return { ok: true }
    },
    [accounts],
  )

  const signOut = useCallback(() => setSessionId(null), [])

  const connectSocial = useCallback<AuthState['connectSocial']>(
    (platform, handle) => {
      if (!user) return { ok: false, error: 'Sign in first.' }
      const trimmed = handle.trim().replace(/^@/, '')
      if (!trimmed)
        return { ok: false, error: 'Please enter a handle to connect.' }
      const conn: SocialConnection = {
        handle: trimmed,
        connectedAt: new Date().toISOString(),
        notifications: true,
      }
      updateUser((u) => ({
        ...u,
        socials: { ...u.socials, [platform]: conn },
      }))
      return { ok: true }
    },
    [user, updateUser],
  )

  const disconnectSocial = useCallback(
    (platform: SocialPlatform) => {
      updateUser((u) => {
        const next = { ...u.socials }
        delete next[platform]
        return { ...u, socials: next }
      })
    },
    [updateUser],
  )

  const toggleSocialNotifications = useCallback(
    (platform: SocialPlatform) => {
      updateUser((u) => {
        const current = u.socials[platform]
        if (!current) return u
        return {
          ...u,
          socials: {
            ...u.socials,
            [platform]: { ...current, notifications: !current.notifications },
          },
        }
      })
    },
    [updateUser],
  )

  const toggleReminder = useCallback(
    (eventId: string) => {
      updateUser((u) => {
        const has = u.remindersFor.includes(eventId)
        return {
          ...u,
          remindersFor: has
            ? u.remindersFor.filter((id) => id !== eventId)
            : [...u.remindersFor, eventId],
        }
      })
    },
    [updateUser],
  )

  const hasReminder = useCallback(
    (eventId: string) => !!user?.remindersFor.includes(eventId),
    [user],
  )

  const value: AuthState = {
    user,
    signUp,
    signIn,
    signOut,
    connectSocial,
    disconnectSocial,
    toggleSocialNotifications,
    toggleReminder,
    hasReminder,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
