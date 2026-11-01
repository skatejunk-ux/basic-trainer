import { NavLink } from 'react-router-dom';
import { nl } from '../content/nl';

const tabs = [
  { to: '/', label: nl.nav.today, end: true, icon: 'M3 11l9-8 9 8v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z' },
  { to: '/historie', label: nl.nav.history, end: false, icon: 'M12 8v5l3 2M21 12a9 9 0 1 1-3-6.7M21 4v5h-5' },
  { to: '/schema', label: nl.nav.schema, end: false, icon: 'M4 6h16M4 12h16M4 18h10' },
  { to: '/meer', label: nl.nav.more, end: false, icon: 'M5 12h.01M12 12h.01M19 12h.01' },
] as const;

export function BottomNav() {
  return (
    <nav aria-label={nl.nav.label} className="border-t border-border bg-surface pb-[env(safe-area-inset-bottom)]">
      <ul className="flex">
        {tabs.map((t) => (
          <li key={t.to} className="flex-1">
            <NavLink
              to={t.to}
              end={t.end}
              className={({ isActive }) =>
                `flex min-h-[56px] min-w-touch flex-col items-center justify-center gap-0.5 text-xs font-medium ${
                  isActive ? 'text-accent' : 'text-muted'
                }`
              }
            >
              <svg
                viewBox="0 0 24 24"
                className="h-6 w-6"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d={t.icon} />
              </svg>
              <span>{t.label}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
