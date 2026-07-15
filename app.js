let db = JSON.parse(localStorage.getItem('proFinanceDB')) || {
  theme: 'light',
  pockets: [{ id: 'p_1', name: 'DOMPET UTAMA', balance: 0 }],
  transactions: [], accounts: [], debts: []
};

let currentView = 'view-home';
const formatRp = (num) => 'RP ' + num.toLocaleString('id-ID');

function getLocalDatetimeString(dateObj = new Date()) {
  const d = new Date(dateObj);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

window.onload = () => {
  if (!db.debts) db.debts = [];
  applyTheme();
  updateClock();
  setInterval(updateClock, 1000);
  renderAll();
};

function saveData() { localStorage.setItem('proFinanceDB', JSON.stringify(db)); renderAll(); }

// ================= SISTEM ALERT & CONFIRM =================
function customAlert(msg) {
  document.getElementById('alert-message').innerText = msg;
  document.getElementById('modal-alert').classList.add('active');
}
function closeCustomAlert() { document.getElementById('modal-alert').classList.remove('active'); }

let confirmCallback = null;
function customConfirm(msg, callback) {
  document.getElementById('confirm-message').innerText = msg;
  confirmCallback = callback;
  document.getElementById('modal-confirm').classList.add('active');
}
function closeCustomConfirm(result) {
  document.getElementById('modal-confirm').classList.remove('active');
  if (result && confirmCallback) confirmCallback();
  confirmCallback = null;
}

// ================= UI & TEMA =================
function updateClock() {
  const now = new Date();
  document.getElementById('realtime-clock').innerText =
    now.toLocaleDateString('id-ID', { weekday: 'short', day: '2-digit', month: 'short' }) + " | " +
    now.toLocaleTimeString('id-ID', { hour12: false }).replace(/:/g, '.');
}

function toggleDarkMode() {
  db.theme = db.theme === 'light' ? 'dark' : 'light';
  saveData(); applyTheme();
}

function applyTheme() {
  document.documentElement.setAttribute('data-theme', db.theme);
  if (currentView === 'view-charts') setTimeout(renderCharts, 50);
}

function switchTab(tabId, btn) {
  document.querySelectorAll('.view-section').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(el => el.classList.remove('active'));
  document.getElementById(tabId).classList.add('active');
  btn.classList.add('active');
  currentView = tabId;
  btn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  if (tabId === 'view-charts') renderCharts();
}

function copyAccount(num) {
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(num).then(() => { customAlert('NOMOR REKENING BERHASIL DISALIN'); })
      .catch(() => { customAlert('GAGAL MENYALIN NOMOR'); });
  } else {
    let textArea = document.createElement("textarea");
    textArea.value = num; textArea.style.position = "fixed"; textArea.style.left = "-999999px";
    document.body.appendChild(textArea); textArea.focus(); textArea.select();
    try { document.execCommand('copy'); customAlert('NOMOR REKENING BERHASIL DISALIN'); }
    catch (err) { customAlert('GAGAL MENYALIN NOMOR'); }
    textArea.remove();
  }
}

// ================= FUNGSI TOGGLE ACCORDION (PANAH) =================
function toggleDebtHistory(histId) {
  const el = document.getElementById(histId);
  const icon = document.getElementById('icon_' + histId);
  if (el.style.display === 'none' || el.style.display === '') {
    el.style.display = 'block';
    icon.style.transform = 'rotate(180deg)';
  } else {
    el.style.display = 'none';
    icon.style.transform = 'rotate(0deg)';
  }
}

