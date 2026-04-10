# Glider Event Hub

> Your single source of truth for everything happening across the Glider ecosystem.

A real-time community dashboard that aggregates AMAs, quizzes, workshops,
hackathons, meetups and launches across the Glider community — all in one place.
It ships with a full-featured **Supabase** backend for auth, storage and
real-time sync, but also runs entirely in **demo mode** (localStorage only) with
zero configuration, so you can explore every feature instantly.

---

## Features

### Home Page

- **Hero card** displaying total events, community member count, and a
  live countdown timer to the next event (updates every second).
- **Live "Happening Now" banner** that automatically surfaces any event
  currently in progress with a one-click Join button.
- **Tab filters** — All / Upcoming / Now / Past / Pending (admin-only) —
  each with a count badge.
- **Category dropdown** filter for AMA, Quiz, Workshop, Meetup, Hackathon
  and Launch.
- **Full-text search** across titles, descriptions, hosts, categories and
  tags.
- **Grid and list view** toggle with consistent card styling in both
  layouts.
- **Featured events** pinned to the top of the list (admin-controlled).

### Calendar Page

- Full **month calendar grid** (Monday-start) with prev / next month
  navigation.
- **Color-coded event density dots** per day (red = live, amber = upcoming,
  gray = past).
- **Category filter** dropdown within the calendar view.
- Click any day to reveal an **event detail panel** for that date.

### Leaderboard

- **Top-3 podium** with gold / silver / bronze medal styling.
- **Full rankings table** for all users, sorted by score.
- **Scoring system**: 5 points per attended event plus bonus points from
  badges.
- **9 achievement badges** — First Steps (10 pts), Explorer (25 pts),
  Veteran (50 pts), Legend (100 pts), AMA Fan (15 pts), Quiz Master
  (15 pts), Workshop Grad (15 pts), Social Butterfly (20 pts) and
  Early Bird (10 pts).
- Highlighted row for the currently signed-in user.
- Sign-up call-to-action for visitors who haven't created an account.

### Event Management

- **Submit events** via a rich in-app form with title, description,
  host(s), category autocomplete, start date/time, duration, join link
  and tags.
- **Image upload** per event (1.5 MB limit, stored as base64 or in
  Supabase Storage).
- **Recurrence options** — daily, weekly (with day-of-week picker),
  biweekly, monthly, or monthly Nth weekday (e.g. "every 3rd Wednesday").
- **Edit events** with the same feature set, including image
  replace/remove.
- **Event detail modal** with full description, live countdown, join link,
  host list, location, tags and a comments section.

### User Accounts

- **Sign up / sign in** with email and password.
- **Dual-mode architecture** — real Supabase auth when environment
  variables are set, or localStorage-only demo mode when they aren't.
- **User profiles** with editable username and avatar upload.
- **Admin role** support (`isAdmin` flag) for elevated privileges.

### Social Connections

- Connect **Email, X (Twitter), Telegram and Discord** from the profile
  modal.
- **Per-platform notification toggles** — choose which platforms receive
  alerts.
- **Telegram bot linking** flow via one-time connect codes and a dedicated
  Edge Function webhook.
- **Global notification mute** toggle.

### Notifications

- **Browser Notification API** integration with permission prompting.
- **Live event alerts** when a bookmarked event goes live.
- **"Starting soon" alerts** when an event begins within 15 minutes.
- **Event update notifications** when an event's time, description or link
  changes.
- **Notification history** log (persisted to localStorage and the
  `notification_log` Supabase table).
- **Server-side delivery** via `notify-live-events` and
  `send-event-reminders` Edge Functions.

### Admin Features

- **Approve / reject** community-submitted events.
- Dedicated **Pending tab** (with count badge) visible only to admins.
- **Edit or delete** any event.
- **Toggle featured** status to pin events to the top.

### Personalization

- **Dark / light theme** toggle with automatic system-preference
  detection.
- **Flash-of-theme prevention** via an inline script in `index.html`.
- **Event bookmarks / reminders** per user.
- **Notification preferences** per social platform, plus a global mute.

### Community

