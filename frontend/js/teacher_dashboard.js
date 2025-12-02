// Teacher dashboard logic: load students and submit point-change requests

// Ensure auth
const token = localStorage.getItem('rc_token');
if (!token) {
  window.location = 'index.html';
}

document.getElementById('logoutLink')?.addEventListener('click', () => {
  localStorage.clear();
});

document.getElementById('navToggle')?.addEventListener('click', () => {
  document.querySelector('.riskcoins-navbar')?.classList.toggle('open');
});

const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };
let allStudents = [];

async function loadStudents() {
  try {
    const res = await fetch(`${API_BASE}/api/teachers/students`, { headers: { Authorization: headers.Authorization } });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to load students');
    allStudents = data.students || [];
    renderStudents(allStudents);
  } catch (err) {
    console.error(err);
    alert(err.message);
    if (/401|403/.test(String(err))) window.location = 'index.html';
  }
}

async function loadMyRequests() {
  try {
    const res = await fetch(`${API_BASE}/api/teachers/my-requests`, { headers: { Authorization: headers.Authorization } });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to load requests');
    renderRequests(data.requests || []);
  } catch (err) {
    console.error(err);
    alert(err.message);
  }
}

function renderStudents(list) {
  const body = document.getElementById('studentsBody');
  body.innerHTML = '';
  document.getElementById('countPill').textContent = `${list.length} students`;

  list.forEach(s => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td style="font-weight:700">${escapeHtml(s.name || '-') }</td>
      <td>${escapeHtml(s.email || '-') }</td>
      <td>${escapeHtml(s.house?.name || '—') }</td>
      <td>
        <div class="table-actions">
          <input type="number" class="input" style="width:110px" id="pts_${s.id}" placeholder="Points" value="1" />
          <input type="text" class="input" style="flex:1" id="rsn_${s.id}" placeholder="Reason" />
          <button class="btn" data-id="${s.id}">Submit</button>
        </div>
      </td>
    `;
    const btn = tr.querySelector('button');
    btn.addEventListener('click', () => submitRequest(s.id));
    body.appendChild(tr);
  });
}

async function submitRequest(studentId) {
  const pointsEl = document.getElementById(`pts_${studentId}`);
  const reasonEl = document.getElementById(`rsn_${studentId}`);
  const deltaPoints = parseInt(pointsEl.value, 10);
  const reason = (reasonEl.value || '').trim();

  if (!Number.isFinite(deltaPoints) || deltaPoints === 0) {
    alert('Enter a non-zero points value (positive to add, negative to deduct).');
    return;
  }
  if (!reason) {
    alert('Please provide a brief reason.');
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/api/teachers/point-change`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ studentId, deltaPoints, reason })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to submit request');

    // Simple success feedback and clear inputs
    alert('Request submitted for admin approval.');
    reasonEl.value = '';
    // Reload requests to show the new one
    loadMyRequests();
  } catch (err) {
    console.error(err);
    alert(err.message);
  }
}

function renderRequests(list) {
  const body = document.getElementById('requestsBody');
  body.innerHTML = '';

  if (list.length === 0) {
    body.innerHTML = '<tr><td colspan="6" style="text-align:center;color:var(--muted)">No requests yet</td></tr>';
    return;
  }

  list.forEach(r => {
    const statusClass = r.status === 'PENDING' ? 'status-pending' : r.status === 'APPROVED' ? 'status-approved' : 'status-rejected';
    const reviewerName = r.reviewer?.name || '—';
    const pointsColor = r.deltaPoints >= 0 ? 'var(--success)' : 'var(--danger)';

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${new Date(r.createdAt).toLocaleString()}</td>
      <td style="font-weight:600">${escapeHtml(r.student?.name || '-')}</td>
      <td style="font-weight:700;color:${pointsColor}">${r.deltaPoints > 0 ? '+' : ''}${r.deltaPoints}</td>
      <td>${escapeHtml(r.reason)}</td>
      <td><span class="status-badge ${statusClass}">${r.status}</span></td>
      <td>${escapeHtml(reviewerName)}</td>
    `;
    body.appendChild(tr);
  });
}

// Simple search filter
const searchEl = document.getElementById('search');
searchEl?.addEventListener('input', () => {
  const q = (searchEl.value || '').toLowerCase();
  const filtered = allStudents.filter(s =>
    (s.name || '').toLowerCase().includes(q) ||
    (s.email || '').toLowerCase().includes(q) ||
    (s.house?.name || '').toLowerCase().includes(q)
  );
  renderStudents(filtered);
});

// Helper to avoid XSS in table injection
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Initial load
loadStudents();
loadMyRequests();
