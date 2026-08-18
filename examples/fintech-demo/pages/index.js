import { useEffect, useState } from 'react';
import AccountCard from '../components/AccountCard';
import NetWorthChart from '../components/NetWorthChart';
import TransactionTable from '../components/TransactionTable';
import InsightCard from '../components/InsightCard';

export default function Dashboard() {
  const [accounts, setAccounts] = useState(null);
  const [netWorth, setNetWorth] = useState(null);
  const [recent, setRecent] = useState(null);
  const [insights, setInsights] = useState(null);

  useEffect(() => {
    fetch('/api/accounts').then((r) => r.json()).then((d) => setAccounts(d.accounts));
    fetch('/api/networth').then((r) => r.json()).then(setNetWorth);
    fetch('/api/transactions?limit=5').then((r) => r.json()).then((d) => setRecent(d.transactions));
    fetch('/api/insights').then((r) => r.json()).then(setInsights);
  }, []);

  return (
    <div className="page" data-ui-id="screen.dashboard.main">
      <h1>Overview</h1>
      {netWorth && <NetWorthChart history={netWorth.history} latest={netWorth.latest} changePct={netWorth.changePct} />}
      <div className="account-grid">
        {(accounts || []).map((a) => (
          <AccountCard key={a.accountId} account={a} />
        ))}
      </div>
      <div className="two-col">
        <div className="card">
          <h3>Recent activity</h3>
          <TransactionTable transactions={recent} compact />
        </div>
        <InsightCard insights={insights} />
      </div>
    </div>
  );
}
