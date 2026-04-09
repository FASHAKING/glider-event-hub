import Wordmark from './Wordmark'

export default function Footer() {
  return (
    <footer
      id="about"
      className="border-t border-glider-border dark:border-glider-darkBorder mt-10 py-12 bg-white/50 dark:bg-glider-darkPanel/40"
    >
      <div className="max-w-6xl mx-auto px-5 flex flex-col items-center text-center gap-3">
        <Wordmark iconClassName="w-7 h-7" textClassName="text-base" />
        <p className="text-sm text-glider-gray dark:text-glider-darkMuted max-w-xl">
          A community-built, open-source aggregator for Glider ecosystem events —
          AMAs, quizzes, workshops, hackathons and meetups, all in one place.
        </p>

        <a
          href="https://x.com/fashaking3"
          target="_blank"
          rel="noreferrer"
          className="mt-2 flex items-center gap-2.5 px-4 py-2 rounded-full bg-glider-light dark:bg-glider-darkPanel2 border border-glider-border dark:border-glider-darkBorder hover:border-glider-olive/40 dark:hover:border-glider-mint/40 transition group"
        >
          <img
            src="/brand/fashaking.jpg"
            alt="Fashaking"
            className="w-8 h-8 rounded-full object-cover ring-2 ring-glider-mint/60 dark:ring-glider-mint/30"
          />
          <span className="text-sm font-medium text-glider-gray dark:text-glider-darkMuted group-hover:text-glider-black dark:group-hover:text-glider-darkText transition">
            Built by{' '}
            <span className="font-semibold text-glider-olive dark:text-glider-mint">
              Fashaking
            </span>
          </span>
        </a>

        <p className="text-xs text-glider-gray/70 dark:text-glider-darkMuted/60">
          &copy; {new Date().getFullYear()} Glider Event Hub
        </p>
      </div>
    </footer>
  )
}
