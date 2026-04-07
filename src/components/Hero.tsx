import { SparkleIcon, LiveDotIcon } from './Icons'

interface Props {
  total: number
  live: number
}

export default function Hero({ total, live }: Props) {
  return (
    <section className="relative max-w-6xl mx-auto px-5 pt-20 pb-14 text-center">
      <div className="inline-flex items-center gap-2 chip border-glide-mint bg-white text-glide-olive shadow-soft">
        <SparkleIcon width={14} height={14} />
        The Single Source of Truth for the Glide Ecosystem
      </div>

      <h1 className="mt-6 font-display text-5xl md:text-6xl font-bold tracking-tight leading-[1.03] text-glide-black">
        Never miss a moment in{' '}
        <span className="relative inline-block">
          <span className="relative z-10 text-glide-olive">Glide</span>
          <span className="absolute inset-x-0 bottom-1 h-3 bg-glide-mint/70 rounded -z-0" />
        </span>
      </h1>

      <p className="mt-6 max-w-2xl mx-auto text-glide-gray text-lg leading-relaxed">
        A real-time dashboard of AMAs, quizzes, workshops, hackathons and meetups
        across the Glide community — all in one place.
      </p>

      <div className="mt-9 flex items-center justify-center gap-3 flex-wrap">
        <a href="#events" className="btn-primary">Browse Events</a>
        <a
          href="https://twitter.com/glide"
          target="_blank"
          rel="noreferrer"
          className="btn-ghost"
        >
          Follow @glide
        </a>
      </div>

      <div className="mt-10 flex items-center justify-center gap-3 flex-wrap text-sm">
        <span className="chip border-glide-border bg-white text-glide-gray shadow-soft">
          <b className="text-glide-black">{total}</b> tracked events
        </span>
        <span className="chip border-glide-mint bg-glide-mint/40 text-glide-olive shadow-soft">
          <LiveDotIcon width={12} height={12} className="text-glide-olive animate-pulse" />
          <b>{live}</b> live now
        </span>
        <span className="chip border-glide-sky bg-glide-sky/30 text-[#2b5d82] shadow-soft">
          Community-powered
        </span>
      </div>
    </section>
  )
}
