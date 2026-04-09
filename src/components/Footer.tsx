import Wordmark from './Wordmark'

const XLogo = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2H21.5l-7.5 8.57L22.5 22h-6.844l-5.36-7.01L4.6 22H1.34l8.022-9.166L1.5 2h7.02l4.844 6.4L18.244 2zm-1.2 18h1.86L7.04 4H5.05l11.994 16z" />
  </svg>
)

const HeartIcon = (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="currentColor"
    className="text-red-400"
  >
    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.27 2 8.5 2 5.41 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.08C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.41 22 8.5c0 3.77-3.4 6.86-8.55 11.53L12 21.35z" />
  </svg>
)

const CodeIcon = (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M7 8l-4 4 4 4" />
    <path d="M17 8l4 4-4 4" />
    <path d="M14 4l-4 16" />
  </svg>
)

const GliderMiniIcon = (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M22 2L11 13" />
    <path d="M22 2l-7 20-4-9-9-4 20-7z" />
  </svg>
)

export default function Footer() {
  return (
    <footer
      id="about"
      className="relative border-t border-glider-border dark:border-glider-darkBorder mt-10 overflow-hidden"
    >
      {/* Decorative background blobs */}
      <div className="pointer-events-none absolute -top-32 -left-20 w-80 h-80 rounded-full bg-glider-mint/20 dark:bg-glider-mint/5 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -right-20 w-80 h-80 rounded-full bg-glider-sky/20 dark:bg-glider-sky/5 blur-3xl" />
      <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-glider-olive/5 dark:bg-glider-olive/5 blur-3xl" />

      <div className="relative py-14 px-5">
        <div className="max-w-6xl mx-auto">
          {/* Top section — logo + links grid */}
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-8 mb-10">
            <div className="flex flex-col items-center md:items-start gap-3 max-w-sm">
              <Wordmark iconClassName="w-8 h-8" textClassName="text-lg" />
              <p className="text-sm text-glider-gray dark:text-glider-darkMuted text-center md:text-left leading-relaxed">
                Your single source of truth for everything happening across the
                Glider ecosystem — AMAs, quizzes, workshops, hackathons and
                meetups, all in one place.
              </p>
            </div>

            {/* Quick links */}
            <div className="flex gap-10 justify-center md:justify-end text-sm">
              <div>
                <h4 className="font-display font-semibold text-glider-black dark:text-glider-darkText mb-2.5">
                  Explore
                </h4>
                <ul className="space-y-1.5 text-glider-gray dark:text-glider-darkMuted">
                  <li>
                    <a href="#" className="hover:text-glider-olive dark:hover:text-glider-mint transition">
                      Home
                    </a>
                  </li>
                  <li>
                    <a href="#calendar" className="hover:text-glider-olive dark:hover:text-glider-mint transition">
                      Calendar
                    </a>
                  </li>
                  <li>
                    <a href="#events" className="hover:text-glider-olive dark:hover:text-glider-mint transition">
                      Events
                    </a>
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="font-display font-semibold text-glider-black dark:text-glider-darkText mb-2.5">
                  Community
                </h4>
                <ul className="space-y-1.5 text-glider-gray dark:text-glider-darkMuted">
                  <li>
                    <a
                      href="https://discord.gg/xDy7M6xNPR"
                      target="_blank"
                      rel="noreferrer"
                      className="hover:text-glider-olive dark:hover:text-glider-mint transition"
                    >
                      Discord
                    </a>
                  </li>
                  <li>
                    <a
                      href="https://x.com/glider_fi"
                      target="_blank"
                      rel="noreferrer"
                      className="hover:text-glider-olive dark:hover:text-glider-mint transition"
                    >
                      X / Twitter
                    </a>
                  </li>
                  <li>
                    <a
                      href="https://glider.fi/r/v9t1x8jy"
                      target="_blank"
                      rel="noreferrer"
                      className="hover:text-glider-olive dark:hover:text-glider-mint transition"
                    >
                      Website
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="h-px bg-gradient-to-r from-transparent via-glider-border dark:via-glider-darkBorder to-transparent mb-8" />

          {/* Builder credit card */}
          <div className="flex flex-col items-center mb-8">
            <a
              href="https://x.com/fashaking3"
              target="_blank"
              rel="noreferrer"
              className="group relative"
            >
              {/* Glow background */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-glider-mint/30 via-glider-olive/20 to-glider-sky/30 dark:from-glider-mint/15 dark:via-glider-olive/10 dark:to-glider-sky/15 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

              <div className="relative flex items-center gap-4 px-6 py-4 rounded-2xl bg-white/80 dark:bg-glider-darkPanel2/80 backdrop-blur-sm border border-glider-border dark:border-glider-darkBorder group-hover:border-glider-mint/50 dark:group-hover:border-glider-mint/30 shadow-soft group-hover:shadow-glowMint transition-all duration-300">
                {/* Avatar with animated ring */}
                <div className="relative shrink-0">
                  <div className="absolute -inset-1 rounded-full bg-gradient-to-tr from-glider-mint via-glider-olive to-glider-sky opacity-60 group-hover:opacity-100 animate-pulse-ring" />
                  <img
                    src="/brand/fashaking.jpg"
                    alt="Fashaking"
                    className="relative w-12 h-12 rounded-full object-cover ring-2 ring-white dark:ring-glider-darkPanel shadow-lg animate-float"
                  />
                  {/* Online dot */}
                  <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-white dark:border-glider-darkPanel" />
                </div>

                {/* Text */}
                <div className="flex flex-col">
                  <span className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest font-semibold text-glider-gray/70 dark:text-glider-darkMuted/70">
                    <span className="text-glider-olive dark:text-glider-mint">
                      {CodeIcon}
                    </span>
                    Built with {HeartIcon} by
                  </span>
                  <span className="font-display text-lg font-bold text-glider-black dark:text-glider-darkText group-hover:text-glider-olive dark:group-hover:text-glider-mint transition-colors">
                    Fashaking
                  </span>
                </div>

                {/* X badge */}
                <div className="ml-2 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-glider-black dark:bg-white text-white dark:text-glider-black text-xs font-semibold group-hover:scale-105 transition-transform">
                  {XLogo}
                  <span>Follow</span>
                </div>
              </div>
            </a>
          </div>

          {/* Bottom bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-glider-gray/60 dark:text-glider-darkMuted/50">
            <p className="flex items-center gap-1.5">
              <span className="text-glider-olive dark:text-glider-mint">
                {GliderMiniIcon}
              </span>
              &copy; {new Date().getFullYear()} Glider Event Hub. All rights
              reserved.
            </p>
            <p>Powered by the Glider community</p>
          </div>
        </div>
      </div>
    </footer>
  )
}
