import { reveal, lineItemHTML, hydrateThumbs, subtotal, gsap } from '../layout.js';
import { api, naira, esc, DELIVERY_FEE } from '../api.js';
import { cart } from '../cart.js';
import { photo } from '../cards.js';
import { miniBall, celebrate, reducedMotion } from '../three/scenes.js';

document.getElementById('hero-media').innerHTML = photo('tunnel', 'Players\' tunnel leading out to a lit pitch', { eager: true });
miniBall(document.getElementById('ball'));
if (!reducedMotion) gsap.from('.hero-content > *', { y: 30, opacity: 0, duration: 1, ease: 'power3.out', stagger: 0.1 });

const form = document.getElementById('form');
const $ = (id) => document.getElementById(id);
const today = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10);
$('preferred_date').min = today;
$('preferred_date').value = new Date(Date.now() + 86400000 - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10);

const method = () => form.querySelector('[name=delivery_method]:checked').value;

function renderSummary(items = cart.items()) {
  const box = $('items');
  if (!items.length) {
    box.innerHTML = '<div class="empty" style="padding:24px 0"><p>Your cart is empty.</p><a class="btn btn-ghost" href="/shop.html">Choose a kit</a></div>';
  } else {
    box.innerHTML = items.map(lineItemHTML).join('');
    hydrateThumbs(box, items);
  }
  const sub = subtotal(items), ship = items.length && method() === 'delivery' ? DELIVERY_FEE : 0;
  $('sub').textContent = naira(sub); $('ship').textContent = ship ? naira(ship) : 'Free';
  $('total').textContent = naira(sub + ship);
  $('submit').disabled = !items.length;
}
$('items').addEventListener('click', (e) => { const uid = e.target.closest('[data-remove]')?.dataset.remove; if (uid) cart.remove(uid); });
cart.onChange(renderSummary);
form.addEventListener('change', (e) => {
  if (e.target.name === 'delivery_method') {
    $('address-field').hidden = method() === 'pickup';
    renderSummary();
  }
});
renderSummary();

function setError(name, msg) {
  const input = form.elements[name]; if (!input || !input.closest) return;
  const err = input.closest('.field')?.querySelector('.error');
  input.setAttribute('aria-invalid', msg ? 'true' : 'false');
  if (err) err.textContent = msg || '';
}
form.addEventListener('input', (e) => { if (e.target.name && e.target.getAttribute('aria-invalid') === 'true') setError(e.target.name, ''); });

function clientValidate(data) {
  const errs = {};
  if (data.full_name.trim().length < 2) errs.full_name = 'Enter your full name';
  if (!/^\+?[0-9\s-]{7,20}$/.test(data.phone.trim())) errs.phone = 'Enter a valid phone number';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim())) errs.email = 'Enter a valid email';
  if (data.delivery_method === 'delivery' && data.address.trim().length < 8) errs.address = 'Enter your delivery address';
  if (!data.preferred_date || data.preferred_date < today) errs.preferred_date = 'Choose a date from today onwards';
  return errs;
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const alert = $('alert'); alert.classList.remove('show');
  const data = Object.fromEntries(new FormData(form));
  ['full_name', 'phone', 'email', 'address', 'preferred_date'].forEach((n) => setError(n, ''));
  const errs = clientValidate(data);
  if (Object.keys(errs).length) {
    Object.entries(errs).forEach(([k, v]) => setError(k, v));
    form.elements[Object.keys(errs)[0]].focus();
    return;
  }
  const items = cart.items();
  const payload = {
    ...data,
    address: data.delivery_method === 'delivery' ? data.address : '',
    items: items.map((i) => ({ kit_id: i.kit.id, size: i.size, quantity: i.quantity, custom_name: i.custom_name || '', custom_number: i.custom_number ?? null })),
  };
  const btn = $('submit'); btn.disabled = true; btn.textContent = 'Booking…';
  try {
    const res = await api.book(payload);
    const colors = [...new Set(items.flatMap((i) => [i.kit.primary_color, i.kit.secondary_color]))].slice(0, 5);
    cart.clear();
    $('layout').innerHTML = `<div class="panel success" style="grid-column:1/-1">
      <span class="eyebrow">Booking received</span>
      <h2>Thanks, ${esc(data.full_name.split(' ')[0])}. You're booked.</h2>
      <div class="ref">${esc(res.reference)}</div>
      <p class="muted" style="max-width:520px;margin:0 auto 24px">Total ${naira(res.total_ngn)}. We'll call ${esc(data.phone)} within 2 working hours to confirm sizes and payment. Keep your reference handy.</p>
      <a class="btn btn-ghost" href="/shop.html">Keep shopping</a></div>`;
    scrollTo({ top: $('layout').offsetTop - 120, behavior: reducedMotion ? 'auto' : 'smooth' });
    celebrate([...colors, '#e8b04b']);
  } catch (err) {
    if (err.fields) Object.entries(err.fields).forEach(([k, v]) => setError(k.split('.')[0], v));
    alert.textContent = err.message; alert.classList.add('show');
    btn.disabled = false; btn.textContent = 'Confirm booking';
  }
});
reveal();
