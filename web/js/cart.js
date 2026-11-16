// Cart lives in localStorage; the server re-prices everything at booking time.
const KEY = 'ek-cart-v1';
const listeners = new Set();

function read() {
  try { const v = JSON.parse(localStorage.getItem(KEY)); return Array.isArray(v) ? v : []; } catch { return []; }
}
function write(items) {
  try { localStorage.setItem(KEY, JSON.stringify(items)); } catch { /* private mode */ }
  listeners.forEach((fn) => fn(items));
}

export const cart = {
  items: read,
  count: () => read().reduce((n, i) => n + i.quantity, 0),
  /** item: { kit, size, quantity, custom_name, custom_number } — kit is a snapshot for display */
  add(item) {
    const items = read();
    const key = (i) => [i.kit.id, i.size, i.custom_name || '', i.custom_number ?? ''].join('|');
    const existing = items.find((i) => key(i) === key(item));
    if (existing) existing.quantity = Math.min(10, existing.quantity + item.quantity);
    else items.push({ ...item, uid: crypto.randomUUID?.() || String(Date.now() + Math.random()) });
    write(items);
  },
  update(uid, patch) { write(read().map((i) => (i.uid === uid ? { ...i, ...patch } : i))); },
  remove(uid) { write(read().filter((i) => i.uid !== uid)); },
  clear() { write([]); },
  onChange(fn) { listeners.add(fn); return () => listeners.delete(fn); },
};
addEventListener('storage', (e) => { if (e.key === KEY) listeners.forEach((fn) => fn(read())); });