// ================= MODAL HANDLER =================
function openModal(id, mode = 'add', dataId = null) {
  document.getElementById(id).classList.add('active');
  populateSelects();

  document.querySelectorAll(`#${id} input`).forEach(i => {
    if (i.type !== 'datetime-local') i.value = '';
  });

  if (id === 'modal-income' || id === 'modal-expense') {
    const title = id === 'modal-income' ? 'inc' : 'exp';
    document.getElementById(`${title}-title`).innerText = mode === 'add' ? (id === 'modal-income' ? 'CATAT PEMASUKAN' : 'CATAT PENGELUARAN') : 'EDIT TRANSAKSI';
    if (mode === 'edit') {
      const trx = db.transactions.find(t => t.id === dataId);
      document.getElementById(`${title}-id`).value = trx.id;
      document.getElementById(`${title}-amount`).value = trx.amount;
      document.getElementById(`${title}-pocket`).value = trx.pocketId;
      document.getElementById(`${title}-desc`).value = trx.desc;
      document.getElementById(`${title}-date`).value = getLocalDatetimeString(trx.date);
    } else {
      document.getElementById(`${title}-date`).value = getLocalDatetimeString();
    }
  }

  if (id === 'modal-transfer') document.getElementById('tf-date').value = getLocalDatetimeString();

  if (id === 'modal-pocket') {
    document.getElementById('pkt-title').innerText = mode === 'add' ? 'KANTONG BARU' : 'EDIT KANTONG';
    if (mode === 'edit') {
      const pkt = db.pockets.find(p => p.id === dataId);
      document.getElementById('pkt-id').value = pkt.id;
      document.getElementById('pkt-name').value = pkt.name;
    }
  }

  if (id === 'modal-debt-main') {
    document.getElementById('debt-title').innerText = mode === 'add' ? 'CATAT HUTANG BARU' : 'EDIT NAMA HUTANG';
    if (mode === 'edit') {
      const debt = db.debts.find(d => d.id === dataId);
      document.getElementById('debt-id').value = debt.id;
      document.getElementById('debt-name').value = debt.name;
      document.getElementById('debt-amount').value = debt.amount;
      document.getElementById('debt-date').value = getLocalDatetimeString(debt.date);
    } else {
      document.getElementById('debt-date').value = getLocalDatetimeString();
    }
  }

  if (id === 'modal-debt-update') {
    document.getElementById('debt-up-title').innerText = mode === 'add' ? 'TAMBAH HUTANG SAYA (+)' : 'SAYA BAYAR HUTANG (-)';
    document.getElementById('debt-up-id').value = dataId;
    document.getElementById('debt-up-type').value = mode;
    document.getElementById('debt-up-date').value = getLocalDatetimeString();
  }
}

function closeModal(id) { document.getElementById(id).classList.remove('active'); }

function populateSelects() {
  const opts = db.pockets.map(p => `<option value="${p.id}">${p.name} (${formatRp(p.balance)})</option>`).join('');
  ['inc-pocket', 'exp-pocket', 'tf-from', 'tf-to'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.innerHTML = opts;
  });
}

// ================= TRANSAKSI & KANTONG =================
function processTrx(type) {
  const prefix = type === 'masuk' ? 'inc' : 'exp';
  const id = document.getElementById(`${prefix}-id`).value;
  const amount = parseFloat(document.getElementById(`${prefix}-amount`).value);
  const pocketId = document.getElementById(`${prefix}-pocket`).value;
  const desc = document.getElementById(`${prefix}-desc`).value.toUpperCase() || (type === 'masuk' ? 'MASUK' : 'KELUAR');

  const inputDate = document.getElementById(`${prefix}-date`).value;
  const finalDate = inputDate ? new Date(inputDate).toISOString() : new Date().toISOString();

  if (!amount || amount <= 0) return customAlert('JUMLAH TIDAK VALID');
  const pocket = db.pockets.find(p => p.id === pocketId);

  if (id) {
    const oldTrx = db.transactions.find(t => t.id === id);
    const oldPocket = db.pockets.find(p => p.id === oldTrx.pocketId);
    oldPocket.balance += oldTrx.type === 'masuk' ? -oldTrx.amount : oldTrx.amount;

    if (type === 'keluar' && pocket.balance < amount) {
      oldPocket.balance += oldTrx.type === 'masuk' ? oldTrx.amount : -oldTrx.amount;
      return customAlert('SALDO TIDAK CUKUP');
    }
    oldTrx.amount = amount; oldTrx.pocketId = pocketId; oldTrx.desc = desc; oldTrx.date = finalDate;
    pocket.balance += type === 'masuk' ? amount : -amount;
  } else {
    if (type === 'keluar' && pocket.balance < amount) return customAlert('SALDO TIDAK CUKUP');
    pocket.balance += type === 'masuk' ? amount : -amount;
    db.transactions.push({ id: 't_' + Date.now(), date: finalDate, type, amount, pocketId, desc });
  }
  closeModal(`modal-${type === 'masuk' ? 'income' : 'expense'}`); saveData();
}

