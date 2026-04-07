import { useEffect, useMemo, useState } from 'react'
import Sidebar from './components/Sidebar'
import LiveBanner from './components/LiveBanner'
import HeroCard from './components/HeroCard'
import EventList from './components/EventList'
import SubmitEventModal from './components/SubmitEventModal'
import Footer from './components/Footer'
import { sampleEvents } from './data/events'
import type { GliderEvent } from './types'
import { getEventStatus } from './types'

const STORAGE_KEY = 'glider-event-hub:user-events'
// rough community member counter for the hero card stat
const COMMUNITY_MEMBERS = 1248

export default function App() {
  const [userEvents, setUserEvents] = useState<GliderEvent[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      return raw ? (JSON.parse(raw) as GliderEvent[]) : []
    } catch {
      return []
    }
  })
  const [modalOpen, setModalOpen] = useState(false)
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
    () => [...sampleEvents, ...userEvents],
    [userEvents],
  )

  const liveEvent = allEvents.find((e) => getEventStatus(e) === 'live')

  const nextEvent = useMemo(() => {
    return allEvents
      .filter((e) => getEventStatus(e) === 'upcoming')
      .sort(
        (a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime(),
      )[0]
  }, [allEvents])

  return (
    <div className="min-h-screen flex flex-col lg:pl-64">
      <Sidebar onSubmitClick={() => setModalOpen(true)} />

      {liveEvent && <LiveBanner event={liveEvent} />}

      <main className="flex-1">
        <HeroCard
          total={allEvents.length}
          members={COMMUNITY_MEMBERS}
          nextEvent={nextEvent}
          onSubmitClick={() => setModalOpen(true)}
        />
        <EventList events={allEvents} />
      </main>

      <Footer />

      <SubmitEventModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={(e) => {
          setUserEvents((prev) => [...prev, e])
          setModalOpen(false)
        }}
      />
    </div>
  )
}
