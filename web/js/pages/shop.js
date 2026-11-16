import { reveal, tilt } from '../layout.js';
import { api, esc } from '../api.js';
import { renderKitGrid, photo } from '../cards.js';
import { shopHero } from '../three/scenes.js';

document.getElementById('hero-media').innerHTML = photo('stadium-roof', 'Stadium under floodlights viewed from the upper tier', { eager: true });

const params = new URLSearchParams(location.search);
const state = { league: params.get('league') || '', type: params.get('type') || '', q: params.get('q') || '', sort: params.get('sort') || 'popular' };
const $ = (id) => document.getElementById(id);
$('q').value = state.q; $('type').value = state.type; $('sort').value = state.sort;

const leagues = await api.leagues().catch(() => []);
const chips = $('chips');
chips.innerHTML = [{ league: '', kits: leagues.reduce((n, l) => n + l.kits, 0) }, ...leagues]
  .map((l) => `<button class="chip" data-league="${esc(l.league)}" aria-pressed="${l.league === state.league}">${esc(l.league || 'All leagues')} <span class="muted">${l.kits}</span></button>`).join('');
chips.addEventListener('click', (e) => {
  const b = e.target.closest('.chip'); if (!b) return;
  state.league = b.dataset.league;
  chips.querySelectorAll('.chip').forEach((c) => c.setAttribute('aria-pressed', c === b));
  load();
});

let timer;
$('q').addEventListener('input', (e) => { clearTimeout(timer); timer = setTimeout(() => { state.q = e.target.value.trim(); load(); }, 250); });
$('type').addEventListener('change', (e) => { state.type = e.target.value; load(); });
$('sort').addEventListener('change', (e) => { state.sort = e.target.value; load(); });

const grid = $('grid');
tilt(grid);
let heroStarted = false, seq = 0;

async function load() {
  const my = ++seq;
  const url = new URL(location.href);
  for (const [k, v] of Object.entries(state)) v && !(k === 'sort' && v === 'popular') ? url.searchParams.set(k, v) : url.searchParams.delete(k);
  history.replaceState(null, '', url);
  $('count').textContent = 'Loading kits…';
  let kits;
  try { kits = await api.kits(state); } catch (e) { $('count').textContent = 'Could not load kits. Please refresh.'; return; }
  if (my !== seq) return;
  $('count').textContent = `${kits.length} kit${kits.length === 1 ? '' : 's'}${state.league ? ' in ' + state.league : ''}`;
  if (!kits.length) grid.innerHTML = '<div class="empty" style="grid-column:1/-1"><p>No kits match those filters.</p></div>';
  else renderKitGrid(grid, kits);
  reveal('.kit-card', grid);
  if (!heroStarted) {
    heroStarted = true;
    const feat = kits.filter((k) => k.featured);
    shopHero(document.getElementById('hero-canvas'), (feat.length >= 5 ? feat : kits).slice(0, 5));
  }
}
load();
