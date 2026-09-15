import { listTransactions, createTransaction, getAccount } from '../../lib/db';

export default function handler(req, res) {
  if (req.method === 'GET') {
    const { accountId, category, limit } = req.query;
    const transactions = listTransactions({
      accountId,
      category,
      limit: limit ? Number(limit) : undefined,
    });
    return res.status(200).json({ transactions, count: transactions.length });
  }

  if (req.method === 'POST') {
    const { accountId, merchant, category, amount, date } = req.body || {};
    if (!accountId || !merchant || !category || amount === undefined) {
      return res.status(400).json({ error: 'accountId, merchant, category, and amount are required' });
    }
    if (!getAccount(accountId)) return res.status(404).json({ error: 'Account not found' });
    if (Number.isNaN(Number(amount))) return res.status(400).json({ error: 'amount must be a number' });
    const tx = createTransaction({ accountId, merchant, category, amount, date });
    return res.status(201).json({ transaction: tx });
  }

  res.status(405).json({ error: 'Method not allowed' });
}
