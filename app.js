
// CapMyBeast - PWA Skeleton in Plain JS (Svelte-ready Concept)

/*
📁 Folder Structure (ideal for GitHub Pages or Netlify)
/ 
├── index.html
├── app.js
├── styles.css
├── assets/
│   └── beasts/*.svg
└── manifest.json
*/

const state = {
  currentWeekId: getCurrentWeekId(),
  data: {},
};

function getCurrentWeekId() {
  const now = new Date();
  const oneJan = new Date(now.getFullYear(), 0, 1);
  const week = Math.ceil((((now - oneJan) / 86400000) + oneJan.getDay() + 1) / 7);
  return `${now.getFullYear()}-W${week}`;
}

function loadWeekData() {
  const saved = localStorage.getItem(state.currentWeekId);
  if (saved) {
    state.data = JSON.parse(saved);
  } else {
    state.data = { cap: 0, spend: 0, beast: "dragon" };
  }
}

function saveWeekData() {
  localStorage.setItem(state.currentWeekId, JSON.stringify(state.data));
  renderDashboard();
}

function setCap(amount) {
  state.data.cap = amount;
  saveWeekData();
}

function logSpend(amount) {
  state.data.spend = amount;
  saveWeekData();
}

function renderDashboard() {
  const beastFill = document.querySelector("#beast-fill");
  const cap = state.data.cap;
  const spend = state.data.spend;
  const percent = Math.min((spend / cap) * 100, 100);
  if (beastFill) {
    beastFill.style.height = `${percent}%`;
  }

  document.querySelector("#cap-value").innerText = `$${cap}`;
  document.querySelector("#spend-value")?.innerText = `$${spend}`;
  document.querySelector("#streak-display")?.innerText = "🔥🔥🔥🔥"; // Placeholder
}

// Init
loadWeekData();
document.addEventListener("DOMContentLoaded", () => {
  renderDashboard();

  document.querySelector("#set-cap-btn")?.addEventListener("click", () => {
    const cap = parseFloat(prompt("Set your weekly spending cap:"));
    if (!isNaN(cap)) setCap(cap);
  });

  document.querySelector("#log-spend-btn")?.addEventListener("click", () => {
    const spend = parseFloat(prompt("Enter this week’s total spend:"));
    if (!isNaN(spend)) logSpend(spend);
  });
});

