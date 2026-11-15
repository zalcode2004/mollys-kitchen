# Deploy: one link for residents AND kitchen (about 15 minutes, all free tiers)

## 1. Supabase (shared database)
1. supabase.com > New project (any name, set a DB password, pick Mumbai region).
2. SQL Editor > New query: paste `database/supabase_schema_and_seed.sql` > Run.
3. New query again: paste `database/02_sync_setup.sql` > Run.
4. Settings > API: copy **Project URL** and the **anon public** key.

## 2. Test locally with the shared database
```
cd frontend
copy .env.example .env      (Mac/Linux: cp .env.example .env)
```
Edit `.env`, leave VITE_API_URL empty, and fill:
```
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```
`npm run dev`, then open the app in two browser windows: place an order in one, watch it appear
in Kitchen in the other.

## 3. Vercel (public website)
1. Put the `frontend` folder on GitHub (new repo; `.env` is git-ignored, so keys never get uploaded).
2. vercel.com > Add New > Project > import the repo. Framework: Vite (auto-detected).
3. Environment Variables: add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
4. Deploy. Share the `.vercel.app` link: residents use "Resident", Molly uses "Kitchen".

## 4. Optional: backend on Render (real Razorpay verification + automatic WhatsApp)
1. render.com > New > Web Service > repo/`backend` folder. Build: `npm install`. Start: `npm start`.
2. Environment: everything in `backend/.env.example` (Supabase service-role key, Razorpay test keys, ADMIN_PIN).
3. On Vercel add `VITE_API_URL` (your Render URL) and `VITE_RAZORPAY_KEY_ID`, then redeploy.
Skip this for the demo: the simulated checkout and the wa.me buttons already work.

## Before real customers
- Turn off "Demo mode" in Kitchen > Tonight's dinner.
- Replace the demo access rules with Supabase Auth / backend-only writes (anyone with the anon key can edit orders now).
