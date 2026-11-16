// Creates the database (if missing), applies schema.sql and seeds clubs + kits.
import fs from 'node:fs';
import pg from 'pg';
import 'dotenv/config';
import { CLUBS, PRICE, FEATURED } from './seed-data.js';

const url = new URL(process.env.DATABASE_URL || 'postgres://localhost:5432/elite_kicks');
const dbName = url.pathname.slice(1);

// 1. ensure database exists
const adminUrl = new URL(url); adminUrl.pathname = '/postgres';
const admin = new pg.Client({ connectionString: adminUrl.toString() });
await admin.connect();
const { rowCount } = await admin.query('SELECT 1 FROM pg_database WHERE datname = $1', [dbName]);
if (!rowCount) { await admin.query(`CREATE DATABASE "${dbName.replace(/"/g, '')}"`); console.log('created database', dbName); }
await admin.end();

// 2. schema + seed
const db = new pg.Client({ connectionString: url.toString() });
await db.connect();
await db.query(fs.readFileSync(new URL('./schema.sql', import.meta.url), 'utf8'));

let kits = 0;
await db.query('BEGIN');
for (const [slug, name, league, country, pattern, colors, away, isNational] of CLUBS) {
  const { rows: [club] } = await db.query(
    'INSERT INTO clubs (slug, name, league, country, is_national) VALUES ($1,$2,$3,$4,$5) RETURNING id',
    [slug, name, league, country, !!isNational]);
  const price = PRICE[league];
  const insert = (type, pat, [p, s, a], featured, priceAdj = 0) => db.query(
    `INSERT INTO kits (club_id, type, pattern, primary_color, secondary_color, accent_color, price_ngn, stock, featured)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
    [club.id, type, pat, p, s, a, price + priceAdj, 10 + ((club.id * 7) % 31), featured]);
  await insert('home', pattern, colors, FEATURED.has(slug)); kits++;
  if (away) { await insert('away', away[0], away[1], false, -3000); kits++; }
}
await db.query('COMMIT');
console.log(`seeded ${CLUBS.length} clubs, ${kits} kits`);
await db.end();
