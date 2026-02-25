// State
let allTopics = [];
let currentCat = 'all';
let currentDate = getTodayStr();
let availableDates = []; // sorted ascending

function getTodayStr() {
  return new Date().toISOString().slice(0, 10);
}

function formatDate(str) {
  const d = new Date(str + 'T00:00:00');
  return d.toLocaleDateString(currentLang === 'zh' ? 'zh-CN' : 'en-US', {
    year: 'numeric', month: 'long', day: 'numeric'
  });
}

function formatSettlement(isoStr) {
  const d = new Date(isoStr);
  return d.toLocaleDateString(currentLang === 'zh' ? 'zh-CN' : 'en-US', {
    year: 'numeric', month: 'short', day: 'numeric'
  });
}

// Load index.json to get all available dates
async function loadIndex() {
  try {
    const res = await fetch(`data/index.json?v=${Date.now()}`);
    if (!res.ok) throw new Error('no index');
    const json = await res.json();
    availableDates = (json.dates || []).sort();
  } catch {
    // fallback: try to detect from known files
    availableDates = [];
  }
  renderNavState();
}

// Load data for a specific date (exact, no fallback — index tells us what's available)
async function loadData(dateStr) {
  const grid = document.getElementById('cardsGrid');
  grid.innerHTML = `<div class="loading">${t('loading')}</div>`;
  try {
    const res = await fetch(`data/${dateStr}.json?v=${Date.now()}`);
    if (!res.ok) throw new Error('not found');
    const json = await res.json();
    if (!json.topics || json.topics.length === 0) throw new Error('empty');
    allTopics = json.topics;
    currentDate = dateStr;
    document.getElementById('dateDisplay').textContent = formatDate(dateStr);
    renderNavState();
    renderStats();
    renderCards();
  } catch {
    allTopics = [];
    grid.innerHTML = `<div class="loading">${t('no_data')}</div>`;
    renderStats();
  }
}

// Update prev/next button states and archive info
function renderNavState() {
  const prevBtn = document.getElementById('prevDate');
  const nextBtn = document.getElementById('nextDate');
  const archiveEl = document.getElementById('archiveInfo');

  if (availableDates.length > 0) {
    const idx = availableDates.indexOf(currentDate);
    prevBtn.disabled = idx <= 0;
    nextBtn.disabled = idx < 0 || idx >= availableDates.length - 1;
    prevBtn.style.opacity = prevBtn.disabled ? '0.3' : '1';
    nextBtn.style.opacity = nextBtn.disabled ? '0.3' : '1';

    // Archive info
    const totalTopics = availableDates.length * 30;
    if (archiveEl) {
      archiveEl.innerHTML = currentLang === 'zh'
        ? `📚 已收录 <strong>${availableDates.length}</strong> 天 · <strong>${totalTopics}</strong> 条话题`
        : `📚 <strong>${availableDates.length}</strong> days · <strong>${totalTopics}</strong> topics archived`;
    }
  }
}

// Category config (order = display order)
const CATEGORIES = [
  { id: 'politics',      color: 'var(--pol)', statKey: 'stat_politics' },
  { id: 'elections',     color: 'var(--ele)', statKey: 'stat_elections' },
  { id: 'finance',       color: 'var(--fin)', statKey: 'stat_finance' },
  { id: 'economics',     color: 'var(--eco)', statKey: 'stat_finance' },   // old data compat
  { id: 'world-economy', color: 'var(--wec)', statKey: 'stat_world_economy' },
  { id: 'earnings',      color: 'var(--ear)', statKey: 'stat_earnings' },
  { id: 'crypto',        color: 'var(--cry)', statKey: 'stat_crypto' },
  { id: 'tech',          color: 'var(--tec)', statKey: 'stat_tech' },
  { id: 'sports',        color: 'var(--spo)', statKey: 'stat_sports' },
  { id: 'culture',       color: 'var(--cul)', statKey: 'stat_culture' },
];

// Stats row — only show categories that have topics today
function renderStats() {
  const counts = {};
  allTopics.forEach(topic => {
    counts[topic.category] = (counts[topic.category] || 0) + 1;
  });
  const row = document.getElementById('statsRow');
  row.innerHTML = CATEGORIES
    .filter(c => counts[c.id] > 0)
    .map(c => `
      <div class="stat-chip">
        <span class="stat-dot" style="background:${c.color}"></span>
        <span class="stat-num">${counts[c.id]}</span>
        <span class="stat-label">${t(c.statKey)}</span>
      </div>
    `).join('');
}