function processTransfer() {
  const amount = parseFloat(document.getElementById('tf-amount').value);
  const fromId = document.getElementById('tf-from').value;
  const toId = document.getElementById('tf-to').value;

  const inputDate = document.getElementById('tf-date').value;
  const finalDate = inputDate ? new Date(inputDate).toISOString() : new Date().toISOString();

  if (!amount || fromId === toId) return customAlert('DATA TRANSFER TIDAK VALID');
  const pFrom = db.pockets.find(p => p.id === fromId);
  const pTo = db.pockets.find(p => p.id === toId);

  if (pFrom.balance < amount) return customAlert('SALDO KANTONG ASAL KURANG');
  pFrom.balance -= amount; pTo.balance += amount;

  db.transactions.push({ id: 't_out_' + Date.now(), date: finalDate, type: 'keluar', amount, pocketId: fromId, desc: 'TF KE ' + pTo.name });
  db.transactions.push({ id: 't_in_' + (Date.now() + 1), date: finalDate, type: 'masuk', amount, pocketId: toId, desc: 'TF DARI ' + pFrom.name });
  closeModal('modal-transfer'); saveData();
}

function processPocket() {
  const id = document.getElementById('pkt-id').value;
  const name = document.getElementById('pkt-name').value.toUpperCase();
  if (!name) return customAlert('NAMA KANTONG KOSONG');
  if (id !== "") db.pockets.find(p => p.id === id).name = name;
  else db.pockets.push({ id: 'p_' + Date.now(), name, balance: 0 });
  closeModal('modal-pocket'); saveData();
}

function deletePocket(id) {
  if (db.pockets.find(p => p.id === id).balance > 0) return customAlert('KOSONGKAN SALDO SEBELUM MENGHAPUS');
  customConfirm('HAPUS KANTONG INI?', () => { db.pockets = db.pockets.filter(p => p.id !== id); saveData(); });
}

function processAccount() {
  const bank = document.getElementById('acc-bank').value.toUpperCase();
  const num = document.getElementById('acc-num').value;
  const owner = document.getElementById('acc-owner').value.toUpperCase();
  if (!bank || !num) return customAlert('LENGKAPI DATA REKENING');
  db.accounts.push({ id: 'a_' + Date.now(), bank, num, owner });
  closeModal('modal-account'); saveData();
}

function delAcc(id) {
  customConfirm('HAPUS REKENING INI?', () => { db.accounts = db.accounts.filter(a => a.id !== id); saveData(); });
}

// ================= HUTANG SAYA =================
function processDebtMain() {
  const id = document.getElementById('debt-id').value;
  const name = document.getElementById('debt-name').value.toUpperCase();
  const amount = parseFloat(document.getElementById('debt-amount').value);

  const inputDate = document.getElementById('debt-date').value;
  const finalDate = inputDate ? new Date(inputDate).toISOString() : new Date().toISOString();

  if (!name || !amount || amount <= 0) return customAlert('DATA HUTANG TIDAK VALID');

  if (id) {
    const debt = db.debts.find(d => d.id === id);
    debt.name = name;
    if (debt.amount !== amount) {
      debt.amount = amount;
      debt.history.push({ id: 'dh_' + Date.now(), type: 'edit', amount, date: finalDate });
    }
  } else {
    db.debts.push({
      id: 'd_' + Date.now(),
      name,
      amount,
      date: finalDate,
      history: [{ id: 'dh_' + Date.now(), type: 'add', amount, date: finalDate }]
    });
  }
  closeModal('modal-debt-main'); saveData();
}

function processDebtUpdate() {
  const id = document.getElementById('debt-up-id').value;
  const type = document.getElementById('debt-up-type').value;
  const amount = parseFloat(document.getElementById('debt-up-amount').value);

  const inputDate = document.getElementById('debt-up-date').value;
  const finalDate = inputDate ? new Date(inputDate).toISOString() : new Date().toISOString();

  if (!amount || amount <= 0) return customAlert('NOMINAL TIDAK VALID');

  const debt = db.debts.find(d => d.id === id);
  if (type === 'sub' && amount > debt.amount) return customAlert('NOMINAL PEMBAYARAN MELEBIHI SISA HUTANG');

  if (type === 'add') debt.amount += amount;
  else debt.amount -= amount;

  debt.history.push({ id: 'dh_' + Date.now(), type, amount, date: finalDate });

  closeModal('modal-debt-update'); saveData();
}

