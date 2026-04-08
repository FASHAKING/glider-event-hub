import { useEffect, useMemo, useState } from 'react'
import type { GliderEvent, EventAccent, EventStatus } from '../types'
import { formatCountdown, getEventStatus } from '../types'
import { useAuth } from '../context/AuthContext'
import {
  CalendarIcon,
  UserIcon,
  PinIcon,
  ExternalIcon,
  LiveDotIcon,
  CategoryIcon,
  ClockIcon,
} from './Icons'

interface Props {
  event: GliderEvent | null
  onClose: () => void
  onRequireAuth: () => void
}

const accentGradients: Record<EventAccent, string> = {
  mint: 'from-glider-mint via-glider-mint/70 to-white dark:from-glider-mint/40 dark:via-glider-mint/20 dark:to-glider-darkPanel',
  olive:
    'from-glider-olive via-glider-olive/70 to-glider-mint dark:from-glider-olive/70 dark:via-glider-olive/40 dark:to-glider-darkPanel',
  sky: 'from-glider-sky via-glider-sky/70 to-white dark:from-glider-sky/40 dark:via-glider-sky/20 dark:to-glider-darkPanel',
}

function formatLong(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short',
  })
}

function statusLabel(status: EventStatus) {
  if (status === 'live') return 'LIVE'
  if (status === 'past') return 'ENDED'
  return 'UPCOMING'
}

