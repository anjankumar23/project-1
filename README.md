# Campus Toto — KGP Ride Booking

A full-stack campus e-rickshaw (Toto) booking prototype designed around IIT Kharagpur-style campus landmarks. The frontend is a static HTML/CSS/JavaScript app and the backend is an Express API with SQLite persistence.

> Prototype only — this is not an official IIT Kharagpur transport system.

## Full-stack features

- Responsive student-friendly booking UI
- Pickup + drop landmark selection
- Passenger count and fare estimation
- Scheduled or immediate ride requests
- Backend-generated driver, vehicle and ETA
- Persistent SQLite booking database
- Per-browser booking history via an anonymous client ID
- Server-side cancellation endpoint
- Routes API and health-check endpoint
- CORS enabled for GitHub Pages / separate frontend hosting
- Render deployment configuration included

## Project structure

```text
.
├── index.html
├── styles.css
├── app.js
├── server.js
├── package.json
├── render.yaml
└── .gitignore
```

## Run the backend locally

Requirements: Node.js 20+.

```bash
npm install
npm start
```

The API starts on `http://localhost:5000`.

Health check:

```text
http://localhost:5000/api/health
```

## Run the frontend locally

Serve the repository folder with any static server. For example:

```bash
python -m http.server 8080
```

Then open `http://localhost:8080`.

The frontend defaults to `http://localhost:5000` for the API. You can change the API URL from the browser console:

```js
setCampusTotoApi('https://your-api.onrender.com')
```

The selected API URL is stored in browser `localStorage`.

## Deploy the backend on Render

The repository includes `render.yaml` with a Node web service and a 1 GB persistent disk for SQLite.

1. Push this repository to GitHub (already done).
2. In Render, create a new Blueprint and select this repository.
3. Render will read `render.yaml` and create `campus-toto-api`.
4. After deployment, open the generated URL and verify `/api/health` returns JSON with `ok: true`.
5. Open the GitHub Pages frontend and run `setCampusTotoApi('YOUR_RENDER_URL')` once in the browser console.

## API endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/health` | Service health check |
| GET | `/api/routes` | Popular route data |
| POST | `/api/bookings` | Create a booking |
| GET | `/api/bookings` | List this browser's bookings |
| GET | `/api/bookings/:id` | Fetch one booking |
| PATCH | `/api/bookings/:id/cancel` | Cancel an active booking |

Bookings use the `X-Client-Id` request header. The frontend generates a random browser ID and keeps it in local storage, so one rider does not see another rider's history in this prototype.

## Production roadmap

For a real campus transport product, add institute authentication, verified driver accounts, real GPS/dispatch, driver availability, rate rules from campus authorities, push notifications, payments, audit logs, an admin dashboard and stronger authentication/authorization.
