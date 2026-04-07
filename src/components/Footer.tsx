import Logo from './Logo'

export default function Footer() {
  return (
    <footer
      id="about"
      className="border-t border-glide-border mt-16 py-12 bg-white/50"
    >
      <div className="max-w-6xl mx-auto px-5 flex flex-col items-center text-center gap-3">
        <div className="flex items-center gap-2">
          <Logo className="w-7 h-7" />
          <span className="font-display font-bold text-glide-black">
            Glide <span className="text-glide-olive">Event Hub</span>
          </span>
        </div>
        <p className="text-sm text-glide-gray max-w-xl">
          A community-built, open-source aggregator for Glide ecosystem events.
          Inspired by{' '}
          <a
            className="text-glide-olive hover:underline"
            href="https://github.com/mrnetwork0001/rialo-event-hub"
            target="_blank"
            rel="noreferrer"
          >
            rialo-event-hub
          </a>
          . Not affiliated with Glide.
        </p>
        <p className="text-xs text-glide-gray/70">
          © {new Date().getFullYear()} Glide Event Hub
        </p>
      </div>
    </footer>
  )
}
