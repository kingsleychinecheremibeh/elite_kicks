// Shared chrome: header, footer, cart drawer, toast, theme, scroll reveals.
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { cart } from './cart.js';
import { naira, esc, kitTitle, CUSTOMISATION_FEE } from './api.js';
import { kitThumbnail } from './three/jersey.js';
import { reducedMotion } from './three/scenes.js';

gsap.registerPlugin(ScrollTrigger);
document.documentElement.classList.remove('no-js');
if (reducedMotion) document.documentElement.classList.add('reduced');

const ICON = {
  ball: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="12" cy="12" r="9.5"/><path d="M12 7.5l4.3 3.1-1.6 5H9.3l-1.6-5z"/><path d="M12 7.5V2.6M16.3 10.6l4.6-1.5M14.7 15.6l2.8 4M9.3 15.6l-2.8 4M7.7 10.6L3.1 9.1"/></svg>',
  bag: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 7h12l-1 13H7z"/><path d="M9 7a3 3 0 0 1 6 0"/></svg>',
  menu: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg>',
  close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>',
  sun: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>',
  moon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/></svg>',
};
export { ICON };

const page = document.body.dataset.page;
const link = (href, label, key) => `<li><a href="${href}" ${page === key ? 'aria-current="page"' : ''}>${label}</a></li>`;

document.body.insertAdjacentHTML('afterbegin', `
<a class="visually-hidden" href="#main">Skip to content</a>
<header class="site-header">
  <nav class="nav container" aria-label="Main">
    <a href="/" class="logo"><span class="logo-mark">${ICON.ball}</span><span>Elite <em>Kicks</em></span></a>
    <ul class="nav-links" id="nav-links">
      ${link('/', 'Home', 'home')}${link('/shop.html', 'Shop kits', 'shop')}${link('/booking.html', 'Book an order', 'booking')}
    </ul>
    <div class="nav-actions">
      <button class="icon-btn" id="theme-btn" aria-label="Toggle light/dark theme"></button>
      <button class="icon-btn" id="cart-btn" aria-label="Open cart">${ICON.bag}<span class="cart-count" id="cart-count">0</span></button>
      <button class="icon-btn menu-toggle" id="menu-btn" aria-label="Open menu" aria-expanded="false" aria-controls="nav-links">${ICON.menu}</button>
    </div>
  </nav>
</header>`);

document.body.insertAdjacentHTML('beforeend', `
<footer class="site-footer">
  <div class="container">
    <div class="footer-grid">
      <div>
        <a href="/" class="logo"><span class="logo-mark">${ICON.ball}</span><span>Elite <em>Kicks</em></span></a>
        <p style="margin-top:14px;max-width:360px">Supporter-edition football kits from 60+ clubs and national teams, printed to order in Lagos and delivered nationwide.</p>
      </div>
      <div><h4>Shop</h4><ul>
        <li><a href="/shop.html?league=Premier%20League">Premier League</a></li>
        <li><a href="/shop.html?league=NPFL">NPFL</a></li>
        <li><a href="/shop.html?league=International">National teams</a></li>
      </ul></div>
      <div><h4>Help</h4><ul>
        <li><a href="/booking.html">Book an order</a></li>
        <li><a href="mailto:hello@elitekicks.ng">hello@elitekicks.ng</a></li>
        <li>Mon–Sat · 9am–6pm</li>
      </ul></div>
    </div>
    <div class="footer-bottom">
      <span>© ${new Date().getFullYear()} Elite Kicks. All rights reserved.</span>
      <span>Kits shown are Elite Kicks 3D renders in club colours. Photography via Unsplash.</span>
    </div>
  </div>
</footer>
<aside class="drawer" id="drawer" aria-label="Shopping cart" aria-hidden="true">
  <header><h2>Your cart</h2><button class="icon-btn" id="drawer-close" aria-label="Close cart">${ICON.close}</button></header>
  <div class="drawer-body" id="drawer-body"></div>
  <footer>
    <div class="totals"><div class="grand"><span>Subtotal</span><span id="drawer-total">₦0</span></div></div>
    <a href="/booking.html" class="btn btn-primary btn-block" style="margin-top:16px">Continue to booking</a>
  </footer>
</aside>
<div class="drawer-backdrop" id="drawer-backdrop"></div>
<div class="toast" id="toast" role="status" aria-live="polite"></div>`);

// ---- Header behaviour ----
const header = document.querySelector('.site-header');
const onScroll = () => header.classList.toggle('scrolled', scrollY > 20);
addEventListener('scroll', onScroll, { passive: true }); onScroll();

const menuBtn = document.getElementById('menu-btn'), navLinks = document.getElementById('nav-links');
menuBtn.addEventListener('click', () => {
  const open = navLinks.classList.toggle('open');
  menuBtn.setAttribute('aria-expanded', open);
  menuBtn.innerHTML = open ? ICON.close : ICON.menu;
});

