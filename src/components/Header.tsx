import Logo from './Logo'
import { PlusIcon } from './Icons'

interface Props {
  onSubmitClick: () => void
}

export default function Header({ onSubmitClick }: Props) {
  return (
    <header className="sticky top-0 z-30 backdrop-blur-md bg-glide-light/75 border-b border-glide-border">
      <div className="max-w-6xl mx-auto px-5 py-4 flex items-center justify-between">
        <a href="#" className="flex items-center gap-2.5">
          <Logo className="w-9 h-9" />
          <span className="font-display font-bold text-lg tracking-tight text-glide-black">
            Glide <span className="text-glide-olive">Event Hub</span>
          </span>
        </a>
        <nav className="hidden md:flex items-center gap-7 text-sm text-glide-gray">
          <a href="#events" className="hover:text-glide-black transition">Events</a>
          <a href="#about" className="hover:text-glide-black transition">About</a>
          <a
            href="https://github.com/fashaking/glider-event-hub"
            target="_blank"
            rel="noreferrer"
            className="hover:text-glide-black transition"
          >
            GitHub
          </a>
        </nav>
        <button onClick={onSubmitClick} className="btn-primary text-sm">
          <PlusIcon width={16} height={16} />
          Submit Event
        </button>
      </div>
    </header>
  )
}
