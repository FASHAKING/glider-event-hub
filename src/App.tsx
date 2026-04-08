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
import { sampleEvents } from './data/events'
import type { GliderEvent } from './types'
import { expandRecurringEvents, getEventStatus } from './types'
import { AuthProvider, useAuth } from './context/AuthContext'
import { useLiveEventNotifications } from './hooks/useLiveEventNotifications'

const STORAGE_KEY = 'glider-event-hub:user-events'
// rough community member counter for the hero card stat
const COMMUNITY_MEMBERS = 1248

export type AppView = 'home' | 'calendar'

function AppInner() {
  const { user } = useAuth()
  const [userEvents, setUserEvents] = useState<GliderEvent[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      return raw ? (JSON.parse(raw) as GliderEvent[]) : []
    } catch {
      return []
    }
  })
  const [view, setView] = useState<AppView>('home')
  const [submitOpen, setSubmitOpen] = useState(false)
  const [authOpen, setAuthOpen] = useState(false)
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin')
  const [profileOpen, setProfileOpen] = useState(false)
  const [activeEvent, setActiveEvent] = useState<GliderEvent | null>(null)
  const [, forceTick] = useState(0)

  // Re-evaluate live/upcoming/past every 30s
  useEffect(() => {
    const id = setInterval(() => forceTick((n) => n + 1), 30_000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(userEvents))
  }, [userEvents])

  const allEvents = useMemo(
    () => expandRecurringEvents([...sampleEvents, ...userEvents]),
    [userEvents],
  )

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
        onSubmitClick={() => setSubmitOpen(true)}
        onSignInClick={() => openAuth('signin')}
        onSignUpClick={() => openAuth('signup')}
        onProfileClick={() => setProfileOpen(true)}
      />

      {liveEvent && <LiveBanner event={liveEvent} />}

      <main className="flex-1">
        {view === 'home' ? (
          <>
            <HeroCard
              total={allEvents.length}
              members={COMMUNITY_MEMBERS}
              nextEvent={nextEvent}
              onSubmitClick={() => setSubmitOpen(true)}
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
        onSubmit={(e) => {
          setUserEvents((prev) => [...prev, e])
          setSubmitOpen(false)
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
