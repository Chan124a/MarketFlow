'use client';

import { useEffect, useRef, useState } from 'react';

/* ─── types ─────────────────────────────────────────────────────────────── */

interface IndexData {
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

interface TrendPoint {
  time: string;
  value: number;
}

interface CandlePoint {
  time: string;
  open: number;
  close: number;
  high: number;
  low: number;
  volume: number;
}

interface IndexDetails {
  code: string;
  name: string;
  marketChart: Record<string, TrendPoint[] | CandlePoint[]>;
  trend: Record<string, TrendPoint[]>;
}

interface FinancialYear {
  year: string;
  revenue: number;
  netProfit: number;
  eps: number;
  totalAssets: number;
  totalLiabilities: number;
  shareholdersEquity: number;
}

interface StockFinancials {
  code: string;
  name: string;
  years: FinancialYear[];
}

interface Props {
  index: IndexData;
  details: IndexDetails | null;
  financials: StockFinancials | null;
  loading: boolean;
  error: string | null;
  klineRange: string;
  trendRange: string;
  onClose: () => void;
  onKlineRangeChange: (r: string) => void;
  onTrendRangeChange: (r: string) => void;
}

/* ─── helpers ────────────────────────────────────────────────────────────── */

function formatVolume(v: number): string {
  if (!v) return '-';
  if (v >= 100000000) return (v / 100000000).toFixed(2) + '亿';
  if (v >= 10000) return (v / 10000).toFixed(2) + '万';
  return v.toFixed(0);
}

function formatFinancial(v: number): string {
  if (!v) return '-';
  const abs = Math.abs(v);
  if (abs >= 100000000) return (v / 100000000).toFixed(2) + '亿';
  if (abs >= 10000) return (v / 10000).toFixed(2) + '万';
  return v.toFixed(2);
}

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}

/* ─── SVG dimensions ─────────────────────────────────────────────────────── */

const W = 900;
const H = 320;
const PAD = { top: 16, right: 16, bottom: 36, left: 62 };
const INNER_W = W - PAD.left - PAD.right;
const INNER_H = H - PAD.top - PAD.bottom;

/* ─── TrendChart ─────────────────────────────────────────────────────────── */

