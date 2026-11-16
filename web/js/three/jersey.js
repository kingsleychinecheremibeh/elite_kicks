// Procedural 3D football shirt. Pattern + colours come from kit data, so one
// function renders all 80+ kits with no crests or third-party artwork.
import * as THREE from 'three';

const TEX_W = 1024, TEX_H = 1024;
// Shirt silhouette bounds (shape space) — used to map UVs 0..1
const BX = [-1.3, 1.3], BY = [-1.25, 1.15];

function shirtShape() {
  const s = new THREE.Shape();
  s.moveTo(0, 0.98);                                   // neck centre (front dip)
  s.quadraticCurveTo(0.2, 0.99, 0.3, 1.1);             // neckline right
  s.quadraticCurveTo(0.58, 1.08, 0.78, 1.0);           // shoulder
  s.lineTo(1.28, 0.52);                                // sleeve top edge
  s.quadraticCurveTo(1.22, 0.36, 1.06, 0.24);          // cuff
  s.lineTo(0.76, 0.48);                                // under-sleeve to armpit
  s.quadraticCurveTo(0.7, -0.3, 0.76, -1.16);          // side seam (slight taper)
  s.quadraticCurveTo(0, -1.24, -0.76, -1.16);          // hem
  s.quadraticCurveTo(-0.7, -0.3, -0.76, 0.48);
  s.lineTo(-1.06, 0.24);
  s.quadraticCurveTo(-1.22, 0.36, -1.28, 0.52);
  s.lineTo(-0.78, 1.0);
  s.quadraticCurveTo(-0.58, 1.08, -0.3, 1.1);
  s.quadraticCurveTo(-0.2, 0.99, 0, 0.98);
  return s;
}

let _geom;
function shirtGeometry() {
  if (_geom) return _geom;
  const g = new THREE.ExtrudeGeometry(shirtShape(), {
    depth: 0.28, curveSegments: 24, bevelEnabled: true,
    bevelThickness: 0.14, bevelSize: 0.05, bevelSegments: 8,
  });
  g.translate(0, 0, -0.14);
  // Re-map UVs from position so the canvas texture covers the silhouette,
  // and add a gentle "chest" curvature so it reads as fabric on a body.
  const pos = g.attributes.position, uv = g.attributes.uv;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
    uv.setXY(i, (x - BX[0]) / (BX[1] - BX[0]), (y - BY[0]) / (BY[1] - BY[0]));
    const torso = Math.max(0, 1 - (x * x) / 0.7);
    const bulge = 0.16 * torso * Math.cos(y * 1.1);
    pos.setZ(i, z + Math.sign(z || 1) * bulge);
  }
  g.computeVertexNormals();
  _geom = g;
  return g;
}

