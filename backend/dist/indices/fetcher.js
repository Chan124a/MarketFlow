"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.INDEX_CODES = void 0;
exports.fetchIndices = fetchIndices;
const axios_1 = require("axios");
exports.INDEX_CODES = {
    'sh000001': '上证指数',
    'sz399001': '深证成指',
    'sh000688': '科创50',
    'sz399006': '创业板指',
    'hkHSI': '恒生指数',
    'hkHSCEI': '国企指数',
    'hkHSTECH': '恒生科技',
    'usNDX': '纳斯达克100',
    'usINX': '标普500',
    'usDJI': '道琼斯',
};
async function fetchIndices() {
    const codes = Object.keys(exports.INDEX_CODES).join(',');
    const response = await axios_1.default.get(`http://qt.gtimg.cn/q=${codes}`, { timeout: 5000 });
    const text = response.data;
    const result = [];
    const pattern = /v_(\w+)="([^"]+)"/g;
    let match;
    while ((match = pattern.exec(text)) !== null) {
        const code = match[1];
        const name = exports.INDEX_CODES[code];
        if (!name)
            continue;
        const fields = match[2].split('~');
        result.push({
            code,
            name,
            price: parseFloat(fields[3]) || 0,
            change: parseFloat(fields[31]) || 0,
            changePercent: parseFloat(fields[32]) || 0,
            volume: parseFloat(fields[6]) || 0,
            timestamp: new Date().toISOString(),
        });
    }
    return result;
}
//# sourceMappingURL=fetcher.js.map