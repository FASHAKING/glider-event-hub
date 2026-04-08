import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import type {
  SocialConnection,
  SocialConnections,
  SocialPlatform,
  UserAccount,
} from '../types'

const ACCOUNTS_KEY = 'glider-event-hub:accounts'
const SESSION_KEY = 'glider-event-hub:session'

/**
 * AuthContext supports two modes:
 *
 *   1. Supabase mode  – when VITE_SUPABASE_URL/KEY are set, real
 *      email/password auth runs against Supabase. Profile, socials,
 *      reminders are loaded from the public.* tables.
 *
 *   2. Demo mode      – when env vars are missing, the original
 *      localStorage-only flow is used. This keeps the app usable
 *      without any backend configuration.
 */

interface AuthState {
  user: UserAccount | null
  /** Underlying Supabase user (only present in Supabase mode) */
  authUser: User | null
  loading: boolean
  configured: boolean
  signUp: (
    username: string,
    email: string,
    password: string,
  ) => Promise<{ ok: true } | { ok: false; error: string }>
  signIn: (
    email: string,
    password: string,
  ) => Promise<{ ok: true } | { ok: false; error: string }>
  signOut: () => Promise<void>
  connectSocial: (
    platform: SocialPlatform,
    handle: string,
    externalId?: string,
  ) => Promise<{ ok: true } | { ok: false; error: string }>
  disconnectSocial: (platform: SocialPlatform) => Promise<void>
  toggleSocialNotifications: (platform: SocialPlatform) => Promise<void>
  toggleReminder: (eventId: string) => Promise<void>
  hasReminder: (eventId: string) => boolean
  /** Force a refresh of profile/socials/reminders from the backend */
  refresh: () => Promise<void>
}

const AuthContext = createContext<AuthState | undefined>(undefined)

/* ----------------------------------------------------------------- */
/* Demo-mode helpers (localStorage)                                   */
/* ----------------------------------------------------------------- */

function trivialHash(input: string): string {
  let h = 0
  for (let i = 0; i < input.length; i++) {
    h = (h << 5) - h + input.charCodeAt(i)
    h |= 0
  }
  return `h${h}`
}

function loadLocalAccounts(): UserAccount[] {
  try {
    const raw = localStorage.getItem(ACCOUNTS_KEY)
    return raw ? (JSON.parse(raw) as UserAccount[]) : []
  } catch {
    return []
  }
}
function saveLocalAccounts(accounts: UserAccount[]) {
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts))
}

/* ----------------------------------------------------------------- */
/* Provider                                                           */
/* ----------------------------------------------------------------- */

export function AuthProvider({ children }: { children: React.ReactNode }) {
  if (isSupabaseConfigured) return <SupabaseAuthProvider>{children}</SupabaseAuthProvider>
  return <DemoAuthProvider>{children}</DemoAuthProvider>
}

/* ============== Supabase-backed implementation =================== */

