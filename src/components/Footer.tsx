import Wordmark from './Wordmark'

export default function Footer() {
  return (
    <footer
      id="about"
      className="border-t border-glider-border mt-10 py-12 bg-white/50"
    >
      <div className="max-w-6xl mx-auto px-5 flex flex-col items-center text-center gap-3">
        <Wordmark iconClassName="w-7 h-7" textClassName="text-base" />
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
