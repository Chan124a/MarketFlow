'use client';

import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import IndexCard from '@/components/IndexCard';
import IndexDetailModal from '@/components/IndexDetailModal';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:3001';

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

interface CandlePoint {
  time: string;
  open: number;
  close: number;
  high: number;
  low: number;
  volume: number;
}

interface TrendPoint {
  time: string;
  value: number;
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

interface IndexDetails {
  code: string;
  name: string;
  marketChart: Record<string, TrendPoint[] | CandlePoint[]>;
  trend: Record<string, TrendPoint[]>;
}

const CATEGORIES: Record<string, string[]> = {
  'A股': ['sh000001', 'sz399001', 'sh000688', 'sz399006'],
  '港股': ['hkHSI', 'hkHSCEI', 'hkHSTECH'],
  '美股': ['usNDX', 'usINX', 'usDJI'],
  '个股': ['hk00700', 'hk09988'],
};

export default function Dashboard() {
  const [indices, setIndices] = useState<IndexData[]>([]);
  const [stocks, setStocks] = useState<IndexData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<IndexData | null>(null);
  const [details, setDetails] = useState<IndexDetails | null>(null);
  const [financials, setFinancials] = useState<StockFinancials | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState<string | null>(null);
  const [klineRange, setKlineRange] = useState<string>('day');
  const [trendRange, setTrendRange] = useState<string>('1m');

  useEffect(() => {
    fetch(`${BACKEND_URL}/api/indices`)
      .then((res) => res.json())
      .then((json) => {
        if (json.success) {
          setIndices(json.data);
        }
        setLoading(false);
      })
      .catch(() => {
        setError('连接失败');
        setLoading(false);
      });

    fetch(`${BACKEND_URL}/api/stocks`)
      .then((res) => res.json())
      .then((json) => {
        if (json.success) {
          setStocks(json.data);
        }
      })
      .catch(() => {});

    const socket: Socket = io(BACKEND_URL, { transports: ['websocket'] });

    socket.on('indices:update', (data: { success: boolean; data: IndexData[] }) => {
      if (data.success) {
        setIndices(data.data);
        setLoading(false);
        setError(null);
      }
    });

    socket.on('connect_error', () => {
      setError('连接失败');
      setLoading(false);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const groupedIndices = indices.reduce(
    (acc, item) => {
      for (const [category, codes] of Object.entries(CATEGORIES)) {
        if (codes.includes(item.code)) {
          if (!acc[category]) acc[category] = [];
          acc[category].push(item);
          break;
        }
      }
      return acc;
    },
    {} as Record<string, IndexData[]>
  );

  useEffect(() => {
    if (!selectedIndex) {
      return;
    }

    setDetailsLoading(true);
    setDetailsError(null);

    const detailsPromise = fetch(`${BACKEND_URL}/api/indices/${selectedIndex.code}/details`)
      .then((res) => res.json())
      .then((json) => {
        if (!json.success) {
          throw new Error('详情加载失败');
        }
        setDetails(json.data);
      });

    const isStock = CATEGORIES['个股'].includes(selectedIndex.code);
    const financialsPromise = isStock
      ? fetch(`${BACKEND_URL}/api/stocks/${selectedIndex.code}/financials`)
          .then((res) => res.json())
          .then((json) => {
            if (json.success) {
              setFinancials(json.data);
            }
          })
          .catch(() => {})
      : Promise.resolve();

    Promise.all([detailsPromise, financialsPromise])
      .catch(() => {
        setDetails(null);
        setDetailsError('详情加载失败');
      })
      .finally(() => {
        setDetailsLoading(false);
      });
  }, [selectedIndex]);

  const openDetails = (item: IndexData) => {
    setSelectedIndex(item);
    setDetails(null);
    setFinancials(null);
    setDetailsError(null);
    setKlineRange('time');
    setTrendRange('1m');
  };

  const closeDetails = () => {
    setSelectedIndex(null);
    setDetails(null);
    setFinancials(null);
    setDetailsError(null);
  };

  if (loading) {
    return <div className="loading">加载中...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  const allData = [...indices, ...stocks];

  return (
    <>
      <div className="header">
        <h1>📈 大盘</h1>
      </div>
      {Object.entries(CATEGORIES).map(([category, codes]) => {
        const items = allData.filter((item) => codes.includes(item.code));
        if (items.length === 0) return null;

        return (
          <div key={category} className="section">
            <div className="section-title">{category}</div>
            <div className="section-grid">
              {items.map((item) => (
                <IndexCard key={item.code} data={item} onClick={() => openDetails(item)} />
              ))}
            </div>
          </div>
        );
      })}
      <div className="time">
        更新时间:{' '}
        {indices[0]?.timestamp
          ? new Date(indices[0].timestamp).toLocaleTimeString()
          : '-'}
      </div>
      {selectedIndex ? (
        <IndexDetailModal
          index={selectedIndex}
          details={details}
          financials={financials}
          loading={detailsLoading}
          error={detailsError}
          klineRange={klineRange}
          trendRange={trendRange}
          onClose={closeDetails}
          onKlineRangeChange={setKlineRange}
          onTrendRangeChange={setTrendRange}
        />
      ) : null}
    </>
  );
}
