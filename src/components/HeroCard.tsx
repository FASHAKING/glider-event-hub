import { useEffect, useState } from 'react'
import type { GliderEvent } from '../types'
import { formatCountdown } from '../types'
import { CalendarIcon, UserIcon, ClockIcon, SendIcon, SparkleIcon } from './Icons'

interface Props {
  total: number
  members: number
  nextEvent?: GliderEvent
  onSubmitClick: () => void
}

export default function HeroCard({
  total,
  members,
  nextEvent,
  onSubmitClick,
}: Props) {
  const [countdown, setCountdown] = useState(() =>
    nextEvent ? new Date(nextEvent.startsAt).getTime() - Date.now() : 0,
  )

  useEffect(() => {
    if (!nextEvent) return
    const id = setInterval(() => {
      setCountdown(new Date(nextEvent.startsAt).getTime() - Date.now())
    }, 1000)
    return () => clearInterval(id)
  }, [nextEvent])

  return (
    <section className="px-5 lg:px-10 pt-8 lg:pt-12 pb-6">
      <div className="relative overflow-hidden card p-7 lg:p-12">
        {/* decorative blobs */}
        <div className="pointer-events-none absolute -top-20 -right-16 w-72 h-72 rounded-full bg-glider-mint/40 dark:bg-glider-mint/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-10 w-72 h-72 rounded-full bg-glider-sky/30 dark:bg-glider-sky/10 blur-3xl" />

        {/* 3D Glider mark, decorative */}
        <img
          src="/brand/glider-icon-3d.png"
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute -right-6 -top-6 w-44 lg:w-56 opacity-90 drop-shadow-xl rotate-[8deg] hidden sm:block"
        />

        <div className="relative">
          <span className="chip border-glider-mint bg-glider-mint/40 text-glider-olive dark:border-glider-mint/40 dark:bg-glider-mint/15 dark:text-glider-mint">
            <SparkleIcon width={13} height={13} />
            Glider Community Event Hub
          </span>

          <h1 className="mt-4 font-display text-4xl lg:text-5xl font-bold tracking-tight text-glider-black dark:text-glider-darkText leading-[1.05]">
            Your single source of truth for everything happening across the{' '}
            <span className="relative inline-block">
              <span className="relative z-10 text-glider-olive dark:text-glider-mint">Glider</span>
              <span className="absolute inset-x-0 bottom-1 h-3 bg-glider-mint/70 dark:bg-glider-mint/25 rounded -z-0" />
            </span>{' '}
            ecosystem.
          </h1>

          <p className="mt-4 max-w-2xl text-glider-gray dark:text-glider-darkMuted text-base lg:text-lg">
            Track AMAs, quizzes, workshops, hackathons and meetups in real time.
            Never miss a moment.
          </p>

          {/* stats row */}
          <div className="mt-7 grid sm:grid-cols-3 gap-3">
            <Stat
              icon={<CalendarIcon width={16} height={16} />}
              label="Total Events"
              value={String(total)}
            />
            <Stat
              icon={<UserIcon width={16} height={16} />}
              label="Community Members"
              value={members.toLocaleString()}
            />
            <Stat
              icon={<ClockIcon width={16} height={16} />}
              label="Next Event in"
              value={nextEvent ? formatCountdown(countdown) : '—'}
              mono
            />
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <button onClick={onSubmitClick} className="btn-primary">
              <SendIcon width={16} height={16} />
              Submit Your Event
            </button>
            <a href="#events" className="btn-soft">
              Browse All Events
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}

function Stat({
  icon,
  label,
  value,
  mono,
}: {
  icon: JSX.Element
  label: string
  value: string
  mono?: boolean
}) {
  return (
    <div className="bg-white/80 dark:bg-glider-darkPanel2/80 backdrop-blur border border-glider-border dark:border-glider-darkBorder rounded-xl px-4 py-3">
      <div className="flex items-center gap-2 text-glider-gray dark:text-glider-darkMuted text-xs font-medium uppercase tracking-wider">
        <span className="text-glider-olive dark:text-glider-mint">{icon}</span>
        {label}
      </div>
      <div
        className={`mt-1 font-display font-bold text-glider-black dark:text-glider-darkText ${
          mono ? 'text-lg tabular-nums' : 'text-2xl'
        }`}
      >
        {value}
      </div>
    </div>
  )
}
