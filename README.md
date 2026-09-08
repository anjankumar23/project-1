# Campus Toto — KGP Ride Booking

A polished frontend prototype for booking campus e-rickshaw (Toto) rides at a large engineering campus, illustrated with IIT Kharagpur landmarks.

## Features

- Responsive mobile/desktop booking experience
- Pickup + drop landmark selection
- Passenger stepper
- Instant prototype fare estimate
- “Find a Toto” confirmation state with simulated driver + ETA
- Popular route shortcuts
- Local-browser booking history using `localStorage`
- Clean, no-framework HTML/CSS/JavaScript stack

## Run locally

Open `index.html` in a browser. No build step is required.

## GitHub Pages

This repository is structured as a static site, so GitHub Pages can serve it directly from the `main` branch. In the repository, open **Settings → Pages**, select **Deploy from a branch**, choose `main` and `/ (root)`, then save. GitHub will provide the public Pages URL after the deployment finishes.

## Production roadmap

This is intentionally a frontend-only prototype. A production campus service could add:

- Student authentication and institute email verification
- Driver onboarding and availability
- Live GPS + driver location
- Push/SMS notifications
- Online payments and receipts
- Admin dashboard for dispatch, fares and issue management
- Real campus route data and operating hours

> Note: This repository is a prototype concept and is not an official IIT Kharagpur transport system.
