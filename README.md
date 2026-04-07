# Glider Event Hub

> Your single source of truth for everything happening across the Glider ecosystem.

A real-time community dashboard that aggregates AMAs, quizzes, workshops,
hackathons, meetups and launches across the Glider community — all in one place.

## Features

- **Sidebar navigation** — Home, Calendar, Leaderboard, Suggestions, Submit
  Event, plus Glider Discord & website links.
- **Live "Happening Now" banner** that surfaces any event currently live with a
  one-click join button.
- **Hero card** with stats: total events, community members, and a live
  countdown to the next event.
- **Tab filters**: All / Upcoming / Now / Past, plus a category dropdown
  (AMA, Quiz, Workshop, Meetup, Hackathon, Launch).
- **Grid and list view toggles** with consistent styling for both layouts.
- **Search** across titles, hosts, categories and tags.
- **Community submissions** — submit events via an in-app form (stored in
  `localStorage` for now; can be wired to any backend later).
- **Modern, clean Glider-branded UI** with custom SVG icons and gradient card
  headers per event accent.

## Tech Stack

- [Vite](https://vitejs.dev/) + [React 18](https://react.dev/) + TypeScript
- [Tailwind CSS](https://tailwindcss.com/)
- Vanilla React state + `localStorage` persistence
- **Typography:** Space Grotesk (display) + Inter (body) via Google Fonts
- **Icons:** hand-built SVG icon set (no icon library dependency)

## Brand Palette

| Role | Name | Hex |
| --- | --- | --- |
| Primary accent | Olive Green | `#4F7F58` |
| Soft accent | Mint Green | `#A8E0D1` |
| Secondary accent | Light Blue | `#A3C8E0` |
| Text | Black | `#000000` |
| Background | Light Gray | `#F5F5F7` |
| Muted text | Dark Gray | `#626262` |

All colors are exposed as Tailwind utilities: `bg-glider-mint`, `text-glider-olive`,
`border-glider-sky`, `bg-glider-light`, `text-glider-gray`, etc. See
[`tailwind.config.js`](tailwind.config.js).

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
├── vercel.json
├── vite.config.ts
└── src
    ├── App.tsx
    ├── main.tsx
    ├── index.css
    ├── types.ts
    ├── data/
    │   └── events.ts          # sample Glider events
    └── components/
        ├── Sidebar.tsx
        ├── LiveBanner.tsx
        ├── HeroCard.tsx
        ├── EventList.tsx
        ├── EventCard.tsx
        ├── SubmitEventModal.tsx
        ├── Footer.tsx
        ├── Logo.tsx
        └── Icons.tsx
```

## Customizing Events

Sample events live in [`src/data/events.ts`](src/data/events.ts). Add, edit or
remove entries there, or use the in-app **Submit Event** button — community
submissions are persisted to the browser's `localStorage`.

Each event has the shape:

```ts
interface GliderEvent {
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
  accent?: 'mint' | 'olive' | 'sky'   // card header gradient
}
```

## Deploying to Vercel

This repo ships with a [`vercel.json`](vercel.json) pre-configured for Vite +
SPA fallback, so deployment is one-click.

**Dashboard (recommended):**
1. Go to https://vercel.com/new
2. Import the `fashaking/glider-event-hub` repository
3. Vercel auto-detects the **Vite** preset — keep the defaults:
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`
4. Click **Deploy**. You'll get a `https://<project>.vercel.app` URL within
   about a minute.

**CLI:**
```bash
npm i -g vercel
vercel           # link and deploy a preview
vercel --prod    # deploy to production
```

Every push to the connected branch will trigger an automatic preview build on
Vercel.

## Roadmap Ideas

- Wire submissions to a real backend (Supabase / Firebase / D1).
- Admin approval workflow for community-submitted events.
- Email / Telegram / Discord reminder integrations.
- AI-generated recaps for past events.
- Calendar export (`.ics`) for individual events.
- Event albums / photo galleries.
- Community leaderboard.
