import * as THREE from 'three';
import { createJersey, webglAvailable } from './jersey.js';

export const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * Minimal stage: renderer + camera + resize + pause when off-screen.
 * update(t, dt) is called each frame while visible.
 */
export function createStage(canvasOrContainer, { fov = 35, camZ = 8, alpha = true, shadows = false } = {}) {
  if (!webglAvailable()) return null;
  const isCanvas = canvasOrContainer instanceof HTMLCanvasElement;
  const renderer = new THREE.WebGLRenderer({
    canvas: isCanvas ? canvasOrContainer : undefined, antialias: true, alpha, powerPreference: 'high-performance',
  });
  if (!isCanvas) canvasOrContainer.appendChild(renderer.domElement);
  const el = renderer.domElement;
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.shadowMap.enabled = shadows;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(fov, 1, 0.1, 100);
  camera.position.set(0, 0, camZ);

  const updates = [];
  const clock = new THREE.Clock();
  let visible = true, running = false, stopped = false;

  function resize() {
    const host = isCanvas ? el : canvasOrContainer;
    const w = host.clientWidth || 1, h = host.clientHeight || 1;
    renderer.setSize(w, h, false);
    camera.aspect = w / h; camera.updateProjectionMatrix();
    stage.onResize?.(w, h);
    if (!running) renderer.render(scene, camera);
  }
  function frame() {
    if (stopped || !visible || reducedMotion) { running = false; return; }
    running = true;
    const dt = Math.min(clock.getDelta(), 0.05), t = clock.elapsedTime;
    for (const u of updates) u(t, dt);
    renderer.render(scene, camera);
    requestAnimationFrame(frame);
  }
  const io = new IntersectionObserver(([e]) => {
    visible = e.isIntersecting;
    if (visible && !running) { clock.getDelta(); frame(); }
  });
  io.observe(isCanvas ? el : canvasOrContainer);
  new ResizeObserver(resize).observe(isCanvas ? el : canvasOrContainer);

  const stage = {
    renderer, scene, camera, el,
    onUpdate(fn) { updates.push(fn); },
    renderOnce() { for (const u of updates) u(0, 0); renderer.render(scene, camera); },
    start() { resize(); if (reducedMotion) stage.renderOnce(); else frame(); },
    stop() { stopped = true; io.disconnect(); },
  };
  return stage;
}

export function studioLights(scene, { warm = 0xe8b04b } = {}) {
  scene.add(new THREE.HemisphereLight(0xdfe9ff, 0x0b1220, 1.1));
  const key = new THREE.DirectionalLight(0xffffff, 2.6);
  key.position.set(4, 6, 6); key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  scene.add(key);
  const rim = new THREE.DirectionalLight(warm, 1.6); rim.position.set(-5, 2, -4); scene.add(rim);
  const fill = new THREE.PointLight(0x1f9d55, 8, 20); fill.position.set(-4, -2, 4); scene.add(fill);
  return { key, rim, fill };
}

/** A football: 12 dark pentagon patches on a white icosphere. */
export function createBall(radius = 1) {
  const geo = new THREE.IcosahedronGeometry(radius, 4).toNonIndexed();
  const ico = new THREE.IcosahedronGeometry(1, 0);
  const p = ico.attributes.position; const centers = [];
  const seen = new Set();
  for (let i = 0; i < p.count; i++) {
    const v = new THREE.Vector3().fromBufferAttribute(p, i).normalize();
    const k = v.toArray().map((n) => n.toFixed(3)).join();
    if (!seen.has(k)) { seen.add(k); centers.push(v); }
  }
  const pos = geo.attributes.position; const colors = [];
  const white = new THREE.Color('#f4f4f2'), dark = new THREE.Color('#14181f'), seam = new THREE.Color('#c9ccd2');
  const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3();
  for (let i = 0; i < pos.count; i += 3) {
    a.fromBufferAttribute(pos, i); b.fromBufferAttribute(pos, i + 1); c.fromBufferAttribute(pos, i + 2);
    const m = a.clone().add(b).add(c).normalize();
    let best = 0; for (const cc of centers) best = Math.max(best, m.dot(cc));
    const col = best > 0.94 ? dark : best > 0.925 ? seam : white;
    for (let k = 0; k < 3; k++) colors.push(col.r, col.g, col.b);
  }
  geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  // smooth sphere normals (non-indexed geometry would otherwise look faceted)
  const nrm = new Float32Array(pos.count * 3);
  for (let i = 0; i < pos.count; i++) {
    a.fromBufferAttribute(pos, i).normalize();
    nrm[i * 3] = a.x; nrm[i * 3 + 1] = a.y; nrm[i * 3 + 2] = a.z;
  }
  geo.setAttribute('normal', new THREE.BufferAttribute(nrm, 3));
  const mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.38, metalness: 0.05, flatShading: false }));
  mesh.castShadow = true;
  return mesh;
}

