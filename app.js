
// app.js — Full version with updated renderBeastBar() and emotion overlay for PNG beasts

const beastsEl    = getEl('beast-choices');
const capDisplay  = getEl('cap-value');
const dashEl      = getEl('dashboard');
const onboardEl   = getEl('onboard');
let beasts        = [];

// Utility: Safe DOM lookup
function getEl(id) {
  const el = document.getElementById(id);
  if (!el) console.error(`Element with id "${id}" not found.`);
  return el;
}

// Load beast options
fetch('beasts.json')
  .then(r => r.json())
  .then(data => {
    beasts = data;
    data.forEach(b => {
      const btn = document.createElement('button');
      btn.innerHTML = `<img src="assets/beasts/${b.file}" alt="${b.label}"><div>${b.label}</div>`;
      btn.setAttribute('aria-label', b.label);
      btn.setAttribute('title', b.label);
      btn.onclick = () => selectBeast(b.id);
      beastsEl?.appendChild(btn);
    });

    if (localStorage.getItem('beastId')) {
      onboardEl?.classList.add('hidden');
      dashEl?.classList.remove('hidden');
      initDashboard();
    }
  })
  .catch(err => {
    alert("Failed to load beast options. Please try refreshing the page.");
    console.error("Error loading beasts.json:", err);
  });

function selectBeast(id) {
  localStorage.setItem('beastId', id);
  onboardEl?.classList.add('hidden');
  dashEl?.classList.remove('hidden');
  initDashboard();
}

function initDashboard() {
  const weekId = getWeekId();
  const lastUsedWeek = localStorage.getItem("currentWeekId");

  if (lastUsedWeek && lastUsedWeek !== weekId) {
    localStorage.removeItem("weeklyCap");
    localStorage.removeItem(`week-${lastUsedWeek}`);
    renderBeastBar(0);
  }

  localStorage.setItem("currentWeekId", weekId);

  const saved = localStorage.getItem(`week-${weekId}`);
  let cap = saved ? JSON.parse(saved).cap : localStorage.getItem("weeklyCap");

  while (!cap || isNaN(cap) || Number(cap) <= 0) {
    cap = prompt("Set your weekly spend cap:");
    if (cap === null) {
      alert("Weekly cap is required to continue.");
      return;
    }
    cap = cap.trim();
    if (!cap || isNaN(cap) || Number(cap) <= 0) {
      alert("Please enter a valid number.");
    }
  }
  cap = Number(cap);
  localStorage.setItem("weeklyCap", cap);
  capDisplay.textContent = cap;
  setStreakCount(getStreakCount());

  if (saved) {
    const spent = JSON.parse(saved).spent || 0;
    const pct = Math.min(100, Math.round((spent / cap) * 100));
    renderBeastBar(pct);
  } else {
    renderBeastBar(0);
  }
}

function renderBeastBar(percent) {
  const beastId = localStorage.getItem('beastId');
  const beast = beasts.find(b => b.id === beastId);
  const container = getEl('beast-bar-container');
  if (!container || !beast) return;

  const pct = Math.max(0, Math.min(100, percent));
  container.innerHTML = `
    <div class="beast-static-container">
      <img src="assets/beasts/${beast.file}" alt="${beast.label}" class="beast-img"/>
      <div class="beast-overlay ${getMoodClass(pct)}">${getBeastEmoji(pct)}</div>
    </div>
  `;
}

function getBeastEmoji(percent) {
  if (percent <= 70) return "😄";
  if (percent <= 90) return "😐";
  return "😞";
}

function getMoodClass(percent) {
  if (percent <= 70) return "mood-happy";
  if (percent <= 90) return "mood-warning";
  return "mood-angry";
}

function getWeekId() {
  const now = new Date();
  const oneJan = new Date(now.getFullYear(), 0, 1);
  const days = Math.ceil((now - oneJan) / 86400000);
  const week = Math.ceil((days + oneJan.getDay() + 1) / 7);
  return `${now.getFullYear()}-W${week}`;
}

function getStreakCount() {
  return parseInt(localStorage.getItem('streakCount')) || 0;
}
function setStreakCount(val) {
  localStorage.setItem('streakCount', val);
  const streakEl = getEl('streak-count');
  if (streakEl) streakEl.textContent = val;
}

const logSpendBtn = getEl('log-spend');
if (logSpendBtn) {
  logSpendBtn.onclick = () => {
    const cap = parseFloat(localStorage.getItem('weeklyCap'));
    if (!cap || isNaN(cap) || cap <= 0) {
      alert("Weekly cap not set. Please reload and set your cap.");
      return;
    }

    let spent = prompt(`You set $${cap}. How much did you spend?`);
    if (spent === null) return;
    spent = spent.trim();
    if (!spent || isNaN(spent) || Number(spent) < 0) {
      alert("Please enter a valid number.");
      return;
    }
    spent = Number(spent);
    const pct = Math.min(100, Math.round((spent / cap) * 100));
    renderBeastBar(pct);
    const weekId = getWeekId();
    localStorage.setItem(`week-${weekId}`, JSON.stringify({ cap, spent }));

    const lastWeekId = localStorage.getItem("lastWeekId");
    let streakCount = getStreakCount();
    if (spent <= cap) {
      if (lastWeekId && lastWeekId !== weekId) {
        setStreakCount(streakCount + 1);
      } else if (!lastWeekId) {
        setStreakCount(1);
      }
    } else {
      setStreakCount(0);
    }
    localStorage.setItem("lastWeekId", weekId);
  };
}
