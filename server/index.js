import express from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import crypto from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';
import { pool } from './db.js';

const app = express();
const PORT = Number(process.env.PORT) || 3001;
const ADMIN_TOKEN = process.env.ADMIN_TOKEN;
const root = path.dirname(fileURLToPath(import.meta.url));

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      imgSrc: ["'self'", 'data:', 'blob:'],
      scriptSrc: ["'self'"],
    },
  },
}));
app.use(express.json({ limit: '50kb' }));

const KIT_SELECT = `
  SELECT k.id, k.season, k.type, k.pattern, k.primary_color, k.secondary_color, k.accent_color,
         k.price_ngn, k.stock, k.featured, k.image_url,
         c.slug AS club_slug, c.name AS club_name, c.league, c.country, c.is_national
  FROM kits k JOIN clubs c ON c.id = k.club_id`;

const wrap = (fn) => (req, res, next) => fn(req, res).catch(next);

app.get('/api/leagues', wrap(async (_req, res) => {
  const { rows } = await pool.query(
    `SELECT c.league, count(k.*)::int AS kits FROM clubs c JOIN kits k ON k.club_id = c.id
     GROUP BY c.league ORDER BY kits DESC`);
  res.json(rows);
}));

app.get('/api/kits', wrap(async (req, res) => {
  const q = z.object({
    league: z.string().max(40).optional(),
    type: z.enum(['home', 'away', 'third', 'gk']).optional(),
    q: z.string().max(60).optional(),
    featured: z.enum(['1']).optional(),
    sort: z.enum(['popular', 'price-asc', 'price-desc', 'name']).default('popular'),
  }).parse(req.query);

  const where = [], params = [];
  if (q.league) { params.push(q.league); where.push(`c.league = $${params.length}`); }
  if (q.type) { params.push(q.type); where.push(`k.type = $${params.length}`); }
  if (q.q) { params.push(`%${q.q}%`); where.push(`(c.name ILIKE $${params.length} OR c.country ILIKE $${params.length})`); }
  if (q.featured) where.push('k.featured');
  const order = {
    popular: 'k.featured DESC, c.id, k.type DESC',
    'price-asc': 'k.price_ngn, c.name',
    'price-desc': 'k.price_ngn DESC, c.name',
    name: 'c.name, k.type DESC',
  }[q.sort];
  const { rows } = await pool.query(
    `${KIT_SELECT} ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY ${order}`, params);
  res.json(rows);
}));

app.get('/api/kits/:id', wrap(async (req, res) => {
  const id = z.coerce.number().int().positive().parse(req.params.id);
  const { rows } = await pool.query(`${KIT_SELECT} WHERE k.id = $1`, [id]);
  if (!rows[0]) return res.status(404).json({ error: 'Kit not found' });
  res.json(rows[0]);
}));

