interface IndexData {
  code: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  pe?: number;
  marketCap?: number;
}

function formatVolume(v: number): string {
  if (!v) return '-';
  if (v >= 100000000) return (v / 100000000).toFixed(2) + '亿';
  if (v >= 10000) return (v / 10000).toFixed(2) + '万';
  return v.toFixed(0);
}

function formatMarketCap(v: number): string {
  if (!v) return '';
  if (v >= 100000000) return (v / 100000000).toFixed(0) + '亿';
  if (v >= 10000) return (v / 10000).toFixed(0) + '万';
  return v.toFixed(0);
}

export default function IndexCard({
  data,
  onClick,
}: {
  data: IndexData;
  onClick: () => void;
}) {
  const isUp = data.change >= 0;
  const cls = isUp ? 'up' : 'down';
  const sign = isUp ? '+' : '';

  return (
    <button type="button" className="card" onClick={onClick}>
      <div className="card-title">{data.name}</div>
      <div className="card-price">{data.price.toFixed(2)}</div>
      <div className={`card-change ${cls}`}>
        <span>
          {sign}
          {data.change.toFixed(2)}
        </span>
        <span>
          ({sign}
          {data.changePercent.toFixed(2)}%)
        </span>
      </div>
      <div className="card-meta">
        成交量 <span className="volume">{formatVolume(data.volume)}</span>
      </div>
      {data.pe != null && (
        <div className="card-meta card-meta-fin">
          市盈率 <span className="volume">{data.pe.toFixed(2)}</span>
        </div>
      )}
      {data.marketCap != null && (
        <div className="card-meta card-meta-fin">
          市值 <span className="volume">{formatMarketCap(data.marketCap)}</span>
        </div>
      )}
      <div className="card-action">点击查看详情</div>
    </button>
  );
}
