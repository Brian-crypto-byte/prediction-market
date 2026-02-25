const I18N = {
  zh: {
    site_title: '汉王大人的预测市场资源库',
    hero_sub: '历史数据存档 · 政治 · 经济 · 体育',
    tab_all: '全部',
    tab_politics: '🏛 政治',
    tab_economics: '📈 经济',
    tab_sports: '🏆 体育',
    loading: '加载中...',
    footer_note: '数据仅供参考，不构成投资建议',
    cat_politics: '政治',
    cat_economics: '经济',
    cat_sports: '体育',
    yes: 'YES',
    no: 'NO',
    settlement_label: '结算',
    stat_total: '今日话题',
    stat_politics: '政治',
    stat_economics: '经济',
    stat_sports: '体育',
    no_data: '暂无数据',
    prev_label: '← 前一天',
    next_label: '后一天 →',
    archive_count: '收录话题',
  },
  en: {
    site_title: "Hanwang's Prediction Market",
    hero_sub: 'Historical Archive · Politics · Economics · Sports',
    tab_all: 'All',
    tab_politics: '🏛 Politics',
    tab_economics: '📈 Economics',
    tab_sports: '🏆 Sports',
    loading: 'Loading...',
    footer_note: 'For reference only. Not financial advice.',
    cat_politics: 'Politics',
    cat_economics: 'Economics',
    cat_sports: 'Sports',
    yes: 'YES',
    no: 'NO',
    settlement_label: 'Settles',
    stat_total: 'Topics Today',
    stat_politics: 'Politics',
    stat_economics: 'Economics',
    stat_sports: 'Sports',
    no_data: 'No data available',
    prev_label: '← Previous',
    next_label: 'Next →',
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
