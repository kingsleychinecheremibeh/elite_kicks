// Converts scripts/raw/*.jpg into responsive AVIF + WebP sets in web/public/img.
// Photos: Unsplash licence (free commercial use) — credits in README.md.
import sharp from 'sharp';
import fs from 'node:fs';

const MAP = {
  '1431324155629-1a6deb1dec8d': 'night-match',
  '1489944440615-453fc2b6a9a9': 'stadium-roof',
  '1522778119026-d647f0596c20': 'stadium-stands',
  '1556056504-5c7696c4c28d': 'pitch-top',
  '1574629810360-7efbbe195018': 'strike',
  '1577223625816-7546f13df25d': 'tunnel',
  '1579952363873-27f3bade9f55': 'ball-close',
};
const WIDTHS = [640, 1280, 1920, 3840];
const out = 'web/public/img';
fs.mkdirSync(out, { recursive: true });

for (const [id, name] of Object.entries(MAP)) {
  const src = `scripts/raw/${id}.jpg`;
  if (!fs.existsSync(src)) { console.warn('missing', src); continue; }
  for (const w of WIDTHS) {
    const img = sharp(src).resize({ width: w, withoutEnlargement: true });
    await img.clone().avif({ quality: 55, effort: 4 }).toFile(`${out}/${name}-${w}.avif`);
    await img.clone().webp({ quality: 78 }).toFile(`${out}/${name}-${w}.webp`);
  }
  console.log('✓', name);
}
