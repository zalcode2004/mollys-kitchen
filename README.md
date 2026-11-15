# Molly's Kitchen — Migsun Twiinz, ETA 2

## Run locally (offline Viva-Safe mode, no keys needed)
```
cd frontend
npm install
npm run dev        # http://localhost:5173
```
Resident: sign in with any valid 10-digit number; the demo OTP is shown on screen (Auto-fill).
Kitchen: switch to "Kitchen" and use "Instant demo login" (phone 9729099722, PIN molly123).

## Going live (shared data across devices): see DEPLOY.md

## Going live later (details)
1. Supabase: run `database/supabase_schema_and_seed.sql` in the SQL editor.
2. `backend/`: copy `.env.example` to `.env`, fill keys, then `npm install && npm start` (port 5000).
3. `frontend/`: copy `.env.example` to `.env`, fill `VITE_API_URL`, Supabase URL/anon key and `VITE_RAZORPAY_KEY_ID`, restart `npm run dev`.
Blank keys always fall back to offline mode.

## Notes
- Dinner orders ignore the 6 PM – cutoff window while "Demo mode" is on (Kitchen > Tonight's dinner). Turn it off for real use.
- Real SMS OTP is not integrated; the OTP is displayed on screen (viva-safe).
- Enable Realtime for the `orders` table in Supabase to get live sync, and add RLS policies allowing the anon key to read `orders`.