// ---- Theme ----
const themeBtn = document.getElementById('theme-btn');
function applyTheme(t) {
  document.documentElement.dataset.theme = t;
  themeBtn.innerHTML = t === 'light' ? ICON.moon : ICON.sun;
  try { localStorage.setItem('ek-theme', t); } catch { /* ignore */ }
}
let saved = 'dark'; try { saved = localStorage.getItem('ek-theme') || 'dark'; } catch { /* ignore */ }
applyTheme(saved);
themeBtn.addEventListener('click', () => applyTheme(document.documentElement.dataset.theme === 'light' ? 'dark' : 'light'));

// ---- Toast ----
let toastTimer;
export function toast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg; t.classList.add('show');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('show'), 2600);
}

// ---- Cart drawer ----
const drawer = document.getElementById('drawer'), backdrop = document.getElementById('drawer-backdrop');
export function openCart() { drawer.classList.add('open'); backdrop.classList.add('open'); drawer.setAttribute('aria-hidden', 'false'); document.getElementById('drawer-close').focus(); }
function closeCart() { drawer.classList.remove('open'); backdrop.classList.remove('open'); drawer.setAttribute('aria-hidden', 'true'); }
document.getElementById('cart-btn').addEventListener('click', openCart);
document.getElementById('drawer-close').addEventListener('click', closeCart);
backdrop.addEventListener('click', closeCart);
addEventListener('keydown', (e) => { if (e.key === 'Escape') closeCart(); });

export const unitPrice = (i) => i.kit.price_ngn + (i.custom_name || i.custom_number != null ? CUSTOMISATION_FEE : 0);
export const subtotal = (items) => items.reduce((s, i) => s + unitPrice(i) * i.quantity, 0);

export function lineItemHTML(i) {
  const custom = [i.custom_name, i.custom_number].filter((v) => v !== '' && v != null).join(' · ');
  return `<div class="line-item" data-uid="${esc(i.uid)}">
    <img alt="" data-kit-thumb="${esc(i.kit.id)}">
    <div><h4>${esc(kitTitle(i.kit))}</h4>
      <small>Size ${esc(i.size)} · Qty ${i.quantity}${custom ? ' · ' + esc(custom) : ''}</small>
      <button class="remove" data-remove="${esc(i.uid)}">Remove</button></div>
    <strong class="price">${naira(unitPrice(i) * i.quantity)}</strong>
  </div>`;
}
export function hydrateThumbs(root, items) {
  root.querySelectorAll('[data-kit-thumb]').forEach((img) => {
    const it = items.find((i) => String(i.kit.id) === img.dataset.kitThumb);
    if (it) kitThumbnail(it.kit).then((src) => { img.src = src; });
  });
}

function renderCart(items = cart.items()) {
  const n = items.reduce((s, i) => s + i.quantity, 0);
  const badge = document.getElementById('cart-count');
  badge.textContent = n; badge.classList.toggle('show', n > 0);
  const body = document.getElementById('drawer-body');
  body.innerHTML = items.length ? items.map(lineItemHTML).join('')
    : '<div class="empty"><p>Your cart is empty.</p><a class="btn btn-ghost" href="/shop.html">Browse kits</a></div>';
  hydrateThumbs(body, items);
  document.getElementById('drawer-total').textContent = naira(subtotal(items));
}
document.getElementById('drawer-body').addEventListener('click', (e) => {
  const uid = e.target.closest('[data-remove]')?.dataset.remove;
  if (uid) cart.remove(uid);
});
cart.onChange(renderCart); renderCart();

// ---- Scroll reveals ----
export function reveal(selector = '.reveal', root = document) {
  const els = root.querySelectorAll(selector);
  if (reducedMotion) { els.forEach((el) => { el.style.opacity = 1; el.style.transform = 'none'; }); return; }
  // IntersectionObserver stays correct when lazy content shifts the layout.
  let pending = [], raf = 0;
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) if (e.isIntersecting) { io.unobserve(e.target); pending.push(e.target); }
    if (pending.length && !raf) raf = requestAnimationFrame(() => {
      gsap.to(pending, { opacity: 1, y: 0, duration: 0.9, ease: 'power3.out', stagger: 0.08 });
      pending = []; raf = 0;
    });
  }, { rootMargin: '0px 0px -8% 0px' });
  els.forEach((el) => io.observe(el));
}

// 3D tilt on hover for cards
export function tilt(root = document) {
  if (reducedMotion || matchMedia('(hover: none)').matches) return;
  root.addEventListener('pointermove', (e) => {
    const card = e.target.closest('.kit-card'); if (!card) return;
    const r = card.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
    card.style.transform = `perspective(900px) rotateY(${x * 10}deg) rotateX(${-y * 10}deg) translateY(-4px)`;
  });
  root.addEventListener('pointerout', (e) => {
    const card = e.target.closest('.kit-card');
    if (card && !card.contains(e.relatedTarget)) card.style.transform = '';
  });
}

export { gsap, ScrollTrigger };
