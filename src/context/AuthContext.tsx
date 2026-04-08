import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import type { Session } from '@supabase/supabase-js'
import type {
  SocialConnection,
  SocialPlatform,
  UserAccount,
} from '../types'
import { supabase } from '../lib/supabase'

/**
 * Authentication is backed by Supabase Auth. Profile data that isn't part of
 * the auth session (username, connected socials, reminder bookmarks) is still
 * kept in localStorage, keyed by the Supabase user id — this keeps the change
 * surgical and avoids needing an extra `profiles` table just to log in.
 */

const PROFILES_KEY = 'glider-event-hub:profiles'

interface StoredProfile {
  username: string
  email: string
  createdAt: string
  socials: Record<string, SocialConnection>
  remindersFor: string[]
}

type ProfileMap = Record<string, StoredProfile>

function loadProfiles(): ProfileMap {
  try {
    const raw = localStorage.getItem(PROFILES_KEY)
    return raw ? (JSON.parse(raw) as ProfileMap) : {}
  } catch {
    return {}
  }
}

function saveProfiles(map: ProfileMap) {
  localStorage.setItem(PROFILES_KEY, JSON.stringify(map))
}

function emptyProfile(email: string, username: string): StoredProfile {
  return {
    username,
    email,
    createdAt: new Date().toISOString(),
    socials: {},
    remindersFor: [],
  }
}

interface AuthResult {
  ok: boolean
  error?: string
}

interface AuthState {
  user: UserAccount | null
  signUp: (
    username: string,
    email: string,
    password: string,
  ) => Promise<AuthResult>
  signIn: (email: string, password: string) => Promise<AuthResult>
  signOut: () => Promise<void>
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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [profiles, setProfiles] = useState<ProfileMap>(() => loadProfiles())
  const [ready, setReady] = useState(false)

  useEffect(() => {
    saveProfiles(profiles)
  }, [profiles])