function deleteDebt(id) {
  customConfirm('HAPUS CATATAN HUTANG INI BESERTA RIWAYATNYA?', () => {
    db.debts = db.debts.filter(d => d.id !== id); saveData();
  });
}

function deleteTrx(id) {
  customConfirm('HAPUS TRANSAKSI INI?', () => {
    const trx = db.transactions.find(t => t.id === id);
    if (!trx) return;
    const pkt = db.pockets.find(p => p.id === trx.pocketId);
    if (pkt) pkt.balance += trx.type === 'masuk' ? -trx.amount : trx.amount;
    db.transactions = db.transactions.filter(t => t.id !== id); saveData();
  });
}

function magicDelete() {
  const now = new Date();
  let count = 0;
  db.transactions.forEach(t => {
    const d = new Date(t.date);
    if (d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()) count++;
  });
  if (count === 0) return customAlert('TIDAK ADA DATA BULAN INI');

  customConfirm(`YAKIN HAPUS ${count} DATA BULAN INI?`, () => {
    const toKeep = [];
    db.transactions.forEach(t => {
      const d = new Date(t.date);
      if (d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()) {
        const p = db.pockets.find(pk => pk.id === t.pocketId);
        if (p) p.balance += t.type === 'masuk' ? -t.amount : t.amount;
      } else toKeep.push(t);
    });
    db.transactions = toKeep; saveData();
    customAlert('DATA BULAN INI BERHASIL DIBERSIHKAN');
  });
}

function deleteAllHistory() {
  customConfirm('HAPUS SEMUA DATA TRANSAKSI? SALDO KANTONG AKAN JADI 0', () => {
    db.transactions = []; db.pockets.forEach(p => p.balance = 0); saveData();
    customAlert('SEMUA DATA BERHASIL DIHAPUS');
  });
}

