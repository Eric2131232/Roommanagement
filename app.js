// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
  loadData();
  loadSettingsUI();
  renderDash();
});

function showToast(msg) {
  const old = document.querySelector('.toast');
  if (old) old.remove();
  const t = document.createElement('div');
  t.className = 'toast';
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 2800);
}

function showPage(p, el) {
  document.querySelectorAll('.page').forEach(x => x.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(x => x.classList.remove('active'));
  document.getElementById('page-' + p).classList.add('active');
  if (el) el.classList.add('active');
  const titles = { dashboard: 'Dashboard', rooms: 'Room Map', tenants: 'Tenants', payments: 'Payments', invoices: 'Invoices', reports: 'Reports', settings: 'Settings' };
  document.getElementById('page-title').textContent = titles[p] || p;
  if (p === 'rooms') renderRoomMap();
  if (p === 'tenants') renderTenants();
  if (p === 'payments') renderPayments('all');
  if (p === 'invoices') renderInvoices();
  if (p === 'reports') renderReports();
  if (p === 'dashboard') renderDash();
  if (p === 'settings') loadSettingsUI();
}

function globalSearch(v) {
  const cur = document.querySelector('.nav-item.active');
  if (cur && cur.textContent.includes('Tenant')) {
    document.getElementById('tsearch').value = v;
    renderTenants(v);
  }
}

// ===== DASHBOARD =====
function renderDash() {
  const occ = DB.rooms.filter(r => r.status === 'occupied').length;
  const ov = DB.rooms.filter(r => r.status === 'overdue').length;
  const rev = DB.payments.reduce((a, p) => a + p.amount, 0);
  const coll = DB.payments.filter(p => p.status === 'paid').reduce((a, p) => a + p.amount, 0);
  const ovAmt = DB.payments.filter(p => p.status === 'overdue').reduce((a, p) => a + p.amount, 0);

  document.getElementById('d-occ').textContent = occ;
  document.getElementById('d-occ-p').textContent = Math.round(occ / 168 * 100) + '% occupancy';
  document.getElementById('d-rev').textContent = fmt$(rev);
  document.getElementById('d-coll').textContent = fmt$(coll) + ' collected';
  document.getElementById('d-ov').textContent = ov;
  document.getElementById('d-ov-a').textContent = fmt$(ovAmt) + ' outstanding';

  document.getElementById('d-pay').innerHTML = DB.payments
    .filter(p => p.status === 'paid').slice(0, 6)
    .map(p => `<tr><td>${p.room}</td><td>${p.tenant}</td><td>${fmt$(p.amount)}</td><td>${fmtD(p.paidDate)}</td><td><span class="badge badge-paid">paid</span></td></tr>`)
    .join('') || '<tr><td colspan="5" class="empty-state">No payments yet</td></tr>';

  document.getElementById('d-ov-t').innerHTML = DB.payments
    .filter(p => p.status === 'overdue').slice(0, 6)
    .map(p => `<tr><td>${p.room}</td><td>${p.tenant}</td><td>${fmt$(p.amount)}</td><td><button class="btn btn-primary btn-sm" onclick="markPaid('${p.room}');renderDash()">Mark Paid</button></td></tr>`)
    .join('') || '<tr><td colspan="4" class="empty-state">No overdue payments 🎉</td></tr>';
}

// ===== ROOM MAP =====
function renderRoomMap(filter = 'all') {
  const wrap = document.getElementById('room-map');
  wrap.innerHTML = '';
  WINGS.forEach(w => {
    const wr = DB.rooms.filter(r => r.wing === w.id && (filter === 'all' || r.status === filter));
    if (!wr.length) return;
    const div = document.createElement('div');
    div.className = 'wing-block';
    div.innerHTML = `<div class="wing-label"><span class="wing-tag" style="background:${w.color}">W${w.id}</span>Wing ${w.id} <span style="color:var(--text3);font-size:11px;font-weight:400;margin-left:4px">${wr.length} rooms</span></div><div class="room-row" id="wr-${w.id}"></div>`;
    wrap.appendChild(div);
    const row = div.querySelector('.room-row');
    wr.forEach(rm => {
      const cell = document.createElement('div');
      cell.className = 'room-cell r-' + rm.status;
      cell.title = rm.id + (rm.tenant ? ' — ' + rm.tenant.name : ' (' + rm.status + ')');
      cell.textContent = rm.id;
      cell.onclick = () => rm.tenant ? openProfile(rm.id) : openRoomOptions(rm.id);
      row.appendChild(cell);
    });
  });
}

function filterRooms(f, btn) {
  document.querySelectorAll('#rm-filters .filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderRoomMap(f);
}

// ===== TENANTS =====
let tenantView = 'card';
function setTView(v, btn) {
  tenantView = v;
  document.querySelectorAll('#page-tenants .filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  document.getElementById('tenant-card-view').style.display = v === 'card' ? 'block' : 'none';
  document.getElementById('tenant-list-view').style.display = v === 'list' ? 'block' : 'none';
  renderTenants(document.getElementById('tsearch').value);
}

function renderTenants(q = '') {
  const lq = q.toLowerCase();
  const tr = DB.rooms.filter(r => r.tenant && (!q || (r.id + r.tenant.name + r.wing).toLowerCase().includes(lq)));

  if (tenantView === 'card') {
    if (!tr.length) {
      document.getElementById('tenant-card-view').innerHTML = `<div class="empty-state"><div class="empty-state-icon">👤</div>No tenants found</div>`;
      return;
    }
    document.getElementById('tenant-card-view').innerHTML = `<div class="tenant-grid">${tr.map(r => {
      const p = getPayment(r.id);
      const w = WINGS.find(w => w.id === r.wing);
      const av = r.photo ? `<img src="${r.photo}" alt="">` : `<span>${inits(r.tenant.name)}</span>`;
      return `<div class="tenant-card" onclick="openProfile('${r.id}')">
        <div class="tc-top">
          <div class="avatar-lg" style="background:${r.avatarColor}22;color:${r.avatarColor}">${av}</div>
          <div><div class="tc-name">${r.tenant.name}</div><div class="tc-room">Room ${r.id} · Wing ${r.wing}</div></div>
        </div>
        <div class="tc-row"><span>Phone</span><span>${r.tenant.phone}</span></div>
        <div class="tc-row"><span>Rent</span><span>${fmt$(r.rent)}/mo</span></div>
        <div class="tc-row"><span>Move-in</span><span>${fmtD(r.tenant.moveIn)}</span></div>
        <div class="tc-row"><span>Payment</span><span><span class="badge badge-${p?.status || 'pending'}">${p?.status || 'pending'}</span></span></div>
      </div>`;
    }).join('')}</div>`;
  } else {
    document.getElementById('tenant-list-tbody').innerHTML = tr.map(r => {
      const p = getPayment(r.id);
      const av = r.photo
        ? `<img src="${r.photo}" style="width:28px;height:28px;border-radius:50%;object-fit:cover">`
        : `<div class="avatar" style="background:${r.avatarColor}22;color:${r.avatarColor}">${inits(r.tenant.name)}</div>`;
      return `<tr>
        <td>${r.id}</td><td>${r.wing}</td><td>${av}</td><td>${r.tenant.name}</td>
        <td>${r.tenant.phone}</td><td>${fmtD(r.tenant.moveIn)}</td><td>${fmt$(r.rent)}</td>
        <td><span class="badge badge-${p?.status || 'pending'}">${p?.status || 'pending'}</span></td>
        <td><button class="btn btn-sm" onclick="openProfile('${r.id}')">Profile</button></td>
      </tr>`;
    }).join('') || '<tr><td colspan="9" class="empty-state">No tenants found</td></tr>';
  }
}

// ===== PROFILE =====
function openProfile(roomId) {
  const rm = getRoom(roomId);
  if (!rm || !rm.tenant) return;
  const t = rm.tenant;
  const p = getPayment(roomId);
  const w = WINGS.find(w => w.id === rm.wing);
  const paidTotal = (p?.history || []).reduce((a, x) => a + x.amount, 0);
  const dob = t.dob ? new Date(t.dob) : null;
  const age = dob ? new Date().getFullYear() - dob.getFullYear() : '—';
  const av = rm.photo ? `<img src="${rm.photo}" alt="">` : `<span>${inits(t.name)}</span>`;

  modal(`<div class="modal-overlay" onclick="if(event.target===this)closeModal()">
  <div class="modal modal-wide">
    <div class="modal-header">
      <h3>Tenant Profile</h3>
      <div style="display:flex;gap:6px;align-items:center">
        <button class="btn btn-sm" onclick="openEditTenant('${roomId}')">✏ Edit</button>
        <button class="btn btn-sm btn-danger" onclick="confirmRemoveTenant('${roomId}')">Move Out</button>
        <button class="modal-close" onclick="closeModal()">×</button>
      </div>
    </div>
    <div class="modal-body">
      <div class="profile-header">
        <div class="profile-avatar" style="background:${rm.avatarColor}22;color:${rm.avatarColor}" onclick="triggerPhotoUpload('${roomId}')" title="Click to change photo">${av}</div>
        <div style="flex:1">
          <div class="profile-name">${t.name}</div>
          <div class="profile-room">Room ${rm.id} · Wing ${rm.wing} · ${t.occupation || '—'}</div>
          <div class="profile-badges">
            <span class="badge badge-${rm.status}">${rm.status}</span>
            <span class="badge badge-${p?.status || 'pending'}">${p?.status || 'pending'} payment</span>
            <span class="badge" style="background:var(--bg3);color:var(--text2)">${t.nationality || '—'}</span>
          </div>
        </div>
        <div style="text-align:right">
          <div style="font-size:24px;font-weight:700;color:var(--green)">${fmt$(rm.rent)}</div>
          <div style="font-size:11px;color:var(--text2)">per month</div>
        </div>
      </div>

      <div class="profile-tabs">
        <div class="profile-tab active" onclick="switchTab(this,'tab-info')">👤 Personal Info</div>
        <div class="profile-tab" onclick="switchTab(this,'tab-payment')">💳 Payments</div>
        <div class="profile-tab" onclick="switchTab(this,'tab-docs')">📄 Documents</div>
        <div class="profile-tab" onclick="switchTab(this,'tab-notes')">📝 Notes</div>
      </div>

      <!-- PERSONAL INFO -->
      <div class="profile-section active" id="tab-info">
        <div class="info-grid">
          <div class="info-item"><div class="info-item-label">Full Name</div><div class="info-item-val">${t.name}</div></div>
          <div class="info-item"><div class="info-item-label">Gender</div><div class="info-item-val">${t.gender || '—'}</div></div>
          <div class="info-item"><div class="info-item-label">Date of Birth</div><div class="info-item-val">${fmtD(t.dob)} (age ${age})</div></div>
          <div class="info-item"><div class="info-item-label">Nationality</div><div class="info-item-val">${t.nationality || '—'}</div></div>
          <div class="info-item"><div class="info-item-label">Occupation</div><div class="info-item-val">${t.occupation || '—'}</div></div>
          <div class="info-item"><div class="info-item-label">ID Card / Passport</div><div class="info-item-val">${t.idCard || '—'}</div></div>
          <div class="info-item"><div class="info-item-label">ID Expiry</div><div class="info-item-val">${fmtD(t.idExpiry)}</div></div>
          <div class="info-item"><div class="info-item-label">Phone 1</div><div class="info-item-val">${t.phone}</div></div>
          <div class="info-item"><div class="info-item-label">Phone 2</div><div class="info-item-val">${t.phone2 || '—'}</div></div>
          <div class="info-item"><div class="info-item-label">Email</div><div class="info-item-val">${t.email || '—'}</div></div>
          <div class="info-item"><div class="info-item-label">Move-in Date</div><div class="info-item-val">${fmtD(t.moveIn)}</div></div>
          <div class="info-item"><div class="info-item-label">Security Deposit</div><div class="info-item-val">${fmt$(t.deposit)}</div></div>
        </div>
        <div class="sub-section-title">Emergency Contact</div>
        <div class="info-grid">
          <div class="info-item"><div class="info-item-label">Name</div><div class="info-item-val">${t.emergencyName || '—'}</div></div>
          <div class="info-item"><div class="info-item-label">Relation</div><div class="info-item-val">${t.emergencyRelation || '—'}</div></div>
          <div class="info-item"><div class="info-item-label">Phone</div><div class="info-item-val">${t.emergencyPhone || '—'}</div></div>
        </div>
      </div>

      <!-- PAYMENTS -->
      <div class="profile-section" id="tab-payment">
        <div class="pay-summary-mini">
          <div class="mini-stat"><div class="mini-stat-val cv-green">${(p?.history || []).length}</div><div class="mini-stat-lbl">Months Paid</div></div>
          <div class="mini-stat"><div class="mini-stat-val cv-green">${fmt$(paidTotal)}</div><div class="mini-stat-lbl">Total Paid</div></div>
          <div class="mini-stat"><div class="mini-stat-val cv-blue">${fmt$(rm.rent)}</div><div class="mini-stat-lbl">Current Rent</div></div>
        </div>
        <div class="sub-section-title" style="margin-top:0">This Month</div>
        <div class="pay-history-row">
          <div><div style="font-weight:600">${new Date().toLocaleDateString('en-US',{month:'long',year:'numeric'})}</div><div style="font-size:11px;color:var(--text2)">Due: ${fmtD(p?.dueDate)}</div></div>
          <div style="text-align:right"><div style="font-weight:600">${fmt$(rm.rent)}</div><span class="badge badge-${p?.status || 'pending'}">${p?.status || 'pending'}</span></div>
        </div>
        ${p?.status !== 'paid' ? `
        <div style="margin:10px 0">
          <div class="form-grid2">
            <div class="form-row"><label class="form-label">Payment Method</label>
              <select class="form-select" id="pay-method-${roomId}">
                <option>Cash</option><option>Bank Transfer</option><option>Wing</option><option>ABA</option>
              </select>
            </div>
            <div style="display:flex;align-items:flex-end;padding-bottom:12px">
              <button class="btn btn-success" style="width:100%" onclick="markPaid('${roomId}',document.getElementById('pay-method-${roomId}').value);openProfile('${roomId}')">✅ Mark as Paid</button>
            </div>
          </div>
        </div>` : '<div style="margin:10px 0;padding:10px;background:var(--green-bg);border-radius:var(--radius);font-size:12px;color:var(--green-text)">✅ This month is fully paid · Method: ' + (p?.method || 'Cash') + '</div>'}
        <div class="sub-section-title">Payment History</div>
        ${(p?.history || []).map(h => `<div class="pay-history-row"><div><div style="font-weight:600">${h.month}</div><div style="font-size:11px;color:var(--text2)">Paid: ${fmtD(h.paidDate)} · ${h.method || 'Cash'}</div></div><div style="text-align:right"><div style="font-weight:600">${fmt$(h.amount)}</div><span class="badge badge-paid">paid</span></div></div>`).join('')
          || '<div class="empty-state" style="padding:16px">No payment history yet</div>'}
      </div>

      <!-- DOCUMENTS -->
      <div class="profile-section" id="tab-docs">
        <div style="font-size:12px;color:var(--text2);margin-bottom:12px">Documents for ${t.name}</div>
        <div id="doc-list-${roomId}">
          ${(t.docs || []).map((d, i) => `<div class="doc-item">
            <div style="display:flex;align-items:center;gap:8px"><span>📄</span><span>${d}</span></div>
            <div style="display:flex;gap:6px">
              <button class="btn btn-sm btn-danger" onclick="removeDoc('${roomId}',${i})">Delete</button>
            </div>
          </div>`).join('')}
          ${!t.docs || t.docs.length === 0 ? '<div class="empty-state" style="padding:16px">No documents uploaded yet</div>' : ''}
        </div>
        <div class="form-row" style="margin-top:12px">
          <label class="form-label">Add Document Name</label>
          <div style="display:flex;gap:8px">
            <input class="form-input" id="doc-name-${roomId}" placeholder="e.g. ID Card Copy, Lease Agreement...">
            <button class="btn btn-primary btn-sm" onclick="addDoc('${roomId}')">Add</button>
          </div>
        </div>
        <div class="upload-area" onclick="showToast('Connect to a file server to enable file uploads.')">
          <div style="font-size:28px">⬆</div>
          <div style="font-size:12px;color:var(--text2);margin-top:6px">Click to upload file</div>
        </div>
      </div>

      <!-- NOTES -->
      <div class="profile-section" id="tab-notes">
        <div style="font-size:12px;color:var(--text2);margin-bottom:10px">Private notes — not visible to tenant</div>
        <textarea class="form-input" id="notes-${roomId}" rows="5" style="resize:vertical" placeholder="Add notes about this tenant...">${t.notes || ''}</textarea>
        <button class="btn btn-primary" style="margin-top:8px" onclick="saveNote('${roomId}')">💾 Save Note</button>
        ${t.notes ? `<div class="note-box" style="margin-top:12px">${t.notes}</div>` : ''}
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn" onclick="closeModal()">Close</button>
      <button class="btn btn-primary" onclick="openEditTenant('${roomId}')">Edit Profile</button>
    </div>
  </div></div>`);
}

function switchTab(el, id) {
  el.closest('.modal').querySelectorAll('.profile-tab').forEach(t => t.classList.remove('active'));
  el.closest('.modal').querySelectorAll('.profile-section').forEach(s => s.classList.remove('active'));
  el.classList.add('active');
  document.getElementById(id).classList.add('active');
}

function saveNote(roomId) {
  const notes = document.getElementById('notes-' + roomId)?.value || '';
  updateTenant(roomId, { notes });
  showToast('✅ Note saved!');
}

function addDoc(roomId) {
  const inp = document.getElementById('doc-name-' + roomId);
  const name = inp?.value?.trim();
  if (!name) return;
  const rm = getRoom(roomId);
  if (rm && rm.tenant) {
    rm.tenant.docs = rm.tenant.docs || [];
    rm.tenant.docs.push(name);
    saveData();
    inp.value = '';
    openProfile(roomId);
  }
}

function removeDoc(roomId, idx) {
  const rm = getRoom(roomId);
  if (rm && rm.tenant && rm.tenant.docs) {
    rm.tenant.docs.splice(idx, 1);
    saveData();
    openProfile(roomId);
  }
}

function triggerPhotoUpload(roomId) {
  const inp = document.createElement('input');
  inp.type = 'file'; inp.accept = 'image/*';
  inp.onchange = e => {
    const f = e.target.files[0]; if (!f) return;
    const reader = new FileReader();
    reader.onload = ev => {
      updateRoom(roomId, { photo: ev.target.result });
      closeModal(); openProfile(roomId);
      renderTenants(document.getElementById('tsearch')?.value || '');
    };
    reader.readAsDataURL(f);
  };
  inp.click();
}

function confirmRemoveTenant(roomId) {
  if (!confirm('Move out tenant from room ' + roomId + '? This will remove their data.')) return;
  removeTenant(roomId);
  closeModal();
  renderTenants();
}

// ===== EDIT TENANT =====
function openEditTenant(roomId) {
  const rm = getRoom(roomId);
  if (!rm || !rm.tenant) return;
  const t = rm.tenant;
  const wingOpts = WINGS.map(w => `<option value="${w.id}"${w.id === rm.wing ? ' selected' : ''}>Wing ${w.id}</option>`).join('');
  const dobVal = t.dob ? new Date(t.dob).toISOString().slice(0, 10) : '';
  const expiryVal = t.idExpiry ? new Date(t.idExpiry).toISOString().slice(0, 10) : '';
  const moveInVal = t.moveIn ? new Date(t.moveIn).toISOString().slice(0, 10) : '';

  modal(`<div class="modal-overlay" onclick="if(event.target===this)closeModal()">
  <div class="modal modal-wide">
    <div class="modal-header"><h3>Edit Tenant — ${rm.id}</h3><button class="modal-close" onclick="closeModal()">×</button></div>
    <div class="modal-body">
      <div class="sub-section-title" style="margin-top:0">Personal Information</div>
      <div class="form-grid2">
        <div class="form-row"><label class="form-label">Full Name *</label><input class="form-input" id="e-name" value="${t.name}"></div>
        <div class="form-row"><label class="form-label">Gender</label><select class="form-select" id="e-gender"><option${t.gender==='Male'?' selected':''}>Male</option><option${t.gender==='Female'?' selected':''}>Female</option></select></div>
        <div class="form-row"><label class="form-label">Date of Birth</label><input class="form-input" type="date" id="e-dob" value="${dobVal}"></div>
        <div class="form-row"><label class="form-label">Nationality</label><input class="form-input" id="e-nat" value="${t.nationality || ''}"></div>
        <div class="form-row"><label class="form-label">Occupation</label><input class="form-input" id="e-occ" value="${t.occupation || ''}"></div>
        <div class="form-row"><label class="form-label">ID Card / Passport</label><input class="form-input" id="e-id" value="${t.idCard || ''}"></div>
        <div class="form-row"><label class="form-label">ID Expiry Date</label><input class="form-input" type="date" id="e-idexp" value="${expiryVal}"></div>
      </div>
      <div class="sub-section-title">Contact</div>
      <div class="form-grid2">
        <div class="form-row"><label class="form-label">Phone 1 *</label><input class="form-input" id="e-phone" value="${t.phone}"></div>
        <div class="form-row"><label class="form-label">Phone 2</label><input class="form-input" id="e-phone2" value="${t.phone2 || ''}"></div>
        <div class="form-row"><label class="form-label">Email</label><input class="form-input" id="e-email" value="${t.email || ''}"></div>
      </div>
      <div class="sub-section-title">Room & Rental</div>
      <div class="form-grid3">
        <div class="form-row"><label class="form-label">Wing</label><select class="form-select" id="e-wing">${wingOpts}</select></div>
        <div class="form-row"><label class="form-label">Room Number</label><input class="form-input" id="e-rnum" value="${pad2(rm.num)}"></div>
        <div class="form-row"><label class="form-label">Monthly Rent ($) *</label><input class="form-input" type="number" id="e-rent" value="${rm.rent}"></div>
        <div class="form-row"><label class="form-label">Move-in Date</label><input class="form-input" type="date" id="e-movein" value="${moveInVal}"></div>
        <div class="form-row"><label class="form-label">Security Deposit ($)</label><input class="form-input" type="number" id="e-dep" value="${t.deposit || 0}"></div>
      </div>
      <div class="sub-section-title">Emergency Contact</div>
      <div class="form-grid3">
        <div class="form-row"><label class="form-label">Name</label><input class="form-input" id="e-ename" value="${t.emergencyName || ''}"></div>
        <div class="form-row"><label class="form-label">Relation</label><input class="form-input" id="e-erel" value="${t.emergencyRelation || ''}"></div>
        <div class="form-row"><label class="form-label">Phone</label><input class="form-input" id="e-ephone" value="${t.emergencyPhone || ''}"></div>
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn" onclick="openProfile('${roomId}')">Cancel</button>
      <button class="btn btn-primary" onclick="saveEditTenant('${roomId}')">💾 Save Changes</button>
    </div>
  </div></div>`);
}

function saveEditTenant(roomId) {
  const updates = {
    name: document.getElementById('e-name').value.trim(),
    gender: document.getElementById('e-gender').value,
    dob: document.getElementById('e-dob').value ? new Date(document.getElementById('e-dob').value).toISOString() : '',
    nationality: document.getElementById('e-nat').value,
    occupation: document.getElementById('e-occ').value,
    idCard: document.getElementById('e-id').value,
    idExpiry: document.getElementById('e-idexp').value ? new Date(document.getElementById('e-idexp').value).toISOString() : '',
    phone: document.getElementById('e-phone').value,
    phone2: document.getElementById('e-phone2').value,
    email: document.getElementById('e-email').value,
    moveIn: document.getElementById('e-movein').value ? new Date(document.getElementById('e-movein').value).toISOString() : '',
    deposit: parseFloat(document.getElementById('e-dep').value) || 0,
    emergencyName: document.getElementById('e-ename').value,
    emergencyRelation: document.getElementById('e-erel').value,
    emergencyPhone: document.getElementById('e-ephone').value,
    rent: parseFloat(document.getElementById('e-rent').value) || 0
  };
  if (!updates.name) { showToast('❌ Name is required'); return; }
  updateTenant(roomId, updates);
  openProfile(roomId);
}

// ===== ADD TENANT =====
function openAddTenant() {
  const wingOpts = WINGS.map(w => `<option value="${w.id}">Wing ${w.id}</option>`).join('');
  modal(`<div class="modal-overlay" onclick="if(event.target===this)closeModal()">
  <div class="modal modal-wide">
    <div class="modal-header"><h3>Add New Tenant</h3><button class="modal-close" onclick="closeModal()">×</button></div>
    <div class="modal-body">
      <div class="sub-section-title" style="margin-top:0">Personal Information</div>
      <div class="form-grid2">
        <div class="form-row"><label class="form-label">Full Name *</label><input class="form-input" id="a-name" placeholder="Sophea Sok"></div>
        <div class="form-row"><label class="form-label">Gender</label><select class="form-select" id="a-gender"><option>Male</option><option>Female</option></select></div>
        <div class="form-row"><label class="form-label">Date of Birth</label><input class="form-input" type="date" id="a-dob"></div>
        <div class="form-row"><label class="form-label">Nationality</label><input class="form-input" id="a-nat" placeholder="Cambodian"></div>
        <div class="form-row"><label class="form-label">Occupation</label><input class="form-input" id="a-occ" placeholder="Student"></div>
        <div class="form-row"><label class="form-label">ID Card / Passport *</label><input class="form-input" id="a-id" placeholder="KH123456"></div>
        <div class="form-row"><label class="form-label">ID Expiry Date</label><input class="form-input" type="date" id="a-idexp"></div>
        <div class="form-row"><label class="form-label">Phone 1 *</label><input class="form-input" id="a-phone" placeholder="0xx xxx xxx"></div>
        <div class="form-row"><label class="form-label">Phone 2</label><input class="form-input" id="a-phone2" placeholder="Optional"></div>
        <div class="form-row"><label class="form-label">Email</label><input class="form-input" id="a-email" placeholder="email@example.com"></div>
      </div>
      <div class="sub-section-title">Room & Rental</div>
      <div class="form-grid3">
        <div class="form-row"><label class="form-label">Wing *</label><select class="form-select" id="a-wing">${wingOpts}</select></div>
        <div class="form-row"><label class="form-label">Room Number *</label><input class="form-input" type="number" id="a-rnum" placeholder="01" min="1"></div>
        <div class="form-row"><label class="form-label">Monthly Rent ($) *</label><input class="form-input" type="number" id="a-rent" placeholder="250"></div>
        <div class="form-row"><label class="form-label">Move-in Date *</label><input class="form-input" type="date" id="a-movein" value="${todayISO()}"></div>
        <div class="form-row"><label class="form-label">Security Deposit ($)</label><input class="form-input" type="number" id="a-dep" placeholder="500"></div>
      </div>
      <div class="sub-section-title">Emergency Contact</div>
      <div class="form-grid3">
        <div class="form-row"><label class="form-label">Name</label><input class="form-input" id="a-ename" placeholder="Contact name"></div>
        <div class="form-row"><label class="form-label">Relation</label><input class="form-input" id="a-erel" placeholder="Parent / Sibling..."></div>
        <div class="form-row"><label class="form-label">Phone</label><input class="form-input" id="a-ephone" placeholder="0xx xxx xxx"></div>
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn" onclick="closeModal()">Cancel</button>
      <button class="btn btn-primary" onclick="submitAddTenant()">✅ Add Tenant</button>
    </div>
  </div></div>`);
}

function submitAddTenant() {
  const data = {
    name: document.getElementById('a-name').value.trim(),
    gender: document.getElementById('a-gender').value,
    dob: document.getElementById('a-dob').value,
    nationality: document.getElementById('a-nat').value,
    occupation: document.getElementById('a-occ').value,
    idCard: document.getElementById('a-id').value,
    idExpiry: document.getElementById('a-idexp').value,
    phone: document.getElementById('a-phone').value.trim(),
    phone2: document.getElementById('a-phone2').value,
    email: document.getElementById('a-email').value,
    wing: document.getElementById('a-wing').value,
    roomNum: document.getElementById('a-rnum').value,
    rent: document.getElementById('a-rent').value,
    moveIn: document.getElementById('a-movein').value,
    deposit: document.getElementById('a-dep').value,
    emergencyName: document.getElementById('a-ename').value,
    emergencyRelation: document.getElementById('a-erel').value,
    emergencyPhone: document.getElementById('a-ephone').value,
  };
  if (!data.name || !data.phone || !data.wing || !data.roomNum || !data.rent) {
    showToast('❌ Please fill all required fields (*)');
    return;
  }
  const ok = addTenantToRoom(data);
  if (ok) { closeModal(); renderTenants(); renderDash(); }
}

// ===== ROOM OPTIONS (for vacant rooms) =====
function openRoomOptions(roomId) {
  const rm = getRoom(roomId);
  if (!rm) return;
  modal(`<div class="modal-overlay" onclick="if(event.target===this)closeModal()">
  <div class="modal">
    <div class="modal-header"><h3>Room ${roomId}</h3><button class="modal-close" onclick="closeModal()">×</button></div>
    <div class="modal-body">
      <div class="detail-row"><span class="detail-label">Status</span><span class="badge badge-${rm.status}">${rm.status}</span></div>
      <div class="detail-row"><span class="detail-label">Listed Rent</span><span>${fmt$(rm.rent)}/mo</span></div>
      <div class="detail-row"><span class="detail-label">Wing</span><span>Wing ${rm.wing}</span></div>
      <div style="margin-top:16px;display:flex;flex-direction:column;gap:8px">
        <button class="btn btn-primary" onclick="closeModal();openAddTenantForRoom('${rm.wing}','${rm.num}')">+ Assign Tenant</button>
        <button class="btn" onclick="setRoomStatus('${roomId}','maintenance');closeModal();renderRoomMap()">Set to Maintenance</button>
        <button class="btn" onclick="setRoomStatus('${roomId}','vacant');closeModal();renderRoomMap()">Set to Vacant</button>
      </div>
    </div>
  </div></div>`);
}

function openAddTenantForRoom(wing, num) {
  openAddTenant();
  setTimeout(() => {
    const ws = document.getElementById('a-wing');
    const ns = document.getElementById('a-rnum');
    if (ws) ws.value = wing;
    if (ns) ns.value = parseInt(num);
  }, 50);
}

// ===== PAYMENTS =====
function renderPayments(filter = 'all') {
  let data = DB.payments;
  if (filter !== 'all') data = data.filter(p => p.status === filter);

  let total = 0, coll = 0, out = 0;
  DB.payments.forEach(p => {
    total += p.amount;
    if (p.status === 'paid') coll += p.amount;
    else out += p.amount;
  });

  document.getElementById('p-total').textContent = fmt$(total);
  document.getElementById('p-coll').textContent = fmt$(coll);
  document.getElementById('p-out').textContent = fmt$(out);

  document.getElementById('pay-tbody').innerHTML = data.map(p =>
    `<tr>
      <td>${p.room}</td><td>${p.tenant}</td><td>${fmt$(p.amount)}</td>
      <td>${fmtD(p.dueDate)}</td><td>${fmtD(p.paidDate)}</td>
      <td><span class="badge badge-${p.status}">${p.status}</span></td>
      <td>${p.method || '—'}</td>
      <td>${p.status !== 'paid'
        ? `<button class="btn btn-primary btn-sm" onclick="markPaid('${p.room}');renderPayments('${filter}')">Mark Paid</button>`
        : '<span style="color:var(--text3)">✓</span>'
      }</td>
    </tr>`
  ).join('') || '<tr><td colspan="8" class="empty-state">No payments found</td></tr>';
}

function filterPayments(f, btn) {
  document.querySelectorAll('#page-payments .filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderPayments(f);
}

function openAddPayment() {
  const vacantRooms = DB.rooms.filter(r => r.tenant);
  modal(`<div class="modal-overlay" onclick="if(event.target===this)closeModal()">
  <div class="modal">
    <div class="modal-header"><h3>Record Payment</h3><button class="modal-close" onclick="closeModal()">×</button></div>
    <div class="modal-body">
      <div class="form-row"><label class="form-label">Room</label>
        <select class="form-select" id="rp-room">
          ${vacantRooms.map(r => `<option value="${r.id}">${r.id} — ${r.tenant.name}</option>`).join('')}
        </select>
      </div>
      <div class="form-row"><label class="form-label">Amount ($)</label><input class="form-input" type="number" id="rp-amt" placeholder="250"></div>
      <div class="form-row"><label class="form-label">Payment Method</label>
        <select class="form-select" id="rp-method"><option>Cash</option><option>Bank Transfer</option><option>Wing</option><option>ABA</option></select>
      </div>
      <div class="form-row"><label class="form-label">Paid Date</label><input class="form-input" type="date" id="rp-date" value="${todayISO()}"></div>
    </div>
    <div class="modal-footer">
      <button class="btn" onclick="closeModal()">Cancel</button>
      <button class="btn btn-primary" onclick="submitPayment()">Record Payment</button>
    </div>
  </div></div>`);
}

function submitPayment() {
  const roomId = document.getElementById('rp-room').value;
  const method = document.getElementById('rp-method').value;
  markPaid(roomId, method);
  closeModal();
  renderPayments('all');
}

// ===== INVOICES =====
function renderInvoices() {
  document.getElementById('inv-tbody').innerHTML = DB.invoices.map(inv =>
    `<tr>
      <td>${inv.num}</td><td>${inv.room}</td><td>${inv.wing}</td>
      <td>${inv.tenant}</td><td>${fmt$(inv.amount)}</td>
      <td>${fmtD(inv.issue)}</td><td>${fmtD(inv.due)}</td>
      <td><span class="badge badge-${inv.status}">${inv.status}</span></td>
      <td><button class="btn btn-sm" onclick="printInvoice('${inv.num}')">🖨 Print</button></td>
    </tr>`
  ).join('') || '<tr><td colspan="9" class="empty-state">No invoices generated yet</td></tr>';
}

function printInvoice(invNum) {
  const inv = DB.invoices.find(i => i.num === invNum);
  if (!inv) return;
  const win = window.open('', '_blank');
  win.document.write(`<html><head><title>Invoice ${inv.num}</title>
  <style>body{font-family:sans-serif;padding:40px;max-width:600px;margin:0 auto}h1{font-size:24px}table{width:100%;border-collapse:collapse;margin:20px 0}td,th{padding:10px;border:1px solid #ddd;font-size:13px}.total{font-size:18px;font-weight:bold;text-align:right;margin-top:20px}@media print{button{display:none}}</style>
  </head><body>
  <h1>Invoice</h1>
  <p><strong>${SETTINGS.buildingName || 'RoomManager Pro'}</strong></p>
  <table><tr><th>Field</th><th>Details</th></tr>
    <tr><td>Invoice #</td><td>${inv.num}</td></tr>
    <tr><td>Room</td><td>${inv.room}</td></tr>
    <tr><td>Tenant</td><td>${inv.tenant}</td></tr>
    <tr><td>Issue Date</td><td>${fmtD(inv.issue)}</td></tr>
    <tr><td>Due Date</td><td>${fmtD(inv.due)}</td></tr>
    <tr><td>Status</td><td>${inv.status.toUpperCase()}</td></tr>
  </table>
  <div class="total">Total: ${fmt$(inv.amount)}</div>
  <br><button onclick="window.print()">🖨 Print</button>
  </body></html>`);
  win.document.close();
}

function openInvSettings() {
  modal(`<div class="modal-overlay" onclick="if(event.target===this)closeModal()">
  <div class="modal"><div class="modal-header"><h3>Invoice Settings</h3><button class="modal-close" onclick="closeModal()">×</button></div>
  <div class="modal-body">
    <div class="form-row"><label class="form-label">Payment due day (each month)</label><input class="form-input" value="${SETTINGS.dueDay}" type="number" onchange="SETTINGS.dueDay=parseInt(this.value)"></div>
    <div class="form-row"><label class="form-label">Grace period (days)</label><input class="form-input" value="${SETTINGS.gracePeriod}" type="number" onchange="SETTINGS.gracePeriod=parseInt(this.value)"></div>
    <div class="form-row"><label class="form-label">Late fee ($)</label><input class="form-input" value="${SETTINGS.lateFee}" type="number" onchange="SETTINGS.lateFee=parseInt(this.value)"></div>
    <div class="form-row"><label class="form-label">Building name</label><input class="form-input" value="${SETTINGS.buildingName}" onchange="SETTINGS.buildingName=this.value"></div>
  </div>
  <div class="modal-footer"><button class="btn" onclick="closeModal()">Cancel</button><button class="btn btn-primary" onclick="localStorage.setItem('${SETTINGS_KEY}',JSON.stringify(SETTINGS));showToast('Settings saved!');closeModal()">Save</button></div>
  </div></div>`);
}

// ===== REPORTS =====
function renderReports() {
  const occ = DB.rooms.filter(r => r.status === 'occupied').length;
  const vac = DB.rooms.filter(r => r.status === 'vacant').length;
  const avg = DB.payments.length ? Math.round(DB.payments.reduce((a, p) => a + p.amount, 0) / DB.payments.length) : 0;
  const paid = DB.payments.filter(p => p.status === 'paid');

  document.getElementById('r-occ').textContent = Math.round(occ / 168 * 100) + '%';
  document.getElementById('r-avg').textContent = fmt$(avg);
  document.getElementById('r-cr').textContent = DB.payments.length ? Math.round(paid.length / DB.payments.length * 100) + '%' : '—';
  document.getElementById('r-vac').textContent = vac;

  document.getElementById('wing-tbody').innerHTML = WINGS.map(w => {
    const wr = DB.rooms.filter(r => r.wing === w.id);
    const wo = wr.filter(r => r.status === 'occupied').length;
    const wv = wr.filter(r => r.status === 'vacant').length;
    const wov = wr.filter(r => r.status === 'overdue').length;
    const wm = wr.filter(r => r.status === 'maintenance').length;
    const wrev = DB.payments.filter(p => p.wing === w.id).reduce((a, p) => a + p.amount, 0);
    return `<tr>
      <td><span class="wing-tag" style="background:${w.color};width:22px;height:22px;font-size:11px;display:inline-flex;align-items:center;justify-content:center;border-radius:5px">${w.id}</span></td>
      <td>${wr.length}</td><td>${wo}</td><td>${wv}</td><td>${wov}</td><td>${wm}</td><td>${fmt$(wrev)}</td>
    </tr>`;
  }).join('');
}

// ===== SETTINGS UI =====
function loadSettingsUI() {
  const s = document.getElementById('s-bname');
  if (s) {
    document.getElementById('s-bname').value = SETTINGS.buildingName || '';
    document.getElementById('s-mgr').value = SETTINGS.managerName || '';
    document.getElementById('s-phone').value = SETTINGS.phone || '';
    document.getElementById('s-addr').value = SETTINGS.address || '';
    document.getElementById('s-due').value = SETTINGS.dueDay || 1;
    document.getElementById('s-grace').value = SETTINGS.gracePeriod || 5;
    document.getElementById('s-late').value = SETTINGS.lateFee || 10;
    document.getElementById('s-currency').value = SETTINGS.currency || '$';
  }
}

// ===== MODAL HELPERS =====
function modal(html) { document.getElementById('modal-root').innerHTML = html; }
function closeModal() { document.getElementById('modal-root').innerHTML = ''; }
