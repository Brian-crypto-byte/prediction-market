// State
let allTopics = [];
let currentCat = 'all';
let currentDate = getTodayStr();
let availableDates = [];

function getTodayStr() {
  return new Date().toISOString().slice(0, 10);
}

function formatDate(str) {
  const d = new Date(str + 'T00:00:00');
  return d.toLocaleDateString(currentLang === 'zh' ? 'zh-CN' : 'en-US', {
    year: 'numeric', month: 'short', day: 'numeric'
  });
}

function formatSettlement(isoStr) {
  const d = new Date(isoStr);
  return d.toLocaleDateString(currentLang === 'zh' ? 'zh-CN' : 'en-US', {
    year: 'numeric', month: 'short', day: 'numeric'
  });
}

// Load data — fallback up to 7 days back if today's file missing
async function loadData(dateStr, fallbackDepth = 0) {
  const grid = document.getElementById('cardsGrid');
  if (fallbackDepth === 0) grid.innerHTML = `<div class="loading">${t('loading')}</div>`;
  try {
    const res = await fetch(`data/${dateStr}.json?v=${Date.now()}`);
    if (!res.ok) throw new Error('not found');
    const json = await res.json();
    if (!json.topics || json.topics.length === 0) throw new Error('empty');
    allTopics = json.topics;
    currentDate = dateStr;
    document.getElementById('dateDisplay').textContent = formatDate(dateStr);
    renderStats();
    renderCards();
  } catch {
    if (fallbackDepth < 7) {
      const d = new Date(dateStr + 'T00:00:00');
      d.setDate(d.getDate() - 1);
      loadData(d.toISOString().slice(0, 10), fallbackDepth + 1);
    } else {
      allTopics = [];
      grid.innerHTML = `<div class="loading">${t('no_data')}</div>`;
      renderStats();
    }
  }
}

// Stats row
function renderStats() {
  const counts = { politics: 0, economics: 0, sports: 0 };
  allTopics.forEach(t => { if (counts[t.category] !== undefined) counts[t.category]++; });
  const colors = { politics: 'var(--pol)', economics: 'var(--eco)', sports: 'var(--spo)' };
  const labels = { politics: t('stat_politics'), economics: t('stat_economics'), sports: t('stat_sports') };
  const row = document.getElementById('statsRow');
  row.innerHTML = Object.entries(counts).map(([cat, num]) => `
    <div class="stat-chip">
      <span class="stat-dot" style="background:${colors[cat]}"></span>
      <span class="stat-num">${num}</span>
      <span class="stat-label">${labels[cat]}</span>
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

// Date nav
function shiftDate(delta) {
  const d = new Date(currentDate + 'T00:00:00');
  d.setDate(d.getDate() + delta);
  const next = d.toISOString().slice(0, 10);
  const today = getTodayStr();
  if (next > today) return;
  currentDate = next;
  loadData(currentDate);
}
document.getElementById('prevDate').addEventListener('click', () => shiftDate(-1));
document.getElementById('nextDate').addEventListener('click', () => shiftDate(1));

// Re-render on lang change
function renderAll() {
  applyI18n();
  document.getElementById('dateDisplay').textContent = formatDate(currentDate);
  renderStats();
  renderCards();
}

// Init
applyI18n();
loadData(currentDate);
