const express = require('express');
const cors = require('cors');
const Database = require('better-sqlite3');
const crypto = require('crypto');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;
const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'campus-toto.db');

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS bookings (
    id TEXT PRIMARY KEY,
    pickup TEXT NOT NULL,
    dropoff TEXT NOT NULL,
    schedule TEXT NOT NULL,
    passengers INTEGER NOT NULL,
    fare INTEGER NOT NULL,
    driver TEXT NOT NULL,
    vehicle TEXT NOT NULL,
    eta INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'confirmed',
    created_at TEXT NOT NULL
  );
`);

const routes = [
  { from: 'Main Gate', to: 'Tech Market', time: '4–6 min', fare: 20 },
  { from: 'Main Gate', to: 'Nalanda Complex', time: '7–9 min', fare: 30 },
  { from: 'Tech Market', to: 'RP Hall', time: '5–7 min', fare: 25 },
  { from: 'Railway Station', to: 'Main Gate', time: '8–12 min', fare: 40 },
  { from: 'Nalanda Complex', to: 'Jnan Ghosh Stadium', time: '6–8 min', fare: 25 },
  { from: 'Your Hall', to: 'Tech Market', time: '5–8 min', fare: 20 }
];

const drivers = [
  { name: 'Amit', vehicle: 'KGP Toto 17' },
  { name: 'Rakesh', vehicle: 'KGP Toto 09' },
  { name: 'Sanjay', vehicle: 'KGP Toto 24' },
  { name: 'Bikash', vehicle: 'KGP Toto 31' },
  { name: 'Rahul', vehicle: 'KGP Toto 12' }
];

app.use(cors({ origin: true }));
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'campus-toto-api', timestamp: new Date().toISOString() });
});

app.get('/api/routes', (_req, res) => {
  res.json({ routes });
});

function calculateFare(pickup, dropoff, passengers) {
  const matched = routes.find(r => r.from === pickup && r.to === dropoff);
  const base = matched ? matched.fare : 20 + Math.min(35, Math.abs(pickup.length - dropoff.length) * 2);
  return base + Math.max(0, passengers - 2) * 10;
}

const insertBooking = db.prepare(`
  INSERT INTO bookings (id, pickup, dropoff, schedule, passengers, fare, driver, vehicle, eta, status, created_at)
  VALUES (@id, @pickup, @dropoff, @schedule, @passengers, @fare, @driver, @vehicle, @eta, 'confirmed', @created_at)
`);

app.post('/api/bookings', (req, res) => {
  const { pickup, dropoff, schedule = 'now', passengers = 1 } = req.body || {};
  const count = Number(passengers);

  if (!pickup || !dropoff) return res.status(400).json({ error: 'Pickup and drop-off are required.' });
  if (pickup === dropoff) return res.status(400).json({ error: 'Pickup and drop-off must be different.' });
  if (!Number.isInteger(count) || count < 1 || count > 6) return res.status(400).json({ error: 'Passengers must be between 1 and 6.' });
  if (!['now', '15', '30', '60'].includes(String(schedule))) return res.status(400).json({ error: 'Invalid schedule.' });

  const driver = drivers[Math.floor(Math.random() * drivers.length)];
  const eta = schedule === 'now' ? Math.floor(2 + Math.random() * 4) : Math.max(5, Number(schedule) + Math.floor(Math.random() * 4));
  const booking = {
    id: crypto.randomUUID(),
    pickup,
    dropoff,
    schedule: String(schedule),
    passengers: count,
    fare: calculateFare(pickup, dropoff, count),
    driver: driver.name,
    vehicle: driver.vehicle,
    eta,
    created_at: new Date().toISOString()
  };

  insertBooking.run(booking);
  res.status(201).json({ booking: { ...booking, status: 'confirmed' } });
});

app.get('/api/bookings', (_req, res) => {
  const bookings = db.prepare('SELECT * FROM bookings ORDER BY datetime(created_at) DESC LIMIT 50').all();
  res.json({ bookings });
});

app.get('/api/bookings/:id', (req, res) => {
  const booking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(req.params.id);
  if (!booking) return res.status(404).json({ error: 'Booking not found.' });
  res.json({ booking });
});

app.patch('/api/bookings/:id/cancel', (req, res) => {
  const result = db.prepare("UPDATE bookings SET status = 'cancelled' WHERE id = ? AND status = 'confirmed'").run(req.params.id);
  if (!result.changes) return res.status(404).json({ error: 'Active booking not found.' });
  const booking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(req.params.id);
  res.json({ booking });
});

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error.' });
});

app.listen(PORT, () => {
  console.log(`Campus Toto API running on port ${PORT}`);
});