// ================= RENDER TAMPILAN =================
function renderAll() {
  const total = db.pockets.reduce((sum, p) => sum + p.balance, 0);
  document.getElementById('total-balance').innerText = formatRp(total);

  // KANTONG
  document.getElementById('pocket-list').innerHTML = db.pockets.map(p => `
        <div class="neu-list-item">
            <div><div class="list-title">${p.name}</div><div class="list-sub">SALDO</div></div>
            <div class="list-right-actions">
                <div class="list-value text-primary">${formatRp(p.balance)}</div>
                <div class="action-btn-group">
                    <button class="neu-btn neu-mini-btn" onclick="openModal('modal-pocket', 'edit', '${p.id}')">EDIT</button>
                    ${p.balance === 0 ? `<button class="neu-btn neu-mini-btn" onclick="deletePocket('${p.id}')">HAPUS</button>` : ''}
                </div>
            </div>
        </div>
    `).join('');

  // REKENING
  document.getElementById('account-list').innerHTML = db.accounts.map(a => `
        <div class="neu-list-item" style="flex-direction: column; gap: 12px; align-items: flex-start;">
            <div style="width: 100%; display: flex; justify-content: space-between; align-items: center;">
                <div class="list-title text-primary">${a.bank}</div>
                <div class="list-sub" style="margin:0; font-weight:700;">A/N: ${a.owner}</div>
            </div>
            <div class="neu-inset" style="padding: 12px; display: flex; justify-content: space-between; align-items: center; width: 100%;">
                <div class="list-value" style="font-size: 1.2rem; letter-spacing: 1px;">${a.num}</div>
                <button class="neu-btn neu-mini-btn text-primary" style="margin-left:10px;" onclick="copyAccount('${a.num}')">SALIN</button>
            </div>
            <button class="neu-btn w-100 mt-10" onclick="delAcc('${a.id}')">HAPUS REKENING</button>
        </div>
    `).join('');

  // HUTANG (Dengan Toggle Buka Tutup Riwayat)
  const debtHTML = db.debts.length === 0 ? '<p style="text-align:center; color:var(--text-muted); font-size:0.9rem;">BELUM ADA CATATAN HUTANG</p>' : db.debts.map(d => {
    const dDate = new Date(d.date).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }).toUpperCase();

    const sortedHistory = (d.history || []).sort((a, b) => new Date(b.date) - new Date(a.date));
    const historyHTML = sortedHistory.map(h => {
      const hDate = new Date(h.date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }) + ' | ' + new Date(h.date).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }).replace(/:/g, '.');
      let sign = '', colorClass = '', label = '';

      if (h.type === 'add') { sign = '+'; colorClass = 'text-expense'; label = 'Hutang Bertambah'; }
      else if (h.type === 'sub') { sign = '-'; colorClass = 'text-income'; label = 'Pembayaran Hutang'; }
      else { sign = ''; colorClass = 'text-primary'; label = 'Koreksi Data'; }

      return `
            <div style="display:flex; justify-content:space-between; margin-bottom:10px; padding-bottom:10px; border-bottom:1px solid var(--border-edge);">
                <div>
                    <div style="font-size:0.85rem; font-weight:700; color:var(--text-main);">${label}</div>
                    <div style="font-size:0.7rem; color:var(--text-muted);">${hDate}</div>
                </div>
                <div class="${colorClass}" style="font-size:1rem; font-weight:700; align-self:center;">${sign} ${formatRp(h.amount)}</div>
            </div>`;
    }).join('');

    return `
        <div class="neu-list-item" style="flex-direction: column; gap: 12px; align-items: flex-start;">
            <div style="width: 100%; display: flex; justify-content: space-between; align-items: center;">
                <div class="list-title text-primary">${d.name}</div>
                <div class="list-sub" style="margin:0; font-weight:700;">TGL: ${dDate}</div>
            </div>
            
            <div class="neu-inset" style="padding: 12px; width: 100%; text-align: center;">
                <div class="list-sub" style="margin-bottom: 5px;">SISA HUTANG SAYA:</div>
                <div class="list-value text-expense" style="font-size: 1.5rem;">${formatRp(d.amount)}</div>
            </div>
            
            <div style="width: 100%; margin-top: 5px;">
                <div style="display:flex; justify-content:space-between; align-items:center; cursor:pointer; padding:5px 0;" onclick="toggleDebtHistory('hist_${d.id}')">
                    <div style="font-size: 0.8rem; color: var(--text-muted); font-weight:700;">RIWAYAT PERUBAHAN</div>
                    <svg id="icon_hist_${d.id}" style="transition:transform 0.3s; width:16px; height:16px; color:var(--text-muted);" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"></polyline></svg>
                </div>
                <div id="hist_${d.id}" class="neu-inset mt-10" style="display:none; max-height: 150px; overflow-y: auto; padding: 12px; border-radius: 12px; background: transparent;">
                    ${historyHTML}
                </div>
            </div>

            <div class="grid-2 w-100 mt-10">
                <button class="neu-btn neu-mini-btn text-expense" onclick="openModal('modal-debt-update', 'add', '${d.id}')">+ HUTANG</button>
                <button class="neu-btn neu-mini-btn text-income" onclick="openModal('modal-debt-update', 'sub', '${d.id}')">- BAYAR</button>
            </div>
            <div class="grid-2 w-100 mt-10">
                <button class="neu-btn neu-mini-btn text-primary" onclick="openModal('modal-debt-main', 'edit', '${d.id}')">EDIT</button>
                <button class="neu-btn neu-mini-btn" onclick="deleteDebt('${d.id}')">HAPUS</button>
            </div>
        </div>`;
  }).join('');
  document.getElementById('debt-list').innerHTML = debtHTML;

  // RIWAYAT TRANSAKSI UTAMA
  const hist = document.getElementById('history-list'); hist.innerHTML = '';
  const sorted = [...db.transactions].sort((a, b) => new Date(b.date) - new Date(a.date));
  let lastDate = '';

  sorted.forEach(t => {
    const d = new Date(t.date);
    const dStr = d.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }).toUpperCase();
    if (dStr !== lastDate) {
      hist.innerHTML += `<div class="list-sub mt-20" style="color:var(--primary); font-weight:700;">${dStr}</div>`;
      lastDate = dStr;
    }
    const pktName = db.pockets.find(p => p.id === t.pocketId)?.name || 'DIHAPUS';
    const isMasuk = t.type === 'masuk';
    hist.innerHTML += `
        <div class="neu-list-item">
            <div><div class="list-title">${t.desc}</div><div class="list-sub">${d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }).replace(/:/g, '.')} | ${pktName}</div></div>
            <div class="list-right-actions">
                <div class="list-value ${isMasuk ? 'text-income' : 'text-expense'}">${isMasuk ? '+' : '-'}${formatRp(t.amount)}</div>
                <div class="action-btn-group">
                    <button class="neu-btn neu-mini-btn" onclick="openModal('modal-${isMasuk ? 'income' : 'expense'}', 'edit', '${t.id}')">EDIT</button>
                    <button class="neu-btn neu-mini-btn" onclick="deleteTrx('${t.id}')">HAPUS</button>
                </div>
            </div>
        </div>`;
  });
}