/** Floating dust/light particles (stadium haze). */
export function createDust(count = 400, spread = 14, color = 0xffffff) {
  const g = new THREE.BufferGeometry();
  const arr = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    arr[i * 3] = (Math.random() - 0.5) * spread;
    arr[i * 3 + 1] = (Math.random() - 0.5) * spread * 0.6;
    arr[i * 3 + 2] = (Math.random() - 0.5) * spread * 0.5;
  }
  g.setAttribute('position', new THREE.BufferAttribute(arr, 3));
  const m = new THREE.PointsMaterial({ color, size: 0.035, transparent: true, opacity: 0.55, depthWrite: false, blending: THREE.AdditiveBlending });
  const pts = new THREE.Points(g, m);
  return {
    points: pts,
    update(t) {
      const a = g.attributes.position.array;
      for (let i = 0; i < count; i++) {
        a[i * 3 + 1] += 0.002 + Math.sin(t + i) * 0.0008;
        if (a[i * 3 + 1] > spread * 0.3) a[i * 3 + 1] = -spread * 0.3;
      }
      g.attributes.position.needsUpdate = true;
    },
  };
}

// ---------- Page scenes ----------

/** Home hero: ball in a floodlit haze with three kits orbiting behind. */
export function homeHero(canvas, kits) {
  const stage = createStage(canvas, { fov: 32, camZ: 11, shadows: true });
  if (!stage) return null;
  const { scene, camera } = stage;
  studioLights(scene);
  const spot = new THREE.SpotLight(0xffffff, 120, 30, 0.45, 0.6, 1.4);
  spot.position.set(2, 9, 4); scene.add(spot); scene.add(spot.target);

  const rig = new THREE.Group(); scene.add(rig);

  const ball = createBall(0.95);
  rig.add(ball);

  // Soft contact shadow under ball
  const shadow = new THREE.Mesh(new THREE.CircleGeometry(1.1, 48),
    new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.35, depthWrite: false }));
  shadow.rotation.x = -Math.PI / 2; shadow.position.y = -1.55; rig.add(shadow);

  const orbit = new THREE.Group(); rig.add(orbit);
  const jerseys = kits.slice(0, 3).map((k, i) => {
    const j = createJersey(k);
    const a = (i / 3) * Math.PI * 2;
    j.group.position.set(Math.cos(a) * 2.3, 0.2 + Math.sin(i * 2) * 0.3, Math.sin(a) * 2.3);
    j.group.scale.setScalar(0.62);
    orbit.add(j.group);
    return j;
  });

  const dust = createDust(500, 16);
  scene.add(dust.points);

  const mouse = { x: 0, y: 0 };
  addEventListener('pointermove', (e) => { mouse.x = e.clientX / innerWidth - 0.5; mouse.y = e.clientY / innerHeight - 0.5; }, { passive: true });

  stage.onResize = (w) => {
    // keep the 3D composition to the right on wide screens, centred & smaller on phones
    const wide = w > 900;
    rig.position.set(wide ? 3.4 : 0.6, wide ? 0 : -3.2, wide ? 0 : -2);
    rig.scale.setScalar(wide ? 0.95 : 0.5);
  };

  let scroll = 0;
  addEventListener('scroll', () => { scroll = Math.min(scrollY / innerHeight, 1); }, { passive: true });

  stage.onUpdate((t) => {
    ball.rotation.y = t * 0.6; ball.rotation.x = t * 0.25;
    ball.position.y = Math.sin(t * 1.6) * 0.18;
    shadow.scale.setScalar(1 - Math.sin(t * 1.6) * 0.08);
    orbit.rotation.y = t * 0.22;
    jerseys.forEach((j, i) => { j.group.rotation.y = -orbit.rotation.y + Math.sin(t + i) * 0.3; j.group.position.y = 0.2 + Math.sin(t * 0.9 + i * 2) * 0.25; });
    spot.position.x = 2 + Math.sin(t * 0.4) * 3;
    dust.update(t);
    camera.position.x += (mouse.x * 1.2 - camera.position.x) * 0.04;
    camera.position.y += (-mouse.y * 0.8 + scroll * 1.5 - camera.position.y) * 0.04;
    camera.lookAt(rig.position.x * 0.4, scroll * 0.8, 0);
    rig.rotation.z = scroll * 0.2;
  });
  stage.start();
  return stage;
}