- **Comments** on events with user avatars and timestamps.
- **Suggestion / feedback form** via a dedicated modal.
- **Attendance tracking** — mark yourself as "I attended".
- **Interest tracking** — mark yourself as "Interested".

---

## Tech Stack

| Layer | Technology |
| --- | --- |
| Framework | [Vite 5](https://vitejs.dev/) + [React 18](https://react.dev/) + TypeScript 5 |
| Styling | [Tailwind CSS 3](https://tailwindcss.com/) with `class`-based dark mode |
| Backend | [Supabase](https://supabase.com/) — Auth, PostgreSQL, Storage, Edge Functions, Realtime |
| Fallback | Vanilla React state + `localStorage` (demo mode) |
| Typography | **Outfit** (display) · **Inter** (body) · **JetBrains Mono** (code) via Google Fonts |
| Icons | Hand-built SVG icon set (no icon library dependency) |

---

## Brand Palette

### Light Theme

| Role | Name | Hex |
| --- | --- | --- |
| Primary accent | Olive Green | `#4F7F58` |
| Soft accent | Mint Green | `#A8E0D1` |
| Secondary accent | Light Blue | `#A3C8E0` |
| Text | Black | `#000000` |
| Background | Light Gray | `#F5F5F7` |
| Muted text | Dark Gray | `#626262` |

### Dark Theme

| Role | Name | Hex |
| --- | --- | --- |
| Background | Dark BG | `#0B0F14` |
| Panel | Dark Panel | `#151A22` |
| Panel alt | Dark Panel 2 | `#1D232D` |
| Border | Dark Border | `#262C38` |
| Text | Dark Text | `#F5F5F7` |
| Muted text | Dark Muted | `#9AA0AC` |

All colors are exposed as Tailwind utilities — `bg-glider-mint`,
`text-glider-olive`, `border-glider-sky`, `bg-glider-darkBg`, etc. See
[`tailwind.config.js`](tailwind.config.js).

---

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

### Environment Variables

Copy `.env.example` to `.env.local` and fill in the values from your
Supabase project:

```env
VITE_SUPABASE_URL=              # Public Supabase project URL
VITE_SUPABASE_ANON_KEY=         # Supabase anon/public API key
VITE_SUPABASE_EVENT_BUCKET=     # Storage bucket name (default: event-images)
VITE_TELEGRAM_BOT_USERNAME=     # Bot username for Telegram linking
```

> **Demo mode:** If the Supabase variables are missing or empty the app
> runs entirely on `localStorage` — every feature still works, no backend
> required.

---

## Project Structure

```
.
├── index.html
├── package.json
├── tailwind.config.js
├── postcss.config.js
├── tsconfig.json
├── vercel.json
├── .env.example
├── supabase/
│   ├── migrations/              # 13 SQL migration files
│   └── functions/
│       ├── notify-live-events/  # Cron: alert users when events go live
│       ├── send-event-reminders/# Cron: send upcoming-event reminders
│       └── telegram-webhook/    # Webhook: Telegram bot link flow
└── src/
    ├── App.tsx                  # Root shell, view routing
    ├── main.tsx                 # React entry point
    ├── index.css                # Tailwind directives + custom styles
    ├── types.ts                 # Types, badge system, event helpers
    ├── context/
    │   └── AuthContext.tsx       # Dual-mode auth (Supabase + demo)
    ├── hooks/
    │   ├── useEvents.ts         # Event CRUD with Supabase / localStorage
    │   ├── useComments.ts       # Comment system
    │   ├── useLiveEventNotifications.ts  # Live / starting-soon alerts
    │   └── useTheme.ts          # Dark / light mode
    ├── services/
    │   └── notifications.ts     # Browser Notification API + history
    ├── lib/
    │   ├── supabase.ts          # Supabase client init
    │   └── database.types.ts    # Generated Supabase types
    ├── data/
    │   └── events.ts            # Sample seed events
    └── components/
        ├── Sidebar.tsx          # Left navigation + links
        ├── LiveBanner.tsx       # "Happening Now" banner
        ├── HeroCard.tsx         # Hero section with stats
        ├── EventList.tsx        # Event list + tabs + filters
        ├── EventCard.tsx        # Grid / list event card
        ├── EventDetailModal.tsx # Full event detail + comments
        ├── EditEventModal.tsx   # Edit event form
        ├── SubmitEventModal.tsx # Submit event form
        ├── CalendarPage.tsx     # Month calendar view
        ├── LeaderboardPage.tsx  # Rankings + podium
        ├── AuthModal.tsx        # Sign in / sign up
        ├── ProfileModal.tsx     # Profile + social connections
        ├── SuggestionModal.tsx  # Feedback form
        ├── ThemeToggle.tsx      # Dark / light toggle
        ├── Footer.tsx           # Footer with links + credits
        ├── Logo.tsx             # Logo image
        ├── Wordmark.tsx         # Logo + text wordmark
        └── Icons.tsx            # SVG icon library
```

---

## Event Data Model

```ts
interface GliderEvent {
  id: string
  title: string
  description: string
  host: string
  hosts?: string[]                      // co-hosts
  category: string                      // AMA | Quiz | Workshop | Meetup | Hackathon | Launch
  startsAt: string                      // ISO timestamp
  durationMinutes: number
  link: string
  location?: string
  tags?: string[]
  accent?: 'mint' | 'olive' | 'sky'    // card header gradient
  imageUrl?: string                     // remote URL or base64
  recurrence?: EventRecurrence          // see below
  isFeatured?: boolean                  // pinned to top
  status?: 'pending' | 'approved' | 'rejected'
}

interface EventRecurrence {
  frequency: 'none' | 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'monthly_nth_day'
  occurrences: number                   // after the first
  daysOfWeek?: number[]                 // 0=Sun..6=Sat
  weekOfMonth?: number                  // 1-4 or 5=last
}
```

Sample events live in [`src/data/events.ts`](src/data/events.ts). You can
add entries there, or use the in-app **Submit Event** button — community
submissions are persisted to the browser's `localStorage` or the Supabase
`events` table.

---

## Supabase Setup

The `supabase/` directory contains everything needed for the backend:

- **13 sequential SQL migrations** in `supabase/migrations/` — run them
  with `supabase db push` or apply manually in the SQL Editor.
- **3 Edge Functions** — `notify-live-events`, `send-event-reminders` and
  `telegram-webhook`.
- **Database tables** — `profiles`, `events`, `reminders`,
  `social_connections`, `notification_log`, `telegram_link_codes`,
  `attendance`, `comments` and `interests`.
- **Storage bucket** — `event-images` for uploaded event images.

See [`supabase/README.md`](supabase/README.md) for detailed backend setup
instructions.

---

## Deploying to Vercel

This repo ships with a [`vercel.json`](vercel.json) pre-configured for
Vite + SPA fallback, so deployment is one-click.

**Dashboard (recommended):**

1. Go to https://vercel.com/new
2. Import the `fashaking/glider-event-hub` repository.
3. Vercel auto-detects the **Vite** preset — keep the defaults:
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`
4. Add your `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` environment
   variables in the Vercel project settings.
5. Click **Deploy**. You'll get a `https://<project>.vercel.app` URL
   within about a minute.

**CLI:**

```bash
npm i -g vercel
vercel           # link and deploy a preview
vercel --prod    # deploy to production
```

Every push to the connected branch triggers an automatic preview build on
Vercel.

---

## Roadmap

### In Progress

- **Notification delivery** — the dispatcher infrastructure and Edge
  Functions are ready; production wiring with real Email / Telegram /
  Discord API keys is the next step.

### Planned

- **Calendar export** — `.ics` download for individual events.
- **AI-generated recaps** for past events.
- **Event albums / photo galleries** — attach multiple images to an event.
- **Push notifications** via PWA / Service Worker.
- **OAuth social login** — Google, GitHub, Discord, X.
- **Event analytics dashboard** — attendance trends, engagement metrics.
- **Multi-language / i18n** support.
- **Public REST API** for event data.
- **Mobile app** — React Native or enhanced PWA.
- **Event templates** for quick creation of recurring formats.
