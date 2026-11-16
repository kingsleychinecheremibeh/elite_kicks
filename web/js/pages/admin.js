import { toast } from '../layout.js';
import { api, naira, esc } from '../api.js';

const $ = (id) => document.getElementById(id);
let token = sessionStorage.getItem('ek-admin') || '';
$('token').value = token;
const STATUSES = ['pending', 'confirmed', 'completed', 'cancelled'];

async function load() {
  $('msg').textContent = 'Loading…';
  try {
    const rows = await api.adminBookings(token);
    sessionStorage.setItem('ek-admin', token);
    $('msg').textContent = `${rows.length} booking${rows.length === 1 ? '' : 's'}`;
    $('wrap').hidden = false;
    $('rows').innerHTML = rows.map((b) => `<tr>
      <td><strong>${esc(b.reference)}</strong><br><small class="muted">${new Date(b.created_at).toLocaleString('en-NG')}</small></td>
      <td>${esc(b.full_name)}<br><small class="muted">${esc(b.phone)} · ${esc(b.email)}</small>${b.address ? `<br><small class="muted">${esc(b.address)}</small>` : ''}</td>
      <td>${b.items.map((i) => `${i.quantity}× ${esc(i.club)} ${esc(i.type)} (${esc(i.size)})${i.custom_name || i.custom_number != null ? ` · ${esc(i.custom_name || '')} ${i.custom_number ?? ''}` : ''}`).join('<br>')}${b.notes ? `<br><small class="muted">“${esc(b.notes)}”</small>` : ''}</td>
      <td>${esc(String(b.preferred_date).slice(0, 10))}<br><small class="muted">${esc(b.preferred_time_slot)} · ${esc(b.delivery_method)}</small></td>
      <td>${naira(b.total_ngn)}</td>
      <td><select class="input" data-id="${b.id}" aria-label="Status for ${esc(b.reference)}">${STATUSES.map((s) => `<option ${s === b.status ? 'selected' : ''}>${s}</option>`).join('')}</select></td>
    </tr>`).join('');
  } catch (e) {
    $('wrap').hidden = true;
    $('msg').textContent = e.status === 401 ? 'Wrong token.' : e.message;
  }
}
$('login').addEventListener('submit', (e) => { e.preventDefault(); token = $('token').value.trim(); load(); });
$('rows').addEventListener('change', async (e) => {
  const sel = e.target.closest('select[data-id]'); if (!sel) return;
  try { await api.adminStatus(token, sel.dataset.id, sel.value); toast(`Status set to ${sel.value}`); }
  catch (err) { toast(err.message); }
});
if (token) load();
