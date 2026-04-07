# Supabase backend for Glider Event Hub

This folder contains everything you need to wire the front-end app to a real
Supabase project, including:

- `migrations/0001_init.sql` — full schema (events, profiles, reminders,
  social connections, notification log, telegram link codes) with
  Row-Level Security policies and an `auth.users` → `profiles` trigger.
- `functions/telegram-webhook/` — Edge Function that handles
  `/start <CODE>` from the Glider Telegram bot and links a user's chat ID
  to their account.
- `functions/notify-live-events/` — Cron-driven Edge Function that finds
  events that have just gone live and DMs every reminded user via
  Telegram.

The front-end automatically detects whether Supabase is configured. If
the env vars are missing it falls back to "demo mode" (localStorage), so
the UI is always usable.

---

## 1. Create the Supabase project

1. Go to <https://supabase.com>, create a new project, and grab:
   - **Project URL** (e.g. `https://abcd1234.supabase.co`)
   - **anon public key**
   - **service_role key** (server-side only — used by Edge Functions)

2. In the project dashboard go to **SQL editor** → **New query**, paste
   the contents of [`migrations/0001_init.sql`](./migrations/0001_init.sql),
   and run it. This creates every table, RLS policy and the
   profile-on-signup trigger.

3. In **Storage** → **Create new bucket**, create a public bucket named
   `event-images` (or whatever you set `VITE_SUPABASE_EVENT_BUCKET` to).
   Make sure "Public bucket" is checked so the URLs the app generates
   are reachable.

---

## 2. Configure the front-end

In the project root, copy the example env file and fill it in:

```bash
cp .env.example .env.local
```

```env
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOi...
VITE_SUPABASE_EVENT_BUCKET=event-images
VITE_TELEGRAM_BOT_USERNAME=GliderEventHubBot
```

Restart `npm run dev`. The yellow "demo mode" banner at the top of the
app should disappear, and Sign Up / Sign In will now create real users
in Supabase Auth.

---

## 3. (Optional) Wire up the Telegram bot

### 3a. Create a bot

1. In Telegram, message `@BotFather` and send `/newbot`.
2. Pick a display name and a username (must end in `bot`, e.g.
   `GliderEventHubBot`).
3. Save the bot token BotFather gives you.

### 3b. Deploy the Edge Functions

You need the [Supabase CLI](https://supabase.com/docs/guides/cli):

```bash
supabase login
supabase link --project-ref <project-ref>
```

Set the secrets the functions need:

```bash
supabase secrets set TELEGRAM_BOT_TOKEN=123456:ABC...
supabase secrets set TELEGRAM_WEBHOOK_SECRET=$(openssl rand -hex 16)
```

Deploy both functions:

```bash
supabase functions deploy telegram-webhook --no-verify-jwt
supabase functions deploy notify-live-events
```

### 3c. Point Telegram at the webhook

```bash
PROJECT_REF=<your-project-ref>
TOKEN=<your-bot-token>
SECRET=<the-secret-you-just-set>

curl -X POST "https://api.telegram.org/bot$TOKEN/setWebhook" \
  -d "url=https://$PROJECT_REF.functions.supabase.co/telegram-webhook" \
  -d "secret_token=$SECRET"
```

You should see `{"ok":true,"result":true,...}`.

### 3d. Schedule the live notifier

In the Supabase dashboard, go to **Database → Cron Jobs** (you may need
to enable the `pg_cron` and `pg_net` extensions first under
**Database → Extensions**). Add a job:

```sql
select cron.schedule(
  'notify-live-events',
  '* * * * *',  -- every minute
  $$
    select net.http_post(
      url := 'https://<project-ref>.functions.supabase.co/notify-live-events',
      headers := '{"Content-Type": "application/json"}'::jsonb
    ) as request_id;
  $$
);
```

(Or, simpler: in the Supabase dashboard go to **Edge Functions → Schedules**
and create a cron schedule for `notify-live-events` running every minute.)

### 3e. Try it end-to-end

1. Open the app, sign up, click your avatar → **Profile**.
2. Tap **Connect** next to Telegram. The app will:
   - Create a one-time link code (e.g. `K7P3X9MQ`)
   - Open `https://t.me/<your-bot>?start=K7P3X9MQ` in a new tab
3. In Telegram, tap **Start**. The bot DMs you "✅ Linked!"
4. Back in the app, the Telegram row in your profile shows
   "@yourhandle · chat linked".
5. Open any event and tap **Set Reminder**.
6. When that event's `starts_at` falls within the last 2 minutes, the
   `notify-live-events` cron will DM you with a join link.

---

## 4. Adding events as an admin

Because RLS only allows the *creator* of an event to insert/update, you
manage events one of two ways:

- **Via the app**: sign in and submit through the Submit Event modal.
  This uploads any image to Storage and inserts into `public.events`.
- **Via the dashboard**: open **Table editor → events** in Supabase and
  add rows manually. Set `created_by` to a user UUID from
  `public.profiles` (or leave it null and add a `service_role` insert
  using the dashboard).

You can also drop additional migrations into `supabase/migrations/` to
extend the schema (add new columns, more tables, etc.).
