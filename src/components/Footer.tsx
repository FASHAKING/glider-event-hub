export default function Footer() {
  return (
    <footer
      id="about"
      className="border-t border-glide-border mt-16 py-10 text-center text-sm text-white/50"
    >
      <div className="max-w-6xl mx-auto px-5 space-y-2">
        <p>
          <b className="text-white">Glide Event Hub</b> — a community-built,
          open-source aggregator for Glide ecosystem events.
        </p>
        <p>
          Inspired by community hubs like{' '}
          <a
            className="underline hover:text-white"
            href="https://github.com/mrnetwork0001/rialo-event-hub"
            target="_blank"
            rel="noreferrer"
          >
            rialo-event-hub
          </a>
          . Not affiliated with Glide.
        </p>
      </div>
    </footer>
  )
}
