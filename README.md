# Doctor Project

This MERN project is split into separate frontend and backend apps for clean deployment.

## Folders

- `frontend/` - React + Vite app
- `backend/` - Node + Express API

## Local Setup

```bash
npm run install:all
```

Create local environment files:

```bash
cp frontend/.env.example frontend/.env
cp backend/.env.example backend/.env
```

Set `MONGODB_URI` in `backend/.env`.

```bash
npm run dev:backend
npm run dev:frontend
```

## Environment Variables

- Frontend: `VITE_API_URL` must point to the backend API base, for example `https://your-api.onrender.com/api`.
- Backend: `MONGODB_URI`, `PORT`, and `CLIENT_ORIGIN` are used by the API. Set `CLIENT_ORIGIN` to your Vercel frontend URL in production.

## Deployment

Deploy `frontend/` to Vercel. Build command: `npm run build`; output directory: `dist`.

Deploy `backend/` to Render or Railway. Start command: `npm start`; health check: `/api/health`.

## What changed in this pass (Aug 2026)

**Real bugs fixed:**
- Services & Gallery admin pages had zero working buttons (Add/Edit/Delete/Publish did nothing). Both now have full working CRUD wired to the existing backend APIs.
- Dashboard was polling the API every **1 second**, causing flicker and jank as data grew. Changed to 20 seconds.
- Marking an appointment "Paid" was silently overwriting its real fee with a hardcoded `1000` every time. Fixed to preserve the actual amount.
- Corrupted fallback icons in the dashboard stat cards (literal `"????"` strings) restored.
- Patients page had a duplicate navbar stacked inside the admin layout, a fake/unwired search box, and entirely fake "Today's Appointments"/"Patient Segments" widgets. Rebuilt with one real search box, real pagination, and widgets driven by live data.
- Settings page: appointment rules and notification toggles looked editable but never saved. Now fully persisted.
- Reviews page: "Request Review" and "Save Response" buttons did nothing. Now copy a shareable link / the reply text to the clipboard.
- Appointment page: notification bell button and a few silent-failure actions now give real feedback via toast notifications.

**Added:**
- Shared toast notification system, modal/confirm-dialog components, and a CSV export utility — used across Appointments, Patients, and Services.
- `POST /api/patients` endpoint for admin-added (walk-in) patient records — didn't exist before.
- Notification-rule fields persisted on the Settings model.
- Code-splitting for admin sections (React.lazy) — they now load on demand instead of all bundling into one file.

**Verified, not just assumed:**
- Full `npm run build` passes cleanly.
- `eslint` passes with zero errors across the frontend.
- All backend files pass `node --check` (syntax-only — this sandbox has no network access to a live MongoDB instance, so full request/response testing against a real database wasn't possible here; test locally with your own `MONGODB_URI` before deploying).

**Not changed:** admin "Change Password" / "Enable 2FA" are honestly labeled as not wired up rather than faked — the current admin login uses hardcoded environment credentials with no user-record backing, so real password rotation would need a small backend change first. Gallery images are added by URL (no file-upload backend existed); wiring real file uploads (e.g. via multer + S3/Cloudinary) is a reasonable next step if you want it.

