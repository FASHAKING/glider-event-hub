import { useState } from 'react'
import type { GliderEvent, EventStatus, EventAccent } from '../types'
import {
  CalendarIcon,
  UserIcon,
  PinIcon,
  ExternalIcon,
  LiveDotIcon,
  getCategoryIcon,
} from './Icons'

const accentGradients: Record<EventAccent, string> = {
  mint: 'from-glider-mint via-glider-mint/70 to-white dark:from-glider-mint/40 dark:via-glider-mint/20 dark:to-glider-darkPanel',
  olive: 'from-glider-olive via-glider-olive/70 to-glider-mint dark:from-glider-olive/70 dark:via-glider-olive/40 dark:to-glider-darkPanel',
  sky: 'from-glider-sky via-glider-sky/70 to-white dark:from-glider-sky/40 dark:via-glider-sky/20 dark:to-glider-darkPanel',
}

const accentText: Record<EventAccent, string> = {
  mint: 'text-glider-olive dark:text-glider-mint',
  olive: 'text-white',
  sky: 'text-[#2b5d82] dark:text-glider-sky',
}

function formatDate(iso: string) {
  const d = new Date(iso)
  return d.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function relative(iso: string) {
  const diff = new Date(iso).getTime() - Date.now()
  const abs = Math.abs(diff)
  const mins = Math.round(abs / 60000)
  const hrs = Math.round(mins / 60)
  const days = Math.round(hrs / 24)
  const val = days >= 1 ? `${days}d` : hrs >= 1 ? `${hrs}h` : `${mins}m`
  return diff >= 0 ? `in ${val}` : `${val} ago`
}

function statusBadge(status: EventStatus, iso: string) {
  if (status === 'live')
    return {
      text: 'LIVE NOW',
      className: 'bg-red-500 text-white',
      pulse: true,
    }
  if (status === 'past')
    return {
      text: 'Past Event',
      className: 'bg-glider-black/70 text-white dark:bg-glider-darkBg/80 dark:text-glider-darkMuted',
      pulse: false,
    }
  // upcoming → "Live in 22h" style
  const diff = new Date(iso).getTime() - Date.now()
  const mins = Math.round(diff / 60000)
  const hrs = Math.round(mins / 60)
  const days = Math.round(hrs / 24)
  const val = days >= 1 ? `${days}d` : hrs >= 1 ? `${hrs}h` : `${mins}m`
  return {
    text: `Live in ${val}`,
    className: 'bg-glider-olive text-white dark:bg-glider-mint dark:text-glider-darkBg',
    pulse: false,
  }
}

interface Props {
  event: GliderEvent
  status: EventStatus
  layout?: 'grid' | 'list'
  onOpen: (event: GliderEvent) => void
}

export default function EventCard({ event, status, layout = 'grid', onOpen }: Props) {
  const [imgFailed, setImgFailed] = useState(false)
  const CatIcon = getCategoryIcon(event.category)
  const accent = event.accent || 'mint'
  const badge = statusBadge(status, event.startsAt)
  const showImage = !!event.imageUrl && !imgFailed

  const handleCardKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onOpen(event)
    }
  }

  if (layout === 'list') {
    return (
      <article
        role="button"
        tabIndex={0}
        onClick={() => onOpen(event)}
        onKeyDown={handleCardKey}
        className="card p-4 flex flex-col sm:flex-row gap-4 hover:border-glider-olive/30 dark:hover:border-glider-mint/30 transform-gpu hover:-translate-y-1 hover:shadow-lg dark:hover:shadow-[0_8px_30px_rgba(168,224,209,0.12)] transition-all cursor-pointer group"
      >
        <div
          className={`relative shrink-0 sm:w-44 h-28 rounded-xl overflow-hidden bg-gradient-to-br ${accentGradients[accent]} flex items-center justify-center`}
        >
          {showImage ? (
            <img
              src={event.imageUrl}
              alt=""
              className="absolute inset-0 w-full h-full object-cover"
              onError={() => setImgFailed(true)}
            />
          ) : (
            <CatIcon
              width={48}
              height={48}
              className={`${accentText[accent]} opacity-90`}
            />
          )}
          <span
            className={`absolute top-2 left-2 chip ${badge.className} border-transparent text-[10px] font-bold tracking-wide`}
          >
            {badge.pulse && (
              <LiveDotIcon width={9} height={9} className="animate-pulse" />
            )}
            {badge.text}
          </span>
        </div>

        <div className="flex-1 min-w-0 flex flex-col">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-display text-base font-semibold text-glider-black dark:text-glider-darkText truncate">
              {event.title}
            </h3>
            <span className="chip border-glider-border dark:border-glider-darkBorder bg-glider-light dark:bg-glider-darkPanel2 text-glider-gray dark:text-glider-darkMuted shrink-0">
              <CatIcon width={12} height={12} />
              {event.category}
            </span>
          </div>
          <p className="mt-1 text-sm text-glider-gray dark:text-glider-darkMuted line-clamp-2">
            {event.description}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-glider-gray dark:text-glider-darkMuted">
            <span className="inline-flex items-center gap-1.5">
              <CalendarIcon width={12} height={12} className="text-glider-olive dark:text-glider-mint" />
              {formatDate(event.startsAt)} · {relative(event.startsAt)}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <UserIcon width={12} height={12} className="text-glider-olive dark:text-glider-mint" />
              {event.host}
            </span>
            {event.location && (
              <span className="inline-flex items-center gap-1.5">
                <PinIcon width={12} height={12} className="text-glider-olive dark:text-glider-mint" />
                {event.location}
              </span>
            )}
          </div>
          <div className="mt-3 flex items-center gap-2">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onOpen(event)
              }}
              className={`${
                status === 'past' ? 'btn-ghost' : status === 'live' ? 'btn-primary' : 'btn-soft'
              } text-xs py-1.5 px-3`}
            >
              {status === 'live' ? 'Join Live' : status === 'upcoming' ? 'View Details' : 'View Recap'}
              <ExternalIcon width={12} height={12} />
            </button>
          </div>
        </div>
      </article>
    )
  }

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={() => onOpen(event)}
      onKeyDown={handleCardKey}
      className="card overflow-hidden flex flex-col hover:border-glider-olive/30 dark:hover:border-glider-mint/30 transform-gpu hover:-translate-y-1 hover:shadow-lg dark:hover:shadow-[0_8px_30px_rgba(168,224,209,0.12)] transition-all duration-300 group cursor-pointer"
    >
      <div
        className={`relative h-36 bg-gradient-to-br ${accentGradients[accent]} flex items-center justify-center overflow-hidden`}
      >
        {showImage ? (
          <img
            src={event.imageUrl}
            alt=""
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={() => setImgFailed(true)}
          />
        ) : (
          <CatIcon
            width={72}
            height={72}
            className={`${accentText[accent]} opacity-90 group-hover:scale-110 transition-transform duration-300`}
          />
        )}
        <span
          className={`absolute top-3 left-3 chip ${badge.className} border-transparent text-[10px] font-bold tracking-wide shadow-sm`}
        >
          {badge.pulse && (
            <LiveDotIcon width={9} height={9} className="animate-pulse" />
          )}
          {badge.text}
        </span>
        <span className="absolute top-3 right-3 chip bg-white/90 dark:bg-[#11141A]/90 backdrop-blur-md border-white/20 dark:border-white/10 text-glider-black dark:text-glider-darkText text-[10px] font-bold shadow-sm">
          <CatIcon width={11} height={11} className="text-glider-olive dark:text-glider-mint" />
          {event.category}
        </span>
      </div>

      <div className="p-5 flex flex-col gap-3 flex-1">
        <div>
          <h3 className="font-display text-lg font-semibold leading-tight text-glider-black dark:text-glider-darkText">
            {event.title}
          </h3>
          <p className="mt-1.5 text-sm text-glider-gray dark:text-glider-darkMuted line-clamp-2">
            {event.description}
          </p>
        </div>

        <div className="text-sm text-glider-gray dark:text-glider-darkMuted space-y-1.5">
          <div className="flex items-center gap-2">
            <CalendarIcon width={14} height={14} className="text-glider-olive dark:text-glider-mint" />
            <span className="text-glider-black dark:text-glider-darkText">{formatDate(event.startsAt)}</span>
            <span className="text-glider-gray/80 dark:text-glider-darkMuted/80">· {relative(event.startsAt)}</span>
          </div>
          <div className="flex items-center gap-2">
            <UserIcon width={14} height={14} className="text-glider-olive dark:text-glider-mint" />
            <span className="truncate">{event.host}</span>
          </div>
          {event.location && (
            <div className="flex items-center gap-2">
              <PinIcon width={14} height={14} className="text-glider-olive dark:text-glider-mint" />
              <span className="truncate">{event.location}</span>
            </div>
          )}
          {event.recurrence && event.recurrence.frequency !== 'none' && (
            <div className="flex items-center gap-2 text-glider-olive dark:text-glider-mint text-xs">
              ↻ Repeats {event.recurrence.frequency}
            </div>
          )}
        </div>

        {event.tags && event.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {event.tags.map((t) => (
              <span
                key={t}
                className="text-[11px] px-2 py-0.5 rounded-full bg-glider-sky/25 dark:bg-glider-sky/15 border border-glider-sky/60 dark:border-glider-sky/30 text-[#2b5d82] dark:text-glider-sky"
              >
                #{t}
              </span>
            ))}
          </div>
        )}

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onOpen(event)
          }}
          className={`mt-auto ${
            status === 'past' ? 'btn-ghost' : status === 'live' ? 'btn-primary' : 'btn-soft'
          } text-sm`}
        >
          {status === 'live'
            ? 'Join Now'
            : status === 'upcoming'
              ? 'View Details'
              : 'View Recap'}
          <ExternalIcon width={14} height={14} />
        </button>
      </div>
    </article>
  )
}