function SupabaseAuthProvider({ children }: { children: React.ReactNode }) {
  const sb = supabase!
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<{
    id: string
    username: string
    email: string
  } | null>(null)
  const [socials, setSocials] = useState<SocialConnections>({})
  const [reminders, setReminders] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  const loadProfileData = useCallback(async (uid: string) => {
    const [{ data: prof }, { data: socs }, { data: rems }] = await Promise.all([
      sb.from('profiles').select('id, username, email').eq('id', uid).maybeSingle(),
      sb.from('social_connections').select('*').eq('user_id', uid),
      sb.from('reminders').select('event_id').eq('user_id', uid),
    ])
    setProfile(prof || null)

    // Defensive: if the user predates migration 0002 they may be missing
    // an 'email' row. Insert one (notifications on by default) using the
    // email from their profile so the notify edge function can find them.
    let socRows = socs || []
    if (prof && !socRows.some((r) => r.platform === 'email')) {
      const { data: inserted } = await sb
        .from('social_connections')
        .upsert(
          {
            user_id: prof.id,
            platform: 'email',
            handle: prof.email,
            notifications: true,
            connected_at: new Date().toISOString(),
          },
          { onConflict: 'user_id,platform' },
        )
        .select()
      if (inserted && inserted.length > 0) {
        socRows = [...socRows, ...inserted]
      }
    }

    const map: SocialConnections = {}
    for (const row of socRows) {
      const conn: SocialConnection = {
        handle: row.handle,
        connectedAt: row.connected_at,
        notifications: row.notifications,
        externalId: row.external_id || undefined,
      }
      map[row.platform as SocialPlatform] = conn
    }
    setSocials(map)
    setReminders((rems || []).map((r) => r.event_id))
  }, [sb])

  useEffect(() => {
    let alive = true
    sb.auth.getSession().then(({ data }) => {
      if (!alive) return
      setSession(data.session)
      if (data.session?.user) {
        loadProfileData(data.session.user.id).finally(() => setLoading(false))
      } else {
        setLoading(false)
      }
    })
    const { data: sub } = sb.auth.onAuthStateChange((_event, sess) => {
      setSession(sess)
      if (sess?.user) {
        loadProfileData(sess.user.id)
      } else {
        setProfile(null)
        setSocials({})
        setReminders([])
      }
    })
    return () => {
      alive = false
      sub.subscription.unsubscribe()
    }
  }, [sb, loadProfileData])

  const refresh = useCallback(async () => {
    if (session?.user) await loadProfileData(session.user.id)
  }, [session, loadProfileData])

  const signUp = useCallback<AuthState['signUp']>(
    async (username, email, password) => {
      if (!username.trim() || !email.trim() || !password)
        return { ok: false, error: 'All fields are required.' }
      if (password.length < 6)
        return { ok: false, error: 'Password must be at least 6 characters.' }
      const { error } = await sb.auth.signUp({
        email: email.trim(),
        password,
        options: { data: { username: username.trim() } },
      })
      if (error) return { ok: false, error: error.message }
      return { ok: true }
    },
    [sb],
  )

  const signIn = useCallback<AuthState['signIn']>(
    async (email, password) => {
      const { error } = await sb.auth.signInWithPassword({
        email: email.trim(),
        password,
      })
      if (error) return { ok: false, error: error.message }
      return { ok: true }
    },
    [sb],
  )

  const signOut = useCallback(async () => {
    await sb.auth.signOut()
  }, [sb])

  const connectSocial = useCallback<AuthState['connectSocial']>(
    async (platform, handle, externalId) => {
      if (!session?.user) return { ok: false, error: 'Sign in first.' }
      const trimmed = handle.trim().replace(/^@/, '')
      if (!trimmed) return { ok: false, error: 'Please enter a handle to connect.' }
      const { error } = await sb.from('social_connections').upsert({
        user_id: session.user.id,
        platform,
        handle: trimmed,
        external_id: externalId || null,
        notifications: true,
        connected_at: new Date().toISOString(),
      })
      if (error) return { ok: false, error: error.message }
      await refresh()
      return { ok: true }
    },
    [sb, session, refresh],
  )

  const disconnectSocial = useCallback<AuthState['disconnectSocial']>(
    async (platform) => {
      if (!session?.user) return
      await sb
        .from('social_connections')
        .delete()
        .eq('user_id', session.user.id)
        .eq('platform', platform)
      await refresh()
    },
    [sb, session, refresh],
  )

  const toggleSocialNotifications = useCallback<
    AuthState['toggleSocialNotifications']
  >(
    async (platform) => {
      if (!session?.user) return
      const cur = socials[platform]
      if (!cur) return
      await sb
        .from('social_connections')
        .update({ notifications: !cur.notifications })
        .eq('user_id', session.user.id)
        .eq('platform', platform)
      await refresh()
    },
    [sb, session, socials, refresh],
  )

  const toggleReminder = useCallback<AuthState['toggleReminder']>(
    async (eventId) => {
      if (!session?.user) return
      const has = reminders.includes(eventId)
      if (has) {
        await sb
          .from('reminders')
          .delete()
          .eq('user_id', session.user.id)
          .eq('event_id', eventId)
      } else {
        await sb
          .from('reminders')
          .insert({ user_id: session.user.id, event_id: eventId })
      }
      await refresh()
    },
    [sb, session, reminders, refresh],
  )

  const hasReminder = useCallback(
    (eventId: string) => reminders.includes(eventId),
    [reminders],
  )

  const user = useMemo<UserAccount | null>(() => {
    if (!session?.user || !profile) return null
    return {
      id: profile.id,
      username: profile.username,
      email: profile.email,
      passwordHash: '',
      createdAt: session.user.created_at || new Date().toISOString(),
      socials,
      remindersFor: reminders,
    }
  }, [session, profile, socials, reminders])

  const value: AuthState = {
    user,
    authUser: session?.user || null,
    loading,
    configured: true,
    signUp,
    signIn,
    signOut,
    connectSocial,
    disconnectSocial,
    toggleSocialNotifications,
    toggleReminder,
    hasReminder,
    refresh,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

/* ============== Demo (localStorage) implementation =============== */

function DemoAuthProvider({ children }: { children: React.ReactNode }) {
  const [accounts, setAccounts] = useState<UserAccount[]>(() => loadLocalAccounts())
  const [sessionId, setSessionId] = useState<string | null>(() => {
    try {
      return localStorage.getItem(SESSION_KEY)
    } catch {
      return null
    }
  })

  useEffect(() => {
    saveLocalAccounts(accounts)
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
    async (username, email, password) => {
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
    async (email, password) => {
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

  const signOut = useCallback(async () => {
    setSessionId(null)
  }, [])

  const connectSocial = useCallback<AuthState['connectSocial']>(
    async (platform, handle, externalId) => {
      if (!user) return { ok: false, error: 'Sign in first.' }
      const trimmed = handle.trim().replace(/^@/, '')
      if (!trimmed)
        return { ok: false, error: 'Please enter a handle to connect.' }
      const conn: SocialConnection = {
        handle: trimmed,
        connectedAt: new Date().toISOString(),
        notifications: true,
        externalId,
      }
      updateUser((u) => ({
        ...u,
        socials: { ...u.socials, [platform]: conn },
      }))
      return { ok: true }
    },
    [user, updateUser],
  )

  const disconnectSocial = useCallback<AuthState['disconnectSocial']>(
    async (platform) => {
      updateUser((u) => {
        const next = { ...u.socials }
        delete next[platform]
        return { ...u, socials: next }
      })
    },
    [updateUser],
  )

  const toggleSocialNotifications = useCallback<
    AuthState['toggleSocialNotifications']
  >(
    async (platform) => {
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

  const toggleReminder = useCallback<AuthState['toggleReminder']>(
    async (eventId) => {
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
    authUser: null,
    loading: false,
    configured: false,
    signUp,
    signIn,
    signOut,
    connectSocial,
    disconnectSocial,
    toggleSocialNotifications,
    toggleReminder,
    hasReminder,
    refresh: async () => {},
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
