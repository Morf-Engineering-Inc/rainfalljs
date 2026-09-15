import Link from 'next/link';
import { useRouter } from 'next/router';

const LINKS = [
  { href: '/', label: 'Dashboard', uiId: 'navtab.header.dashboard' },
  { href: '/transactions', label: 'Transactions', uiId: 'navtab.header.transactions' },
  { href: '/budgets', label: 'Budgets', uiId: 'navtab.header.budgets' },
];

export default function Header() {
  const { pathname } = useRouter();
  return (
    <header className="header" data-ui-id="nav.header.main">
      <span className="logo">◆ Fintrack</span>
      <nav>
        {LINKS.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            data-ui-id={l.uiId}
            className={pathname === l.href ? 'active' : ''}
          >
            {l.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
