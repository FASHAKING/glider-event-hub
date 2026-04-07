interface Props {
  onSubmitClick: () => void
}

export default function Header({ onSubmitClick }: Props) {
  return (
    <header className="sticky top-0 z-30 backdrop-blur bg-glide-bg/70 border-b border-glide-border">
      <div className="max-w-6xl mx-auto px-5 py-4 flex items-center justify-between">
        <a href="#" className="flex items-center gap-2.5">
          <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-glide-accent to-glide-accent2 shadow-glow" />
          <span className="font-bold text-lg tracking-tight">
            Glide <span className="text-glide-accent">Event Hub</span>
          </span>
        </a>
        <nav className="hidden md:flex items-center gap-6 text-sm text-white/70">
          <a href="#events" className="hover:text-white">Events</a>
          <a href="#about" className="hover:text-white">About</a>
          <a
            href="https://github.com/fashaking/glider-event-hub"
            target="_blank"
            rel="noreferrer"
            className="hover:text-white"
          >
            GitHub
          </a>
        </nav>
        <button onClick={onSubmitClick} className="btn-primary text-sm">
          Submit Event
        </button>
      </div>
    </header>
  )
}
