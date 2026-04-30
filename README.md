# GetFitWithJ — Personal Trainer Client Management Platform

A full-stack personal trainer client management platform built with **Next.js 14**, **Supabase**, and **Tailwind CSS**.

## Features

### User Roles
- **Trainer Owner** (`trainer_owner` / `admin`) — Full admin access: all clients, all trainers, all data
- **Associate Trainer** (`associate_trainer`) — Assigned clients only, cannot manage other trainers
- **Client** (`client`) — Personal dashboard only

### Trainer Portal
| Page | Route | Description |
|------|-------|-------------|
| Dashboard | `/dashboard` | Stats, today's sessions, recent completions, quick actions |
| Clients | `/clients` | Searchable/filterable client list with invite flow |
| Client Profile | `/clients/[id]` | Full profile: info, programs, sessions, notes, completions |
| Workout Library | `/workouts` | YouTube-based workout library with tags and filters |
| Add Workout | `/workouts/new` | Add workout with YouTube URL and muscle group tags |
| Program Builder | `/programs/[id]` | Drag-and-drop weekly builder (Mon–Sun) |
| Sessions | `/sessions` | Month calendar view, create/complete/cancel sessions |
| Notes | `/notes` | Threaded notes with **Supabase Realtime** replies |
| Settings | `/settings` | Profile, avatar upload, password reset, associate trainer management |

### Client Portal
| Page | Route | Description |
|------|-------|-------------|
| Dashboard | `/my-dashboard` | Today's workouts with YouTube embeds, mark complete, upcoming sessions, trainer notes |

### Additional
- **Invite-only client signup** via tokenized links (`/invite?token=...`, 7-day expiry)
- **Session reminder emails** via Supabase Edge Function + Resend (24h and 1h before)
- **Realtime** notes and replies via Supabase Realtime subscriptions
- **Supabase Storage** for avatars
- **YouTube privacy-friendly** embeds via `youtube-nocookie.com`
- **RLS policies** — clients can only see their own data

---

## Tech Stack

- **Framework**: Next.js 14 (App Router, TypeScript)
- **Database & Auth**: Supabase (PostgreSQL, Supabase Auth, RLS, Realtime, Storage)
- **Styling**: Tailwind CSS + shadcn/ui components
- **Drag & Drop**: @dnd-kit/core + @dnd-kit/sortable
- **Email**: Resend (free tier: 100 emails/day)
- **Deployment**: Vercel

---

## Setup

### 1. Clone and install

```bash
git clone <repo-url>
cd GetFitWithJ-App
npm install
```

### 2. Configure environment variables

```bash
cp .env.local.example .env.local
```

Fill in your values:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
RESEND_API_KEY=re_your_key_here
FROM_EMAIL=noreply@yourdomain.com
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

### 3. Set up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run the migrations in order:
   ```
   supabase/migrations/001_initial_schema.sql
   supabase/migrations/002_multi_trainer_schema.sql
   ```
3. Enable Realtime for notes and replies:
   ```sql
   ALTER PUBLICATION supabase_realtime ADD TABLE notes, note_replies, notifications;
   ```
4. In **Authentication → Settings**, configure your site URL and redirect URLs

### 4. Create the first trainer account

In Supabase SQL Editor, after creating an account via the app:
```sql
UPDATE profiles SET role = 'trainer_owner' WHERE email = 'your-email@example.com';
```

### 5. Run locally

```bash
npm run dev
```

### 6. Deploy to Vercel

```bash
vercel deploy
```

Add all environment variables in Vercel project settings.

---

## Session Reminder Edge Function

Deploy the session reminder Edge Function:

```bash
# Install Supabase CLI
npm install -g supabase

# Deploy
supabase functions deploy session-reminders --project-ref your-project-ref
```

Set Edge Function secrets:
```bash
supabase secrets set RESEND_API_KEY=re_... NEXT_PUBLIC_APP_URL=https://...
```

Schedule with pg_cron (in Supabase SQL Editor):
```sql
-- Requires pg_cron extension (available on Pro plan)
-- For free tier, use an external cron service to call the function every hour
SELECT cron.schedule(
  'session-reminders',
  '0 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://your-project.supabase.co/functions/v1/session-reminders',
    headers := '{"Authorization": "Bearer your-anon-key"}'::jsonb
  )
  $$
);
```

> **Free tier alternative**: Use [cron-job.org](https://cron-job.org) to call the Edge Function URL hourly.

---

## Database Schema

### Core Tables

| Table | Description |
|-------|-------------|
| `profiles` | All users (trainers + clients) with roles |
| `workouts` | YouTube-based workout library |
| `programs` | Weekly training programs (optionally template) |
| `program_workouts` | Workouts assigned to program days |
| `client_programs` | Programs assigned to clients |
| `sessions` | Scheduled training sessions |
| `notes` | Trainer → client notes |
| `note_replies` | Threaded replies on notes |
| `notifications` | In-app notifications |
| `client_invites` | Token-based invite links |
| `workout_completions` | Client workout completion log |

### RLS Policy Summary

- **Clients** can only read/write their own data
- **Associate trainers** manage only their assigned clients' data
- **Trainer owners** have full access to all data

---

## Folder Structure

```
src/
├── app/
│   ├── (auth)/          # Login, invite signup
│   ├── (trainer)/       # Trainer portal pages
│   │   ├── dashboard/
│   │   ├── clients/
│   │   ├── workouts/
│   │   ├── programs/
│   │   ├── sessions/
│   │   ├── notes/
│   │   └── settings/
│   ├── (client-portal)/ # Client dashboard
│   │   └── my-dashboard/
│   └── (admin)/         # Legacy admin routes (auto-redirected)
├── actions/             # Server Actions
├── components/
│   ├── layouts/         # Sidebar, nav
│   ├── shared/          # Reusable components (YouTubeEmbed, etc.)
│   └── ui/              # shadcn/ui components
├── lib/
│   └── supabase/        # Client, server, middleware helpers
└── types/
    └── database.ts      # Full Supabase type definitions
supabase/
├── migrations/          # SQL migrations
└── functions/
    └── session-reminders/ # Email reminder Edge Function
```

---

## Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Supabase anon key (public) |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | Supabase service role key (server only) |
| `RESEND_API_KEY` | Optional | Resend API key for email reminders |
| `FROM_EMAIL` | Optional | Sender email for reminders |
| `NEXT_PUBLIC_APP_URL` | Optional | Full app URL for email links |
