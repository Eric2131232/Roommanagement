// ===== WINGS DEFINITION =====
const WINGS = [
  { id: 'A', count: 14, color: '#185FA5' },
  { id: 'B', count: 31, color: '#3B6D11' },
  { id: 'C', count: 22, color: '#854F0B' },
  { id: 'D', count: 12, color: '#533AB7' },
  { id: 'E', count: 5,  color: '#993556' },
  { id: 'F', count: 28, color: '#0F6E56' },
  { id: 'G', count: 28, color: '#993C1D' },
  { id: 'H', count: 28, color: '#185FA5' },
];

const AV_COLORS = ['#185FA5','#3B6D11','#854F0B','#533AB7','#993556','#0F6E56','#993C1D','#A32D2D'];
const STORAGE_KEY = 'roommanager_data_v1';
const SETTINGS_KEY = 'roommanager_settings_v1';

// ===== HELPER FUNCTIONS =====
function ri(n) { return Math.floor(Math.random() * n); }
function pad2(n) { return String(n).padStart(2, '0'); }
function inits(name) { return name.split(' ').map(x => x[0]).join('').slice(0, 2).toUpperCase(); }
function fmt$(n) { return '$' + Math.round(n).toLocaleString(); }
function fmtD(d) {
  if (!d) return '—';
  const dt = d instanceof Date ? d : new Date(d);
  if (isNaN(dt)) return '—';
  return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
function addD(d, n) {
  const x = d instanceof Date ? new Date(d) : new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}
function nowISO() { return new Date().toISOString(); }
function todayISO() { return new Date().toISOString().slice(0, 10); }

// ===== DEFAULT SAMPLE DATA =====
function generateSampleData() {
  const FN = ['Sophea','Dara','Chanta','Bopha','Ratha','Sovan','Kanha','Pich','Vireak','Sreymom','Pisach','Vanna','Monita','Sarom','Kosal','Theary','Bunny','Channary','Lina','Sina','Makara','Vibol','Sokhom','Rany','Pisey','Chanthy','Kimhak','Socheata','Narith','Sreypov'];
  const LN = ['Sok','Chhim','Pov','Kong','Ly','San','Heng','Rath','Yim','Nhem','Keo','Touch','Em','Lim','Kim','Meas','Ros','Chan','Noun','Horn','Oun','Phan','Tep','Seng','Nget','Peou','Chea','Bun','Doeun','Kuy'];
  const NATIONS = ['Cambodian','Vietnamese','Chinese','Thai','Korean'];
  const JOBS = ['Student','Business Owner','Government Staff','Private Employee','Freelancer','Teacher','Driver','Trader'];
  const ST_LIST = ['occupied','occupied','occupied','occupied','occupied','occupied','occupied','vacant','vacant','overdue','maintenance'];

  function rn() { return FN[ri(30)] + ' ' + LN[ri(30)]; }
  function rPhone() { return '0' + (ri(9)+1) + '' + ri(10) + ri(10) + ri(10) + ri(10) + ri(10) + ri(10) + ri(10); }

  const rooms = [];
  WINGS.forEach(w => {
    for (let i = 1; i <= w.count; i++) {
      const id = w.id + '-' + pad2(i);
      const status = ST_LIST[ri(ST_LIST.length)];
      const rent = 150 + ri(14) * 25;
      const moveInDate = new Date(2023, ri(12), ri(27) + 1).toISOString();
      const hasTenant = status !== 'vacant' && status !== 'maintenance';
      rooms.push({
        id, wing: w.id, num: i, status, rent,
        photo: null,
        avatarColor: AV_COLORS[ri(8)],
        tenant: hasTenant ? {
          name: rn(),
          gender: ri(2) === 0 ? 'Male' : 'Female',
          dob: new Date(1985 + ri(20), ri(12), ri(27) + 1).toISOString(),
          nationality: NATIONS[ri(5)],
          occupation: JOBS[ri(8)],
          phone: rPhone(),
          phone2: ri(2) === 0 ? rPhone() : '',
          email: 'tenant.' + id.toLowerCase().replace('-', '') + '@mail.com',
          moveIn: moveInDate,
          idCard: 'KH' + String(100000 + ri(900000)),
          idExpiry: new Date(2026 + ri(5), ri(12), ri(27) + 1).toISOString(),
          deposit: rent * 2,
          emergencyName: rn(),
          emergencyPhone: rPhone(),
          emergencyRelation: ['Parent','Sibling','Spouse','Friend'][ri(4)],
          notes: ri(3) === 0 ? 'Has a pet cat. Quiet tenant.' : ri(2) === 0 ? 'Works night shift.' : '',
          docs: ['ID Card Copy', 'Lease Agreement', 'Move-in Checklist'].slice(0, ri(3) + 1)
        } : null
      });
    }
  });

  const dueDate = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
  const payments = rooms.filter(r => r.tenant).map(r => {
    const isPaid = r.status === 'occupied' && ri(10) > 1;
    const status = r.status === 'overdue' ? 'overdue' : isPaid ? 'paid' : 'pending';
    const history = [];
    for (let m = 1; m <= ri(6) + 1; m++) {
      const d = new Date(2025, m, 1);
      history.push({
        id: 'PAY-' + Date.now() + '-' + m,
        month: d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
        amount: r.rent, status: 'paid',
        paidDate: addD(d, ri(5)).toISOString(),
        method: ['Cash','Bank Transfer','Wing','ABA'][ri(4)]
      });
    }
    return {
      id: 'PAY-' + r.id,
      room: r.id, wing: r.wing,
      tenant: r.tenant.name,
      amount: r.rent,
      dueDate,
      paidDate: isPaid ? addD(new Date(dueDate), ri(8) - 3).toISOString() : null,
      status,
      method: isPaid ? ['Cash','Bank Transfer','Wing','ABA'][ri(4)] : '',
      history
    };
  });

  let invN = 2000;
  const invoices = rooms.filter(r => r.tenant).map(r => {
    const pStatus = payments.find(p => p.room === r.id)?.status || 'pending';
    return {
      num: 'INV-' + (++invN),
      room: r.id, wing: r.wing,
      tenant: r.tenant.name,
      amount: r.rent,
      issue: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString(),
      due: addD(new Date(new Date().getFullYear(), new Date().getMonth(), 1), 14).toISOString(),
      status: pStatus
    };
  });

  return { rooms, payments, invoices, lastUpdated: nowISO() };
}

// ===== LOAD / SAVE =====
let DB = null;
let SETTINGS = null;

function loadData() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      DB = JSON.parse(saved);
      console.log('✅ Data loaded from localStorage');
    } else {
      DB = generateSampleData();
      saveData();
      console.log('✅ Sample data generated and saved');
    }
  } catch (e) {
    console.error('Error loading data:', e);
    DB = generateSampleData();
  }

  try {
    const savedSettings = localStorage.getItem(SETTINGS_KEY);
    SETTINGS = savedSettings ? JSON.parse(savedSettings) : {
      buildingName: 'My Building',
      managerName: '',
      phone: '',
      address: '',
      dueDay: 1,
      gracePeriod: 5,
      lateFee: 10,
      currency: '$'
    };
  } catch (e) {
    SETTINGS = { buildingName: 'My Building', managerName: '', phone: '', address: '', dueDay: 1, gracePeriod: 5, lateFee: 10, currency: '$' };
  }
}

