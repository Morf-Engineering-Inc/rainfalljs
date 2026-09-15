import { money } from '../lib/format';

const TYPE_LABELS = {
  checking: 'Checking',
  savings: 'Savings',
  credit: 'Credit',
  investment: 'Investing',
};

export default function AccountCard({ account }) {
  const negative = account.balance < 0;
  return (
    <div className="card account-card" data-ui-id="card.dashboard.account">
      <div className="account-type">{TYPE_LABELS[account.type] || account.type}</div>
      <div className="account-name">{account.name}</div>
      <div className={`account-balance ${negative ? 'neg' : ''}`}>
        {money(account.balance, account.currency)}
      </div>
    </div>
  );
}
