// app.js — CapMyBeast PWA with robust validation, accessibility, reaction emojis & emotion states

// DOM references
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

// Load beast options from JSON with error handling
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

    // Auto‑init if a Beast was already selected
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

// Handle Beast selection
function selectBeast(id) {
  localStorage.setItem('beastId', id);
  onboardEl?.classList.add('hidden');
  dashEl?.classList.remove('hidden');
  initDashboard();
}

// Initialize dashboard: week rollover, cap prompt, previous progress, streak
function initDashboard() {
  const weekId       = getWeekId();
  const lastUsedWeek = localStorage.getItem("currentWeekId");

  // New week detected?
  if (lastUsedWeek && lastUsedWeek !== weekId) {
    console.log("⏭️ New week detected!");
    localStorage.removeItem("weeklyCap");
    localStorage.removeItem(`week-${lastUsedWeek}`);
    renderBeastBar(0);
  }

  localStorage.setItem("currentWeekId", weekId);

  // Load saved data for this week
  const saved = localStorage.getItem(`week-${weekId}`);
  let cap = saved
    ? JSON.parse(saved).cap
    : localStorage.getItem("weeklyCap");

  // Robust prompt for cap
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

  // Update UI cap & streak
  if (capDisplay) capDisplay.textContent = cap;
  setStreakCount(getStreakCount());

  // Render previous progress or empty bar
  if (saved) {
    const spent = JSON.parse(saved).spent || 0;
    const pct   = Math.min(100, Math.round((spent / cap) * 100));
    renderBeastBar(pct);
  } else {
    renderBeastBar(0);
  }
}

// Render the Beast SVG with clip‑path fill and emotion states
function renderBeastBar(percent) {
  const beastId  = localStorage.getItem('beastId');
  const beast    = beasts.find(b => b.id === beastId);
  const container = getEl('beast-bar-container');
  if (!container || !beast) return;

  // Remove any existing reaction emoji
  const oldReaction = container.querySelector('.beast-reaction');
  if (oldReaction) oldReaction.remove();

  // Clamp percent
  const pct = Math.max(0, Math.min(100, percent));

  // Inject the clipped SVG
  container.innerHTML = `
    <svg
      id="beast-svg"
      viewBox="0 0 100 100"
      class="beast-svg"
      width="100"
      height="100"
      aria-label="${beast.label}"
    >
      <defs>
        <clipPath id="barClip">
          <rect y="${100 - pct}" width="100" height="${pct}"></rect>
        </clipPath>
      </defs>
      <image
        clip-path="url(#barClip)"
        href="assets/beasts/${beast.file}"
        width="100"
        height="100"
        alt="${beast.label}"
      />
    </svg>
  `;

  // Apply emotion state class
  const svgEl = getEl('beast-svg');
  if (svgEl) {
    svgEl.classList.remove('state-calm','state-anxious','state-furious');
    if (pct <= 70)      svgEl.classList.add('state-calm');
    else if (pct <= 90) svgEl.classList.add('state-anxious');
    else                svgEl.classList.add('state-furious');
  }
}

// Compute week ID (Jan 1–based)
function getWeekId() {
  const now    = new Date();
  const oneJan = new Date(now.getFullYear(), 0, 1);
  const days   = Math.ceil((now - oneJan) / 86400000);
  const week   = Math.ceil((days + oneJan.getDay() + 1) / 7);
  return `${now.getFullYear()}-W${week}`;
}

// Streak helpers
function getStreakCount() {
  return parseInt(localStorage.getItem('streakCount')) || 0;
}
function setStreakCount(val) {
  localStorage.setItem('streakCount', val);
  const streakEl = getEl('streak-count');
  if (streakEl) streakEl.textContent = val;
}

// Log‐spend button logic (validation, persistence, reactions, streak updates)
const logSpendBtn = getEl('log-spend');
if (logSpendBtn) {
  logSpendBtn.onclick = () => {
    const cap = parseFloat(localStorage.getItem('weeklyCap'));
    if (!cap || isNaN(cap) || cap <= 0) {
      alert("Weekly cap not set. Please reload and set your cap.");
      return;
    }

    let spent = prompt(`You set $${cap}. How much did you spend?`);
    if (spent === null) return;  // user cancelled
    spent = spent.trim();
    if (!spent || isNaN(spent) || Number(spent) < 0) {
      alert("Please enter a valid number.");
      return;
    }
    spent = Number(spent);

    // Render bar & persist data
    const pct = Math.min(100, Math.round((spent / cap) * 100));
    renderBeastBar(pct);

    const weekId = getWeekId();
    localStorage.setItem(`week-${weekId}`, JSON.stringify({ cap, spent }));

    // Streak logic
    const lastWeekId = localStorage.getItem("lastWeekId");
    let streakCount  = getStreakCount();
    let streakMessage = "";

    if (spent <= cap) {
      if (lastWeekId && lastWeekId !== weekId) {
        setStreakCount(streakCount + 1);
        streakMessage = "Congrats! Streak increased!";
      } else if (!lastWeekId) {
        setStreakCount(1);
        streakMessage = "First week tracked! Streak started!";
      } else {
        streakMessage = "Good job! Cap not exceeded.";
      }
    } else {
      setStreakCount(0);
      streakMessage = "Cap exceeded. Streak reset.";
    }

    localStorage.setItem("lastWeekId", weekId);

    // Show reaction emoji
    const container = getEl('beast-bar-container');
    if (container) {
      const old = container.querySelector('.beast-reaction');
      if (old) old.remove();
      const reaction = document.createElement('div');
      reaction.className = 'beast-reaction';
      reaction.setAttribute('role','status');
      reaction.setAttribute('aria-live','polite');
      reaction.textContent = spent <= cap ? "😄" : "😞";
      if (streakMessage) reaction.title = streakMessage;
      container.appendChild(reaction);
      setTimeout(() => reaction.remove(), 3000);
    }
  };
}
