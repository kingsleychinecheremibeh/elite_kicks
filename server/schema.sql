-- Elite Kicks schema (PostgreSQL)
DROP TABLE IF EXISTS booking_items, bookings, kits, clubs CASCADE;

CREATE TABLE clubs (
  id              SERIAL PRIMARY KEY,
  slug            TEXT UNIQUE NOT NULL,
  name            TEXT NOT NULL,
  league          TEXT NOT NULL,
  country         TEXT NOT NULL,
  is_national     BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE kits (
  id              SERIAL PRIMARY KEY,
  club_id         INT NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  season          TEXT NOT NULL DEFAULT '2026/27',
  type            TEXT NOT NULL CHECK (type IN ('home','away','third','gk')),
  pattern         TEXT NOT NULL CHECK (pattern IN ('solid','stripes','hoops','sash','halves','sleeves','gradient')),
  primary_color   TEXT NOT NULL,
  secondary_color TEXT NOT NULL,
  accent_color    TEXT NOT NULL,
  price_ngn       INT  NOT NULL CHECK (price_ngn > 0),
  stock           INT  NOT NULL DEFAULT 25 CHECK (stock >= 0),
  featured        BOOLEAN NOT NULL DEFAULT FALSE,
  image_url       TEXT,               -- optional licensed photo; null = 3D render
  UNIQUE (club_id, season, type)
);

CREATE TABLE bookings (
  id                  SERIAL PRIMARY KEY,
  reference           TEXT UNIQUE NOT NULL,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  full_name           TEXT NOT NULL,
  email               TEXT NOT NULL,
  phone               TEXT NOT NULL,
  delivery_method     TEXT NOT NULL CHECK (delivery_method IN ('pickup','delivery')),
  address             TEXT,
  preferred_date      DATE NOT NULL,
  preferred_time_slot TEXT NOT NULL,
  notes               TEXT,
  status              TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','confirmed','completed','cancelled')),
  total_ngn           INT NOT NULL
);

CREATE TABLE booking_items (
  id              SERIAL PRIMARY KEY,
  booking_id      INT NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  kit_id          INT NOT NULL REFERENCES kits(id),
  size            TEXT NOT NULL CHECK (size IN ('XS','S','M','L','XL','XXL')),
  quantity        INT NOT NULL CHECK (quantity BETWEEN 1 AND 10),
  unit_price_ngn  INT NOT NULL,
  custom_name     TEXT,
  custom_number   INT CHECK (custom_number BETWEEN 0 AND 99)
);

CREATE INDEX kits_club_idx ON kits(club_id);
CREATE INDEX bookings_created_idx ON bookings(created_at DESC);