  // Hydrate session on mount and subscribe to auth changes.
  useEffect(() => {
    let active = true
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return
      setSession(data.session)
      setReady(true)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s)
    })
    return () => {
      active = false
      sub.subscription.unsubscribe()
    }
  }, [])

  // Whenever a user signs in, pull their reminder bookmarks from Supabase so
  // the reminder cron + the UI agree. Signed-out state leaves existing local
  // reminders untouched (they're still rendered in the profile modal history).
  useEffect(() => {
    const userId = session?.user?.id
    if (!userId) return
    let cancelled = false
    supabase
      .from('event_reminders')
      .select('event_id')
      .eq('user_id', userId)
      .then(({ data, error }) => {
        if (cancelled) return
        if (error) {
          // Table may not exist yet if the migration hasn't been run.
          // eslint-disable-next-line no-console
          console.warn('[reminders] could not load from Supabase:', error.message)
          return
        }
        const ids = (data ?? []).map((r) => r.event_id as string)
        setProfiles((prev) => {
          const current =
            prev[userId] ??
            emptyProfile(session?.user?.email ?? '', session?.user?.email?.split('@')[0] ?? 'glider')
          return {
            ...prev,
            [userId]: { ...current, remindersFor: ids },
          }
        })
      })
    return () => {
      cancelled = true
    }
  }, [session?.user?.id])

  const user = useMemo<UserAccount | null>(() => {
    if (!session?.user) return null
    const authUser = session.user
    const profile =
      profiles[authUser.id] ??
      emptyProfile(
        authUser.email ?? '',
        (authUser.user_metadata?.username as string) ??
          authUser.email?.split('@')[0] ??
          'glider',
      )
    return {
      id: authUser.id,
      username: profile.username,
      email: profile.email || authUser.email || '',
      passwordHash: '',
      createdAt: profile.createdAt,
      socials: profile.socials,
      remindersFor: profile.remindersFor,
    }
  }, [session, profiles])

  const updateProfile = useCallback(
    (userId: string, updater: (p: StoredProfile) => StoredProfile) => {
      setProfiles((prev) => {
        const current =
          prev[userId] ?? emptyProfile(user?.email ?? '', user?.username ?? '')
        return { ...prev, [userId]: updater(current) }
      })
    },
    [user],
  )

  const signUp = useCallback<AuthState['signUp']>(
    async (username, email, password) => {
      const cleanEmail = email.trim().toLowerCase()
      const cleanUsername = username.trim()
      if (!cleanUsername || !cleanEmail || !password)
        return { ok: false, error: 'All fields are required.' }
      if (password.length < 6)
        return { ok: false, error: 'Password must be at least 6 characters.' }

      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: { data: { username: cleanUsername } },
      })
      if (error) return { ok: false, error: error.message }
      const newUserId = data.user?.id
      if (newUserId) {
        setProfiles((prev) => ({
          ...prev,
          [newUserId]: emptyProfile(cleanEmail, cleanUsername),
        }))
      }
      if (!data.session) {
        return {
          ok: false,
          error:
            'Account created — check your inbox to confirm your email, then sign in.',
        }
      }
      return { ok: true }
    },
    [],
  )

  const signIn = useCallback<AuthState['signIn']>(async (email, password) => {
    const cleanEmail = email.trim().toLowerCase()
    if (!cleanEmail || !password)
      return { ok: false, error: 'Email and password are required.' }
    const { data, error } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password,
    })
    if (error) return { ok: false, error: error.message }
    const signedInId = data.user?.id
    if (signedInId) {
      setProfiles((prev) => {
        if (prev[signedInId]) return prev
        const username =
          (data.user?.user_metadata?.username as string) ??
          cleanEmail.split('@')[0]
        return {
          ...prev,
          [signedInId]: emptyProfile(cleanEmail, username),
        }
      })
    }
    return { ok: true }
  }, [])

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
  }, [])

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
      updateProfile(user.id, (p) => ({
        ...p,
        socials: { ...p.socials, [platform]: conn },
      }))
      return { ok: true }
    },
    [user, updateProfile],
  )

  const disconnectSocial = useCallback(
    (platform: SocialPlatform) => {
      if (!user) return
      updateProfile(user.id, (p) => {
        const next = { ...p.socials }
        delete next[platform]
        return { ...p, socials: next }
      })
    },
    [user, updateProfile],
  )

  const toggleSocialNotifications = useCallback(
    (platform: SocialPlatform) => {
      if (!user) return
      updateProfile(user.id, (p) => {
        const current = p.socials[platform]
        if (!current) return p
        return {
          ...p,
          socials: {
            ...p.socials,
            [platform]: { ...current, notifications: !current.notifications },
          },
        }
      })
    },
    [user, updateProfile],
  )

  const toggleReminder = useCallback(
    (eventId: string) => {
      if (!user) return
      const has = user.remindersFor.includes(eventId)

      // Optimistic local update so the UI flips immediately.
      updateProfile(user.id, (p) => ({
        ...p,
        remindersFor: has
          ? p.remindersFor.filter((id) => id !== eventId)
          : [...p.remindersFor, eventId],
      }))

      // Persist to Supabase so the reminder cron can pick it up. Failures are
      // non-fatal for the UI — we log and leave the optimistic state in place.
      const persist = async () => {
        try {
          if (has) {
            const { error } = await supabase
              .from('event_reminders')
              .delete()
              .eq('user_id', user.id)
              .eq('event_id', eventId)
            if (error) throw error
          } else {
            const { error } = await supabase
              .from('event_reminders')
              .insert({ user_id: user.id, event_id: eventId })
            if (error) throw error
          }
        } catch (e) {
          // eslint-disable-next-line no-console
          console.warn(
            '[reminders] could not sync to Supabase:',
            e instanceof Error ? e.message : e,
          )
        }
      }
      void persist()
    },
    [user, updateProfile],
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

  // Keep the provider behavior unchanged even before the session has hydrated;
  // `user` will simply be null during that brief window.
  void ready

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
