import { useEffect, useMemo, useState } from 'react'
import Header from './components/Header'
import Hero from './components/Hero'
import EventList from './components/EventList'
import SubmitEventModal from './components/SubmitEventModal'
import Footer from './components/Footer'
import { sampleEvents } from './data/events'
import type { GlideEvent } from './types'
import { getEventStatus } from './types'

const STORAGE_KEY = 'glide-event-hub:user-events'

export default function App() {
  const [userEvents, setUserEvents] = useState<GlideEvent[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      return raw ? (JSON.parse(raw) as GlideEvent[]) : []
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

  const liveCount = allEvents.filter((e) => getEventStatus(e) === 'live').length

  return (
    <div className="min-h-screen flex flex-col">
      <Header onSubmitClick={() => setModalOpen(true)} />
      <main className="flex-1">
        <Hero total={allEvents.length} live={liveCount} />
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
