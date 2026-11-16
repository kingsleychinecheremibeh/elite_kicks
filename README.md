# Elite Kicks

Football kit store: 61 clubs and national teams, 82 kits, 3D kit renders, a booking system and an admin view.

**Stack:** Node + Express API · PostgreSQL · Vite · Three.js · GSAP

## Run locally
```bash
npm install
cp .env.example .env          # set DATABASE_URL and a long ADMIN_TOKEN
# Postgres: use your local install, or `docker compose up -d`
#   (then DATABASE_URL=postgres://elite:elite@localhost:5432/elite_kicks)
npm run db:setup              # creates DB, tables, seeds 82 kits (⚠ resets all data)
npm run dev                   # site http://localhost:5173 (API on :3001)
```

## Production
```bash
npm run build && npm start    # serves dist/ + API on $PORT
```
Deploy to any Node host with Postgres (Render, Railway, Fly + Neon). Static hosts can't run the booking API.

## Pages
| Page | What it does |
|---|---|
| `/` | 3D hero (ball and orbiting kits over a 4K photo), featured kits, how booking works |
| `/shop.html` | All kits, with league filters, search and sort; 3D card thumbnails |
| `/kit.html?id=N` | 3D viewer (drag to rotate), size, custom name/number previewed live on the back |
| `/booking.html` | Cart summary plus a validated booking form; saves to Postgres and returns a reference like `EK-1A2B3C` |
| `/admin.html` | Bookings list with status updates (needs `ADMIN_TOKEN`) |

## Editing the catalogue
- Clubs, colours, patterns: `server/seed-data.js`, then run `npm run db:setup`
- Prices per league: `PRICE` in the same file
- To use a real product photo for a kit, set `kits.image_url`; it replaces the 3D thumbnail.

## Images
4K photos are from Unsplash (free licence, credit appreciated). `npm run images` regenerates the AVIF/WebP sets (640/1280/1920/3840w) from `scripts/raw/`.

## Note on club names
Kits are original Elite Kicks renders in club colours, with no crests or sponsor marks. Selling merchandise under real club names usually needs a licence or authorised stock. Check before going live.
