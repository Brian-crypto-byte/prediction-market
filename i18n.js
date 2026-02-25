const I18N = {
  zh: {
    site_title: '汉王大人的预测市场资源库',
    hero_sub: '历史数据存档 · 政治 · 科技 · 体育 · 加密货币 ...',
    tab_all: '全部',
    tab_politics: '🏛 政治',
    tab_geopolitics: '🌐 地缘政治',
    tab_elections: '🗳 选举',
    tab_finance: '💹 金融',
    tab_world_economy: '🌍 全球经济',
    tab_earnings: '📊 财报',
    tab_crypto: '₿ 加密货币',
    tab_tech: '💻 科技',
    tab_sports: '🏆 体育',
    tab_culture: '🎭 文化',
    tab_climate: '🌿 气候与科学',
    tab_mentions: '🔥 热议',
    loading: '加载中...',
    footer_note: '数据仅供参考，不构成投资建议',
    cat_politics: '政治',
    cat_geopolitics: '地缘政治',
    cat_elections: '选举',
    cat_finance: '金融',
    cat_economics: '金融',      // backward compat
    cat_world_economy: '全球经济',
    cat_earnings: '财报',
    cat_crypto: '加密货币',
    cat_tech: '科技',
    cat_sports: '体育',
    cat_culture: '文化',
    cat_climate: '气候与科学',
    cat_mentions: '热议',
    yes: 'YES',
    no: 'NO',
    settlement_label: '结算',
    stat_politics: '政治',
    stat_geopolitics: '地缘',
    stat_elections: '选举',
    stat_finance: '金融',
    stat_world_economy: '全球经济',
    stat_earnings: '财报',
    stat_crypto: '加密',
    stat_tech: '科技',
    stat_sports: '体育',
    stat_culture: '文化',
    stat_climate: '气候',
    stat_mentions: '热议',
    no_data: '暂无数据',
    archive_count: '收录话题',
  },
  en: {
    site_title: "Hanwang's Prediction Market",
    hero_sub: 'Historical Archive · Politics · Tech · Sports · Crypto ...',
    tab_all: 'All',
    tab_politics: '🏛 Politics',
    tab_geopolitics: '🌐 Geopolitics',
    tab_elections: '🗳 Elections',
    tab_finance: '💹 Finance',
    tab_world_economy: '🌍 World Economy',
    tab_earnings: '📊 Earnings',
    tab_crypto: '₿ Crypto',
    tab_tech: '💻 Tech',
    tab_sports: '🏆 Sports',
    tab_culture: '🎭 Culture',
    tab_climate: '🌿 Climate & Science',
    tab_mentions: '🔥 Mentions',
    loading: 'Loading...',
    footer_note: 'For reference only. Not financial advice.',
    cat_politics: 'Politics',
    cat_geopolitics: 'Geopolitics',
    cat_elections: 'Elections',
    cat_finance: 'Finance',
    cat_economics: 'Finance',    // backward compat
    cat_world_economy: 'World Economy',
    cat_earnings: 'Earnings',
    cat_crypto: 'Crypto',
    cat_tech: 'Tech',
    cat_sports: 'Sports',
    cat_culture: 'Culture',
    cat_climate: 'Climate & Science',
    cat_mentions: 'Mentions',
    yes: 'YES',
    no: 'NO',
    settlement_label: 'Settles',
    stat_politics: 'Politics',
    stat_geopolitics: 'Geopolitics',
    stat_elections: 'Elections',
    stat_finance: 'Finance',
    stat_world_economy: 'World Economy',
    stat_earnings: 'Earnings',
    stat_crypto: 'Crypto',
    stat_tech: 'Tech',
    stat_sports: 'Sports',
    stat_culture: 'Culture',
    stat_climate: 'Climate',
    stat_mentions: 'Mentions',
    no_data: 'No data available',
    archive_count: 'Topics Archived',
  }
};

let currentLang = localStorage.getItem('lang') || 'zh';

function t(key) {
  return I18N[currentLang][key] || key;
}

function applyI18n() {
  document.documentElement.lang = currentLang;
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    el.textContent = t(key);
  });
  document.getElementById('langToggle').textContent = currentLang === 'zh' ? 'EN' : '中文';
  document.title = t('site_title') + ' | ' + (currentLang === 'zh' ? 'Prediction Market' : '预测市场资源库');
}

function toggleLang() {
  currentLang = currentLang === 'zh' ? 'en' : 'zh';
  localStorage.setItem('lang', currentLang);
  applyI18n();
  if (typeof renderAll === 'function') renderAll();
}

document.getElementById('langToggle').addEventListener('click', toggleLang);
