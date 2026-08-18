import { getNetWorthHistory } from '../../lib/db';

export default function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  const history = getNetWorthHistory();
  const latest = history[history.length - 1];
  const previous = history[history.length - 2];
  const changePct = previous ? Math.round(((latest.total - previous.total) / previous.total) * 1000) / 10 : 0;
  res.status(200).json({ history, latest: latest.total, changePct });
}
