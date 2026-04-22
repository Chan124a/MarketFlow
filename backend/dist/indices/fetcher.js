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
    const [dailyResult, intradayResult, multiDayResult] = await Promise.allSettled([
        fetchDailySeries(code),
        fetchIntradaySeries(code),
        fetchMultiDayIntradaySeries(code),
    ]);
    const dailySeries = dailyResult.status === 'fulfilled' ? dailyResult.value : [];
    const intradaySeries = intradayResult.status === 'fulfilled' ? intradayResult.value : [];
    const multiDaySeries = multiDayResult.status === 'fulfilled' ? multiDayResult.value : [];
    const recentThreeDays = multiDaySeries.slice(-3).flatMap((item) => item.data);
    return {
        code,
        name,
        kline: {
            '1d': toIntradayCandles(intradaySeries, 5),
            '3d': recentThreeDays.length > 0 ? toIntradayCandles(recentThreeDays, 30) : sliceTail(dailySeries, KLINE_WINDOWS['3d']),
            '7d': sliceTail(dailySeries, KLINE_WINDOWS['7d']),
        },
        trend: {
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
async function fetchIntradaySeries(code) {
    const response = await axios_1.default.get(`https://web.ifzq.gtimg.cn/appstock/app/minute/query?code=${code}`, { timeout: 5000 });
    const quote = response.data?.data?.[code];
    const container = quote?.data?.data ? quote.data : quote?.data;
    const rawSeries = container?.data;
    const date = container?.date;
    if (!Array.isArray(rawSeries)) {
        return [];
    }
    return rawSeries
        .map((item) => parseIntradayRow(item, date))
        .filter((item) => item !== null);
}
async function fetchMultiDayIntradaySeries(code) {
    const path = getTencentFlashPath(code);
    if (!path) {
        return [];
    }
    const response = await axios_1.default.get(`http://data.gtimg.cn/flashdata/hushen/4day/${path}.js?visitDstTime=1`, { timeout: 5000 });
    return parseFourDaySeries(String(response.data));
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
function parseIntradayRow(item, date) {
    if (typeof item !== 'string') {
        return null;
    }
    const segments = item.trim().split(/\s+/);
    if (segments.length < 2) {
        return null;
    }
    const [time, value, volume] = segments;
    const normalizedDate = normalizeCompactDate(date);
    return {
        time: normalizedDate ? `${normalizedDate} ${time}` : time,
        value: toNumber(value),
        volume: toNumber(volume),
    };
}
function parseFourDaySeries(source) {
    const raw = source.match(/var\s+min_data_4d=\[(.*)\];?$/s)?.[1];
    if (!raw) {
        return [];
    }
    const normalized = raw.replace(/'/g, '"');
    const parsed = JSON.parse(`[${normalized}]`);
    return parsed
        .map((item) => {
        const date = normalizeCompactDate(item.date);
        const data = typeof item.data === 'string' ? item.data.split('^') : [];
        if (!date || data.length === 0) {
            return null;
        }
        return {
            date,
            data: data
                .map((line) => parseFourDayRow(line, date))
                .filter((point) => point !== null),
        };
    })
        .filter((item) => item !== null);
}
function parseFourDayRow(line, date) {
    const segments = line.split('~');
    if (segments.length < 3) {
        return null;
    }
    const [time, value, volume] = segments;
    const normalizedTime = time.length === 4 ? `${time.slice(0, 2)}:${time.slice(2, 4)}` : time;
    return {
        time: `${date} ${normalizedTime}`,
        value: toNumber(value),
        volume: toNumber(volume),
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
function toIntradayCandles(series, intervalMinutes) {
    if (series.length === 0) {
        return [];
    }
    const buckets = new Map();
    for (let index = 0; index < series.length; index += 1) {
        const item = series[index];
        const previousClose = index === 0 ? item.value : series[index - 1].value;
        const incrementalVolume = index === 0 ? item.volume : Math.max(item.volume - series[index - 1].volume, 0);
        const bucketKey = buildMinuteBucket(item.time, intervalMinutes);
        const existing = buckets.get(bucketKey);
        if (!existing) {
            buckets.set(bucketKey, {
                time: bucketKey,
                open: previousClose,
                close: item.value,
                high: Math.max(previousClose, item.value),
                low: Math.min(previousClose, item.value),
                volume: incrementalVolume,
            });
            continue;
        }
        existing.close = item.value;
        existing.high = Math.max(existing.high, item.value);
        existing.low = Math.min(existing.low, item.value);
        existing.volume += incrementalVolume;
    }
    return Array.from(buckets.values());
}
function buildMinuteBucket(value, intervalMinutes) {
    const [datePart, timePart] = value.split(' ');
    if (!timePart) {
        return value;
    }
    const [hourText, minuteText] = timePart.split(':');
    const hour = Number(hourText);
    const minute = Number(minuteText);
    if (!Number.isFinite(hour) || !Number.isFinite(minute)) {
        return value;
    }
    const totalMinutes = hour * 60 + minute;
    const bucketStart = Math.floor(totalMinutes / intervalMinutes) * intervalMinutes;
    const bucketHour = String(Math.floor(bucketStart / 60)).padStart(2, '0');
    const bucketMinute = String(bucketStart % 60).padStart(2, '0');
    return `${datePart} ${bucketHour}:${bucketMinute}`;
}
function getTencentFlashPath(code) {
    if (code.startsWith('sh')) {
        return `sh/${code}`;
    }
    if (code.startsWith('sz')) {
        return `sz/${code}`;
    }
    return null;
}
function sliceTail(items, size) {
    return items.slice(Math.max(items.length - size, 0));
}
function toNumber(value) {
    const result = Number(value);
    return Number.isFinite(result) ? result : 0;
}
//# sourceMappingURL=fetcher.js.map