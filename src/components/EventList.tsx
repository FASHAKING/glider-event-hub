import { useMemo, useState } from 'react'
import type { GlideEvent, EventStatus } from '../types'
import { getEventStatus } from '../types'
import EventCard from './EventCard'

const tabs: { key: EventStatus; label: string }[] = [
  { key: 'live', label: 'Live' },
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'past', label: 'Past' },
]

export default function EventList({ events }: { events: GlideEvent[] }) {
  const [tab, setTab] = useState<EventStatus>('upcoming')
  const [query, setQuery] = useState('')

  const grouped = useMemo(() => {
    const g: Record<EventStatus, GlideEvent[]> = { live: [], upcoming: [], past: [] }
    for (const e of events) g[getEventStatus(e)].push(e)
    g.upcoming.sort(
      (a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime(),
    )
    g.past.sort(
      (a, b) => new Date(b.startsAt).getTime() - new Date(a.startsAt).getTime(),
    )
    return g
  }, [events])

  const visible = grouped[tab].filter((e) => {
    if (!query.trim()) return true
    const q = query.toLowerCase()
    return (
      e.title.toLowerCase().includes(q) ||
      e.description.toLowerCase().includes(q) ||
      e.host.toLowerCase().includes(q) ||
      e.category.toLowerCase().includes(q) ||
      (e.tags || []).some((t) => t.toLowerCase().includes(q))
    )
  })

  return (
    <section id="events" className="max-w-6xl mx-auto px-5 py-10">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div className="flex items-center gap-2 p-1 card w-fit">
          {tabs.map((t) => {
            const count = grouped[t.key].length
            const active = tab === t.key
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? 'bg-glide-accent text-glide-bg'
                    : 'text-white/70 hover:text-white'
                }`}
              >
                {t.label}
                <span
                  className={`ml-2 text-xs ${
                    active ? 'text-glide-bg/70' : 'text-white/40'
                  }`}
                >
                  {count}
                </span>
              </button>
            )
          })}
        </div>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search events, hosts, tags…"
          className="card px-4 py-2 text-sm outline-none focus:border-glide-accent/60 md:w-80"
        />
      </div>

      {visible.length === 0 ? (
        <div className="card p-10 text-center text-white/60">
          No {tab} events match your search.
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((e) => (
            <EventCard key={e.id} event={e} status={tab} />
          ))}
        </div>
      )}
    </section>
  )
}
