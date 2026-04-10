# Glider Event Hub

> Your single source of truth for everything happening across the Glider ecosystem.

A real-time community event dashboard that aggregates AMAs, quizzes, workshops, hackathons, meetups, and launches — all in one place. Built with React, TypeScript, and Supabase.

---

## Features

### Event Discovery

- **Live "Happening Now" banner** — prominent banner surfaces any event currently live with a one-click join button and pulsing live indicator.
- **Hero card** with community stats: total events, members, and a live countdown to the next event.
- **Tab filters** — All / Upcoming / Live / Past, plus a category dropdown (AMA, Quiz, Workshop, Meetup, Hackathon, Launch).
- **Grid and list view** toggles with consistent card styling for both layouts.
- **Full-text search** across titles, hosts, descriptions, categories, and tags.
- **Featured events** — admin-pinnable events float to the top of every view.
- **Real-time countdown timers** that update every second for upcoming events.
- **Event detail modal** — full event info, countdown, host details, external join link, comments, and attendance tracking.

### Event Management

- **Community submissions** — anyone can submit events via an in-app form with title, description, host(s), category, start time, duration, link, location, tags, accent color, and optional image upload.
- **Event recurrence** — six recurrence modes: daily, weekly (with multi-day picker), biweekly, monthly, and monthly-nth-day (e.g. "every 3rd Wednesday"). Occurrences are expanded client-side.
- **Edit and delete** — event owners and admins can update or remove events.
- **Event images** — upload custom images (base64 in demo mode, Supabase Storage in production).
- **Accent colors** — three gradient options (mint, olive, sky) for card headers.

### Admin Dashboard

- **Approval workflow** — community-submitted events land in a "Pending" tab for admin review. Admins can approve or reject.
- **Featured toggle** — pin/unpin events from the detail modal.
- **Full CRUD** — admins can create, edit, and delete any event.
- **"Notify all live" toggle** — admin-only opt-in to receive notifications for every event that goes live, not just reminded ones.

### Authentication

- **Dual auth modes:**
  - **Demo mode** — localStorage-only accounts, zero setup required.
  - **Supabase mode** — full cloud auth with email/password when environment variables are configured.
- **User profiles** — username, avatar upload, and connected social accounts.
- **Persistent sessions** — stay signed in across page reloads.

### Notifications

- **Multi-channel delivery:**
  - **Email** — HTML-formatted emails via Resend.
  - **Telegram** — messages via Telegram Bot API with one-tap bot linking flow.
  - **Browser** — native Web Notification API for in-app alerts.
- **Notification types:**
  - **Event goes live** — triggered the moment an event starts.
  - **Starting soon** — 15-minute reminder before event start.
- **Per-event reminders** — set/unset reminders on individual events.
- **Per-platform toggles** — enable/disable notifications independently for each connected platform.
- **Connect and disconnect** any platform at any time, including email.
- **Notification history** — view past notifications in the profile modal.
- **Deduplication** — notification log prevents double-sends regardless of how a user was selected.

### Social Connections

- **Four platforms:** Email, X (Twitter), Telegram, and Discord.
- **Telegram bot linking** — one-time code generation, auto-redirect to the Glider bot, and automatic chat linking via webhook.
- **Per-platform notification control** — instant on/off toggle switches for each connected channel.

### Calendar View

- **Monthly calendar** with dot indicators showing event status (live, upcoming, past).
- **Day selection** — click a date to see events for that day.
- **Recurrence-aware** — recurring events appear on all their expanded dates.

### Gamification & Leaderboard

- **9 earnable badges:**
  - First Steps (1 event), Explorer (5), Veteran (10), Legend (25)
  - AMA Fan, Quiz Master, Workshop Grad (3 each in category)
  - Social Butterfly (3+ connected platforms)
  - Early Bird (attended within 1 hour of signup)
- **Points system** — 5 points per attended event + badge bonus points.
- **Leaderboard** — ranked user list with medals for top 3, avatars, scores, event counts, and earned badges.
- **Attendance tracking** — mark events as attended to earn points and badges.

### Interest & Engagement

- **"Interested" button** — mark events you want to attend (auto-sets a reminder).
- **Comments** — post and read comments on any event with user avatars.
- **Attendance marking** — confirm you attended an event to build your profile.

### Theme & UI

- **Dark mode** — toggle between light and dark themes, with system preference detection.
- **Responsive design** — mobile-first layout that works on phone, tablet, and desktop.
- **Custom brand palette** — Glider olive, mint, sky, and neutral tones throughout.
- **Smooth animations** — pulsing live indicators, transition effects, and floating decorative elements.
- **Category icons** — distinct visual icons for each event category.

### Real-time Updates (Supabase mode)

