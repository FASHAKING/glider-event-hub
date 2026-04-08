import { useMemo, useState } from 'react'
import type { GliderEvent, EventStatus } from '../types'
import { getEventStatus, PRESET_CATEGORIES } from '../types'
import EventCard from './EventCard'
import { SearchIcon, GridIcon, ListIcon, ChevronDownIcon } from './Icons'

type Tab = 'all' | EventStatus

const tabs: { key: Tab; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'live', label: 'Now' },
  { key: 'past', label: 'Past' },
]

interface EventListProps {
  events: GliderEvent[]
  onOpenEvent: (event: GliderEvent) => void
}

export default function EventList({ events, onOpenEvent }: EventListProps) {
  const [tab, setTab] = useState<Tab>('all')
  const [query, setQuery] = useState('')
  const [view, setView] = useState<'grid' | 'list'>('grid')
  const [category, setCategory] = useState<string>('All')
  const [catOpen, setCatOpen] = useState(false)

  const withStatus = useMemo(
    () => events.map((e) => ({ event: e, status: getEventStatus(e) })),
    [events],
  )

  // Pull every category that appears in the event list, union it with the
  // built-in presets so the filter shows them even if no event uses them yet,
  // and deduplicate (case-sensitive since that's how we compare downstream).
  const allCategories = useMemo(() => {
    const seen = new Set<string>(PRESET_CATEGORIES)
    for (const e of events) if (e.category) seen.add(e.category)
    return Array.from(seen)
  }, [events])

  const counts = useMemo(() => {
    const c: Record<Tab, number> = { all: events.length, live: 0, upcoming: 0, past: 0 }
    for (const { status } of withStatus) c[status]++
    return c
  }, [withStatus, events.length])

  const visible = useMemo(() => {
    let list = withStatus
    if (tab !== 'all') list = list.filter((x) => x.status === tab)
    if (category !== 'All') list = list.filter((x) => x.event.category === category)
    if (query.trim()) {
      const q = query.toLowerCase()
      list = list.filter(({ event: e }) =>
        e.title.toLowerCase().includes(q) ||
        e.description.toLowerCase().includes(q) ||
        e.host.toLowerCase().includes(q) ||
        e.category.toLowerCase().includes(q) ||
        (e.tags || []).some((t) => t.toLowerCase().includes(q)),
      )
    }
    // sort: live first, then upcoming asc, then past desc
    return [...list].sort((a, b) => {
      const order: Record<EventStatus, number> = { live: 0, upcoming: 1, past: 2 }
      if (order[a.status] !== order[b.status]) return order[a.status] - order[b.status]
      const at = new Date(a.event.startsAt).getTime()
      const bt = new Date(b.event.startsAt).getTime()
      return a.status === 'past' ? bt - at : at - bt
    })
  }, [withStatus, tab, category, query])

  return (
    <section id="events" className="px-5 lg:px-10 py-8">
      {/* Filters bar */}
      <div className="flex flex-col gap-4 mb-7">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-1 p-1 bg-white dark:bg-glider-darkPanel border border-glider-border dark:border-glider-darkBorder rounded-2xl shadow-soft w-fit">
            {tabs.map((t) => {
              const count = counts[t.key]
              const active = tab === t.key
              return (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={`px-4 py-1.5 rounded-xl text-sm font-medium transition-all ${
                    active
                      ? 'bg-glider-olive text-white shadow-sm dark:bg-glider-mint dark:text-glider-darkBg'
                      : 'text-glider-gray dark:text-glider-darkMuted hover:text-glider-black dark:hover:text-glider-darkText hover:bg-glider-light dark:hover:bg-glider-darkPanel2'
                  }`}
                >
                  {t.label}
                  <span
                    className={`ml-1.5 text-xs ${
                      active ? 'text-white/75 dark:text-glider-darkBg/70' : 'text-glider-gray/60 dark:text-glider-darkMuted/60'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              )
            })}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px] lg:w-72">
              <SearchIcon
                width={16}
                height={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-glider-gray dark:text-glider-darkMuted"
              />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search events…"
                className="input pl-10"
              />
            </div>

            {/* Category dropdown */}
            <div className="relative">
              <button
                onClick={() => setCatOpen((o) => !o)}
                onBlur={() => setTimeout(() => setCatOpen(false), 150)}
                className="input flex items-center gap-2 min-w-[170px] !w-auto"
              >
                <span className="flex-1 text-left">
                  {category === 'All' ? 'All Categories' : category}
                </span>
                <ChevronDownIcon
                  width={16}
                  height={16}
                  className={`text-glider-gray dark:text-glider-darkMuted transition ${catOpen ? 'rotate-180' : ''}`}
                />
              </button>
              {catOpen && (
                <div className="absolute right-0 mt-1.5 z-20 bg-white dark:bg-glider-darkPanel border border-glider-border dark:border-glider-darkBorder rounded-xl shadow-card py-1 min-w-[170px]">
                  {(['All', ...allCategories] as const).map((c) => (
                    <button
                      key={c}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => {
                        setCategory(c)
                        setCatOpen(false)
                      }}
                      className={`w-full text-left px-3 py-2 text-sm hover:bg-glider-light dark:hover:bg-glider-darkPanel2 ${
                        category === c
                          ? 'text-glider-olive dark:text-glider-mint font-semibold'
                          : 'text-glider-black dark:text-glider-darkText'
                      }`}
                    >
                      {c === 'All' ? 'All Categories' : c}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* View toggle */}
            <div className="flex items-center gap-1 p-1 bg-white dark:bg-glider-darkPanel border border-glider-border dark:border-glider-darkBorder rounded-xl">
              <button
                onClick={() => setView('list')}
                aria-label="List view"
                className={`p-1.5 rounded-lg transition ${
                  view === 'list'
                    ? 'bg-glider-olive text-white dark:bg-glider-mint dark:text-glider-darkBg'
                    : 'text-glider-gray dark:text-glider-darkMuted hover:bg-glider-light dark:hover:bg-glider-darkPanel2'
                }`}
              >
                <ListIcon width={16} height={16} />
              </button>
              <button
                onClick={() => setView('grid')}
                aria-label="Grid view"
                className={`p-1.5 rounded-lg transition ${
                  view === 'grid'
                    ? 'bg-glider-olive text-white dark:bg-glider-mint dark:text-glider-darkBg'
                    : 'text-glider-gray dark:text-glider-darkMuted hover:bg-glider-light dark:hover:bg-glider-darkPanel2'
                }`}
              >
                <GridIcon width={16} height={16} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {visible.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="text-glider-black dark:text-glider-darkText font-medium">No events found</p>
          <p className="text-glider-gray dark:text-glider-darkMuted text-sm mt-1">
            Try a different filter or check back soon.
          </p>
        </div>
      ) : view === 'grid' ? (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {visible.map(({ event, status }) => (
            <EventCard
              key={event.id}
              event={event}
              status={status}
              layout="grid"
              onOpen={onOpenEvent}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {visible.map(({ event, status }) => (
            <EventCard
              key={event.id}
              event={event}
              status={status}
              layout="list"
              onOpen={onOpenEvent}
            />
          ))}
        </div>
      )}
    </section>
  )
}
