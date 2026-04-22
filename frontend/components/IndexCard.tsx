interface IndexData {
  code: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
}

function formatVolume(v: number): string {
  if (!v) return '-';
  if (v >= 100000000) return (v / 100000000).toFixed(2) + '亿';
  if (v >= 10000) return (v / 10000).toFixed(2) + '万';
  return v.toFixed(0);
}

export default function IndexCard({ data }: { data: IndexData }) {
  const isUp = data.change >= 0;
  const cls = isUp ? 'up' : 'down';
  const sign = isUp ? '+' : '';

  return (
    <div className="card">
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
    </div>
  );
}