import { reveal, tilt, gsap, ScrollTrigger } from '../layout.js';
import { api, esc } from '../api.js';
import { renderKitGrid, photo } from '../cards.js';
import { homeHero, reducedMotion } from '../three/scenes.js';

document.getElementById('hero-media').innerHTML = photo('night-match', 'Floodlit football match at night', { eager: true });
document.getElementById('about-photo').innerHTML = photo('stadium-stands', 'Packed stadium stands around a green pitch', { sizes: '(max-width: 900px) 100vw, 55vw' });
document.getElementById('band').insertAdjacentHTML('afterbegin', photo('strike', 'Player about to strike a ball on grass', { sizes: '100vw' }));

// Hero entrance
if (!reducedMotion) {
  gsap.from('.hero-content > *', { y: 40, opacity: 0, duration: 1.1, ease: 'power3.out', stagger: 0.12, delay: 0.1 });
  gsap.to('[data-parallax] img', { yPercent: -12, ease: 'none', scrollTrigger: { trigger: '[data-parallax]', scrub: true } });
}

const [featured, leagues] = await Promise.all([api.kits({ featured: '1' }), api.leagues()]).catch(() => [[], []]);

const items = leagues.map((l) => `<a href="/shop.html?league=${encodeURIComponent(l.league)}">${esc(l.league)}</a>`).join('');
document.getElementById('leagues').innerHTML = items + items.replace(/<a /g, '<a aria-hidden="true" tabindex="-1" ');
const total = leagues.reduce((n, l) => n + l.kits, 0);
if (total) document.getElementById('stat-kits').textContent = total;

const grid = document.getElementById('featured');
renderKitGrid(grid, featured.slice(0, 8));
tilt(grid);
reveal();
ScrollTrigger.refresh();

homeHero(document.getElementById('hero-canvas'), featured.length ? featured : []);
