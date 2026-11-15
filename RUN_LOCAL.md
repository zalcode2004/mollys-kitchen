# Run everything locally (frontend + backend + Razorpay test mode)

From the project root (the folder containing this file):

1. `npm run setup`      (installs all packages, creates backend/.env and frontend/.env)
2. Open `backend/.env` and fill:
   - RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET   (Razorpay Dashboard > Test Mode > Settings > API Keys)
   - SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (optional, Supabase > Settings > API; service_role key, never in the frontend)
3. Open `frontend/.env` and fill:
   - VITE_API_URL=http://localhost:5000        (already set)
   - VITE_RAZORPAY_KEY_ID=<same Key ID as above>
   - VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY (optional)
4. `npm run dev`         (backend on :5000, app on http://localhost:5173)

The header badge confirms the mode: "Razorpay test mode · Live sync" or "Demo payments · Offline".
Test payment: card 4111 1111 1111 1111 (any future expiry, any CVV) or UPI success@razorpay.
Restart `npm run dev` after editing any .env file.