function saveData() {
  try {
    DB.lastUpdated = nowISO();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(DB));
    const el = document.getElementById('save-indicator');
    if (el) {
      el.textContent = '💾 Saved ' + new Date().toLocaleTimeString();
    }
  } catch (e) {
    console.error('Error saving data:', e);
    showToast('⚠️ Could not save data — storage full?');
  }
}

function saveSettings() {
  SETTINGS.buildingName = document.getElementById('s-bname')?.value || SETTINGS.buildingName;
  SETTINGS.managerName  = document.getElementById('s-mgr')?.value  || SETTINGS.managerName;
  SETTINGS.phone        = document.getElementById('s-phone')?.value || SETTINGS.phone;
  SETTINGS.address      = document.getElementById('s-addr')?.value  || SETTINGS.address;
  SETTINGS.dueDay       = parseInt(document.getElementById('s-due')?.value)   || SETTINGS.dueDay;
  SETTINGS.gracePeriod  = parseInt(document.getElementById('s-grace')?.value) || SETTINGS.gracePeriod;
  SETTINGS.lateFee      = parseInt(document.getElementById('s-late')?.value)  || SETTINGS.lateFee;
  SETTINGS.currency     = document.getElementById('s-currency')?.value || SETTINGS.currency;
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(SETTINGS));
  showToast('✅ Settings saved!');
}

