import { money } from '../lib/format';

// Dependency-free SVG sparkline of net worth history.
export default function NetWorthChart({ history, latest, changePct }) {
  if (!history || !history.length) return null;
  const w = 560;
  const h = 120;
  const pad = 8;
  const totals = history.map((p) => p.total);
  const min = Math.min(...totals);
  const max = Math.max(...totals);
  const x = (i) => pad + (i * (w - pad * 2)) / (history.length - 1);
  const y = (v) => h - pad - ((v - min) * (h - pad * 2)) / (max - min || 1);
  const points = history.map((p, i) => `${x(i)},${y(p.total)}`).join(' ');
  const up = changePct >= 0;

  return (
    <div className="card networth" data-ui-id="chart.dashboard.networth">
      <div className="card-row">
        <div>
          <div className="label">Net worth</div>
          <div className="big-number">{money(latest)}</div>
        </div>
        <div className={`change ${up ? 'pos' : 'neg'}`}>
          {up ? '▲' : '▼'} {Math.abs(changePct)}% this month
        </div>
      </div>
      <svg viewBox={`0 0 ${w} ${h}`} className="sparkline" role="img" aria-label="Net worth trend">
        <polyline points={points} fill="none" strokeWidth="2.5" className="spark-line" />
        {history.map((p, i) => (
          <circle key={p.month} cx={x(i)} cy={y(p.total)} r="3" className="spark-dot" />
        ))}
      </svg>
      <div className="spark-months">
        <span>{history[0].month}</span>
        <span>{history[history.length - 1].month}</span>
      </div>
    </div>
  );
}
