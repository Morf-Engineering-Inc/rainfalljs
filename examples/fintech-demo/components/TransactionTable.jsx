import { money, shortDate } from '../lib/format';

export default function TransactionTable({ transactions, compact = false }) {
  if (!transactions || !transactions.length) {
    return <div className="empty">No transactions yet.</div>;
  }
  return (
    <table className="tx-table" data-ui-id="table.transactions.list">
      <thead>
        <tr>
          <th>Date</th>
          <th>Merchant</th>
          {!compact && <th>Category</th>}
          <th className="num">Amount</th>
        </tr>
      </thead>
      <tbody>
        {transactions.map((tx) => (
          <tr key={tx.txId}>
            <td className="muted">{shortDate(tx.date)}</td>
            <td>{tx.merchant}</td>
            {!compact && (
              <td>
                <span className={`chip chip-${tx.category}`}>{tx.category}</span>
              </td>
            )}
            <td className={`num ${tx.amount < 0 ? 'neg' : 'pos'}`}>{money(tx.amount)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