// ---- Texture painting ----
function paintPattern(ctx, kit) {
  const { pattern, primary_color: p, secondary_color: s, accent_color: a } = kit;
  const W = TEX_W, H = TEX_H;
  ctx.fillStyle = p; ctx.fillRect(0, 0, W, H);

  const u = (x) => ((x - BX[0]) / (BX[1] - BX[0])) * W;   // shape x -> px
  const v = (y) => H - ((y - BY[0]) / (BY[1] - BY[0])) * H; // shape y -> px

  switch (pattern) {
    case 'stripes': {
      const n = 9, w = W / n;
      ctx.fillStyle = s;
      for (let i = 1; i < n; i += 2) ctx.fillRect(i * w, 0, w, H);
      break;
    }
    case 'hoops': {
      const n = 8, h = (v(BY[0]) - v(1.0)) / n;
      ctx.fillStyle = s;
      for (let i = 1; i < n; i += 2) ctx.fillRect(0, v(1.0) + i * h, W, h);
      break;
    }
    case 'sash': {
      ctx.save(); ctx.fillStyle = s;
      ctx.translate(W / 2, H / 2); ctx.rotate(-Math.PI / 4.2);
      ctx.fillRect(-W, -H * 0.075, W * 2, H * 0.15);
      ctx.restore();
      break;
    }
    case 'halves': {
      ctx.fillStyle = s; ctx.fillRect(W / 2, 0, W / 2, H);
      break;
    }
    case 'sleeves': {
      ctx.fillStyle = s;
      ctx.fillRect(0, 0, u(-0.74), H); ctx.fillRect(u(0.74), 0, W - u(0.74), H);
      break;
    }
    case 'gradient': {
      const g = ctx.createLinearGradient(0, v(1.1), W, v(-1.2));
      g.addColorStop(0, p); g.addColorStop(0.55, p); g.addColorStop(1, s);
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      // subtle chevrons
      ctx.globalAlpha = 0.12; ctx.strokeStyle = s; ctx.lineWidth = 18;
      for (let i = -2; i < 8; i++) {
        ctx.beginPath(); ctx.moveTo(0, i * 150); ctx.lineTo(W / 2, i * 150 + 120); ctx.lineTo(W, i * 150); ctx.stroke();
      }
      ctx.globalAlpha = 1;
      break;
    }
    default: break; // solid
  }

  // Trim: collar, cuffs, hem — accent colour
  ctx.strokeStyle = a; ctx.lineCap = 'round';
  // collar ring
  ctx.lineWidth = 26;
  ctx.beginPath(); ctx.moveTo(u(-0.32), v(1.1)); ctx.quadraticCurveTo(u(0), v(0.9), u(0.32), v(1.1)); ctx.stroke();
  // cuffs
  ctx.lineWidth = 22;
  ctx.beginPath(); ctx.moveTo(u(1.27), v(0.5)); ctx.lineTo(u(1.06), v(0.27)); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(u(-1.27), v(0.5)); ctx.lineTo(u(-1.06), v(0.27)); ctx.stroke();
  // side panels (thin piping)
  ctx.lineWidth = 6; ctx.globalAlpha = 0.85;
  ctx.beginPath(); ctx.moveTo(u(0.69), v(0.42)); ctx.quadraticCurveTo(u(0.64), v(-0.3), u(0.69), v(-1.1)); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(u(-0.69), v(0.42)); ctx.quadraticCurveTo(u(-0.64), v(-0.3), u(-0.69), v(-1.1)); ctx.stroke();
  ctx.globalAlpha = 1;

  // Fabric: fine knit + soft body shading
  ctx.globalAlpha = 0.05; ctx.fillStyle = '#000';
  for (let y = 0; y < H; y += 4) ctx.fillRect(0, y, W, 1);
  ctx.globalAlpha = 1;
  const shade = ctx.createRadialGradient(W / 2, H * 0.42, W * 0.1, W / 2, H * 0.5, W * 0.7);
  shade.addColorStop(0, 'rgba(255,255,255,0.08)'); shade.addColorStop(1, 'rgba(0,0,0,0.22)');
  ctx.fillStyle = shade; ctx.fillRect(0, 0, W, H);

  // Small neutral brand mark (our own) on the chest
  ctx.fillStyle = a; ctx.globalAlpha = 0.9;
  ctx.font = `700 ${W * 0.035}px Oswald, Arial Narrow, sans-serif`;
  ctx.textAlign = 'center';
  ctx.fillText('EK', u(0.36), v(0.62));
  ctx.globalAlpha = 1;
}

function makeTexture(draw) {
  const c = document.createElement('canvas'); c.width = TEX_W; c.height = TEX_H;
  draw(c.getContext('2d'));
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  return t;
}

// Back print (name + number) drawn on its own transparent decal
export function backPrintTexture(kit, name = '', number = '') {
  return makeTexture((ctx) => {
    ctx.clearRect(0, 0, TEX_W, TEX_H);
    const ink = kit.pattern === 'stripes' || kit.pattern === 'halves' || kit.pattern === 'hoops'
      ? '#ffffff' : contrast(kit.primary_color, kit.accent_color);
    ctx.fillStyle = ink; ctx.textAlign = 'center';
    ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = 6;
    if (name) {
      ctx.font = `600 ${TEX_W * 0.09}px Oswald, Arial Narrow, sans-serif`;
      ctx.strokeText(name.toUpperCase(), TEX_W / 2, TEX_H * 0.27);
      ctx.fillText(name.toUpperCase(), TEX_W / 2, TEX_H * 0.27);
    }
    if (number !== '' && number != null) {
      ctx.font = `700 ${TEX_W * 0.34}px Oswald, Arial Narrow, sans-serif`;
      ctx.strokeText(String(number), TEX_W / 2, TEX_H * 0.6);
      ctx.fillText(String(number), TEX_W / 2, TEX_H * 0.6);
    }
  });
}