- **Postgres Changes subscription** — events update in real-time across all connected clients.
- **Optimistic UI** — toggle switches and interactions update instantly, with DB writes in the background.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | [React 18](https://react.dev/) + TypeScript |
| Build | [Vite](https://vitejs.dev/) |
| Styling | [Tailwind CSS](https://tailwindcss.com/) |
| Backend | [Supabase](https://supabase.com/) (PostgreSQL + Auth + Storage + Edge Functions) |
| Email | [Resend](https://resend.com/) |
| Telegram | Telegram Bot API |
| Fonts | Space Grotesk (display) + Inter (body) via Google Fonts |
| Icons | Hand-built SVG icon set (no icon library) |
| Hosting | [Vercel](https://vercel.com/) |

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

The app runs in **demo mode** by default (localStorage only). To enable cloud features, copy `.env.example` to `.env.local` and fill in your Supabase credentials:

```bash
cp .env.example .env.local
```

### Supabase Setup

1. Create a Supabase project at [supabase.com](https://supabase.com).
2. Run the migrations in `supabase/migrations/` against your database.
3. Set your `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in `.env.local`.
4. For notifications, set these secrets on your Supabase project:
   - `RESEND_API_KEY` — for email delivery
   - `TELEGRAM_BOT_TOKEN` — for Telegram messages
   - `TELEGRAM_WEBHOOK_SECRET` — to secure the Telegram webhook endpoint
5. Deploy the edge functions in `supabase/functions/`.
6. Set up pg_cron jobs to invoke `notify-live-events` and `send-event-reminders` every minute.

---

## Project Structure

```
.
├── index.html
├── package.json
├── tailwind.config.js
├── vite.config.ts
├── vercel.json
└── src/
    ├── App.tsx                      # Main app shell, routing, views
    ├── main.tsx                     # Entry point
    ├── index.css                    # Global styles + Tailwind
    ├── types.ts                     # Core types, badges, scoring
    ├── context/
    │   └── AuthContext.tsx           # Auth providers (Demo + Supabase)
    ├── hooks/
    │   ├── useEvents.ts             # Event CRUD, filtering, real-time sync
    │   ├── useLiveEventNotifications.ts  # Browser notification triggers
    │   └── useTheme.ts              # Dark mode toggle
    ├── services/
    │   └── notifications.ts         # Notification log & delivery service
    ├── lib/
    │   ├── supabase.ts              # Supabase client
    │   └── database.types.ts        # Database type definitions
    ├── data/
    │   └── events.ts                # Sample seed events
    └── components/
        ├── Sidebar.tsx              # Navigation sidebar
        ├── LiveBanner.tsx           # "Happening Now" banner
        ├── HeroCard.tsx             # Stats hero section
        ├── EventList.tsx            # Event grid/list display
        ├── EventCard.tsx            # Individual event card
        ├── EventDetailModal.tsx     # Full event view + comments
        ├── SubmitEventModal.tsx     # Event creation form
        ├── EditEventModal.tsx       # Event editing form
        ├── AuthModal.tsx            # Sign in / sign up
        ├── ProfileModal.tsx         # Profile settings + social connections
        ├── CalendarView.tsx         # Monthly calendar
        ├── Footer.tsx               # Site footer
        ├── Logo.tsx                 # Glider logo
        └── Icons.tsx                # SVG icon components
└── supabase/
    ├── migrations/                  # SQL migrations
    └── functions/
        ├── notify-live-events/      # Edge function: live event notifications
        ├── send-event-reminders/    # Edge function: 15-min reminders
        └── telegram-webhook/        # Edge function: Telegram bot webhook
```

---

## Deploying to Vercel

This repo ships with a [`vercel.json`](vercel.json) pre-configured for Vite + SPA fallback.

**Dashboard:**
1. Go to https://vercel.com/new
2. Import the `fashaking/glider-event-hub` repository
3. Keep the Vite preset defaults (build: `npm run build`, output: `dist`)
4. Add your `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` environment variables
5. Click **Deploy**

**CLI:**
```bash
npm i -g vercel
vercel           # preview deployment
vercel --prod    # production deployment
```

---

## Brand Palette

| Role | Name | Hex |
|------|------|-----|
| Primary accent | Olive Green | `#4F7F58` |
| Soft accent | Mint Green | `#A8E0D1` |
| Secondary accent | Light Blue | `#A3C8E0` |
| Text | Black | `#000000` |
| Background | Light Gray | `#F5F5F7` |
| Muted text | Dark Gray | `#626262` |

All colors are exposed as Tailwind utilities: `bg-glider-mint`, `text-glider-olive`, `border-glider-sky`, `bg-glider-light`, `text-glider-gray`, etc.

---

## Roadmap

- [ ] Discord bot integration for notifications
- [ ] X (Twitter) mention notifications
- [ ] Calendar export (`.ics`) for individual events
- [ ] AI-generated recaps and summaries for past events
- [ ] Event albums and photo galleries
- [ ] RSVP counts and attendee lists
- [ ] Recurring event series management (edit all / edit single)
- [ ] Push notifications via service workers
- [ ] Webhook integrations for third-party event sources
- [ ] Event analytics dashboard for hosts
- [ ] Multi-language / i18n support
- [ ] OAuth sign-in (Google, GitHub, Discord)
