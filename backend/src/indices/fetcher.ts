import axios from 'axios';

export const STOCK_CODES: Record<string, string> = {
  'hk00700': '腾讯控股',
  'hk09988': '阿里巴巴-W',
};

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

const ALL_CODES = { ...INDEX_CODES, ...STOCK_CODES };

export interface IndexData {
  code: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  pe?: number;
  marketCap?: number;
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

interface IntradayPoint {
  time: string;
  value: number;
  volume: number;
}

interface MultiDaySeries {
  date: string;
  data: IntradayPoint[];
}

export interface IndexDetails {
  code: string;
  name: string;
  marketChart: {
    time: TrendPoint[];
    day: CandlePoint[];
    week: CandlePoint[];
    month: CandlePoint[];
  };
  trend: Record<'3d' | '7d' | '1m' | '3m' | '6m' | '1y' | '2y' | '3y', TrendPoint[]>;
}

const TREND_WINDOWS = {
  '1m': 22,
  '3m': 66,
  '6m': 132,
  '9m': 198,
  '1y': 252,
  '2y': 504,
  '3y': 756,
} as const;

export interface StockFinancials {
  code: string;
  name: string;
  years: FinancialYear[];
}

export interface FinancialYear {
  year: string;
  revenue: number;
  netProfit: number;
  eps: number;
  totalAssets: number;
  totalLiabilities: number;
  shareholdersEquity: number;
}

function createIndexData(code: string, name: string, fields: string[]): IndexData {
  const pe = parseFloat(fields[39]);
  const marketCap = parseFloat(fields[45]);
  return {
    code,
    name,
    price: parseFloat(fields[3]) || 0,
    change: parseFloat(fields[31]) || 0,
    changePercent: parseFloat(fields[32]) || 0,
    volume: parseFloat(fields[6]) || 0,
    ...(Number.isFinite(pe) && pe > 0 ? { pe } : {}),
    ...(Number.isFinite(marketCap) && marketCap > 0 ? { marketCap } : {}),
    timestamp: new Date().toISOString(),
  };
}

export async function fetchIndices(): Promise<IndexData[]> {
  const codes = Object.keys(INDEX_CODES).join(',');
  const response = await axios.get(`http://qt.gtimg.cn/q=${codes}`, { timeout: 5000 });
  const text = response.data;
  const result: IndexData[] = [];

  const pattern = /v_(\w+)="([^"]+)"/g;
  let match;

  while ((match = pattern.exec(text)) !== null) {
    const code = match[1];
    const name = ALL_CODES[code as keyof typeof ALL_CODES];
    if (!name) continue;

    const fields = match[2].split('~');
    result.push(createIndexData(code, name, fields));
  }

  return result;
}

export async function fetchStocks(): Promise<IndexData[]> {
  const stockCodes = Object.keys(STOCK_CODES);
  if (stockCodes.length === 0) return [];

  const codes = stockCodes.join(',');
  const response = await axios.get(`http://qt.gtimg.cn/q=${codes}`, { timeout: 5000 });
  const text = response.data;
  const result: IndexData[] = [];

  const pattern = /v_(\w+)="([^"]+)"/g;
  let match;

  while ((match = pattern.exec(text)) !== null) {
    const code = match[1];
    const name = STOCK_CODES[code];
    if (!name) continue;

    const fields = match[2].split('~');
    result.push(createIndexData(code, name, fields));
  }

  return result;
}

export async function fetchIndexDetails(code: string): Promise<IndexDetails> {
  const name = ALL_CODES[code as keyof typeof ALL_CODES] ?? code;
  const [dailyResult, weeklyResult, monthlyResult, intradayResult, multiDayResult] = await Promise.allSettled([
    fetchDailySeries(code),
    fetchPeriodSeries(code, 'week'),
    fetchPeriodSeries(code, 'month'),
    fetchIntradaySeries(code),
    fetchMultiDayIntradaySeries(code),
  ]);
  const dailySeries = dailyResult.status === 'fulfilled' ? dailyResult.value : [];
  const weeklySeries = weeklyResult.status === 'fulfilled' ? weeklyResult.value : [];
  const monthlySeries = monthlyResult.status === 'fulfilled' ? monthlyResult.value : [];
  const intradaySeries = intradayResult.status === 'fulfilled' ? intradayResult.value : [];
  const multiDaySeries = multiDayResult.status === 'fulfilled' ? multiDayResult.value : [];
  const currentDate = intradaySeries[0]?.time.split(' ')[0];
  const normalizedMultiDaySeries = currentDate
    ? multiDaySeries.filter((item) => item.date !== currentDate)
    : multiDaySeries;
  const recentThreeDays = [...normalizedMultiDaySeries.slice(-2).flatMap((item) => item.data), ...intradaySeries];

  return {
    code,
    name,
    marketChart: {
      time: toTrendPointsFromIntraday(intradaySeries),
      day: dailySeries,
      week: weeklySeries,
      month: monthlySeries,
    },
    trend: {
      '3d': recentThreeDays.length > 0 ? toTrendPointsFromIntraday(recentThreeDays) : toTrendPoints(sliceTail(dailySeries, 3)),
      '7d': toTrendPoints(sliceTail(dailySeries, 7)),
      '1m': toTrendPoints(sliceTail(dailySeries, TREND_WINDOWS['1m'])),
      '3m': toTrendPoints(sliceTail(dailySeries, TREND_WINDOWS['3m'])),
      '6m': toTrendPoints(sliceTail(dailySeries, TREND_WINDOWS['6m'])),
      '1y': toTrendPoints(sliceTail(dailySeries, TREND_WINDOWS['1y'])),
      '2y': toTrendPoints(sliceTail(dailySeries, TREND_WINDOWS['2y'])),
      '3y': toTrendPoints(sliceTail(dailySeries, TREND_WINDOWS['3y'])),
    },
  };
}