export default function EventDetailModal({ event, onClose, onRequireAuth }: Props) {
  const { user, toggleReminder, hasReminder } = useAuth()
  const [tick, setTick] = useState(0)

  // re-render every second so the live countdown stays accurate
  useEffect(() => {
    if (!event) return
    const id = setInterval(() => setTick((n) => n + 1), 1000)
    return () => clearInterval(id)
  }, [event])

  // close on Esc
  useEffect(() => {
    if (!event) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [event, onClose])

  // prevent background scroll
  useEffect(() => {
    if (!event) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [event])

  const status = useMemo(
    () => (event ? getEventStatus(event) : 'upcoming'),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [event, tick],
  )

  if (!event) return null

  const CatIcon = CategoryIcon[event.category]
  const accent = event.accent || 'mint'
  const start = new Date(event.startsAt)
  const end = new Date(start.getTime() + event.durationMinutes * 60_000)
  const countdownMs = start.getTime() - Date.now()
  const reminderOn = hasReminder(event.id)

  const allHosts = [event.host, ...(event.hosts || [])].filter(Boolean)

  return (
    <div
      className="fixed inset-0 z-50 bg-glider-black/40 dark:bg-glider-black/80 backdrop-blur-sm flex items-start justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="card w-full max-w-3xl shadow-card my-8 overflow-hidden"
      >
        {/* Hero / image */}
        <div
          className={`relative h-56 sm:h-72 bg-gradient-to-br ${accentGradients[accent]} flex items-center justify-center overflow-hidden`}
        >
          {event.imageUrl ? (
            <img
              src={event.imageUrl}
              alt={event.title}
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : (
            <CatIcon
              width={120}
              height={120}
              className="text-white/80 drop-shadow-md"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

          {/* close */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="absolute top-3 right-3 w-9 h-9 rounded-full bg-black/40 hover:bg-black/60 text-white text-xl flex items-center justify-center backdrop-blur"
          >
            ×
          </button>

          <span
            className={`absolute top-4 left-4 chip border-transparent text-[11px] font-bold tracking-wider ${
              status === 'live'
                ? 'bg-red-500 text-white'
                : status === 'past'
                  ? 'bg-glider-black/70 text-white'
                  : 'bg-glider-olive text-white dark:bg-glider-mint dark:text-glider-darkBg'
            }`}
          >
            {status === 'live' && (
              <LiveDotIcon width={10} height={10} className="animate-pulse" />
            )}
            {statusLabel(status)}
          </span>

          <div className="absolute bottom-4 left-5 right-5 text-white">
            <div className="text-xs uppercase tracking-wider opacity-90 flex items-center gap-1.5">
              <CalendarIcon width={12} height={12} />
              {formatLong(event.startsAt)}
            </div>
            <h2 className="mt-1 font-display text-2xl sm:text-3xl font-bold leading-tight drop-shadow">
              {event.title}
            </h2>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 sm:p-8 space-y-6">
          {/* Quick action row */}
          <div className="flex flex-wrap gap-3">
            <a
              href={event.link}
              target="_blank"
              rel="noreferrer"
              className={`${
                status === 'live'
                  ? 'btn-primary'
                  : status === 'past'
                    ? 'btn-ghost'
                    : 'btn-soft'
              } text-sm`}
            >
              {status === 'live'
                ? 'Join Live'
                : status === 'past'
                  ? 'View Recap'
                  : 'Open Event Link'}
              <ExternalIcon width={14} height={14} />
            </a>

            <button
              type="button"
              onClick={() => {
                if (!user) {
                  onRequireAuth()
                  return
                }
                toggleReminder(event.id)
              }}
              className={`btn ${
                reminderOn
                  ? 'bg-glider-mint text-glider-olive dark:bg-glider-mint/30 dark:text-glider-mint'
                  : 'bg-white border border-glider-border text-glider-black hover:bg-glider-light dark:bg-glider-darkPanel dark:border-glider-darkBorder dark:text-glider-darkText dark:hover:bg-glider-darkPanel2'
              } text-sm`}
            >
              {reminderOn ? '✓ Reminder On' : 'Set Reminder'}
            </button>
          </div>

          {/* Tags */}
          {event.tags && event.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {event.tags.map((t) => (
                <span
                  key={t}
                  className="text-[11px] px-2.5 py-1 rounded-full bg-glider-sky/25 dark:bg-glider-sky/15 border border-glider-sky/60 dark:border-glider-sky/30 text-[#2b5d82] dark:text-glider-sky uppercase font-semibold"
                >
                  # {t}
                </span>
              ))}
              <span className="text-[11px] px-2.5 py-1 rounded-full bg-glider-mint/40 dark:bg-glider-mint/15 border border-glider-mint dark:border-glider-mint/30 text-glider-olive dark:text-glider-mint uppercase font-semibold">
                # {event.category}
              </span>
            </div>
          )}

          {/* Description */}
          <div className="text-glider-black dark:text-glider-darkText whitespace-pre-line leading-relaxed">
            {event.description || 'No description provided.'}
          </div>

          {/* Meta grid */}
          <div className="grid sm:grid-cols-2 gap-4">
            <MetaBlock
              icon={
                <CalendarIcon
                  width={16}
                  height={16}
                  className="text-glider-olive dark:text-glider-mint"
                />
              }
              label={status === 'live' ? 'LIVE NOW' : status === 'past' ? 'Ended' : 'Starts'}
              value={formatLong(event.startsAt)}
              sub={`Until ${end.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })} (${event.durationMinutes} min)`}
            />
            <MetaBlock
              icon={
                <PinIcon
                  width={16}
                  height={16}
                  className="text-glider-olive dark:text-glider-mint"
                />
              }
              label="Platform"
              value={event.location || '—'}
              sub={event.recurrence && event.recurrence.frequency !== 'none'
                ? `Recurs ${event.recurrence.frequency} · ${event.recurrence.occurrences + 1} sessions`
                : undefined}
            />
            <MetaBlock
              icon={
                <UserIcon
                  width={16}
                  height={16}
                  className="text-glider-olive dark:text-glider-mint"
                />
              }
              label={allHosts.length > 1 ? 'Hosts' : 'Host'}
              value={allHosts.join(', ')}
            />
            <MetaBlock
              icon={
                <ClockIcon
                  width={16}
                  height={16}
                  className="text-glider-olive dark:text-glider-mint"
                />
              }
              label={status === 'upcoming' ? 'Starts in' : status === 'live' ? 'Time left' : 'Duration'}
              value={
                status === 'upcoming'
                  ? formatCountdown(countdownMs)
                  : status === 'live'
                    ? formatCountdown(end.getTime() - Date.now())
                    : `${event.durationMinutes} min`
              }
              mono
            />
          </div>

          {/* Notification hint */}
          {user ? (
            Object.keys(user.socials).length > 0 ? (
              <div className="text-xs text-glider-gray dark:text-glider-darkMuted bg-glider-light dark:bg-glider-darkPanel2 border border-glider-border dark:border-glider-darkBorder rounded-xl px-4 py-3">
                You'll be pinged on{' '}
                <span className="font-semibold text-glider-olive dark:text-glider-mint">
                  {Object.keys(user.socials).join(', ').toUpperCase()}
                </span>{' '}
                when this event goes live.
              </div>
            ) : (
              <div className="text-xs text-glider-gray dark:text-glider-darkMuted bg-glider-light dark:bg-glider-darkPanel2 border border-glider-border dark:border-glider-darkBorder rounded-xl px-4 py-3">
                Connect your X / Telegram / Discord in your profile to get pinged
                when this event starts.
              </div>
            )
          ) : (
            <div className="text-xs text-glider-gray dark:text-glider-darkMuted bg-glider-light dark:bg-glider-darkPanel2 border border-glider-border dark:border-glider-darkBorder rounded-xl px-4 py-3">
              <button
                onClick={onRequireAuth}
                className="text-glider-olive dark:text-glider-mint font-semibold underline"
              >
                Sign up
              </button>{' '}
              to set reminders and get notified across X, Telegram, and Discord
              when this event starts.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function MetaBlock({
  icon,
  label,
  value,
  sub,
  mono,
}: {
  icon: JSX.Element
  label: string
  value: string
  sub?: string
  mono?: boolean
}) {
  return (
    <div className="bg-glider-light dark:bg-glider-darkPanel2 border border-glider-border dark:border-glider-darkBorder rounded-xl px-4 py-3">
      <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-glider-gray dark:text-glider-darkMuted font-semibold">
        {icon}
        {label}
      </div>
      <div
        className={`mt-1 font-semibold text-glider-black dark:text-glider-darkText ${
          mono ? 'tabular-nums text-base' : 'text-sm'
        }`}
      >
        {value}
      </div>
      {sub && (
        <div className="text-xs text-glider-gray dark:text-glider-darkMuted mt-0.5">
          {sub}
        </div>
      )}
    </div>
  )
}
