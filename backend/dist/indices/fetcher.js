"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchIndexDetails = exports.fetchIndices = exports.INDEX_CODES = void 0;
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
const KLINE_WINDOWS = {
    '1d': 1,
    '3d': 3,
    '7d': 7,
};
const TREND_WINDOWS = {
    '1m': 22,
    '3m': 66,
    '6m': 132,
    '9m': 198,
    '1y': 252,
    '2y': 504,
    '3y': 756,
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
exports.fetchIndices = fetchIndices;
async function fetchIndexDetails(code) {
    const name = exports.INDEX_CODES[code] ?? code;
    const [dailyResult, intradayResult] = await Promise.allSettled([
        fetchDailySeries(code),
        fetchIntradayTrend(code),
    ]);
    const dailySeries = dailyResult.status === 'fulfilled' ? dailyResult.value : [];
    const intradaySeries = intradayResult.status === 'fulfilled' ? intradayResult.value : [];
    return {
        code,
        name,
        kline: {
            '1d': sliceTail(dailySeries, KLINE_WINDOWS['1d']),
            '3d': sliceTail(dailySeries, KLINE_WINDOWS['3d']),
            '7d': sliceTail(dailySeries, KLINE_WINDOWS['7d']),
        },
        trend: {
            '1d': intradaySeries,
            '1m': toTrendPoints(sliceTail(dailySeries, TREND_WINDOWS['1m'])),
            '3m': toTrendPoints(sliceTail(dailySeries, TREND_WINDOWS['3m'])),
            '6m': toTrendPoints(sliceTail(dailySeries, TREND_WINDOWS['6m'])),
            '9m': toTrendPoints(sliceTail(dailySeries, TREND_WINDOWS['9m'])),
            '1y': toTrendPoints(sliceTail(dailySeries, TREND_WINDOWS['1y'])),
            '2y': toTrendPoints(sliceTail(dailySeries, TREND_WINDOWS['2y'])),
            '3y': toTrendPoints(sliceTail(dailySeries, TREND_WINDOWS['3y'])),
        },
    };
}
exports.fetchIndexDetails = fetchIndexDetails;
async function fetchDailySeries(code) {
    const response = await axios_1.default.get(`https://web.ifzq.gtimg.cn/appstock/app/fqkline/get?param=${code},day,,,900,qfq`, { timeout: 5000 });
    const quote = response.data?.data?.[code];
    const rawSeries = quote?.qfqday ?? quote?.day ?? quote?.hfqday ?? [];
    if (!Array.isArray(rawSeries)) {
        return [];
    }
    return rawSeries
        .map((item) => parseCandleRow(item))
        .filter((item) => item !== null);
}
async function fetchIntradayTrend(code) {
    const response = await axios_1.default.get(`https://web.ifzq.gtimg.cn/appstock/app/minute/query?code=${code}`, { timeout: 5000 });
    const quote = response.data?.data?.[code];
    const container = quote?.data?.data ? quote.data : quote?.data;
    const rawSeries = container?.data;
    const date = container?.date;
    if (!Array.isArray(rawSeries)) {
        return [];
    }
    return rawSeries
        .map((item) => parseTrendRow(item, date))
        .filter((item) => item !== null);
}
function parseCandleRow(item) {
    if (!Array.isArray(item) || item.length < 5) {
        return null;
    }
    const [time, open, close, high, low, volume] = item;
    return {
        time: String(time),
        open: toNumber(open),
        close: toNumber(close),
        high: toNumber(high),
        low: toNumber(low),
        volume: toNumber(volume),
    };
}
function parseTrendRow(item, date) {
    if (typeof item !== 'string') {
        return null;
    }
    const segments = item.trim().split(/\s+/);
    if (segments.length < 2) {
        return null;
    }
    const [time, value] = segments;
    const normalizedDate = normalizeCompactDate(date);
    return {
        time: normalizedDate ? `${normalizedDate} ${time}` : time,
        value: toNumber(value),
    };
}
function normalizeCompactDate(value) {
    if (!value) {
        return null;
    }
    if (/^\d{8}$/.test(value)) {
        return `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)}`;
    }
    return value;
}
function toTrendPoints(series) {
    return series.map((item) => ({
        time: item.time,
        value: item.close,
    }));
}
function sliceTail(items, size) {
    return items.slice(Math.max(items.length - size, 0));
}
function toNumber(value) {
    const result = Number(value);
    return Number.isFinite(result) ? result : 0;
}
//# sourceMappingURL=fetcher.js.map