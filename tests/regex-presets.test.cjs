const assert = require('node:assert/strict');
const { presets, filterPresets } = require('../web/regex-presets.js');

assert.ok(presets.length >= 40, `expected at least 40 presets; received ${presets.length}`);

const categories = new Set(presets.map(({ category }) => category));
assert.ok(categories.size >= 5, `expected grouped categories; received ${categories.size}`);

for (const preset of presets) {
  assert.ok(preset.name && preset.description && preset.category, `preset metadata missing: ${preset.name}`);
  assert.doesNotThrow(() => new RegExp(preset.pattern, 'g'), `invalid pattern: ${preset.name}`);
}

assert.ok(filterPresets('手機').some(({ name }) => name === '台灣手機'));
assert.ok(filterPresets('ipv4').some(({ name }) => name === 'IPv4'));
assert.ok(filterPresets('25[0-5]').some(({ name }) => name === 'IPv4'));
assert.equal(filterPresets('沒有這種範本').length, 0);

const checks = [
  ['ISO 日期', '日期 2026-10-17', { date: '2026-10-17' }],
  ['電子郵件', '寄給 alex@example.tw', { email: 'alex@example.tw' }],
  ['台灣手機', '聯絡 0912-345-678', { phone: '0912-345-678' }],
  ['IPv4', '來源 203.0.113.10', { ipv4: '203.0.113.10' }],
  ['百分比', '成長 12.5%', { percent: '12.5' }],
  ['Markdown 標題', '## 範本目錄', { level: '##', title: '範本目錄' }],
  ['Nginx 訪問日誌', '203.0.113.10 - - [15/Oct/2026:10:31:08 +0800] "GET /home HTTP/1.1" 200 1842', { ip: '203.0.113.10', method: 'GET', path: '/home', status: '200', bytes: '1842' }]
];

for (const [name, text, expected] of checks) {
  const preset = presets.find((entry) => entry.name === name);
  const match = new RegExp(preset.pattern, 'g').exec(text);
  assert.ok(match, `${name} should match its sample`);
  for (const [key, value] of Object.entries(expected)) assert.equal(match.groups[key], value, `${name} capture ${key}`);
}