// Cards
function renderCards() {
  const grid = document.getElementById('cardsGrid');
  const filtered = currentCat === 'all' ? allTopics : allTopics.filter(t => t.category === currentCat);
  if (!filtered.length) {
    grid.innerHTML = `<div class="loading">${t('no_data')}</div>`;
    return;
  }
  grid.innerHTML = filtered.map(topic => buildCard(topic)).join('');
}

function buildCard(topic) {
  const lang = currentLang;
  const title = topic.title[lang] || topic.title.zh;
  const yesRule = topic.rules.yes[lang] || topic.rules.yes.zh;
  const noRule = topic.rules.no[lang] || topic.rules.no.zh;
  const catLabel = t('cat_' + topic.category);
  const settle = formatSettlement(topic.settlement);
  const { yes, no, yes_prob, no_prob } = topic.odds;
  const source = topic.source || null;
  const isBreaking = topic.breaking || false;

  const sourceHtml = source ? `
    <a class="source-link" href="${source.url}" target="_blank" rel="noopener">
      <span class="source-icon">📰</span>
      <span>${source.name}</span>
    </a>` : '';

  const breakingBadge = isBreaking ? `<span class="breaking-badge">🔴 BREAKING</span>` : '';

  return `
    <div class="card ${isBreaking ? 'card-breaking' : ''}" data-id="${topic.id}">
      <div class="card-header">
        <div class="card-title">${breakingBadge}${title}</div>
        <span class="cat-badge ${topic.category}">${catLabel}</span>
      </div>
      <div class="rules">
        <div class="rule yes">
          <span class="rule-icon">✅</span>
          <span>${yesRule}</span>
        </div>
        <div class="rule no">
          <span class="rule-icon">❌</span>
          <span>${noRule}</span>
        </div>
      </div>
      <div class="card-footer">
        <div class="settlement">
          <span class="settlement-icon">🕐</span>
          <span>${t('settlement_label')}: ${settle}</span>
        </div>
        ${sourceHtml}
      </div>
      <div class="odds-row">
        <div class="odds-btn yes-btn">
          <span class="odds-label">${t('yes')}</span>
          <span class="odds-value">${yes.toFixed(2)}</span>
          <span class="odds-prob">${yes_prob}%</span>
        </div>
        <div class="odds-btn no-btn">
          <span class="odds-label">${t('no')}</span>
          <span class="odds-value">${no.toFixed(2)}</span>
          <span class="odds-prob">${no_prob}%</span>
        </div>
      </div>
    </div>
  `;
}

// Tabs
document.getElementById('tabs').addEventListener('click', e => {
  const tab = e.target.closest('.tab');
  if (!tab) return;
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  tab.classList.add('active');
  currentCat = tab.dataset.cat;
  renderCards();
});

// Date nav — jump to prev/next AVAILABLE date
function shiftDate(delta) {
  if (availableDates.length === 0) return;
  const idx = availableDates.indexOf(currentDate);
  let nextIdx;
  if (idx < 0) {
    nextIdx = delta < 0 ? availableDates.length - 1 : 0;
  } else {
    nextIdx = idx + delta;
  }
  if (nextIdx < 0 || nextIdx >= availableDates.length) return;
  currentDate = availableDates[nextIdx];
  loadData(currentDate);
}

document.getElementById('prevDate').addEventListener('click', () => shiftDate(-1));
document.getElementById('nextDate').addEventListener('click', () => shiftDate(1));

// Re-render on lang change
function renderAll() {
  applyI18n();
  document.getElementById('dateDisplay').textContent = formatDate(currentDate);
  renderNavState();
  renderStats();
  renderCards();
}

// Init: load index first, then load the latest available date
async function init() {
  applyI18n();
  await loadIndex();
  // Start from latest available date (or today)
  const today = getTodayStr();
  if (availableDates.length > 0) {
    // Pick latest date that is <= today
    const valid = availableDates.filter(d => d <= today);
    currentDate = valid.length > 0 ? valid[valid.length - 1] : availableDates[availableDates.length - 1];
  }
  loadData(currentDate);
}

init();