function TrendChart({ data }: { data: TrendPoint[] }) {
  const [hover, setHover] = useState<{ idx: number; x: number; y: number } | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  if (!data || data.length === 0) {
    return <div className="chart-empty">暂无数据</div>;
  }

  const values = data.map((d) => d.value);
  const minV = Math.min(...values);
  const maxV = Math.max(...values);
  const range = maxV - minV || 1;

  const xScale = (i: number) => PAD.left + (i / (data.length - 1)) * INNER_W;
  const yScale = (v: number) => PAD.top + INNER_H - ((v - minV) / range) * INNER_H;

  const gridLines = 5;
  const gridStep = range / gridLines;

  const pathD = data
    .map((d, i) => `${i === 0 ? 'M' : 'L'}${xScale(i).toFixed(1)},${yScale(d.value).toFixed(1)}`)
    .join(' ');

  const xLabels: number[] = [];
  const step = Math.max(1, Math.floor(data.length / 6));
  for (let i = 0; i < data.length; i += step) xLabels.push(i);
  if (xLabels[xLabels.length - 1] !== data.length - 1) xLabels.push(data.length - 1);

  const hovered = hover !== null ? data[hover.idx] : null;

  return (
    <div style={{ position: 'relative' }}>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        className="chart-svg"
        onMouseMove={(e) => {
          const rect = svgRef.current!.getBoundingClientRect();
          const svgX = ((e.clientX - rect.left) / rect.width) * W;
          const idx = clamp(Math.round(((svgX - PAD.left) / INNER_W) * (data.length - 1)), 0, data.length - 1);
          setHover({ idx, x: e.clientX, y: e.clientY });
        }}
        onMouseLeave={() => setHover(null)}
      >
        <rect className="chart-bg" x={0} y={0} width={W} height={H} rx={12} />

        {Array.from({ length: gridLines + 1 }, (_, i) => {
          const v = minV + gridStep * i;
          const y = yScale(v);
          return (
            <g key={i}>
              <line className="chart-grid-line" x1={PAD.left} x2={PAD.left + INNER_W} y1={y} y2={y} />
              <text className="chart-axis-label" x={PAD.left - 6} y={y + 4} textAnchor="end">
                {v.toFixed(0)}
              </text>
            </g>
          );
        })}

        <line className="chart-axis-line" x1={PAD.left} x2={PAD.left} y1={PAD.top} y2={PAD.top + INNER_H} />
        <line className="chart-axis-line" x1={PAD.left} x2={PAD.left + INNER_W} y1={PAD.top + INNER_H} y2={PAD.top + INNER_H} />

        {xLabels.map((i) => (
          <text
            key={i}
            className="chart-axis-label"
            x={xScale(i)}
            y={H - 8}
            textAnchor="middle"
            fontSize={10}
          >
            {data[i].time.slice(-5)}
          </text>
        ))}

        <path className="trend-line" d={pathD} />

        {hover && (
          <>
            <line
              className="chart-crosshair"
              x1={xScale(hover.idx)}
              x2={xScale(hover.idx)}
              y1={PAD.top}
              y2={PAD.top + INNER_H}
            />
            <circle
              className="trend-active-dot"
              cx={xScale(hover.idx)}
              cy={yScale(data[hover.idx].value)}
              r={5}
            />
          </>
        )}

        <rect
          className="chart-hit-area"
          x={PAD.left}
          y={PAD.top}
          width={INNER_W}
          height={INNER_H}
        />
      </svg>

      {hover && hovered && (
        <div
          className="chart-tooltip chart-tooltip-floating"
          style={{ left: hover.x + 14, top: hover.y - 20 }}
        >
          <div>{hovered.time}</div>
          <div style={{ fontWeight: 700, fontSize: 14 }}>{hovered.value.toFixed(2)}</div>
        </div>
      )}

      <div className="chart-summary" style={{ marginTop: 6 }}>
        <span>最低 {minV.toFixed(2)}</span>
        <span>最高 {maxV.toFixed(2)}</span>
      </div>
    </div>
  );
}

/* ─── CandleChart ────────────────────────────────────────────────────────── */

