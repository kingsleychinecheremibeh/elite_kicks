import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { reveal, tilt, toast, openCart, gsap } from '../layout.js';
import { api, naira, esc, kitTitle, CUSTOMISATION_FEE } from '../api.js';
import { cart } from '../cart.js';
import { renderKitGrid } from '../cards.js';
import { createJersey } from '../three/jersey.js';
import { createStage, studioLights, reducedMotion } from '../three/scenes.js';

const id = new URLSearchParams(location.search).get('id');
const info = document.getElementById('info');
let kit;
try { kit = await api.kit(id); } catch {
  info.innerHTML = '<h1 style="font-size:2.4rem">Kit not found</h1><p class="muted">It may have been removed.</p><a class="btn btn-primary" href="/shop.html">Back to shop</a>';
  throw new Error('kit not found');
}
document.title = `${kitTitle(kit)} ${kit.season} — Elite Kicks`;
document.getElementById('viewer').style.setProperty('--kit', kit.primary_color);

const stockLine = kit.stock > 12 ? `<span class="stock-ok">● In stock</span>` : kit.stock > 0 ? `<span class="stock-low">● Only ${kit.stock} left</span>` : '<span class="muted">Sold out</span>';
info.innerHTML = `
  <nav class="crumbs"><a href="/shop.html">Shop</a> / <a href="/shop.html?league=${encodeURIComponent(kit.league)}">${esc(kit.league)}</a> / ${esc(kit.club_name)}</nav>
  <div class="tag-row"><span class="tag">${esc(kit.season)}</span><span class="tag">${kit.type === 'home' ? 'Home' : 'Away'} kit</span><span class="tag">${esc(kit.country)}</span></div>
  <h1 style="font-size:clamp(2.2rem,5vw,3.6rem)">${esc(kitTitle(kit))}</h1>
  <p class="price" style="font-size:1.8rem;margin:8px 0 6px">${naira(kit.price_ngn)}</p>
  <p class="muted" style="font-size:.9rem">${stockLine} · Supporter edition · Breathable mesh</p>
  <form class="stack" id="form" style="margin-top:28px">
    <fieldset style="border:0;padding:0;margin:0">
      <legend class="field" style="margin-bottom:10px"><label>Size</label></legend>
      <div class="size-grid">${['XS', 'S', 'M', 'L', 'XL', 'XXL'].map((s) => `<label><input type="radio" name="size" value="${s}" ${s === 'M' ? 'checked' : ''}><span>${s}</span></label>`).join('')}</div>
    </fieldset>
    <div class="panel stack" style="gap:14px">
      <div><strong>Add name and number</strong> <span class="muted">+${naira(CUSTOMISATION_FEE)}</span></div>
      <div class="row">
        <div class="field"><label for="cname">Name (max 12)</label><input class="input" id="cname" maxlength="12" pattern="[A-Za-z .'\\-]*" placeholder="e.g. OSIMHEN" autocomplete="off"></div>
        <div class="field"><label for="cnum">Number</label><input class="input" id="cnum" type="number" min="0" max="99" placeholder="9"></div>
      </div>
    </div>
    <div style="display:flex;gap:14px;align-items:center;flex-wrap:wrap">
      <div class="qty"><button type="button" id="dec" aria-label="Decrease quantity">−</button><output id="qty">1</output><button type="button" id="inc" aria-label="Increase quantity">+</button></div>
      <button class="btn btn-primary" style="flex:1" ${kit.stock ? '' : 'disabled'}>Add to cart · <span id="line-total">${naira(kit.price_ngn)}</span></button>
    </div>
  </form>
  <div class="features" style="margin-top:28px">
    <div class="feature"><div><h3>Delivery &amp; pickup</h3><p>48h in Lagos, 3–5 days nationwide. Free pickup at our Lekki store.</p></div></div>
    <div class="feature"><div><h3>Easy exchanges</h3><p>Wrong size? Swap it within 7 days. This doesn't apply to printed shirts.</p></div></div>
  </div>`;

