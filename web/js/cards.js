import { kitThumbnail } from './three/jersey.js';
import { naira, esc, kitTitle } from './api.js';
import { cart } from './cart.js';
import { toast } from './layout.js';

const PLUS = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>';

export function kitCardHTML(k) {
  const badge = k.featured ? '<span class="kit-badge gold">Best seller</span>'
    : k.stock <= 12 ? '<span class="kit-badge">Low stock</span>' : '';
  return `<article class="kit-card reveal" style="--kit:${esc(k.primary_color)}">
    <a href="/kit.html?id=${k.id}" class="kit-media" aria-label="${esc(kitTitle(k))}">
      ${badge}<div class="skeleton"></div><img alt="${esc(kitTitle(k))} shirt, 3D render" data-thumb="${k.id}" hidden>
    </a>
    <div class="kit-body">
      <a href="/kit.html?id=${k.id}"><h3>${esc(kitTitle(k))}</h3></a>
      <span class="kit-meta">${esc(k.league)} · ${esc(k.season)}</span>
      <div class="swatches" aria-hidden="true"><i style="background:${esc(k.primary_color)}"></i><i style="background:${esc(k.secondary_color)}"></i><i style="background:${esc(k.accent_color)}"></i></div>
      <div class="kit-foot"><span class="price">${naira(k.price_ngn)}</span>
        <button class="add-btn" data-add="${k.id}" aria-label="Add ${esc(kitTitle(k))} (size M) to cart">${PLUS}</button></div>
    </div>
  </article>`;
}

/** Render kits into a grid, lazily painting 3D thumbnails as they scroll into view. */
export function renderKitGrid(grid, kits) {
  grid.innerHTML = kits.map(kitCardHTML).join('');
  const byId = new Map(kits.map((k) => [String(k.id), k]));
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      io.unobserve(e.target);
      const img = e.target, kit = byId.get(img.dataset.thumb);
      kitThumbnail(kit).then((src) => { img.src = src; img.hidden = false; img.previousElementSibling?.remove(); });
    }
  }, { rootMargin: '300px' });
  grid.querySelectorAll('img[data-thumb]').forEach((img) => io.observe(img));

  if (!grid.dataset.bound) {
    grid.dataset.bound = '1';
    grid.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-add]'); if (!btn) return;
      const kit = grid._kits.get(btn.dataset.add);
      cart.add({ kit, size: 'M', quantity: 1, custom_name: '', custom_number: null });
      toast(`${kitTitle(kit)} (M) added to cart`);
    });
  }
  grid._kits = byId;
}

/** <picture> markup for a responsive photo set from scripts/images.js */
export function photo(name, alt, { eager = false, sizes = '100vw' } = {}) {
  const set = (ext) => [640, 1280, 1920, 3840].map((w) => `/img/${name}-${w}.${ext} ${w}w`).join(', ');
  return `<picture><source type="image/avif" srcset="${set('avif')}" sizes="${sizes}">
    <img src="/img/${name}-1920.webp" srcset="${set('webp')}" sizes="${sizes}" alt="${esc(alt)}"
      ${eager ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async"></picture>`;
}