function CandleChart({ data }: { data: CandlePoint[] }) {
  const [hover, setHover] = useState<{ idx: number; x: number; y: number } | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  if (!data || data.length === 0) {
    return <div className="chart-empty">暂无数据</div>;
  }

  const visible = data.slice(-120);
  const highs = visible.map((d) => d.high);
  const lows = visible.map((d) => d.low);
  const minV = Math.min(...lows);
  const maxV = Math.max(...highs);
  const range = maxV - minV || 1;

  const candleW = Math.max(2, Math.floor(INNER_W / visible.length) - 1);
  const xScale = (i: number) => PAD.left + (i + 0.5) * (INNER_W / visible.length);
  const yScale = (v: number) => PAD.top + INNER_H - ((v - minV) / range) * INNER_H;

  const gridLines = 5;
  const gridStep = range / gridLines;

  const xLabels: number[] = [];
  const step = Math.max(1, Math.floor(visible.length / 6));
  for (let i = 0; i < visible.length; i += step) xLabels.push(i);

  const hovered = hover !== null ? visible[hover.idx] : null;

  return (
    <div style={{ position: 'relative' }}>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        className="chart-svg"
        onMouseMove={(e) => {
          const rect = svgRef.current!.getBoundingClientRect();
          const svgX = ((e.clientX - rect.left) / rect.width) * W;
          const idx = clamp(Math.floor(((svgX - PAD.left) / INNER_W) * visible.length), 0, visible.length - 1);
          setHover({ idx, x: e.clientX, y: e.clientY });
        }}
        onMouseLeave={() => setHover(null)}
      >
        <rect className="chart-bg" x={0} y={0} width={W} height={H} rx={12} />

        {Array.from({ length: gridLines + 1 }, (_, i) => {
          const v = minV + gridStep * i;
          const y = yScale(v);
          return (
            <g key={i}>
              <line className="chart-grid-line" x1={PAD.left} x2={PAD.left + INNER_W} y1={y} y2={y} />
              <text className="chart-axis-label" x={PAD.left - 6} y={y + 4} textAnchor="end">
                {v.toFixed(0)}
              </text>
            </g>
          );
        })}

        <line className="chart-axis-line" x1={PAD.left} x2={PAD.left} y1={PAD.top} y2={PAD.top + INNER_H} />
        <line className="chart-axis-line" x1={PAD.left} x2={PAD.left + INNER_W} y1={PAD.top + INNER_H} y2={PAD.top + INNER_H} />

        {xLabels.map((i) => (
          <text key={i} className="chart-axis-label" x={xScale(i)} y={H - 8} textAnchor="middle" fontSize={10}>
            {visible[i].time.slice(-5)}
          </text>
        ))}

        {visible.map((d, i) => {
          const isUp = d.close >= d.open;
          const cx = xScale(i);
          const bodyTop = yScale(Math.max(d.open, d.close));
          const bodyBot = yScale(Math.min(d.open, d.close));
          const bodyH = Math.max(1, bodyBot - bodyTop);
          const wickTop = yScale(d.high);
          const wickBot = yScale(d.low);

          return (
            <g key={i} className={isUp ? 'candle-up' : 'candle-down'}>
              <line className="candle-wick" x1={cx} x2={cx} y1={wickTop} y2={wickBot} />
              <rect
                className="candle-body"
                x={cx - candleW / 2}
                y={bodyTop}
                width={candleW}
                height={bodyH}
              />
            </g>
          );
        })}

        {hover && (
          <line
            className="chart-crosshair"
            x1={xScale(hover.idx)}
            x2={xScale(hover.idx)}
            y1={PAD.top}
            y2={PAD.top + INNER_H}
          />
        )}

        <rect className="chart-hit-area" x={PAD.left} y={PAD.top} width={INNER_W} height={INNER_H} />
      </svg>

      {hover && hovered && (
        <div
          className="chart-tooltip chart-tooltip-floating"
          style={{ left: hover.x + 14, top: hover.y - 80 }}
        >
          <div>{hovered.time}</div>
          <div>开 {hovered.open.toFixed(2)}</div>
          <div>收 {hovered.close.toFixed(2)}</div>
          <div>高 {hovered.high.toFixed(2)}</div>
          <div>低 {hovered.low.toFixed(2)}</div>
          <div>量 {formatVolume(hovered.volume)}</div>
        </div>
      )}

      <div className="chart-summary" style={{ marginTop: 6 }}>
        <span>最低 {minV.toFixed(2)}</span>
        <span>最高 {maxV.toFixed(2)}</span>
      </div>
    </div>
  );
}

/* ─── FinancialsPanel ────────────────────────────────────────────────────── */

