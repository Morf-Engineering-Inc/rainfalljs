import { useEffect, useState } from 'react';
import TransactionTable from '../components/TransactionTable';
import TransactionForm from '../components/TransactionForm';

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [category, setCategory] = useState('');

  function load() {
    const qs = category ? `?category=${category}` : '';
    fetch(`/api/transactions${qs}`).then((r) => r.json()).then((d) => setTransactions(d.transactions));
  }

  useEffect(load, [category]);
  useEffect(() => {
    fetch('/api/accounts').then((r) => r.json()).then((d) => setAccounts(d.accounts));
  }, []);

  return (
    <div className="page" data-ui-id="screen.transactions.main">
      <h1>Transactions</h1>
      <div className="filter-row">
        <label>Filter:</label>
        <select data-ui-id="select.transactions.filter" value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="">All categories</option>
          {['groceries', 'dining', 'travel', 'transport', 'subscriptions', 'income', 'savings'].map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>
      <div className="card">
        <TransactionTable transactions={transactions} />
      </div>
      <TransactionForm accounts={accounts} onCreated={load} />
    </div>
  );
}
