import { money } from '../lib/format';

export default function InsightCard({ insights }) {
  if (!insights) return null;
  return (
    <div className="card insight" data-ui-id="card.dashboard.insights">
      <h3>Insights</h3>
      <ul>
        {insights.topCategory && (
          <li>
            Top spend: <strong>{insights.topCategory.category}</strong> at{' '}
            <strong>{money(insights.topCategory.amount)}</strong> this month.
          </li>
        )}
        <li>
          Savings rate: <strong>{insights.savingsRate}%</strong> of income kept.
        </li>
        {insights.overBudget && insights.overBudget.length > 0 ? (
          <li className="neg">Over budget: {insights.overBudget.join(', ')}.</li>
        ) : (
          <li className="pos">All budgets on track. 🎉</li>
        )}
      </ul>
    </div>
  );
}
