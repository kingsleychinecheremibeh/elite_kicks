async function request(url, opts = {}) {
  const res = await fetch(url, { headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) }, ...opts });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw Object.assign(new Error(body.error || `Request failed (${res.status})`), { status: res.status, fields: body.fields });
  return body;
}
export const api = {
  leagues: () => request('/api/leagues'),
  kits: (params = {}) => request('/api/kits?' + new URLSearchParams(Object.entries(params).filter(([, v]) => v))),
  kit: (id) => request(`/api/kits/${encodeURIComponent(id)}`),
  book: (data) => request('/api/bookings', { method: 'POST', body: JSON.stringify(data) }),
  adminBookings: (token) => request('/api/admin/bookings', { headers: { Authorization: `Bearer ${token}` } }),
  adminStatus: (token, id, status) => request(`/api/admin/bookings/${id}`, { method: 'PATCH', headers: { Authorization: `Bearer ${token}` }, body: JSON.stringify({ status }) }),
};

const fmt = new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 });
export const naira = (n) => fmt.format(n);
export const kitTitle = (k) => `${k.club_name} ${k.type === 'home' ? 'Home' : k.type === 'away' ? 'Away' : k.type === 'third' ? 'Third' : 'GK'}`;
export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const CUSTOMISATION_FEE = 3000;
export const DELIVERY_FEE = 2500;