function FinancialsPanel({ data }: { data: StockFinancials }) {
  if (!data.years || data.years.length === 0) {
    return <div className="chart-empty" style={{ minHeight: 120 }}>暂无财务数据</div>;
  }

  const recentYears = data.years.slice(-5);

  return (
    <div className="financials-table-wrap">
      <table className="financials-table">
        <thead>
          <tr>
            <th></th>
            {recentYears.map((y) => (
              <th key={y.year}>{y.year}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>营业收入</td>
            {recentYears.map((y) => (
              <td key={y.year}>{formatFinancial(y.revenue)}</td>
            ))}
          </tr>
          <tr>
            <td>净利润</td>
            {recentYears.map((y) => (
              <td key={y.year}>{formatFinancial(y.netProfit)}</td>
            ))}
          </tr>
          <tr>
            <td>每股收益</td>
            {recentYears.map((y) => (
              <td key={y.year}>{y.eps ? y.eps.toFixed(2) : '-'}</td>
            ))}
          </tr>
          <tr>
            <td>总资产</td>
            {recentYears.map((y) => (
              <td key={y.year}>{formatFinancial(y.totalAssets)}</td>
            ))}
          </tr>
          <tr>
            <td>总负债</td>
            {recentYears.map((y) => (
              <td key={y.year}>{formatFinancial(y.totalLiabilities)}</td>
            ))}
          </tr>
          <tr>
            <td>股东权益</td>
            {recentYears.map((y) => (
              <td key={y.year}>{formatFinancial(y.shareholdersEquity)}</td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );
}

/* ─── IndexDetailModal ───────────────────────────────────────────────────── */

const KLINE_TABS = [
  { key: 'time', label: '分时' },
  { key: 'day', label: '日K' },
  { key: 'week', label: '周K' },
  { key: 'month', label: '月K' },
];

const TREND_TABS = [
  { key: '3d', label: '3日' },
  { key: '7d', label: '7日' },
  { key: '1m', label: '1月' },
  { key: '3m', label: '3月' },
  { key: '6m', label: '6月' },
  { key: '1y', label: '1年' },
  { key: '2y', label: '2年' },
  { key: '3y', label: '3年' },
];

export default function IndexDetailModal({
  index,
  details,
  financials,
  loading,
  error,
  klineRange,
  trendRange,
  onClose,
  onKlineRangeChange,
  onTrendRangeChange,
}: Props) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const isUp = index.change >= 0;
  const sign = isUp ? '+' : '';
  const priceColor = isUp ? '#e94560' : '#2ecc71';

  const klineData = details?.marketChart?.[klineRange];
  const trendData = details?.trend?.[trendRange];

  return (
    <div
      className="modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="detail-modal" role="dialog" aria-modal="true" aria-label={`${index.name} 详情`}>
        <button className="modal-close" onClick={onClose} aria-label="关闭">
          ×
        </button>

        <div className="detail-header">
          <div>
            <div className="detail-code">{index.code.toUpperCase()}</div>
            <h2>{index.name}</h2>
            <div className="detail-meta">
              <span>成交量 {formatVolume(index.volume)}</span>
              {index.pe != null && <span>市盈率 {index.pe.toFixed(2)}</span>}
              <span>
                更新时间{' '}
                {index.timestamp ? new Date(index.timestamp).toLocaleTimeString() : '-'}
              </span>
            </div>
          </div>
          <div className="detail-price-block">
            <div className="detail-price" style={{ color: priceColor }}>
              {index.price.toFixed(2)}
            </div>
            <div className="detail-price-change" style={{ color: priceColor }}>
              {sign}{index.change.toFixed(2)} ({sign}{index.changePercent.toFixed(2)}%)
            </div>
          </div>
        </div>

        {loading && <div className="detail-state">加载中...</div>}
        {error && <div className="detail-state detail-state-error">{error}</div>}

        {!loading && !error && details && (
          <div className="detail-sections">
            <div className="chart-panel">
              <div className="chart-panel-head chart-panel-head-wrap">
                <h3>行情图</h3>
                <div className="segmented-control segmented-control-wrap">
                  {KLINE_TABS.map((t) => (
                    <button
                      key={t.key}
                      className={klineRange === t.key ? 'active' : ''}
                      onClick={() => onKlineRangeChange(t.key)}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {klineData && klineData.length > 0 ? (
                klineRange === 'time' ? (
                  <TrendChart data={klineData as TrendPoint[]} />
                ) : (
                  <CandleChart data={klineData as CandlePoint[]} />
                )
              ) : (
                <div className="chart-empty">暂无数据</div>
              )}
            </div>

            <div className="chart-panel">
              <div className="chart-panel-head">
                <h3>历史走势</h3>
                <div className="segmented-control trend-control">
                  {TREND_TABS.map((t) => (
                    <button
                      key={t.key}
                      className={trendRange === t.key ? 'active' : ''}
                      onClick={() => onTrendRangeChange(t.key)}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {trendData && trendData.length > 0 ? (
                <TrendChart data={trendData} />
              ) : (
                <div className="chart-empty">暂无数据</div>
              )}
            </div>

            {financials && financials.years && financials.years.length > 0 && (
              <div className="chart-panel">
                <div className="chart-panel-head">
                  <h3>年度财务</h3>
                </div>
                <FinancialsPanel data={financials} />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
