// daily-collect.js — 每日自动生成预测话题数据
// 由 OpenClaw cron 每天触发，搜集当日热点并生成 JSON

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, 'data');
const today = new Date().toISOString().slice(0, 10);
const outFile = path.join(DATA_DIR, `${today}.json`);

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (fs.existsSync(outFile)) {
  console.log(`[daily-collect] ${today}.json already exists, skipping.`);
  process.exit(0);
}

// 占位结构 — 实际内容由 AI agent 填充后写入
const template = {
  date: today,
  topics: []
};

fs.writeFileSync(outFile, JSON.stringify(template, null, 2));
console.log(`[daily-collect] Created ${outFile}`);
