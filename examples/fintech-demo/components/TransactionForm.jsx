import { useState } from 'react';

const CATEGORIES = ['groceries', 'dining', 'travel', 'transport', 'subscriptions', 'income', 'savings'];

export default function TransactionForm({ accounts, onCreated }) {
  const [form, setForm] = useState({ accountId: '', merchant: '', category: 'groceries', amount: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, accountId: form.accountId || accounts[0]?.accountId }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || 'Failed to save');
      setForm({ accountId: form.accountId, merchant: '', category: form.category, amount: '' });
      onCreated && onCreated(body.transaction);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="card tx-form" data-ui-id="form.transactions.add" onSubmit={submit}>
      <h3>Add transaction</h3>
      <div className="form-grid">
        <select data-ui-id="select.transactions.account" value={form.accountId} onChange={set('accountId')}>
          {(accounts || []).map((a) => (
            <option key={a.accountId} value={a.accountId}>{a.name}</option>
          ))}
        </select>
        <input
          data-ui-id="input.transactions.merchant"
          placeholder="Merchant"
          value={form.merchant}
          onChange={set('merchant')}
          required
        />
        <select data-ui-id="select.transactions.category" value={form.category} onChange={set('category')}>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <input
          data-ui-id="input.transactions.amount"
          placeholder="Amount (negative = spend)"
          type="number"
          step="0.01"
          value={form.amount}
          onChange={set('amount')}
          required
        />
      </div>
      {error && <div className="error">{error}</div>}
      <button data-ui-id="button.transactions.save" disabled={saving}>
        {saving ? 'Saving…' : 'Save'}
      </button>
    </form>
  );
}
