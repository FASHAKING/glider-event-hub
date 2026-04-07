import { useMemo, useState } from 'react'
import type { GlideEvent, EventStatus } from '../types'
import { getEventStatus } from '../types'
import EventCard from './EventCard'
import { SearchIcon } from './Icons'

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
    <section id="events" className="max-w-6xl mx-auto px-5 py-12">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div className="flex items-center gap-1 p-1 bg-white border border-glide-border rounded-2xl shadow-soft w-fit">
          {tabs.map((t) => {
            const count = grouped[t.key].length
            const active = tab === t.key
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`px-4 py-1.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                  active
                    ? 'bg-glide-olive text-white shadow-sm'
                    : 'text-glide-gray hover:text-glide-black hover:bg-glide-light'
                }`}
              >
                {t.label}
                <span
                  className={`ml-2 text-xs ${
                    active ? 'text-white/75' : 'text-glide-gray/60'
                  }`}
                >
                  {count}
                </span>
              </button>
            )
          })}
        </div>

        <div className="relative md:w-80">
          <SearchIcon
            width={16}
            height={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-glide-gray"
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search events, hosts, tags…"
            className="input pl-10"
          />
        </div>
      </div>

      {visible.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="text-glide-black font-medium">No {tab} events found</p>
          <p className="text-glide-gray text-sm mt-1">
            Try a different search or check back soon.
          </p>
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
