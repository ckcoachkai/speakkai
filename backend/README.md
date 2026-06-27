# SpeakKai Booking Backend

The live site is hosted on GitHub Pages, so the public site cannot safely store logins, availability, or bookings by itself. Use this folder as the deployment plan for a small China-friendly backend.

Recommended production shape:

- Host in Hong Kong or Singapore.
- Use email/password or email code login.
- Avoid Google Calendar, Google sign-in, Facebook login, and Google reCAPTCHA.
- Keep the public Astro site on `speakkai.com`.
- Point the booking JavaScript to the backend API when the backend is live.

## Data Model

`users`

- `id`
- `name`
- `email`
- `role`: `client` or `admin`
- `created_at`

`availability_slots`

- `id`
- `starts_at`
- `duration_minutes`
- `mode`: `online` or `in-person`
- `note`
- `status`: `open`, `booked`, or `blocked`
- `created_at`

`bookings`

- `id`
- `slot_id`
- `user_id`
- `name`
- `email`
- `status`: `requested`, `confirmed`, or `cancelled`
- `created_at`

## API Contract

`GET /api/slots`

Returns open availability slots.

`POST /api/bookings`

Creates a booking request for an open slot.

`GET /api/admin/slots`

Returns all slots and booking status. Requires admin auth.

`POST /api/admin/slots`

Creates a new availability slot. Requires admin auth.

`DELETE /api/admin/slots/:id`

Removes a slot. Requires admin auth.

## Next Deployment Step

Deploy a small Node API or PocketBase server, then replace the browser-only storage in `public/scripts/booking-store.js` with API calls. The current site pages are ready for that switch.
