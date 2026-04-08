import { useMemo, useState } from 'react'
import type { GliderEvent, EventStatus } from '../types'
import { PRESET_CATEGORIES, getEventStatus } from '../types'
import { getCategoryIcon, ChevronDownIcon } from './Icons'

interface Props {
  events: GliderEvent[]
  onOpenEvent: (e: GliderEvent) => void
  onBack: () => void
}

const WEEK_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const

/** First day of the month a given date sits in. */
function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1)
}

/** Calendar grid always starts on the Monday on-or-before the 1st. */
function gridStart(monthStart: Date): Date {
  const d = new Date(monthStart)
  // getDay: 0 = Sun, 1 = Mon, ... we want Monday-first offset.
  const dow = (d.getDay() + 6) % 7
  d.setDate(d.getDate() - dow)
  d.setHours(0, 0, 0, 0)
  return d
}

function sameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

function formatMonth(d: Date): string {
  return d.toLocaleString(undefined, { month: 'long', year: 'numeric' })
}

function formatFullDate(d: Date): string {
  return d.toLocaleString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  })
}

const statusDotClass: Record<EventStatus, string> = {
  live: 'bg-red-500',
  upcoming: 'bg-amber-400',
  past: 'bg-glider-gray/60 dark:bg-glider-darkMuted/60',
}

const BackArrowIcon = (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M19 12H5" />
    <path d="M12 19l-7-7 7-7" />
  </svg>
)

const CalHeaderIcon = (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="3" y="5" width="18" height="16" rx="2" />
    <path d="M16 3v4M8 3v4M3 10h18" />
  </svg>
)

