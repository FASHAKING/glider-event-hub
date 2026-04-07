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

All colors are exposed as Tailwind utilities: `bg-glide-mint`, `text-glide-olive`,
`border-glide-sky`, `bg-glide-light`, `text-glide-gray`, etc. See
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

## Disclaimer

This is an unofficial, community-built project and is not affiliated with Glide.