// ---- Bookings ----
const bookingSchema = z.object({
  full_name: z.string().trim().min(2, 'Enter your full name').max(80),
  email: z.string().trim().email('Enter a valid email').max(120),
  phone: z.string().trim().regex(/^\+?[0-9\s-]{7,20}$/, 'Enter a valid phone number'),
  delivery_method: z.enum(['pickup', 'delivery']),
  address: z.string().trim().max(240).optional().default(''),
  preferred_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  preferred_time_slot: z.enum(['09:00–12:00', '12:00–15:00', '15:00–18:00']),
  notes: z.string().trim().max(500).optional().default(''),
  items: z.array(z.object({
    kit_id: z.number().int().positive(),
    size: z.enum(['XS', 'S', 'M', 'L', 'XL', 'XXL']),
    quantity: z.number().int().min(1).max(10),
    custom_name: z.string().trim().max(12).regex(/^[A-Za-z .'-]*$/).optional().default(''),
    custom_number: z.number().int().min(0).max(99).nullable().optional(),
  })).min(1, 'Your cart is empty').max(20),
}).superRefine((b, ctx) => {
  if (b.delivery_method === 'delivery' && b.address.length < 8)
    ctx.addIssue({ code: 'custom', path: ['address'], message: 'Delivery address is required' });
  const today = new Date().toISOString().slice(0, 10);
  if (b.preferred_date < today)
    ctx.addIssue({ code: 'custom', path: ['preferred_date'], message: 'Choose a date from today onwards' });
});

const CUSTOMISATION_FEE = 3000;
const DELIVERY_FEE = 2500;

app.post('/api/bookings', rateLimit({ windowMs: 10 * 60_000, limit: 20 }), wrap(async (req, res) => {
  const b = bookingSchema.parse(req.body);
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const ids = b.items.map((i) => i.kit_id);
    const { rows: kits } = await client.query(
      'SELECT id, price_ngn, stock FROM kits WHERE id = ANY($1) FOR UPDATE', [ids]);
    const byId = new Map(kits.map((k) => [k.id, k]));

    let total = b.delivery_method === 'delivery' ? DELIVERY_FEE : 0;
    for (const item of b.items) {
      const kit = byId.get(item.kit_id);
      if (!kit) throw httpError(400, `Kit ${item.kit_id} no longer exists`);
      if (kit.stock < item.quantity) throw httpError(409, 'One of your kits just sold out — please adjust the quantity');
      kit.stock -= item.quantity;
      item.unit_price_ngn = kit.price_ngn + (item.custom_name || item.custom_number != null ? CUSTOMISATION_FEE : 0);
      total += item.unit_price_ngn * item.quantity;
    }

    const reference = 'EK-' + crypto.randomBytes(3).toString('hex').toUpperCase();
    const { rows: [booking] } = await client.query(
      `INSERT INTO bookings (reference, full_name, email, phone, delivery_method, address,
         preferred_date, preferred_time_slot, notes, total_ngn)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING id, reference, total_ngn, created_at`,
      [reference, b.full_name, b.email, b.phone, b.delivery_method, b.address || null,
        b.preferred_date, b.preferred_time_slot, b.notes || null, total]);

    for (const item of b.items) {
      await client.query(
        `INSERT INTO booking_items (booking_id, kit_id, size, quantity, unit_price_ngn, custom_name, custom_number)
         VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [booking.id, item.kit_id, item.size, item.quantity, item.unit_price_ngn,
          item.custom_name || null, item.custom_number ?? null]);
      await client.query('UPDATE kits SET stock = stock - $2 WHERE id = $1', [item.kit_id, item.quantity]);
    }
    await client.query('COMMIT');
    res.status(201).json(booking);
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}));

// ---- Admin ----
function requireAdmin(req, res, next) {
  const token = (req.get('authorization') || '').replace(/^Bearer /, '');
  const ok = ADMIN_TOKEN && token.length === ADMIN_TOKEN.length &&
    crypto.timingSafeEqual(Buffer.from(token), Buffer.from(ADMIN_TOKEN));
  if (!ok) return res.status(401).json({ error: 'Unauthorised' });
  next();
}

app.get('/api/admin/bookings', rateLimit({ windowMs: 60_000, limit: 60 }), requireAdmin, wrap(async (_req, res) => {
  const { rows } = await pool.query(`
    SELECT b.*, COALESCE(json_agg(json_build_object(
      'club', c.name, 'type', k.type, 'size', i.size, 'quantity', i.quantity,
      'unit_price_ngn', i.unit_price_ngn, 'custom_name', i.custom_name, 'custom_number', i.custom_number)
      ORDER BY i.id), '[]') AS items
    FROM bookings b
    JOIN booking_items i ON i.booking_id = b.id
    JOIN kits k ON k.id = i.kit_id JOIN clubs c ON c.id = k.club_id
    GROUP BY b.id ORDER BY b.created_at DESC LIMIT 200`);
  res.json(rows);
}));

app.patch('/api/admin/bookings/:id', requireAdmin, wrap(async (req, res) => {
  const id = z.coerce.number().int().positive().parse(req.params.id);
  const { status } = z.object({ status: z.enum(['pending', 'confirmed', 'completed', 'cancelled']) }).parse(req.body);
  const { rows } = await pool.query('UPDATE bookings SET status = $2 WHERE id = $1 RETURNING id, status', [id, status]);
  if (!rows[0]) return res.status(404).json({ error: 'Booking not found' });
  res.json(rows[0]);
}));

// ---- Static (production build) ----
if (process.env.NODE_ENV === 'production') {
  const dist = path.join(root, '..', 'dist');
  app.use(express.static(dist, { maxAge: '7d', extensions: ['html'] }));
}

app.use('/api', (_req, res) => res.status(404).json({ error: 'Not found' }));

function httpError(status, message) { return Object.assign(new Error(message), { status }); }

app.use((err, _req, res, _next) => {
  if (err instanceof z.ZodError) {
    return res.status(400).json({
      error: 'Please check the highlighted fields',
      fields: Object.fromEntries(err.issues.map((i) => [i.path.join('.'), i.message])),
    });
  }
  if (err.status) return res.status(err.status).json({ error: err.message });
  console.error(err);
  res.status(500).json({ error: 'Something went wrong — please try again' });
});

app.listen(PORT, () => console.log(`Elite Kicks API on http://localhost:${PORT}`));
