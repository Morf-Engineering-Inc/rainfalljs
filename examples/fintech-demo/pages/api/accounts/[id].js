import { getAccount, listTransactions } from '../../../lib/db';

export default function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  const account = getAccount(req.query.id);
  if (!account) return res.status(404).json({ error: 'Account not found' });
  const transactions = listTransactions({ accountId: account.accountId, limit: 20 });
  res.status(200).json({ account, transactions });
}
