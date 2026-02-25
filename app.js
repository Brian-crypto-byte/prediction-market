// State
let allTopics = [];
let currentCat = 'all';
let currentDate = getTodayStr();
let availableDates = []; // sorted ascending

function getTodayStr() {
  // 用本地时间，避免 UTC 偏差导致跨日显示错误
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
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
    // 兼容数组格式和 {topics:[]} 格式
    const topics = Array.isArray(json) ? json : (json.topics || []);
    if (!topics.length) throw new Error('empty');
    allTopics = topics;
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

// Category alias map — old/merged categories → canonical tab id
const CAT_ALIAS = {
  'economics':    'world-economy',
  'finance':      'world-economy',
  'earnings':     'world-economy',
  'world-economy':'world-economy',
};

function canonicalCat(cat) {
  return CAT_ALIAS[cat] || cat;
}

// Category config (order = display order)
const CATEGORIES = [
  { id: 'politics',      color: 'var(--pol)', statKey: 'stat_politics' },
  { id: 'elections',     color: 'var(--ele)', statKey: 'stat_elections' },
  { id: 'world-economy', color: 'var(--wec)', statKey: 'stat_world_economy' },
  { id: 'crypto',        color: 'var(--cry)', statKey: 'stat_crypto' },
  { id: 'tech',          color: 'var(--tec)', statKey: 'stat_tech' },
  { id: 'sports',        color: 'var(--spo)', statKey: 'stat_sports' },
  { id: 'culture',       color: 'var(--cul)', statKey: 'stat_culture' },
];

// Stats — update count badges on each tab
function renderStats() {
  const counts = {};
  allTopics.forEach(topic => {
    const cat = canonicalCat(topic.category);
    counts[cat] = (counts[cat] || 0) + 1;
  });
  const total = allTopics.length;

  // Update archive info
  const archiveEl = document.getElementById('archiveInfo');
  if (archiveEl && availableDates.length > 0) {
    const totalTopics = availableDates.length * 30;
    archiveEl.innerHTML = currentLang === 'zh'
      ? `📚 已收录 <strong>${availableDates.length}</strong> 天 · <strong>${totalTopics}</strong> 条话题`
      : `📚 <strong>${availableDates.length}</strong> days · <strong>${totalTopics}</strong> topics archived`;
  }

  // Update count badges on each tab
  document.querySelectorAll('.tab[data-cat]').forEach(tab => {
    const cat = tab.dataset.cat;
    const n = cat === 'all' ? total : (counts[cat] || 0);
    // remove old badge if exists
    const old = tab.querySelector('.tab-count');
    if (old) old.remove();
    if (n > 0) {
      const badge = document.createElement('span');
      badge.className = 'tab-count';
      badge.textContent = n;
      tab.appendChild(badge);
    }
  });
}

// Cards
function renderCards() {
  const grid = document.getElementById('cardsGrid');
  const filtered = currentCat === 'all'
    ? allTopics
    : allTopics.filter(t => canonicalCat(t.category) === currentCat);
  if (!filtered.length) {
    grid.innerHTML = `<div class="loading">${t('no_data')}</div>`;
    return;
  }
  grid.innerHTML = filtered.map(topic => buildCard(topic)).join('');
}

function buildCard(topic) {
  const lang = currentLang;

  // 兼容新旧两种数据格式
  const title = topic.title
    ? (topic.title[lang] || topic.title.zh || topic.title.en || '')
    : (topic.question || '');

  const settle = topic.settlement
    ? formatSettlement(topic.settlement)
    : formatSettlement(topic.endDate || new Date().toISOString());

  // 赔率：旧格式 odds.yes/no + yes_prob/no_prob；新格式 outcomes.yes/no（概率0-1）
  let yes_val, no_val, yes_prob, no_prob;
  if (topic.odds) {
    yes_val  = topic.odds.yes.toFixed(2);
    no_val   = topic.odds.no.toFixed(2);
    yes_prob = topic.odds.yes_prob;
    no_prob  = topic.odds.no_prob;
  } else if (topic.outcomes) {
    yes_prob = Math.round((topic.outcomes.yes || 0) * 100);
    no_prob  = Math.round((topic.outcomes.no  || 0) * 100);
    yes_val  = yes_prob + '%';
    no_val   = no_prob  + '%';
  } else {
    yes_val = no_val = '50%'; yes_prob = no_prob = 50;
  }

  const catLabel = t('cat_' + topic.category) || topic.category;
  const source = topic.source || null;
  const isBreaking = topic.breaking || false;

  // rules 区域：只在有真实规则数据时显示
  const rulesHtml = topic.rules ? `
      <div class="rules">
        <div class="rule yes">
          <span class="rule-icon">✅</span>
          <span>${topic.rules.yes[lang] || topic.rules.yes.zh || ''}</span>
        </div>
        <div class="rule no">
          <span class="rule-icon">❌</span>
          <span>${topic.rules.no[lang] || topic.rules.no.zh || ''}</span>
        </div>
      </div>` : '';

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
      ${rulesHtml}
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
          <span class="odds-value">${yes_val}</span>
          <span class="odds-prob">${yes_prob}%</span>
        </div>
        <div class="odds-btn no-btn">
          <span class="odds-label">${t('no')}</span>
          <span class="odds-value">${no_val}</span>
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