export default function CalendarPage({ events, onOpenEvent, onBack }: Props) {
  const today = useMemo(() => {
    const t = new Date()
    t.setHours(0, 0, 0, 0)
    return t
  }, [])

  const [monthCursor, setMonthCursor] = useState<Date>(() => startOfMonth(today))
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [categoryFilter, setCategoryFilter] = useState<string>('All')
  const [catOpen, setCatOpen] = useState(false)

  // Parent already expands recurring events, so we just filter by category.
  const filteredEvents = useMemo(() => {
    if (categoryFilter === 'All') return events
    return events.filter((e) => e.category === categoryFilter)
  }, [events, categoryFilter])

  const allCategories = useMemo(() => {
    const set = new Set<string>(PRESET_CATEGORIES)
    for (const e of events) if (e.category) set.add(e.category)
    return Array.from(set)
  }, [events])

  // Bucket events per YYYY-MM-DD so day cells can look them up in O(1).
  const eventsByDay = useMemo(() => {
    const map = new Map<string, { event: GliderEvent; status: EventStatus }[]>()
    for (const ev of filteredEvents) {
      const d = new Date(ev.startsAt)
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
      const bucket = map.get(key) ?? []
      bucket.push({ event: ev, status: getEventStatus(ev) })
      map.set(key, bucket)
    }
    // Sort each bucket by start time
    for (const bucket of map.values()) {
      bucket.sort(
        (a, b) =>
          new Date(a.event.startsAt).getTime() -
          new Date(b.event.startsAt).getTime(),
      )
    }
    return map
  }, [filteredEvents])

  const dayKey = (d: Date) =>
    `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`

  // Build 6 weeks of cells starting from the Monday on-or-before the 1st.
  const cells = useMemo(() => {
    const start = gridStart(monthCursor)
    const out: Date[] = []
    for (let i = 0; i < 42; i++) {
      const d = new Date(start)
      d.setDate(start.getDate() + i)
      out.push(d)
    }
    return out
  }, [monthCursor])

  const selectedBucket =
    selectedDate != null ? eventsByDay.get(dayKey(selectedDate)) ?? [] : []

  const goPrev = () =>
    setMonthCursor(
      new Date(monthCursor.getFullYear(), monthCursor.getMonth() - 1, 1),
    )
  const goNext = () =>
    setMonthCursor(
      new Date(monthCursor.getFullYear(), monthCursor.getMonth() + 1, 1),
    )
  const goToday = () => {
    setMonthCursor(startOfMonth(today))
    setSelectedDate(today)
  }

  return (
    <section className="px-5 lg:px-10 py-8">
      {/* Title + back */}
      <div className="flex items-start gap-3 mb-6">
        <button
          type="button"
          onClick={onBack}
          aria-label="Back"
          className="btn-ghost !p-2 text-glider-gray dark:text-glider-darkMuted hover:text-glider-black dark:hover:text-glider-darkText mt-1"
        >
          {BackArrowIcon}
        </button>
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-glider-black dark:text-glider-darkText flex items-center gap-2">
            <span className="text-glider-olive dark:text-glider-mint">
              {CalHeaderIcon}
            </span>
            Community Calendar
          </h1>
          <p className="text-sm text-glider-gray dark:text-glider-darkMuted mt-0.5">
            Browse all events at a glance.
          </p>
        </div>
      </div>

      {/* Month switcher + filter */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={goPrev}
            aria-label="Previous month"
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-white dark:bg-glider-darkPanel border border-glider-border dark:border-glider-darkBorder hover:bg-glider-light dark:hover:bg-glider-darkPanel2"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <div className="min-w-[160px] text-center font-display text-lg font-semibold text-glider-black dark:text-glider-darkText">
            {formatMonth(monthCursor)}
          </div>
          <button
            type="button"
            onClick={goNext}
            aria-label="Next month"
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-white dark:bg-glider-darkPanel border border-glider-border dark:border-glider-darkBorder hover:bg-glider-light dark:hover:bg-glider-darkPanel2"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
          <button
            type="button"
            onClick={goToday}
            className="ml-1 px-3 py-1.5 text-sm rounded-xl bg-white dark:bg-glider-darkPanel border border-glider-border dark:border-glider-darkBorder hover:bg-glider-light dark:hover:bg-glider-darkPanel2 text-glider-black dark:text-glider-darkText"
          >
            Today
          </button>
        </div>

        {/* Category filter */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setCatOpen((o) => !o)}
            onBlur={() => setTimeout(() => setCatOpen(false), 150)}
            className="input flex items-center gap-2 min-w-[180px] !w-auto"
          >
            <span className="flex-1 text-left">
              {categoryFilter === 'All' ? 'All Categories' : categoryFilter}
            </span>
            <ChevronDownIcon
              width={16}
              height={16}
              className={`text-glider-gray dark:text-glider-darkMuted transition ${
                catOpen ? 'rotate-180' : ''
              }`}
            />
          </button>
          {catOpen && (
            <div className="absolute right-0 mt-1.5 z-20 bg-white dark:bg-glider-darkPanel border border-glider-border dark:border-glider-darkBorder rounded-xl shadow-card py-1 min-w-[180px] max-h-64 overflow-y-auto">
              {(['All', ...allCategories] as const).map((c) => (
                <button
                  key={c}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    setCategoryFilter(c)
                    setCatOpen(false)
                  }}
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-glider-light dark:hover:bg-glider-darkPanel2 ${
                    categoryFilter === c
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
      </div>

      {/* Grid + side panel */}
      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        <div className="card overflow-hidden">
          {/* Weekday headers */}
          <div className="grid grid-cols-7 text-xs font-semibold uppercase tracking-wider text-glider-gray dark:text-glider-darkMuted border-b border-glider-border dark:border-glider-darkBorder">
            {WEEK_DAYS.map((w) => (
              <div key={w} className="px-3 py-2.5 text-left">
                {w}
              </div>
            ))}
          </div>

          {/* Day cells */}
          <div className="grid grid-cols-7">
            {cells.map((d, i) => {
              const inMonth = d.getMonth() === monthCursor.getMonth()
              const isToday = sameDay(d, today)
              const isSelected =
                selectedDate != null && sameDay(d, selectedDate)
              const bucket = eventsByDay.get(dayKey(d)) ?? []
              const dotStatuses = Array.from(
                new Set(bucket.map((b) => b.status)),
              )

              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => setSelectedDate(d)}
                  className={`relative min-h-[86px] border-t border-l border-glider-border dark:border-glider-darkBorder text-left p-2 flex flex-col gap-1 transition
                    ${i % 7 === 6 ? 'border-r' : ''}
                    ${i >= 35 ? 'border-b' : ''}
                    ${
                      inMonth
                        ? 'text-glider-black dark:text-glider-darkText'
                        : 'text-glider-gray/60 dark:text-glider-darkMuted/50'
                    }
                    ${
                      isSelected
                        ? 'bg-glider-mint/25 dark:bg-glider-mint/10'
                        : 'hover:bg-glider-light/70 dark:hover:bg-glider-darkPanel2/50'
                    }`}
                >
                  <span
                    className={`inline-flex items-center justify-center text-sm font-medium
                      ${
                        isToday
                          ? 'w-7 h-7 rounded-full bg-glider-olive text-white dark:bg-glider-mint dark:text-glider-darkBg'
                          : ''
                      }`}
                  >
                    {d.getDate()}
                  </span>
                  {bucket.length > 0 && (
                    <div className="flex items-center gap-1 mt-auto">
                      {dotStatuses.map((s) => (
                        <span
                          key={s}
                          className={`w-1.5 h-1.5 rounded-full ${statusDotClass[s]}`}
                        />
                      ))}
                      <span className="text-[10px] text-glider-gray dark:text-glider-darkMuted ml-0.5">
                        {bucket.length}
                      </span>
                    </div>
                  )}
                </button>
              )
            })}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap items-center gap-4 px-4 py-3 border-t border-glider-border dark:border-glider-darkBorder text-xs text-glider-gray dark:text-glider-darkMuted">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-red-500" /> Live
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400" /> Upcoming
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-glider-gray/60 dark:bg-glider-darkMuted/60" />{' '}
              Past
            </span>
          </div>
        </div>

        {/* Side panel */}
        <aside className="card p-5 h-fit">
          {selectedDate == null ? (
            <>
              <h3 className="font-display font-semibold text-glider-black dark:text-glider-darkText">
                Select a date
              </h3>
              <p className="text-sm text-glider-gray dark:text-glider-darkMuted mt-1">
                Click on a date to see its events
              </p>
            </>
          ) : (
            <>
              <h3 className="font-display font-semibold text-glider-black dark:text-glider-darkText">
                {formatFullDate(selectedDate)}
              </h3>
              <p className="text-xs text-glider-gray dark:text-glider-darkMuted mt-0.5">
                {selectedBucket.length} event
                {selectedBucket.length === 1 ? '' : 's'}
              </p>

              {selectedBucket.length === 0 ? (
                <p className="text-sm text-glider-gray dark:text-glider-darkMuted mt-4">
                  Nothing scheduled for this day.
                </p>
              ) : (
                <ul className="mt-4 space-y-2">
                  {selectedBucket.map(({ event, status }) => {
                    const CatIcon = getCategoryIcon(event.category)
                    return (
                      <li key={event.id}>
                        <button
                          type="button"
                          onClick={() => onOpenEvent(event)}
                          className="w-full text-left p-3 rounded-xl bg-glider-light dark:bg-glider-darkPanel2 border border-glider-border dark:border-glider-darkBorder hover:border-glider-olive/40 dark:hover:border-glider-mint/40 transition"
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${statusDotClass[status]}`}
                            />
                            <span className="text-[10px] uppercase tracking-wider text-glider-gray dark:text-glider-darkMuted">
                              {status} · {formatTime(event.startsAt)}
                            </span>
                          </div>
                          <div className="flex items-start gap-2">
                            <span className="text-glider-olive dark:text-glider-mint mt-0.5">
                              <CatIcon width={16} height={16} />
                            </span>
                            <div className="flex-1 min-w-0">
                              <div className="font-semibold text-sm text-glider-black dark:text-glider-darkText truncate">
                                {event.title}
                              </div>
                              <div className="text-xs text-glider-gray dark:text-glider-darkMuted truncate">
                                {event.host}
                                {event.location ? ` · ${event.location}` : ''}
                              </div>
                            </div>
                          </div>
                        </button>
                      </li>
                    )
                  })}
                </ul>
              )}
            </>
          )}
        </aside>
      </div>
    </section>
  )
}