function luminance(hex) {
  const n = parseInt(hex.slice(1), 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) => {
    c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
function contrast(bg, preferred) {
  const lb = luminance(bg), lp = luminance(preferred);
  const ratio = (Math.max(lb, lp) + 0.05) / (Math.min(lb, lp) + 0.05);
  if (ratio >= 3) return preferred;
  return lb > 0.4 ? '#111111' : '#ffffff';
}

/**
 * Build a shirt mesh group for a kit.
 * Returns { group, setBackPrint(name, number), dispose() }
 */
export function createJersey(kit) {
  const geom = shirtGeometry();
  const tex = makeTexture((ctx) => paintPattern(ctx, kit));
  const mat = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.62, metalness: 0.02 });
  const sideMat = new THREE.MeshStandardMaterial({ color: kit.primary_color, roughness: 0.7 });
  const mesh = new THREE.Mesh(geom, [mat, sideMat]);
  mesh.castShadow = true;

  const group = new THREE.Group();
  group.add(mesh);

  // Back decal for name/number, sits just behind the back face
  const decalGeom = new THREE.PlaneGeometry(BX[1] - BX[0], BY[1] - BY[0]);
  decalGeom.translate(0, (BY[0] + BY[1]) / 2, 0);
  const decalMat = new THREE.MeshStandardMaterial({ transparent: true, roughness: 0.5, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4 });
  const decal = new THREE.Mesh(decalGeom, decalMat);
  decal.rotation.y = Math.PI;
  decal.position.z = -0.32;
  decal.visible = false;
  group.add(decal);

  function setBackPrint(name, number) {
    if (decalMat.map) decalMat.map.dispose();
    const has = (name && name.trim()) || (number !== '' && number != null);
    decal.visible = !!has;
    if (has) { decalMat.map = backPrintTexture(kit, name, number); decalMat.needsUpdate = true; }
  }

  return {
    group, setBackPrint,
    dispose() { tex.dispose(); mat.dispose(); sideMat.dispose(); decalMat.map?.dispose(); decalMat.dispose(); },
  };
}

// ---- Shared offscreen renderer for card thumbnails ----
let thumbRenderer, thumbScene, thumbCam;
const thumbCache = new Map();
const queue = [];
let busy = false;

function initThumbs() {
  thumbRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
  thumbRenderer.setSize(480, 560, false);
  thumbRenderer.outputColorSpace = THREE.SRGBColorSpace;
  thumbRenderer.toneMapping = THREE.ACESFilmicToneMapping;
  thumbScene = new THREE.Scene();
  thumbScene.add(new THREE.HemisphereLight(0xffffff, 0x334455, 1.4));
  const key = new THREE.DirectionalLight(0xffffff, 2.4); key.position.set(2.5, 3, 4); thumbScene.add(key);
  const rim = new THREE.DirectionalLight(0xe8b04b, 1.2); rim.position.set(-3, 1, -2); thumbScene.add(rim);
  thumbCam = new THREE.PerspectiveCamera(30, 480 / 560, 0.1, 50);
  thumbCam.position.set(0, 0, 6.2);
}

/** Returns a Promise<dataURL> of a rendered kit (cached by id). */
export function kitThumbnail(kit) {
  if (kit.image_url) return Promise.resolve(kit.image_url);
  if (thumbCache.has(kit.id)) return thumbCache.get(kit.id);
  const p = new Promise((resolve) => { queue.push({ kit, resolve }); pump(); });
  thumbCache.set(kit.id, p);
  return p;
}

function pump() {
  if (busy || !queue.length) return;
  busy = true;
  requestAnimationFrame(() => {
    if (!thumbRenderer) initThumbs();
    // render a few per frame to keep scrolling smooth
    for (let n = 0; n < 4 && queue.length; n++) {
      const { kit, resolve } = queue.shift();
      const j = createJersey(kit);
      j.group.rotation.set(0.08, -0.38, 0);
      j.group.position.y = 0.05;
      thumbScene.add(j.group);
      thumbRenderer.render(thumbScene, thumbCam);
      resolve(thumbRenderer.domElement.toDataURL('image/webp', 0.9));
      thumbScene.remove(j.group); j.dispose();
    }
    busy = false; pump();
  });
}

export function webglAvailable() {
  try {
    const c = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl')));
  } catch { return false; }
}