function exportData() {
  const blob = new Blob([JSON.stringify({ DB, SETTINGS }, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'roommanager-backup-' + todayISO() + '.json';
  a.click();
  showToast('✅ Backup exported!');
}

function importData() {
  document.getElementById('import-file').click();
}

function handleImport(input) {
  const file = input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    try {
      const parsed = JSON.parse(e.target.result);
      if (parsed.DB) DB = parsed.DB;
      if (parsed.SETTINGS) SETTINGS = parsed.SETTINGS;
      saveData();
      renderDash();
      showToast('✅ Data imported successfully!');
    } catch (err) {
      showToast('❌ Invalid backup file');
    }
  };
  reader.readAsText(file);
}

function clearAllData() {
  if (!confirm('Are you sure you want to delete ALL data? This cannot be undone.')) return;
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(SETTINGS_KEY);
  DB = generateSampleData();
  saveData();
  renderDash();
  showToast('🗑 All data cleared. Sample data restored.');
}

// ===== ROOM OPERATIONS =====
function getRoom(id) { return DB.rooms.find(r => r.id === id); }
function getPayment(roomId) { return DB.payments.find(p => p.room === roomId); }
function getInvoice(roomId) { return DB.invoices.find(i => i.room === roomId); }

function updateRoom(id, updates) {
  const idx = DB.rooms.findIndex(r => r.id === id);
  if (idx >= 0) { DB.rooms[idx] = { ...DB.rooms[idx], ...updates }; saveData(); }
}

function markPaid(roomId, method = 'Cash') {
  const p = DB.payments.find(x => x.room === roomId);
  if (p && p.status !== 'paid') {
    p.status = 'paid';
    p.paidDate = nowISO();
    p.method = method;
  }
  const rm = DB.rooms.find(r => r.id === roomId);
  if (rm && rm.status === 'overdue') rm.status = 'occupied';
  const inv = DB.invoices.find(i => i.room === roomId);
  if (inv) inv.status = 'paid';
  saveData();
  showToast('✅ Payment marked as paid!');
}

function generateInvoices() {
  const now = new Date();
  const issue = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const due = addD(new Date(issue), SETTINGS.dueDay + (SETTINGS.gracePeriod || 5)).toISOString();
  let count = 0;
  DB.rooms.filter(r => r.tenant).forEach(r => {
    const existing = DB.invoices.find(i => i.room === r.id && new Date(i.issue).getMonth() === now.getMonth());
    if (!existing) {
      const pStatus = getPayment(r.id)?.status || 'pending';
      DB.invoices.push({
        num: 'INV-' + (Date.now() + count),
        room: r.id, wing: r.wing,
        tenant: r.tenant.name,
        amount: r.rent, issue, due,
        status: pStatus
      });
      count++;
    }
  });
  saveData();
  renderInvoices();
  showToast('✅ Generated ' + (count || 'updated') + ' invoices!');
}

function addTenantToRoom(data) {
  const roomId = data.wing + '-' + pad2(parseInt(data.roomNum));
  const rm = DB.rooms.find(r => r.id === roomId);
  if (!rm) { showToast('❌ Room ' + roomId + ' not found'); return false; }
  if (rm.tenant) { showToast('❌ Room ' + roomId + ' already has a tenant'); return false; }

  rm.tenant = {
    name: data.name, gender: data.gender,
    dob: data.dob || new Date(2000,0,1).toISOString(),
    nationality: data.nationality || 'Cambodian',
    occupation: data.occupation || '',
    phone: data.phone, phone2: data.phone2 || '',
    email: data.email || '',
    moveIn: data.moveIn || new Date().toISOString(),
    idCard: data.idCard || '',
    idExpiry: data.idExpiry || '',
    deposit: parseFloat(data.deposit) || 0,
    emergencyName: data.emergencyName || '',
    emergencyPhone: data.emergencyPhone || '',
    emergencyRelation: data.emergencyRelation || '',
    notes: '', docs: []
  };
  rm.status = 'occupied';
  rm.rent = parseFloat(data.rent) || rm.rent;
  rm.avatarColor = AV_COLORS[ri(8)];
  rm.photo = null;

  const dueDate = new Date(new Date().getFullYear(), new Date().getMonth(), SETTINGS.dueDay).toISOString();
  DB.payments.push({
    id: 'PAY-' + roomId + '-' + Date.now(),
    room: roomId, wing: rm.wing,
    tenant: data.name,
    amount: rm.rent,
    dueDate, paidDate: null,
    status: 'pending', method: '',
    history: []
  });

  saveData();
  showToast('✅ Tenant added to Room ' + roomId);
  return true;
}

function updateTenant(roomId, data) {
  const rm = DB.rooms.find(r => r.id === roomId);
  if (!rm || !rm.tenant) return;
  Object.assign(rm.tenant, data);
  if (data.rent) rm.rent = parseFloat(data.rent);
  saveData();
  showToast('✅ Tenant profile updated!');
}

function removeTenant(roomId) {
  const rm = DB.rooms.find(r => r.id === roomId);
  if (!rm) return;
  rm.tenant = null;
  rm.status = 'vacant';
  DB.payments = DB.payments.filter(p => p.room !== roomId);
  saveData();
  showToast('✅ Tenant removed from room ' + roomId);
}

function setRoomStatus(roomId, status) {
  const rm = DB.rooms.find(r => r.id === roomId);
  if (rm) { rm.status = status; saveData(); showToast('Room ' + roomId + ' set to ' + status); }
}
