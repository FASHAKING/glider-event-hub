interface Props {
  total: number
  live: number
}

export default function Hero({ total, live }: Props) {
  return (
    <section className="max-w-6xl mx-auto px-5 pt-16 pb-12 text-center">
      <div className="inline-flex items-center gap-2 chip border-glide-border text-glide-accent bg-glide-accent/10">
        <span className="w-1.5 h-1.5 rounded-full bg-glide-accent animate-pulse" />
        The Single Source of Truth for the Glide Ecosystem
      </div>
      <h1 className="mt-5 text-4xl md:text-6xl font-extrabold tracking-tight leading-[1.05]">
        Never miss a moment in{' '}
        <span className="bg-gradient-to-r from-glide-accent to-glide-accent2 bg-clip-text text-transparent">
          Glide
        </span>
      </h1>
      <p className="mt-5 max-w-2xl mx-auto text-white/70 text-lg">
        A real-time dashboard of AMAs, quizzes, workshops, hackathons and meetups
        across the Glide community — all in one place.
      </p>
      <div className="mt-8 flex items-center justify-center gap-3">
        <a href="#events" className="btn-primary">
          Browse Events
        </a>
        <a
          href="https://twitter.com/glide"
          target="_blank"
          rel="noreferrer"
          className="btn-ghost"
        >
          Follow @glide
        </a>
      </div>
      <div className="mt-10 flex items-center justify-center gap-3 text-sm text-white/60">
        <span className="chip border-glide-border bg-white/5">
          <b className="text-white">{total}</b> tracked events
        </span>
        <span className="chip border-red-500/30 bg-red-500/10 text-red-300">
          <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
          <b>{live}</b> live now
        </span>
      </div>
    </section>
  )
}
