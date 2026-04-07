# Glide Event Hub

> The Single Source of Truth for the Glide Ecosystem.

A real-time community dashboard that aggregates AMAs, quizzes, workshops,
hackathons, meetups and launches across the Glide ecosystem. Inspired by the
[rialo-event-hub](https://github.com/mrnetwork0001/rialo-event-hub) community
project.

## Features

- **Live / Upcoming / Past** event categorization computed automatically from
  event start time and duration.
- **Search** across titles, hosts, categories and tags.
- **Community submissions** — submit events via an in-app form (stored in
  `localStorage` for now; can be wired to Supabase or any backend later).
- **Modern web3-styled UI** with Tailwind CSS.
- **Zero backend required** to try it locally.

## Tech Stack

- [Vite](https://vitejs.dev/) + [React 18](https://react.dev/) + TypeScript
- [Tailwind CSS](https://tailwindcss.com/)
- Vanilla React state + `localStorage` persistence

## Getting Started

```bash
# install dependencies
npm install

# start the dev server
npm run dev

# build for production
npm run build

# preview the production build
npm run preview
```

Then open http://localhost:5173.

## Project Structure

```
.
├── index.html
├── package.json
├── tailwind.config.js
├── postcss.config.js
├── tsconfig.json
├── vite.config.ts
└── src
    ├── App.tsx
    ├── main.tsx
    ├── index.css
    ├── types.ts
    ├── data/
    │   └── events.ts          # sample Glide events
    └── components/
        ├── Header.tsx
        ├── Hero.tsx
        ├── EventCard.tsx
        ├── EventList.tsx
        ├── SubmitEventModal.tsx
        └── Footer.tsx
```

## Customizing Events

Sample events live in [`src/data/events.ts`](src/data/events.ts). Add, edit or
remove entries there, or use the in-app **Submit Event** button — community
submissions are persisted to the browser's `localStorage`.

Each event has the shape:

```ts
interface GlideEvent {
  id: string
  title: string
  description: string
  host: string
  category: 'AMA' | 'Quiz' | 'Workshop' | 'Meetup' | 'Hackathon' | 'Launch'
  startsAt: string        // ISO timestamp
  durationMinutes: number
  link: string
  location?: string
  tags?: string[]
}
```

## Roadmap Ideas

- Wire submissions to a real backend (Supabase / Firebase / D1).
- Admin approval workflow for community-submitted events.
- Email / Telegram / Discord reminder integrations.
- AI-generated recaps for past events.
- Calendar export (`.ics`) for individual events.

## Disclaimer

This is an unofficial, community-built project and is not affiliated with Glide.
