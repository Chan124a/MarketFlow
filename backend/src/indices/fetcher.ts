import axios from 'axios';

export const INDEX_CODES = {
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

export interface IndexData {
  code: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  timestamp: string;
}

export interface CandlePoint {
  time: string;
  open: number;
  close: number;
  high: number;
  low: number;
  volume: number;
}

export interface TrendPoint {
  time: string;
  value: number;
}

export interface IndexDetails {
  code: string;
  name: string;
  kline: Record<'1d' | '3d' | '7d', CandlePoint[]>;
  trend: Record<'1d' | '1m' | '3m' | '6m' | '9m' | '1y' | '2y' | '3y', TrendPoint[]>;
}

const KLINE_WINDOWS = {
  '1d': 1,
  '3d': 3,
  '7d': 7,
} as const;

const TREND_WINDOWS = {
  '1m': 22,
  '3m': 66,
  '6m': 132,
  '9m': 198,
  '1y': 252,
  '2y': 504,
  '3y': 756,
} as const;

export async function fetchIndices(): Promise<IndexData[]> {
  const codes = Object.keys(INDEX_CODES).join(',');
  const response = await axios.get(`http://qt.gtimg.cn/q=${codes}`, { timeout: 5000 });
  const text = response.data;
  const result: IndexData[] = [];

  const pattern = /v_(\w+)="([^"]+)"/g;
  let match;

  while ((match = pattern.exec(text)) !== null) {
    const code = match[1];
    const name = INDEX_CODES[code as keyof typeof INDEX_CODES];
    if (!name) continue;

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

export async function fetchIndexDetails(code: string): Promise<IndexDetails> {
  const name = INDEX_CODES[code as keyof typeof INDEX_CODES] ?? code;
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

async function fetchDailySeries(code: string): Promise<CandlePoint[]> {
  const response = await axios.get(
    `https://web.ifzq.gtimg.cn/appstock/app/fqkline/get?param=${code},day,,,900,qfq`,
    { timeout: 5000 }
  );

  const quote = response.data?.data?.[code];
  const rawSeries = quote?.qfqday ?? quote?.day ?? quote?.hfqday ?? [];
  if (!Array.isArray(rawSeries)) {
    return [];
  }

  return rawSeries
    .map((item: unknown) => parseCandleRow(item))
    .filter((item: CandlePoint | null): item is CandlePoint => item !== null);
}

async function fetchIntradayTrend(code: string): Promise<TrendPoint[]> {
  const response = await axios.get(
    `https://web.ifzq.gtimg.cn/appstock/app/minute/query?code=${code}`,
    { timeout: 5000 }
  );

  const quote = response.data?.data?.[code];
  const container = quote?.data?.data ? quote.data : quote?.data;
  const rawSeries = container?.data;
  const date = container?.date;

  if (!Array.isArray(rawSeries)) {
    return [];
  }

  return rawSeries
    .map((item: unknown) => parseTrendRow(item, date))
    .filter((item: TrendPoint | null): item is TrendPoint => item !== null);
}

function parseCandleRow(item: unknown): CandlePoint | null {
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

function parseTrendRow(item: unknown, date?: string): TrendPoint | null {
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

function normalizeCompactDate(value?: string): string | null {
  if (!value) {
    return null;
  }

  if (/^\d{8}$/.test(value)) {
    return `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)}`;
  }

  return value;
}

function toTrendPoints(series: CandlePoint[]): TrendPoint[] {
  return series.map((item) => ({
    time: item.time,
    value: item.close,
  }));
}

function sliceTail<T>(items: T[], size: number): T[] {
  return items.slice(Math.max(items.length - size, 0));
}

function toNumber(value: unknown): number {
  const result = Number(value);
  return Number.isFinite(result) ? result : 0;
}
