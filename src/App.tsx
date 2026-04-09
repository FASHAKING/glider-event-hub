import { useEffect, useMemo, useState } from 'react'
import Sidebar from './components/Sidebar'
import LiveBanner from './components/LiveBanner'
import HeroCard from './components/HeroCard'
import EventList from './components/EventList'
import CalendarPage from './components/CalendarPage'
import SubmitEventModal from './components/SubmitEventModal'
import EventDetailModal from './components/EventDetailModal'
import AuthModal from './components/AuthModal'
import ProfileModal from './components/ProfileModal'
import Footer from './components/Footer'
import type { GliderEvent } from './types'
import { expandRecurringEvents, getEventStatus } from './types'
import { AuthProvider, useAuth } from './context/AuthContext'
import { useLiveEventNotifications } from './hooks/useLiveEventNotifications'
import { useEvents } from './hooks/useEvents'
import { isSupabaseConfigured } from './lib/supabase'

// rough community member counter for the hero card stat
const COMMUNITY_MEMBERS = 1248
const TELEGRAM_BOT_USERNAME = import.meta.env.VITE_TELEGRAM_BOT_USERNAME as
  | string
  | undefined

/** Top-level in-app views. Anchors like leaderboard stay as hash scrolls. */
export type AppView = 'home' | 'calendar'

function AppInner() {
  const { user } = useAuth()
  const { events, submitEvent } = useEvents(user?.id || null)
  const [view, setView] = useState<AppView>('home')
  const [submitOpen, setSubmitOpen] = useState(false)
  const [authOpen, setAuthOpen] = useState(false)
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin')
  const [profileOpen, setProfileOpen] = useState(false)
  const [activeEvent, setActiveEvent] = useState<GliderEvent | null>(null)
  const [, forceTick] = useState(0)

  // Scroll back to the top when switching top-level views.
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' })
  }, [view])

  // Re-evaluate live/upcoming/past every 30s
  useEffect(() => {
    const id = setInterval(() => forceTick((n) => n + 1), 30_000)
    return () => clearInterval(id)
  }, [])

  const allEvents = useMemo(() => expandRecurringEvents(events), [events])

  // notification dispatcher hook
  useLiveEventNotifications(allEvents)

  const liveEvent = allEvents.find((e) => getEventStatus(e) === 'live')

  const nextEvent = useMemo(() => {
    return allEvents
      .filter((e) => getEventStatus(e) === 'upcoming')
      .sort(
        (a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime(),
      )[0]
  }, [allEvents])

  const openAuth = (mode: 'signin' | 'signup' = 'signin') => {
    setAuthMode(mode)
    setAuthOpen(true)
  }

  return (
    <div className="min-h-screen flex flex-col lg:pl-64">
      <Sidebar
        view={view}
        onNavigate={setView}
        onSubmitClick={() => {
          if (isSupabaseConfigured && !user) {
            openAuth('signup')
            return
          }
          setSubmitOpen(true)
        }}
        onSignInClick={() => openAuth('signin')}
        onSignUpClick={() => openAuth('signup')}
        onProfileClick={() => setProfileOpen(true)}
      />

      {!isSupabaseConfigured && (
        <div className="bg-amber-100 dark:bg-amber-500/20 border-b border-amber-200 dark:border-amber-500/30 text-amber-800 dark:text-amber-200 text-xs px-5 py-1.5 text-center">
          Demo mode — Supabase not configured. Set <code>VITE_SUPABASE_URL</code> and
          <code className="ml-1">VITE_SUPABASE_ANON_KEY</code> in <code>.env.local</code> to enable real accounts and notifications.
        </div>
      )}

      {liveEvent && <LiveBanner event={liveEvent} />}

      <main className="flex-1">
        {view === 'home' ? (
          <>
            <HeroCard
              total={allEvents.length}
              members={COMMUNITY_MEMBERS}
              nextEvent={nextEvent}
              onSubmitClick={() => {
                if (isSupabaseConfigured && !user) {
                  openAuth('signup')
                  return
                }
                setSubmitOpen(true)
              }}
            />
            <EventList events={allEvents} onOpenEvent={setActiveEvent} />
          </>
        ) : (
          <CalendarPage
            events={allEvents}
            onOpenEvent={setActiveEvent}
            onBack={() => setView('home')}
          />
        )}
      </main>

      <Footer />

      <SubmitEventModal
        open={submitOpen}
        onClose={() => setSubmitOpen(false)}
        onSubmit={async (payload) => {
          const result = await submitEvent(payload)
          if (result.ok) {
            setSubmitOpen(false)
            return { ok: true as const }
          }
          return { ok: false as const, error: result.error }
        }}
      />

      <EventDetailModal
        event={activeEvent}
        onClose={() => setActiveEvent(null)}
        onRequireAuth={() => openAuth('signup')}
      />

      <AuthModal
        open={authOpen}
        onClose={() => setAuthOpen(false)}
        initialMode={authMode}
      />

      <ProfileModal
        open={profileOpen && !!user}
        onClose={() => setProfileOpen(false)}
        telegramBotUsername={TELEGRAM_BOT_USERNAME}
      />
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  )
}
