import Logo from './Logo'

export default function Footer() {
  return (
    <footer
      id="about"
      className="border-t border-glider-border mt-10 py-12 bg-white/50"
    >
      <div className="max-w-6xl mx-auto px-5 flex flex-col items-center text-center gap-3">
        <div className="flex items-center gap-2">
          <Logo className="w-7 h-7" />
          <span className="font-display font-bold text-glider-black">
            Glider <span className="text-glider-olive">Event Hub</span>
          </span>
        </div>
        <p className="text-sm text-glider-gray max-w-xl">
          A community-built, open-source aggregator for Glider ecosystem events —
          AMAs, quizzes, workshops, hackathons and meetups, all in one place.
        </p>
        <p className="text-xs text-glider-gray/70">
          © {new Date().getFullYear()} Glider Event Hub
        </p>
      </div>
    </footer>
  )
}