// ---- 3D viewer ----
const viewer = document.getElementById('viewer');
const stage = createStage(viewer, { fov: 32, camZ: 7.2 });
let jersey;
if (stage) {
  studioLights(stage.scene);
  jersey = createJersey(kit);
  stage.scene.add(jersey.group);
  const controls = new OrbitControls(stage.camera, stage.el);
  controls.enableDamping = true; controls.enablePan = false;
  controls.minDistance = 4.5; controls.maxDistance = 10;
  controls.autoRotate = !reducedMotion; controls.autoRotateSpeed = 1.4;
  controls.addEventListener('start', () => { controls.autoRotate = false; });
  controls.addEventListener('change', () => { if (reducedMotion) stage.renderer.render(stage.scene, stage.camera); });
  stage.onUpdate((t) => { jersey.group.position.y = Math.sin(t * 1.2) * 0.06; controls.update(); });
  stage.start();
  if (!reducedMotion) gsap.from(jersey.group.rotation, { y: -Math.PI * 1.5, duration: 1.6, ease: 'power3.out' });

  const face = (back) => {
    controls.autoRotate = false;
    const target = back ? Math.PI : 0;
    const r = stage.camera.position.length();
    gsap.to(stage.camera.position, { x: Math.sin(target) * r, z: Math.cos(target) * r, y: 0, duration: reducedMotion ? 0 : 0.9, ease: 'power2.inOut',
      onUpdate: () => { stage.camera.lookAt(0, 0, 0); if (reducedMotion) stage.renderer.render(stage.scene, stage.camera); } });
    document.getElementById('show-front').setAttribute('aria-pressed', !back);
    document.getElementById('show-back').setAttribute('aria-pressed', back);
  };
  document.getElementById('show-front').onclick = () => face(false);
  document.getElementById('show-back').onclick = () => face(true);
} else {
  viewer.innerHTML = '<p class="muted" style="padding:40px;text-align:center">3D preview needs WebGL, which this browser doesn\'t support.</p>';
}

// ---- Form ----
let qty = 1;
const $ = (s) => document.getElementById(s);
const nameEl = $('cname'), numEl = $('cnum');
function custom() {
  const name = nameEl.value.trim().replace(/[^A-Za-z .'-]/g, '');
  const n = numEl.value === '' ? null : Math.max(0, Math.min(99, parseInt(numEl.value, 10)));
  return { name, number: Number.isNaN(n) ? null : n };
}
function update() {
  const c = custom();
  const unit = kit.price_ngn + (c.name || c.number != null ? CUSTOMISATION_FEE : 0);
  $('line-total').textContent = naira(unit * qty);
  $('qty').textContent = qty;
  if (jersey) {
    jersey.setBackPrint(c.name, c.number ?? '');
    if (reducedMotion) stage.renderer.render(stage.scene, stage.camera);
  }
}
let shownBack = false;
[nameEl, numEl].forEach((el) => el.addEventListener('input', () => {
  update();
  if (!shownBack && stage) { shownBack = true; $('show-back').click(); }
}));
$('dec').onclick = () => { qty = Math.max(1, qty - 1); update(); };
$('inc').onclick = () => { qty = Math.min(10, qty + 1, kit.stock); update(); };
$('form').addEventListener('submit', (e) => {
  e.preventDefault();
  const c = custom();
  const size = new FormData(e.target).get('size');
  cart.add({ kit, size, quantity: qty, custom_name: c.name, custom_number: c.number });
  toast(`${kitTitle(kit)} (${size}) added to cart`);
  openCart();
});

// ---- Related ----
const related = (await api.kits({ league: kit.league }).catch(() => [])).filter((k) => k.id !== kit.id).slice(0, 4);
document.getElementById('more-title').textContent = `More from ${kit.league}`;
const grid = document.getElementById('related');
renderKitGrid(grid, related);
tilt(grid); reveal('.kit-card', grid);
