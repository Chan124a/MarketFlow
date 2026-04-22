import axios from 'axios';

const INDEX_CODES = {
  'sh000001': '上证指数',
  'sz399001': '深证成指',
  'sh000688': '科创50',
  'sz399006': '创业板指',
  'hkHSI': '恒生指数',
  'usNDX': '纳斯达克100',
  'usINX': '标普500'
};

const TENCENT_BASE = 'http://qt.gtimg.cn/q=';

export async function fetchIndices() {
  const codes = Object.keys(INDEX_CODES).join(',');
  const url = `${TENCENT_BASE}${codes}`;

  const response = await axios.get(url, { timeout: 5000 });
  const text = response.data;
  const result = [];

  const rawPattern = /v_(\w+)="([^"]+)"/g;
  let match;

  while ((match = rawPattern.exec(text)) !== null) {
    const code = match[1];
    const name = INDEX_CODES[code];
    if (!name) continue;

    const fields = match[2].split('~');

    const price = parseFloat(fields[3]) || 0;
    const change = parseFloat(fields[31]) || 0;
    const changePercent = parseFloat(fields[32]) || 0;
    const volume = parseFloat(fields[6]) || 0;

    result.push({
      code,
      name,
      price,
      change,
      changePercent: isNaN(changePercent) ? 0 : changePercent,
      volume,
      timestamp: new Date().toISOString()
    });
  }

  return result;
}

export async function fetchIndex(code) {
  const all = await fetchIndices();
  return all.find(item => item.code === code);
}

export { INDEX_CODES };