function calc(v) {
  let cVal = document.getElementById('calc-display').innerText;
  if (v === 'C') cVal = '0';
  else if (v === 'DEL') cVal = cVal.length > 1 ? cVal.slice(0, -1) : '0';
  else if (v === '=') { try { cVal = eval(cVal).toString(); } catch { cVal = 'ERROR'; } }
  else { if (cVal === '0' && v !== '.') cVal = v; else cVal += v; }
  document.getElementById('calc-display').innerText = cVal;
}

// ================= GRAFIK =================
let barChart, pieChart;

function renderCharts() {
  try {
    if (!window.Chart) return;
    const ctxBar = document.getElementById('cashflowChart').getContext('2d');
    const ctxPie = document.getElementById('allocationChart').getContext('2d');

    const compStyle = getComputedStyle(document.documentElement);
    const pColor = compStyle.getPropertyValue('--primary').trim();
    const textCol = db.theme === 'dark' ? '#ffffff' : '#111111';

    const incomeColor = '#2b9348';
    const expenseColor = '#d90429';
    const todayStrRaw = new Date().toISOString().split('T')[0];

    let map = {};
    db.transactions.forEach(t => {
      const rawDate = new Date(t.date).toISOString().split('T')[0];
      if (!map[rawDate]) map[rawDate] = { in: 0, out: 0 };
      if (t.type === 'masuk') map[rawDate].in += t.amount; else map[rawDate].out += t.amount;
    });

    const rawLabels = Object.keys(map).sort();
    const displayLabels = rawLabels.map(d => {
      if (d === todayStrRaw) return "HARI INI";
      return new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });
    });

    const chartWrapper = document.getElementById('chart-wrapper-div');
    const chartScrollBox = document.getElementById('chart-scroll-box');
    const minWidthCalculated = rawLabels.length * 120;
    const containerWidth = chartScrollBox.clientWidth;
    chartWrapper.style.width = Math.max(containerWidth, minWidthCalculated) + 'px';

    const dataIn = rawLabels.map(l => map[l].in);
    const dataOut = rawLabels.map(l => map[l].out);
    const dataNet = rawLabels.map(l => map[l].in - map[l].out);

    if (barChart) barChart.destroy();
    barChart = new Chart(ctxBar, {
      type: 'bar',
      data: {
        labels: displayLabels,
        datasets: [
          {
            type: 'line',
            label: 'NET CASHFLOW',
            data: dataNet,
            borderColor: pColor,
            backgroundColor: pColor,
            borderWidth: 3,
            tension: 0.3,
            pointBackgroundColor: textCol,
            pointRadius: 4,
            fill: false,
            yAxisID: 'y'
          },
          {
            type: 'bar',
            label: 'MASUK',
            data: dataIn,
            backgroundColor: incomeColor,
            barPercentage: 0.6,
            categoryPercentage: 0.7,
            borderRadius: 4,
            yAxisID: 'y'
          },
          {
            type: 'bar',
            label: 'KELUAR',
            data: dataOut,
            backgroundColor: expenseColor,
            barPercentage: 0.6,
            categoryPercentage: 0.7,
            borderRadius: 4,
            yAxisID: 'y'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: { ticks: { color: textCol, font: { weight: 'bold' } } },
          y: { ticks: { color: textCol } }
        },
        plugins: { legend: { labels: { color: textCol, font: { family: 'Rajdhani', weight: 700 } } } }
      }
    });

    if (pieChart) pieChart.destroy();
    const pieColors = db.theme === 'dark'
      ? [pColor, '#ffffff', '#ce93d8', '#757575', '#424242']
      : [pColor, '#111111', '#7e57c2', '#9e9e9e', '#e0e0e0'];

    pieChart = new Chart(ctxPie, {
      type: 'doughnut',
      data: {
        labels: db.pockets.map(p => p.name),
        datasets: [{ data: db.pockets.map(p => p.balance), backgroundColor: pieColors, borderWidth: 0 }]
      },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { color: textCol, font: { family: 'Rajdhani', weight: 700 } } } } }
    });
  } catch (e) { console.log("Menunggu Chart..."); }
}