/** Shop hero: an arc of slowly rotating featured shirts. */
export function shopHero(canvas, kits) {
  const stage = createStage(canvas, { fov: 30, camZ: 13 });
  if (!stage) return null;
  const { scene, camera } = stage;
  studioLights(scene);
  scene.fog = new THREE.Fog(0x0b1220, 10, 22);
  const arc = new THREE.Group(); scene.add(arc);
  const n = Math.min(kits.length, 5);
  const items = kits.slice(0, n).map((k, i) => {
    const j = createJersey(k);
    const a = ((i - (n - 1) / 2) / n) * Math.PI * 0.9;
    j.group.position.set(Math.sin(a) * 6, -0.3, -Math.cos(a) * 6 + 6);
    j.group.userData.base = a;
    arc.add(j.group);
    return j;
  });
  scene.add(createDust(250, 18).points);
  stage.onResize = (w) => {
    const wide = w > 900;
    arc.scale.setScalar(wide ? 0.58 : 0.42);
    arc.position.set(wide ? 3.4 : 0, wide ? -0.2 : -2.1, wide ? -1 : -2);
  };
  stage.onUpdate((t) => {
    items.forEach((j, i) => {
      j.group.rotation.y = Math.sin(t * 0.5 + i) * 0.6 - j.group.userData.base;
      j.group.position.y = -0.3 + Math.sin(t * 0.8 + i * 0.9) * 0.2;
    });
    arc.rotation.y = Math.sin(t * 0.15) * 0.15;
    camera.lookAt(0, 0, 0);
  });
  stage.start();
  return stage;
}

/** Spinning ball for small spots (booking page loader / accent). */
export function miniBall(container) {
  const stage = createStage(container, { fov: 30, camZ: 4.2 });
  if (!stage) return null;
  studioLights(stage.scene);
  const ball = createBall(1);
  stage.scene.add(ball);
  stage.onUpdate((t) => { ball.rotation.y = t * 1.2; ball.rotation.x = t * 0.5; ball.position.y = Math.abs(Math.sin(t * 2.4)) * 0.25 - 0.1; });
  stage.start();
  return { stage, ball };
}

/** Celebration burst: confetti in given colours, auto-removes. */
export function celebrate(colors = ['#1f9d55', '#e8b04b', '#ffffff']) {
  if (reducedMotion || !webglAvailable()) return;
  const canvas = document.createElement('canvas'); canvas.className = 'burst-canvas';
  document.body.appendChild(canvas);
  const stage = createStage(canvas, { fov: 50, camZ: 10 });
  const N = 260;
  const geo = new THREE.PlaneGeometry(0.16, 0.08);
  const mats = colors.map((c) => new THREE.MeshBasicMaterial({ color: c, side: THREE.DoubleSide }));
  const parts = [];
  for (let i = 0; i < N; i++) {
    const m = new THREE.Mesh(geo, mats[i % mats.length]);
    const a = Math.random() * Math.PI * 2, s = 6 + Math.random() * 8;
    m.userData.v = new THREE.Vector3(Math.cos(a) * s * 0.6, Math.random() * s + 4, (Math.random() - 0.5) * 4);
    m.userData.r = new THREE.Vector3(Math.random() * 8, Math.random() * 8, 0);
    m.position.set(0, -2, 0);
    stage.scene.add(m); parts.push(m);
  }
  let life = 0;
  stage.onUpdate((_t, dt) => {
    life += dt;
    for (const p of parts) {
      p.userData.v.y -= 14 * dt; p.userData.v.multiplyScalar(0.985);
      p.position.addScaledVector(p.userData.v, dt);
      p.rotation.x += p.userData.r.x * dt; p.rotation.y += p.userData.r.y * dt;
    }
    if (life > 3.2) { stage.stop(); geo.dispose(); mats.forEach((m) => m.dispose()); stage.renderer.dispose(); canvas.remove(); }
  });
  stage.start();
}
