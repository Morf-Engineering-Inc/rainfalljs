import { listAccounts } from '../../lib/db';

export default function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  const accounts = listAccounts();
  const netWorth = accounts.reduce((sum, a) => sum + a.balance, 0);
  res.status(200).json({ accounts, netWorth: Math.round(netWorth * 100) / 100 });
}
