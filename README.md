# Molly's Kitchen — Migsun Twiinz, ETA 2

## Run locally
```
cd frontend
npm install
npm run dev        # http://localhost:5173
```
Resident: sign in with any valid 10-digit number; the demo OTP is shown on screen (Auto-fill).
Kitchen: switch to "Kitchen" and use the shared password(shared to owner).

## Going live (shared data across devices): see DEPLOY.md

## Going live later (details)
1. Supabase: run `database/supabase_schema_and_seed.sql` in the SQL editor.
2. `backend/`: copy `.env.example` to `.env`, fill keys, then `npm install && npm start` (port 5000).
3. `frontend/`: copy `.env.example` to `.env`, fill `VITE_API_URL`, Supabase URL/anon key and `VITE_RAZORPAY_KEY_ID`, restart `npm run dev`.
Blank keys always fall back to offline mode.

## Notes
- Real SMS OTP is not integrated; the OTP is displayed on screen.
- Enable Realtime for the `orders` table in Supabase to get live sync, and add RLS policies allowing the anon key to read `orders`.