async function fetchDailySeries(code: string): Promise<CandlePoint[]> {
  return fetchPeriodSeries(code, 'day');
}

async function fetchPeriodSeries(code: string, period: 'day' | 'week' | 'month'): Promise<CandlePoint[]> {
  const response = await axios.get(
    `https://web.ifzq.gtimg.cn/appstock/app/fqkline/get?param=${code},${period},,,900,qfq`,
    { timeout: 5000 }
  );

  const quote = response.data?.data?.[code];
  const rawSeries =
    (period === 'day' ? quote?.qfqday : null) ??
    quote?.[period] ??
    (period === 'day' ? quote?.day ?? quote?.hfqday : null) ??
    [];
  if (!Array.isArray(rawSeries)) {
    return [];
  }

  return rawSeries
    .map((item: unknown) => parseCandleRow(item))
    .filter((item: CandlePoint | null): item is CandlePoint => item !== null);
}

async function fetchIntradaySeries(code: string): Promise<IntradayPoint[]> {
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
    .map((item: unknown) => parseIntradayRow(item, date))
    .filter((item: IntradayPoint | null): item is IntradayPoint => item !== null);
}

async function fetchMultiDayIntradaySeries(code: string): Promise<MultiDaySeries[]> {
  const path = getTencentFlashPath(code);
  if (!path) {
    return [];
  }

  const response = await axios.get(
    `http://data.gtimg.cn/flashdata/hushen/4day/${path}.js?visitDstTime=1`,
    { timeout: 5000 }
  );

  return parseFourDaySeries(String(response.data));
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

function parseIntradayRow(item: unknown, date?: string): IntradayPoint | null {
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

function parseFourDaySeries(source: string): MultiDaySeries[] {
  const raw = source.match(/var\s+min_data_4d=\[(.*)\];?$/s)?.[1];
  if (!raw) {
    return [];
  }

  const normalized = raw.replace(/'/g, '"');
  const parsed = JSON.parse(`[${normalized}]`) as Array<{ date?: string; data?: string }>;

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
          .filter((point: IntradayPoint | null): point is IntradayPoint => point !== null),
      };
    })
    .filter((item: MultiDaySeries | null): item is MultiDaySeries => item !== null);
}

function parseFourDayRow(line: string, date: string): IntradayPoint | null {
  const segments = line.split('~');
  if (segments.length < 3) {
    return null;
  }

  const [time, value, volume] = segments;
  const normalizedTime =
    time.length === 4 ? `${time.slice(0, 2)}:${time.slice(2, 4)}` : time;

  return {
    time: `${date} ${normalizedTime}`,
    value: toNumber(value),
    volume: toNumber(volume),
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

function toTrendPointsFromIntraday(series: IntradayPoint[]): TrendPoint[] {
  return series.map((item) => ({
    time: item.time,
    value: item.value,
  }));
}

function toIntradayCandles(series: IntradayPoint[], intervalMinutes: number): CandlePoint[] {
  if (series.length === 0) {
    return [];
  }

  const buckets = new Map<string, CandlePoint>();

  for (let index = 0; index < series.length; index += 1) {
    const item = series[index];
    const previousClose = index === 0 ? item.value : series[index - 1].value;
    const incrementalVolume =
      index === 0 ? item.volume : Math.max(item.volume - series[index - 1].volume, 0);
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

function buildMinuteBucket(value: string, intervalMinutes: number): string {
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

function getTencentFlashPath(code: string): string | null {
  if (code.startsWith('sh')) {
    return `sh/${code}`;
  }

  if (code.startsWith('sz')) {
    return `sz/${code}`;
  }

  return null;
}

function sliceTail<T>(items: T[], size: number): T[] {
  return items.slice(Math.max(items.length - size, 0));
}

function toNumber(value: unknown): number {
  const result = Number(value);
  return Number.isFinite(result) ? result : 0;
}

export async function fetchStockFinancials(code: string): Promise<StockFinancials | null> {
  const name = STOCK_CODES[code];
  if (!name) return null;

  try {
    const response = await axios.get(
      `https://web.ifzq.gtimg.cn/appstock/app/profit/get?symbol=${code}&type=year`,
      { timeout: 5000 }
    );

    const profitData = response.data?.data?.[code]?.profit?.year;
    if (!Array.isArray(profitData) || profitData.length === 0) {
      return null;
    }

    const years: FinancialYear[] = profitData
      .map((item: unknown) => parseFinancialYear(item))
      .filter((item: FinancialYear | null): item is FinancialYear => item !== null)
      .sort((a, b) => a.year.localeCompare(b.year));

    return { code, name, years };
  } catch {
    return null;
  }
}

function parseFinancialYear(item: unknown): FinancialYear | null {
  if (!Array.isArray(item) || item.length < 9) return null;

  const [year, , revenue, netProfit, , , eps, totalAssets, totalLiabilities, shareholdersEquity] = item;

  const rev = toNumber(revenue);
  const np = toNumber(netProfit);
  if (!rev && !np) return null;

  return {
    year: String(year),
    revenue: rev,
    netProfit: np,
    eps: toNumber(eps),
    totalAssets: toNumber(totalAssets),
    totalLiabilities: toNumber(totalLiabilities),
    shareholdersEquity: toNumber(shareholdersEquity),
  };
}
