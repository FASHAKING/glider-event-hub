import { useEffect, useMemo, useState } from 'react'
import Sidebar from './components/Sidebar'
import LiveBanner from './components/LiveBanner'
import HeroCard from './components/HeroCard'
import EventList from './components/EventList'
import CalendarPage from './components/CalendarPage'
import LeaderboardPage from './components/LeaderboardPage'
import SubmitEventModal from './components/SubmitEventModal'
import EventDetailModal from './components/EventDetailModal'
import EditEventModal from './components/EditEventModal'
import AuthModal from './components/AuthModal'
import ProfileModal from './components/ProfileModal'
import SuggestionModal from './components/SuggestionModal'
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
export type AppView = 'home' | 'calendar' | 'leaderboard'

function AppInner() {
  const { user } = useAuth()
  const isAdmin = user?.isAdmin || false
  const { events, submitEvent, updateEvent, deleteEvent, toggleFeatured, approveEvent, rejectEvent } = useEvents(user?.id || null, isAdmin)
  const [view, setView] = useState<AppView>('home')
  const [submitOpen, setSubmitOpen] = useState(false)
  const [authOpen, setAuthOpen] = useState(false)
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin')
  const [profileOpen, setProfileOpen] = useState(false)
  const [suggestionOpen, setSuggestionOpen] = useState(false)
  const [activeEvent, setActiveEvent] = useState<GliderEvent | null>(null)
  const [editingEvent, setEditingEvent] = useState<GliderEvent | null>(null)
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

  // Only approved events should drive the live banner and hero stats
  const approvedEvents = useMemo(
    () => allEvents.filter((e) => e.status !== 'pending' && e.status !== 'rejected'),
    [allEvents],
  )

  const liveEvent = approvedEvents.find((e) => getEventStatus(e) === 'live')

  const nextEvent = useMemo(() => {
    return approvedEvents
      .filter((e) => getEventStatus(e) === 'upcoming')
      .sort(
        (a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime(),
      )[0]
  }, [approvedEvents])

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
        onSuggestionClick={() => setSuggestionOpen(true)}
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
              total={approvedEvents.length}
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
            <EventList events={isAdmin ? allEvents : approvedEvents} onOpenEvent={setActiveEvent} isAdmin={isAdmin} />
          </>
        ) : view === 'calendar' ? (
          <CalendarPage
            events={approvedEvents}
            onOpenEvent={setActiveEvent}
            onBack={() => setView('home')}
          />
        ) : (
          <LeaderboardPage
            events={allEvents}
            onSignUpClick={() => openAuth('signup')}
          />
        )}
      </main>

      <Footer />

      <SubmitEventModal
        open={submitOpen}
        onClose={() => setSubmitOpen(false)}
        isAdmin={isAdmin}
        onSubmit={async (payload) => {
          const result = await submitEvent(payload)
          if (result.ok) {
            if (isAdmin) setSubmitOpen(false)
            return { ok: true as const }
          }
          return { ok: false as const, error: result.error }
        }}
      />

      <SuggestionModal
        open={suggestionOpen}
        onClose={() => setSuggestionOpen(false)}
        onSubmit={async (payload) => {
          // Log suggestion to console for now, or save to backend later
          console.log('Suggestion submitted:', payload)
          // Simulate network request
          await new Promise(resolve => setTimeout(resolve, 600))
          return { ok: true }
        }}
      />

      <EventDetailModal
        event={activeEvent}
        onClose={() => setActiveEvent(null)}
        onRequireAuth={() => openAuth('signup')}
        onEditEvent={(ev) => {
          setActiveEvent(null)
          setEditingEvent(ev)
        }}
        onDeleteEvent={async (id) => {
          await deleteEvent(id)
          setActiveEvent(null)
        }}
        onToggleFeatured={async (id, featured) => {
          await toggleFeatured(id, featured)
          // Update the active event so the UI reflects the change immediately
          setActiveEvent((prev) =>
            prev && prev.id === id ? { ...prev, isFeatured: featured } : prev,
          )
        }}
        onApproveEvent={async (id) => {
          await approveEvent(id)
          setActiveEvent((prev) =>
            prev && prev.id === id ? { ...prev, status: 'approved' } : prev,
          )
        }}
        onRejectEvent={async (id) => {
          await rejectEvent(id)
          setActiveEvent(null)
        }}
      />

      <EditEventModal
        event={editingEvent}
        onClose={() => setEditingEvent(null)}
        onSave={async (id, updates, imageFile) => {
          const result = await updateEvent(id, updates, imageFile ?? undefined)
          if (result.ok) {
            setEditingEvent(null)
          }
          return result
        }}
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
