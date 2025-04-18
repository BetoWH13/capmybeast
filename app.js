// CapMyBeast - Full app.js with streak tracking and weekly spend logic

const beastsEl = document.getElementById('beast-choices');
const capDisplay = document.getElementById('cap-value');
const dashEl = document.getElementById('dashboard');
const onboardEl = document.getElementById('onboard');
let beasts = [];

// Load beast options from JSON
fetch('beasts.json')
  .then(r => r.json())
  .then(data => {
    beasts = data;
    data.forEach(b => {
      const btn = document.createElement('button');
      btn.innerHTML = `<img src="assets/beasts/${b.file}" alt="${b.label}"><div>${b.label}</div>`;
      btn.onclick = () => selectBeast(b.id);
      beastsEl.appendChild(btn);
    });

    // Auto-init if beast was already picked
    if (localStorage.getItem('beastId')) {
      onboardEl.classList.add('hidden');
      dashEl.classList.remove('hidden');
      initDashboard();
    }
  });

// Handle beast selection
function selectBeast(id) {
  localStorage.setItem('beastId', id);
  onboardEl.classList.add('hidden');
  dashEl.classList.remove('hidden');
  initDashboard();
}

// Setup dashboard and beast bar
function initDashboard() {
  const weekId = getWeekId();
  const saved = localStorage.getItem(`week-${weekId}`);
  const cap = saved ? JSON.parse(saved).cap : prompt('Set your weekly spend cap:');
  if (!cap || isNaN(cap) || cap <= 0) return alert("Please enter a valid number.");
  localStorage.setItem('weeklyCap', cap);
  capDisplay.textContent = cap;
  renderBeastBar(0);
  setStreakCount(getStreakCount());
}

// Render beast with dynamic clip-path fill
function renderBeastBar(percent) {
  const beast = beasts.find(b => b.id === localStorage.getItem('beastId'));
  const container = document.getElementById('beast-bar-container');
  container.innerHTML = `
    <svg viewBox="0 0 100 100" class="beast-svg" width="100" height="100">
      <defs>
        <clipPath id="barClip"><rect y="${100 - percent}" width="100" height="${percent}"></rect></clipPath>
      </defs>
      <image clip-path="url(#barClip)" href="assets/beasts/${beast.file}" width="100" height="100"/>
    </svg>`;
}

// Week ID logic
function getWeekId() {
  const now = new Date();
  const oneJan = new Date(now.getFullYear(), 0, 1);
  const week = Math.ceil((((now - oneJan) / 86400000) + oneJan.getDay() + 1) / 7);
  return `${now.getFullYear()}-W${week}`;
}

// Streak helpers
function getStreakCount() {
  return parseInt(localStorage.getItem('streakCount')) || 0;
}

function setStreakCount(val) {
  localStorage.setItem('streakCount', val);
  const streakEl = document.getElementById('streak-count');
  if (streakEl) streakEl.textContent = val;
}

// Log weekly spend
document.getElementById('log-spend').onclick = () => {
  const cap = +localStorage.getItem('weeklyCap');
  const spent = +prompt(`You set $${cap}. How much did you spend?`);
  if (isNaN(spent) || spent <= 0) return alert("Please enter a valid number.");

  const pct = Math.min(100, Math.round((spent / cap) * 100));
  renderBeastBar(pct);

  const weekId = getWeekId();
  localStorage.setItem(`week-${weekId}`, JSON.stringify({ cap, spent }));

  const lastWeekId = localStorage.getItem("lastWeekId");
  const streakCount = getStreakCount();

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


